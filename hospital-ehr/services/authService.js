const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const signTokens = (user) => {
  const payload = { id: user._id, role: user.role, email: user.email };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );

  return { accessToken, refreshToken };
};

const normalizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  patientId: user.patientId || null,
});

/* =========================
   REGISTER
========================= */
const register = async (name, email, password, role) => {
  email = email.toLowerCase();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  if (role === 'admin') {
    const existingAdmin = await User.exists({ role: 'admin' });
    if (existingAdmin) {
      throw new AppError('An admin account already exists. Use the Admin portal to sign in.', 400);
    }
  }

  // DO NOT HASH HERE — model handles it
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  const tokens = signTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: normalizeUser(user),
    ...tokens,
  };
};

/* =========================
   LOGIN
========================= */
const login = async (email, password) => {
  email = email.toLowerCase();

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await user.comparePassword(password);
  if (!match) throw new AppError('Invalid credentials', 401);

  const tokens = signTokens(user);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: normalizeUser(user),
    ...tokens,
  };
};

/* =========================
   REFRESH TOKEN
========================= */
const refresh = async (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(payload.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = signTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  } catch (err) {
    throw new AppError('Invalid refresh token', 401);
  }
};

/* =========================
   LOGOUT
========================= */
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: 1 },
  });
  return true;
};

const getSessionUser = async (userId) => {
  const user = await User.findById(userId)
    .select('_id name email role patientId');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return normalizeUser(user);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getSessionUser,
};
