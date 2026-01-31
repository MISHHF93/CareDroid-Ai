import * as winston from 'winston';

/**
 * Winston Logger Configuration
 * Configures structured logging with multiple transports:
 * - Console (development)
 * JSON formatting for structured logging
 */

const isProduction = process.env.NODE_ENV === 'production';

// JSON formatter for structured logging
const jsonFormatter = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Console formatter with colors (development)
const consoleFormatter = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    return `[${timestamp}] ${level}: ${message} ${Object.keys(rest).length ? JSON.stringify(rest) : ''}`;
  }),
);

// Configure transports (outputs)
const transports: winston.transport[] = [];

// Console transport (always, useful for debugging)
transports.push(
  new winston.transports.Console({
    format: consoleFormatter,
    level: isProduction ? 'warn' : 'debug',
  }),
);

export const winstonLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: jsonFormatter,
  defaultMeta: {
    service: 'caredroid-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
});

export default winstonLogger;
