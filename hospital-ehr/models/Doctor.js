const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  doctorId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  specialization: { type: String },
  department: { type: String, index: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
