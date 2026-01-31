import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Winston Logger Configuration
 * Configures structured logging with multiple transports:
 * - Console (development)
 * JSON formatting for structured logging
 */

const isProduction = process.env.NODE_ENV === 'production';

// JSON formatter for structured logging
const jsonFormatter = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
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

export const winstonLogger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: jsonFormatter,
  defaultMeta: {
    service: 'caredroid-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.Console({
      format: consoleFormatter,
      level: isProduction ? 'warn' : 'debug',
    }),
  ],
});

export default winstonLogger;
