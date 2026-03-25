const Joi = require('joi');
const ActivityLog = require('../models/ActivityLog');

const listSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  path: Joi.string().optional(),
});

const listHandler = async (req, res) => {
  const { page, limit, path } = req.query;
  const query = {};
  if (path) query.path = new RegExp(path, 'i');
  const logs = await ActivityLog.find(query)
    .populate('user', 'email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await ActivityLog.countDocuments(query);
  return res.success({ logs, total, page, limit });
};

module.exports = { listSchema, listHandler };
