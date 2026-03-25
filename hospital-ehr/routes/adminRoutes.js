const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createDoctorSchema, createDoctorHandler, listDoctorsSchema, listDoctorsHandler } = require('../controllers/adminController');
const { listSchema: logListSchema, listHandler: logListHandler } = require('../controllers/logController');

router.post('/doctors', authenticate, authorize('admin'), validate(createDoctorSchema), (req, res, next) => createDoctorHandler(req, res).catch(next));
router.get('/doctors', authenticate, authorize('admin'), validate(listDoctorsSchema, 'query'), (req, res, next) => listDoctorsHandler(req, res).catch(next));
router.get('/logs', authenticate, authorize('admin'), validate(logListSchema, 'query'), (req, res, next) => logListHandler(req, res).catch(next));

module.exports = router;
