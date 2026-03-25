const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const router = require('express').Router();
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Patient = require('../models/Patient');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { predictFromFile } = require('../services/mlPredictionService');
const { listSchema, listRecordsHandler, getRecordByIdHandler, softDeleteHandler } = require('../controllers/recordController');

const createRecordSchema = Joi.object({
  patientId: Joi.string().required(),
  diagnosis: Joi.string().required(),
  prescription: Joi.string().allow('', null).optional(),
  testResults: Joi.string().allow('', null).optional(),
  predictionType: Joi.string().valid('scan', 'bp', 'ecg').default('scan').optional(),
});

const patientParamSchema = Joi.object({ patientId: Joi.string().required() });
const recordIdParamSchema = Joi.object({ id: Joi.string().required() });

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) { cb(null, uploadDir); },
  filename: function (_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});

const upload = multer({ storage });

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

router.get(
  '/',
  authenticate,
  authorize('admin', 'doctor'),
  validate(listSchema, 'query'),
  (req, res, next) => listRecordsHandler(req, res).catch(next)
);

router.post(
  '/',
  authenticate,
  authorize('doctor', 'admin'),
  upload.array('reports', 5),
  validate(createRecordSchema),
  async (req, res, next) => {
    try {
      const { patientId, diagnosis, prescription, testResults, predictionType } = req.body;

      const patientUserId = await resolvePatientUserId(patientId);
      if (!patientUserId) {
        return res.error('Patient not found', 404);
      }

      const labReports = (req.files || []).map((file) =>
        path.posix.join('/uploads', path.basename(file.path))
      );

      const primaryReport = (req.files || [])[0];
      const aiPrediction = await predictFromFile(primaryReport, predictionType);

      const record = await MedicalRecord.create({
        patient: patientUserId,
        doctor: req.user.id,
        diagnosis,
        prescription,
        testResults,
        labReports,
        aiPrediction: aiPrediction || (primaryReport ? 'Prediction unavailable' : undefined),
        updatedBy: req.user.id,
      });

      return res.success(record, 201);
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/my', authenticate, authorize('patient', 'doctor'), async (req, res, next) => {
  try {
    const match = req.user.role === 'patient'
      ? { patient: req.user.id, isDeleted: { $ne: true } }
      : { doctor: req.user.id, isDeleted: { $ne: true } };

    const records = await MedicalRecord.find(match)
      .populate('doctor', 'name email role')
      .populate('patient', 'name email role patientId')
      .sort({ createdAt: -1 });

    return res.success(records);
  } catch (err) {
    return next(err);
  }
});

// GET /:id - Get single record by ID
// Placed before /:patientId to attempt matching record ID first.
// If ID is not a record, we call next() to let /:patientId handle it (in case of ID collision).
router.get(
  '/:id',
  authenticate,
  authorize('patient', 'doctor', 'admin'),
  validate(recordIdParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const isRecord = await MedicalRecord.exists({ _id: req.params.id });
      if (isRecord) {
        return getRecordByIdHandler(req, res).catch(next);
      }
      return next();
    } catch (err) {
      return next();
    }
  }
);

router.get(
  '/:patientId',
  authenticate,
  authorize('patient', 'doctor', 'admin'),
  validate(patientParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const patientUserId = await resolvePatientUserId(req.params.patientId);
      if (!patientUserId) {
        return res.error('Patient not found', 404);
      }

      if (req.user.role === 'patient' && String(req.user.id) !== patientUserId) {
        return res.error('Forbidden', 403);
      }

      const records = await MedicalRecord.find({
        patient: patientUserId,
        isDeleted: { $ne: true },
      })
        .populate('doctor', 'name email role')
        .populate('patient', 'name email role patientId')
        .sort({ createdAt: -1 });

      return res.success(records);
    } catch (err) {
      return next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize('doctor', 'admin'),
  validate(recordIdParamSchema, 'params'),
  (req, res, next) => softDeleteHandler(req, res).catch(next)
);

module.exports = router;
