const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const { AppError } = require('../middleware/errorHandler');

/*
---------------------------------------
Generate Unique Patient ID
---------------------------------------
*/

const generatePatientId = async () => {

  const id = `PT-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const exists = await Patient.findOne({ patientId: id });

  if (exists) {
    return generatePatientId();
  }

  return id;
};


/*
---------------------------------------
Create Patient Profile
---------------------------------------
*/

const createPatientProfile = async (userId, payload) => {

  const existingProfile = await Patient.findOne({
    user: userId,
    isDeleted: false
  });

  if (existingProfile) {
    throw new AppError('Patient profile already exists', 400);
  }

  const patientId = await generatePatientId();

  const patient = await Patient.create({
    ...payload,
    user: userId,
    patientId
  });

  return patient;
};


/*
---------------------------------------
Get Patient By User ID
---------------------------------------
*/

const getPatientByUserId = async (userId) => {

  const patient = await Patient.findOne({
    user: userId,
    isDeleted: false
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  return patient;
};


/*
---------------------------------------
Get Patient By Patient ID
---------------------------------------
*/

const getPatientById = async (patientId) => {

  const patient = await Patient.findOne({
    patientId,
    isDeleted: false
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  return patient;
};


/*
---------------------------------------
Update Patient Profile
---------------------------------------
*/

const updateProfile = async (userId, payload) => {

  const patient = await Patient.findOneAndUpdate(
    { user: userId, isDeleted: false },
    payload,
    { new: true }
  );

  if (!patient) {
    throw new AppError('Patient profile not found', 404);
  }

  return patient;
};


/*
---------------------------------------
Get Patient Medical History
---------------------------------------
*/

const getMedicalHistory = async (patientId, { page = 1, limit = 10 }) => {

  const patient = await getPatientById(patientId);

  const query = {
    patient: patient.user,
    isDeleted: false
  };

  const records = await MedicalRecord.find(query)
    .populate('doctor', 'name email role')
    .sort({ visitDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await MedicalRecord.countDocuments(query);

  return {
    records,
    total,
    page,
    limit
  };
};


/*
---------------------------------------
Get AI Predictions For Patient
---------------------------------------
*/

const getAIPredictions = async (patientId) => {

  const patient = await getPatientById(patientId);

  const records = await MedicalRecord.find({
    patient: patient.user,
    aiPrediction: { $ne: null },
    isDeleted: false
  })
    .populate('doctor', 'name email')
    .sort({ visitDate: -1 });

  return records;
};


/*
---------------------------------------
Exports
---------------------------------------
*/

module.exports = {
  createPatientProfile,
  getPatientById,
  getPatientByUserId,
  updateProfile,
  getMedicalHistory,
  getAIPredictions
};