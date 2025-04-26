/**
 * Logger utility for application-wide logging
 * Provides file and console logging with environment-based configuration
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Environment configuration
const environment = process.env.ENVIRONMENT || 'development';
const isProduction = environment === 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (more readable for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Define transports
const transports = [
  // Always log to files
  new winston.transports.File({ 
    filename: path.join(logsDir, 'error.log'), 
    level: 'error',
    format: logFormat
  }),
  new winston.transports.File({ 
    filename: path.join(logsDir, 'combined.log'),
    format: logFormat
  })
];

// Add console transport with conditional debug level based on environment
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: isProduction ? 'info' : 'debug' // Only show debug logs in development
  })
);

// Create the logger
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  defaultMeta: { service: 'who-is-online' },
  transports
});

// Helper methods for common log types
const loggerWrapper = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, error = null) => {
    const meta = error ? { error: error.toString(), stack: error.stack } : {};
    logger.error(message, meta);
  },
  debug: (message, meta = {}) => logger.debug(message, meta),
  // Log HTTP requests
  request: (req, meta = {}) => {
    if (isProduction) return; // Skip detailed request logging in production
    logger.debug(`${req.method} ${req.url}`, {
      ...meta,
      params: req.params,
      query: req.query,
      // Don't log sensitive data like passwords or tokens
      body: req.body ? sanitizeRequestBody(req.body) : undefined
    });
  }
};

// Utility to sanitize sensitive data from request bodies
function sanitizeRequestBody(body) {
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

module.exports = loggerWrapper;
