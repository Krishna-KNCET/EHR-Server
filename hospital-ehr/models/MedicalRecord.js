const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  diagnosis: String,
  prescription: String,
  testResults: String,
  aiPrediction: String,
  aiPredictions: {
    heartRisk: { type: String },
    diabetes: { type: String },
    ecgResult: { type: String },
    confidence: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  visitDate: { type: Date, default: Date.now },
  labReports: [{ type: String }],
  isDeleted: { type: Boolean, default: false, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
