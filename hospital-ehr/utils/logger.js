const { createLogger, format, transports } = require('winston');
const morgan = require('morgan');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()],
});

// Morgan stream to winston
const httpLogger = morgan('combined', {
  stream: {
    write: (message) => logger.http ? logger.http(message.trim()) : logger.info(message.trim()),
  },
});

module.exports = { logger, httpLogger };
