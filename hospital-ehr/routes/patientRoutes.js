const Joi = require('joi');
const router = require('express').Router();
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createProfileSchema, updateProfileSchema, historyQuerySchema, createProfileHandler, getByPatientIdHandler, updateProfileHandler, getHistoryHandler } = require('../controllers/patientController');

const patientIdParamSchema = Joi.object({
	patientId: Joi.string().required(),
});

router.post('/', authenticate, authorize('patient'), validate(createProfileSchema), (req, res, next) => createProfileHandler(req, res).catch(next));
router.put('/me', authenticate, authorize('patient'), validate(updateProfileSchema), (req, res, next) => updateProfileHandler(req, res).catch(next));
router.get('/:patientId/history', authenticate, authorize('patient', 'doctor'), validate(patientIdParamSchema, 'params'), validate(historyQuerySchema, 'query'), (req, res, next) => getHistoryHandler(req, res).catch(next));
router.get('/:patientId', authenticate, authorize('patient', 'doctor', 'admin'), validate(patientIdParamSchema, 'params'), (req, res, next) => getByPatientIdHandler(req, res).catch(next));

module.exports = router;
