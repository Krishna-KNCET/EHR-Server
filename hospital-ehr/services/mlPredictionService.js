const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const { AppError } = require('../middleware/errorHandler');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS = 5000;
const MAX_RETRIES = 1;

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_TIMEOUT_MS,
});

const logMlError = (context, error) => {
  console.error(`[ML] ${context} failed`, {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    response: error.response?.data,
  });
};

const getMlErrorMessage = (error) => {
  if (error.response?.status === 404) {
    return 'Invalid ML endpoint';
  }

  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ECONNABORTED'
  ) {
    return 'ML service is not running. Start FastAPI on port 8000';
  }

  const detail = error.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  return error.message || 'ML prediction request failed';
};

const shouldRetry = (error) => {
  if (!error.response) return true;
  return error.response.status >= 500;
};

const requestWithRetry = async ({ method, url, data, headers }, context) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      console.log(`[ML] Sending ${method.toUpperCase()} request`, { url, attempt: attempt + 1, baseURL: ML_SERVICE_URL });
      const response = await mlClient.request({ method, url, data, headers });
      console.log('[ML] Response received', {
        url,
        status: response.status,
        prediction: response.data?.prediction,
      });
      return response.data;
    } catch (error) {
      logMlError(context, error);
      if (attempt < MAX_RETRIES && shouldRetry(error)) {
        console.warn(`[ML] Retrying ${context}`, { attempt: attempt + 2 });
        continue;
      }

      throw new AppError(getMlErrorMessage(error), 502, {
        code: error.code,
        status: error.response?.status,
      });
    }
  }

  throw new AppError('ML prediction request failed', 502);
};

const checkMLService = async () => {
  try {
    await mlClient.get('/health');
    console.log('[ML] Health check passed using /health');
    return true;
  } catch (firstError) {
    try {
      await mlClient.get('/docs');
      console.log('[ML] Health check passed using /docs');
      return true;
    } catch (secondError) {
      logMlError('health-check', secondError);
      console.warn('[ML] ML service appears down');
      return false;
    }
  }
};

const normalizeResult = (responseData) => ({
  prediction: responseData?.prediction || 'Prediction unavailable',
  confidence: Number(responseData?.confidence || 0),
  source: responseData?.source || 'model',
});

const callJsonPrediction = async (endpoint, payload) => {
  const data = await requestWithRetry(
    {
      method: 'post',
      url: endpoint,
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    },
    `json-prediction:${endpoint}`
  );

  return normalizeResult(data);
};

const predictFromFile = async (uploadedFile, predictionType = 'scan') => {
  if (!uploadedFile?.path) return null;

  try {
    const buffer = await fs.readFile(uploadedFile.path);
    if (!buffer?.length) return null;

    // Heuristic score is sent as fallback metadata to the ML service.
    // Primarily useful for image-based scans.
    let normalizedScore = 0;
    if (predictionType === 'scan') {
      const sampled = buffer.subarray(0, Math.min(buffer.length, 200000));
      const average = sampled.reduce((sum, value) => sum + value, 0) / sampled.length;
      normalizedScore = average / 255;
    }

    const form = new FormData();
    form.append(
      'file',
      buffer,
      uploadedFile.originalname || path.basename(uploadedFile.path)
    );
    form.append('type', predictionType);
    form.append('value', normalizedScore.toFixed(4));

    const data = await requestWithRetry(
      {
        method: 'post',
        url: '/predict',
        data: form,
        headers: {
          ...form.getHeaders(),
        },
      },
      'file-prediction:/predict'
    );

    return data?.prediction || null;
  } catch (err) {
    logMlError('legacy-file-predict', err);
    return null;
  }
};

const predictHeartRisk = async (payload) => callJsonPrediction('/predict-heart', payload);

const predictDiabetesRisk = async (payload) => callJsonPrediction('/predict-diabetes', payload);

const predictEcg = async ({ signal, file }) => {
  if (Array.isArray(signal) && signal.length > 0) {
    return callJsonPrediction('/predict-ecg', { signal });
  }

  if (!file?.buffer?.length) {
    throw new AppError('ECG file or signal is required', 400);
  }

  const form = new FormData();
  form.append('ecgFile', file.buffer, file.originalname || 'ecg.dat');

  const data = await requestWithRetry(
    {
      method: 'post',
      url: '/predict-ecg',
      data: form,
      headers: {
        ...form.getHeaders(),
      },
    },
    'multipart-prediction:/predict-ecg'
  );

  return normalizeResult(data);
};

const resolvePatientUserId = async (identifier) => {
  if (!identifier) return null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const patientUser = await User.findOne({ _id: identifier, role: 'patient' }).select('_id');
    if (patientUser) return String(patientUser._id);
  }

  const patientProfile = await Patient.findOne({ patientId: identifier, isDeleted: false }).select('user');
  if (patientProfile) return String(patientProfile.user);

  const patientUserByPublicId = await User.findOne({ patientId: identifier, role: 'patient' }).select('_id');
  if (patientUserByPublicId) return String(patientUserByPublicId._id);

  return null;
};

const savePredictionRecord = async ({ patientId, actorId, type, prediction, confidence }) => {
  const patientUserId = await resolvePatientUserId(patientId);
  if (!patientUserId) {
    throw new AppError('Patient not found', 404);
  }

  const predictionPatch = {
    heartRisk: type === 'heart' ? prediction : undefined,
    diabetes: type === 'diabetes' ? prediction : undefined,
    ecgResult: type === 'ecg' ? prediction : undefined,
    confidence,
    createdAt: new Date(),
  };

  const record = await MedicalRecord.create({
    patient: patientUserId,
    doctor: actorId,
    diagnosis: `${type.toUpperCase()} AI Screening`,
    aiPrediction: prediction,
    aiPredictions: predictionPatch,
    updatedBy: actorId,
  });

  return record;
};

module.exports = {
  checkMLService,
  predictFromFile,
  predictHeartRisk,
  predictDiabetesRisk,
  predictEcg,
  savePredictionRecord,
};

void checkMLService();
