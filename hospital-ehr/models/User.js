const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: { type: String },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true,
    index: true,
  },
  refreshToken: { type: String, select: false },
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (this.role === 'patient' && !this.patientId) {
    this.patientId = "PAT-" + Date.now();
  }

  if (!this.isModified('password')) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
  this.password = await bcrypt.hash(this.password, saltRounds);

  next();
});

UserSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);