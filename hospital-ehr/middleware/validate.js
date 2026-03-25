const Joi = require('joi');
const { AppError } = require('./errorHandler');

module.exports = (schema, property = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) return next(new AppError('Validation error', 400, error.details.map(d => d.message)));
  req[property] = value;
  return next();
};
