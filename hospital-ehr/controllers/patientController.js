const Joi = require('joi');
const { AppError } = require('../middleware/errorHandler');
const { createPatientProfile, getPatientById, getPatientByUserId, updateProfile, getMedicalHistory } = require('../services/patientService');

const createProfileSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().min(0).max(120).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  contact: Joi.string().optional(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().optional(),
  age: Joi.number().min(0).max(120).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  contact: Joi.string().optional(),
});

const createProfileHandler = async (req, res) => {
  const patient = await createPatientProfile(req.user.id, req.body);
  return res.success(patient, 201);
};

const assertPatientCanAccessPatientId = async (req, patientId) => {
  if (req.user.role !== 'patient') return;
  const ownProfile = await getPatientByUserId(req.user.id);
  if (ownProfile.patientId !== patientId) {
    throw new AppError('Forbidden', 403);
  }
};

const getByPatientIdHandler = async (req, res) => {
  await assertPatientCanAccessPatientId(req, req.params.patientId);
  const patient = await getPatientById(req.params.patientId);
  return res.success(patient);
};

const updateProfileHandler = async (req, res) => {
  const patient = await updateProfile(req.user.id, req.body);
  return res.success(patient);
};

const historyQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
});

const getHistoryHandler = async (req, res) => {
  await assertPatientCanAccessPatientId(req, req.params.patientId);
  const { page, limit } = req.query;
  const data = await getMedicalHistory(req.params.patientId, { page, limit });
  return res.success(data);
};

module.exports = { createProfileSchema, updateProfileSchema, historyQuerySchema, createProfileHandler, getByPatientIdHandler, updateProfileHandler, getHistoryHandler };
