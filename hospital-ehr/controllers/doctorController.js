const Joi = require('joi');
const path = require('path');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { searchPatientByPatientId, addConsultation, updateConsultation } = require('../services/doctorService');
const { predictFromFile } = require('../services/mlPredictionService');

const searchSchema = Joi.object({ patientId: Joi.string().required() });

const consultationSchema = Joi.object({
  patientId: Joi.string().required(),
  diagnosis: Joi.string().required(),
  prescription: Joi.string().required(),
  visitDate: Joi.date().optional(),
});

const searchHandler = async (req, res) => {
  const { patientId } = req.query;
  const patient = await searchPatientByPatientId(patientId);
  return res.success(patient);
};

const addConsultationHandler = async (req, res) => {
  const labReports = (req.files || []).map((f) => path.posix.join('/uploads', path.basename(f.path)));
  const primaryReport = (req.files || [])[0];
  const aiPrediction = await predictFromFile(primaryReport);
  const record = await addConsultation(req.user.id, {
    ...req.body,
    labReports,
    aiPrediction: aiPrediction || (primaryReport ? 'Prediction unavailable' : undefined),
  });
  return res.success(record, 201);
};

const updateConsultationSchema = Joi.object({
  diagnosis: Joi.string().optional(),
  prescription: Joi.string().optional(),
  visitDate: Joi.date().optional(),
});

const updateConsultationHandler = async (req, res) => {
  const record = await updateConsultation(req.user.id, req.params.id, req.body);
  return res.success(record);
};

const listPatientsHandler = async (_req, res) => {
  const users = await User.find({ role: 'patient' })
    .select('_id name email patientId createdAt')
    .sort({ createdAt: -1 });

  const userIds = users.map((user) => user._id);
  const profiles = await Patient.find({ user: { $in: userIds }, isDeleted: false })
    .select('_id user patientId name');

  const profileByUserId = new Map(
    profiles.map((profile) => [String(profile.user), profile])
  );

  const normalized = users.map((user) => {
    const profile = profileByUserId.get(String(user._id));
    return {
      _id: user._id,
      name: profile?.name || user.name,
      email: user.email,
      patientId: profile?.patientId || user.patientId || null,
      profileId: profile?._id || null,
      createdAt: user.createdAt,
    };
  });

  return res.success({ patients: normalized });
};

module.exports = { searchSchema, consultationSchema, updateConsultationSchema, searchHandler, addConsultationHandler, updateConsultationHandler, listPatientsHandler };
