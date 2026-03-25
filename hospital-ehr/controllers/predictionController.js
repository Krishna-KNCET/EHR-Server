const Joi = require('joi');
const {
  predictHeartRisk,
  predictDiabetesRisk,
  predictEcg,
  savePredictionRecord,
} = require('../services/mlPredictionService');

const heartSchema = Joi.object({
  patientId: Joi.string().optional(),
  age: Joi.number().required(),
  sex: Joi.number().required(),
  cp: Joi.number().required(),
  trestbps: Joi.number().required(),
  chol: Joi.number().required(),
  thalach: Joi.number().required(),
});

const diabetesSchema = Joi.object({
  patientId: Joi.string().optional(),
  glucose: Joi.number().required(),
  bmi: Joi.number().required(),
  insulin: Joi.number().required(),
  age: Joi.number().required(),
});

const resolvePredictionPatientId = (req) => {
  if (req.body?.patientId) return req.body.patientId;
  if (req.user?.role === 'patient') return req.user.id;
  return null;
};

const ensurePredictionPatientId = (req) => {
  const patientId = resolvePredictionPatientId(req);
  if (!patientId) {
    return {
      error: 'patientId is required for doctor/admin predictions',
    };
  }

  return { patientId };
};

// =======================
// ❤️ HEART PREDICTION
// =======================
exports.predictHeartHandler = async (req, res) => {
  try {
    const patientInfo = ensurePredictionPatientId(req);
    if (patientInfo.error) return res.error(patientInfo.error, 400);

    const prediction = await predictHeartRisk(req.body);

    await savePredictionRecord({
      patientId: patientInfo.patientId,
      actorId: req.user.id,
      type: 'heart',
      prediction: prediction.prediction,
      confidence: prediction.confidence,
    });

    return res.success({
      type: 'heart',
      prediction: prediction.prediction,
      confidence: Number(prediction.confidence || 0),
      source: prediction.source || 'model',
    });
  } catch (err) {
    console.error('Heart Prediction Error:', err.message);
    return res.error(err.message || 'Heart prediction failed', 500);
  }
};

// =======================
// 🧪 DIABETES PREDICTION
// =======================
exports.predictDiabetesHandler = async (req, res) => {
  try {
    const patientInfo = ensurePredictionPatientId(req);
    if (patientInfo.error) return res.error(patientInfo.error, 400);

    const prediction = await predictDiabetesRisk(req.body);

    await savePredictionRecord({
      patientId: patientInfo.patientId,
      actorId: req.user.id,
      type: 'diabetes',
      prediction: prediction.prediction,
      confidence: prediction.confidence,
    });

    return res.success({
      type: 'diabetes',
      prediction: prediction.prediction,
      confidence: Number(prediction.confidence || 0),
      source: prediction.source || 'model',
    });
  } catch (err) {
    console.error('Diabetes Prediction Error:', err.message);
    return res.error(err.message || 'Diabetes prediction failed', 500);
  }
};

// =======================
// ❤️‍🔥 ECG PREDICTION (FULL FIX)
// =======================
exports.predictEcgHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.error('No ECG file uploaded', 400);
    }

    const patientInfo = ensurePredictionPatientId(req);
    if (patientInfo.error) return res.error(patientInfo.error, 400);

    const prediction = await predictEcg({ file: req.file });

    await savePredictionRecord({
      patientId: patientInfo.patientId,
      actorId: req.user.id,
      type: 'ecg',
      prediction: prediction.prediction,
      confidence: prediction.confidence,
    });

    return res.success({
      type: 'ecg',
      prediction: prediction.prediction,
      confidence: Number(prediction.confidence || 0),
      source: prediction.source || 'model',
    });
  } catch (err) {
    console.error('ECG Prediction Error:', err.message);
    return res.error(err.message || 'ECG prediction failed', 500);
  }
};

module.exports = {
  heartSchema,
  diabetesSchema,
  predictHeartHandler: exports.predictHeartHandler,
  predictDiabetesHandler: exports.predictDiabetesHandler,
  predictEcgHandler: exports.predictEcgHandler,
};