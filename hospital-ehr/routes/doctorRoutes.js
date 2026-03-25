const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { searchSchema, consultationSchema, updateConsultationSchema, searchHandler, addConsultationHandler, updateConsultationHandler, listPatientsHandler } = require('../controllers/doctorController');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) { cb(null, uploadDir); },
  filename: function (_req, file, cb) { cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`); },
});

const upload = multer({ storage });

router.get('/search', authenticate, authorize('doctor'), validate(searchSchema, 'query'), (req, res, next) => searchHandler(req, res).catch(next));
router.get('/patients', authenticate, authorize('doctor'), (req, res, next) => listPatientsHandler(req, res).catch(next));
router.post('/consultations', authenticate, authorize('doctor'), upload.array('reports', 5), validate(consultationSchema), (req, res, next) => addConsultationHandler(req, res).catch(next));
router.put('/consultations/:id', authenticate, authorize('doctor'), validate(updateConsultationSchema), (req, res, next) => updateConsultationHandler(req, res).catch(next));

module.exports = router;
