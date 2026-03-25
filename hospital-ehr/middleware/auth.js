const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const authenticate = (req, _res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next(new AppError('Unauthorized', 401));
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Unauthorized', 401));
  if (!roles.includes(req.user.role)) return next(new AppError('Forbidden', 403));
  return next();
};

module.exports = { authenticate, authorize };
