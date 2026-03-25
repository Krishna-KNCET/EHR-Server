const Joi = require('joi');
const { createDoctor, listDoctors } = require('../services/adminService');

const createDoctorSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  specialization: Joi.string().optional(),
  department: Joi.string().optional(),
});

const createDoctorHandler = async (req, res) => {
  const result = await createDoctor(req.body);
  return res.success(result, 201);
};

const listDoctorsSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  department: Joi.string().optional(),
});

const listDoctorsHandler = async (req, res) => {
  const data = await listDoctors(req.query);
  return res.success(data);
};

module.exports = { createDoctorSchema, createDoctorHandler, listDoctorsSchema, listDoctorsHandler };
