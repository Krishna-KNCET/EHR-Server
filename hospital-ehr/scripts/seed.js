require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const createSampleCredentials = (role) => {
  const suffix = crypto.randomBytes(3).toString('hex');
  return {
    email: `${role}.${suffix}@ehr.local`,
    password: `${role[0].toUpperCase()}${crypto.randomBytes(5).toString('hex')}!9`,
  };
};

(async () => {
  try {
    const withData = process.argv.includes('--with-data');
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
    ]);

    if (withData) {
      const doctorCredentials = createSampleCredentials('doctor');
      const patientCredentials = createSampleCredentials('patient');

      const doctorUser = await User.create({
        name: 'Sample Doctor',
        email: doctorCredentials.email,
        password: doctorCredentials.password,
        role: 'doctor',
      });
      const patientUser = await User.create({
        name: 'Sample Patient',
        email: patientCredentials.email,
        password: patientCredentials.password,
        role: 'patient',
      });

      const doctor = await Doctor.create({ user: doctorUser._id, doctorId: 'DR-TEST', name: 'Dr. Smith', specialization: 'Cardiology', department: 'Cardiology' });
      const patient = await Patient.create({ user: patientUser._id, patientId: 'PT-TEST', name: 'John Doe', age: 34, gender: 'male', contact: '1234567890' });

      console.log('Seed complete with sample data:', {
        doctor: doctor.name,
        patient: patient.name,
        credentials: {
          doctor: doctorCredentials,
          patient: patientCredentials,
        },
        note: 'No admin account is created by the seed script. Register the first admin from the app.',
      });
    } else {
      console.log('Database cleaned. No sample data inserted.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    console.error('Seed error', e);
    process.exit(1);
  }
})();
