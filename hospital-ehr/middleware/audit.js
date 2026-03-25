const ActivityLog = require('../models/ActivityLog');
const { logger } = require('../utils/logger');

module.exports = async (req, res, next) => {
  const start = Date.now();
  res.on('finish', async () => {
    try {
      await ActivityLog.create({
        user: req.user ? req.user.id : undefined,
        role: req.user ? req.user.role : undefined,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        body: req.body,
        params: req.params,
        query: req.query,
        responseTimeMs: Date.now() - start,
      });
    } catch (e) {
      logger.warn('Audit log write failed', { message: e.message });
      // Do not crash request flow if audit persistence fails.
    }
  });
  next();
};
