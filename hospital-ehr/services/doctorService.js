const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const { AppError } = require('../middleware/errorHandler');
const { predictFromFile } = require('../services/mlPredictionService');

/*
---------------------------------------
Search Patient
---------------------------------------
*/

const searchPatientByPatientId = async (patientId) => {

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
Add Consultation + AI Prediction
---------------------------------------
*/

const addConsultation = async (
  doctorUserId,
  {
    patientId,
    diagnosis,
    prescription,
    labReports = [],
    visitDate
  }
) => {

  // Find doctor
  const doctor = await Doctor.findOne({
    user: doctorUserId,
    isDeleted: false
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Find patient
  const patient = await Patient.findOne({
    patientId,
    isDeleted: false
  });

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  let aiPrediction = null;

  /*
  ---------------------------------------
  Run AI prediction if scan/report exists
  ---------------------------------------
  */

  if (labReports && labReports.length > 0) {

    try {

      // Assuming first uploaded report is used for prediction
      const reportFile = labReports[0];

      aiPrediction = await predictFromFile(reportFile, 'scan');

    } catch (error) {

      console.error("AI prediction failed:", error.message);

      aiPrediction = null;

    }

  }

  /*
  ---------------------------------------
  Save Medical Record
  ---------------------------------------
  */

  const record = await MedicalRecord.create({

    patient: patient.user,
    doctor: doctor.user,

    diagnosis,
    prescription,

    labReports,

    aiPrediction,

    visitDate: visitDate || new Date(),

    updatedBy: doctorUserId

  });

  return record;

};


/*
---------------------------------------
Update Consultation
---------------------------------------
*/

const updateConsultation = async (
  doctorUserId,
  recordId,
  payload
) => {

  const doctor = await Doctor.findOne({
    user: doctorUserId,
    isDeleted: false
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  const record = await MedicalRecord.findOneAndUpdate(

    {
      _id: recordId,
      doctor: doctor.user,
      isDeleted: false
    },

    {
      ...payload,
      updatedBy: doctorUserId
    },

    {
      new: true
    }

  );

  if (!record) {
    throw new AppError('Record not found or not owned by doctor', 404);
  }

  return record;

};


/*
---------------------------------------
Exports
---------------------------------------
*/

module.exports = {
  searchPatientByPatientId,
  addConsultation,
  updateConsultation
};