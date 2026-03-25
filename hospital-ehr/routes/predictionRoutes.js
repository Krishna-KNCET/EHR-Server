const router = require('express').Router();
const multer = require('multer');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  heartSchema,
  diabetesSchema,
  predictHeartHandler,
  predictDiabetesHandler,
  predictEcgHandler,
} = require('../controllers/predictionController');

// Use memory storage (good for API forwarding)
const upload = multer({ storage: multer.memoryStorage() });

// ❤️ HEART
router.post(
  '/heart',
  authenticate,
  authorize('patient', 'doctor', 'admin'),
  validate(heartSchema),
  (req, res, next) => predictHeartHandler(req, res).catch(next)
);

// 🧪 DIABETES
router.post(
  '/diabetes',
  authenticate,
  authorize('patient', 'doctor', 'admin'),
  validate(diabetesSchema),
  (req, res, next) => predictDiabetesHandler(req, res).catch(next)
);

// ❤️‍🔥 ECG (FIXED HERE)
router.post(
  '/ecg',
  authenticate,
  authorize('patient', 'doctor', 'admin'),
  upload.single('ecgFile'),
  (req, res, next) => predictEcgHandler(req, res).catch(next)
);

module.exports = router;