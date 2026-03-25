require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logger, httpLogger } = require('./utils/logger');
const apiResponse = require('./middleware/apiResponse');
const audit = require('./middleware/audit');
const { connectDB } = require('./config/db');

// Load swagger doc
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'swagger.yaml'));

const app = express();

const requiredEnvVars = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const validateRequiredEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Prevent NoSQL injection & XSS
app.use(mongoSanitize());
app.use(xssClean());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Logging
app.use(httpLogger);
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Static files (for report downloads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Standard API response wrapper
app.use(apiResponse);
// Audit logging
app.use(audit);

// Health check
app.get('/health', (_req, res) => res.success({ status: 'ok', uptime: process.uptime() }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/predict', require('./routes/predictionRoutes'));

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 + Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    validateRequiredEnv();
    await connectDB();
    const server = app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Stop the existing process or use a different PORT.`);
      } else {
        logger.error('Server failed to bind port', { err });
      }
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
})();
