const Joi = require('joi');
const MedicalRecord = require('../models/MedicalRecord');
const { AppError } = require('../middleware/errorHandler');

const listSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  q: Joi.string().optional(),
});

const listRecordsHandler = async (req, res) => {
  const { page, limit, q } = req.query;
  const query = { isDeleted: false };
  if (q) query.$text = { $search: q };
  const records = await MedicalRecord.find(query)
    .populate('patient', 'patientId name email role')
    .populate('doctor', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await MedicalRecord.countDocuments(query);
  return res.success({ records, page, limit, total });
};

const getRecordByIdHandler = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'name email role patientId')
    .populate('doctor', 'name email role');

  if (!record) {
    throw new AppError('Record not found', 404);
  }

  // Access control: only doctor, admin, or the patient who owns the record
  if (req.user.role === 'patient' && String(record.patient._id) !== req.user.id) {
    throw new AppError('Forbidden', 403);
  }

  return res.success(record);
};

const softDeleteSchema = Joi.object({ id: Joi.string().required() });

const softDeleteHandler = async (req, res) => {
  const id = req.params.id;
  const rec = await MedicalRecord.findByIdAndUpdate(id, { isDeleted: true, updatedBy: req.user.id }, { new: true });
  if (!rec) throw new AppError('Record not found', 404);
  return res.success({ message: 'Record soft-deleted' });
};

module.exports = { listSchema, listRecordsHandler, getRecordByIdHandler, softDeleteSchema, softDeleteHandler };
