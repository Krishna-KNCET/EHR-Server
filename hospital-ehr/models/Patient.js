const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, index: 'text' },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  contact: { type: String },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
