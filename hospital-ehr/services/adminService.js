const User = require('../models/User');
const Doctor = require('../models/Doctor');
const { AppError } = require('../middleware/errorHandler');

const createDoctor = async ({ email, password, name, specialization, department }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already in use', 400);
  const user = await User.create({ email, password, role: 'doctor' });
  const doctor = await Doctor.create({ user: user._id, doctorId: `DR-${Date.now().toString(36).toUpperCase()}`, name, specialization, department });
  return { user: { id: user._id, email: user.email, role: user.role }, doctor };
};

const listDoctors = async ({ page = 1, limit = 10, department }) => {
  const query = { isDeleted: false };
  if (department) query.department = department;
  const doctors = await Doctor.find(query)
    .populate('user', 'email role')
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await Doctor.countDocuments(query);
  return { doctors, total, page, limit };
};

module.exports = { createDoctor, listDoctors };
