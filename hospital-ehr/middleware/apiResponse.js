module.exports = (req, res, next) => {
  res.success = (data = null, status = 200, meta = {}) => {
    return res.status(status).json({ success: true, data, meta });
  };
  res.error = (message = 'Error', status = 500, errors = {}) => {
    return res.status(status).json({ success: false, message, errors });
  };
  next();
};
