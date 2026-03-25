const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String },
  method: { type: String },
  path: { type: String, index: true },
  statusCode: { type: Number },
  ip: { type: String },
  userAgent: { type: String },
  body: { type: Object },
  params: { type: Object },
  query: { type: Object },
  responseTimeMs: { type: Number },
}, { timestamps: true });

ActivityLogSchema.index({ path: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
