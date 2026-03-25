const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  registerHandler,
  loginHandler,
  refreshTokenHandler,
  logoutHandler,
  meHandler,
} = require('../controllers/authController');

router.post('/register', validate(registerSchema), (req, res, next) => registerHandler(req, res).catch(next));
router.post('/login', validate(loginSchema), (req, res, next) => loginHandler(req, res).catch(next));
router.post('/refresh-token', validate(refreshSchema), (req, res, next) => refreshTokenHandler(req, res).catch(next));
router.get('/me', authenticate, (req, res, next) => meHandler(req, res).catch(next));
router.post('/logout', authenticate, (req, res, next) => logoutHandler(req, res).catch(next));

module.exports = router;
