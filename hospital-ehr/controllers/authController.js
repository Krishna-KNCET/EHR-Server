const Joi = require('joi');
const { register, login, refresh, logout, getSessionUser } = require('../services/authService');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('patient', 'doctor', 'admin').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const registerHandler = async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await register(name, email, password, role);
  return res.success(result, 201);
};

const loginHandler = async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);
  return res.success(result);
};

const refreshTokenHandler = async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await refresh(refreshToken);
  return res.success(tokens);
};

const logoutHandler = async (req, res) => {
  await logout(req.user.id);
  return res.success({ message: 'Logged out' });
};

const meHandler = async (req, res) => {
  const user = await getSessionUser(req.user.id);
  return res.success(user);
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  meHandler,
};