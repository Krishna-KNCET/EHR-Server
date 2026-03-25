const { logger } = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Not Found - ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (statusCode >= 500) logger.error(message, { err });
  else logger.warn(message, { err });
  return res.error(message, statusCode, err.details || {});
};

module.exports = { AppError, errorHandler, notFoundHandler };
