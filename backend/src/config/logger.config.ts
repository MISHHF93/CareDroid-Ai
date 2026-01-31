import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonUtilities } from 'nest-winston';

/**
 * Winston Logger Configuration
 * Configures structured logging with multiple transports:
 * - Console (development)
 * - Daily rotating file (all logs)
 * - Daily rotating file (errors only)
 * JSON formatting for ELK stack ingestion
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
  nestWinstonUtilities.format.nestLike('CareDroid', {
    colors: true,
    prettyPrint: true,
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

// Daily rotating file for combined logs
transports.push(
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxDays: isProduction ? '30d' : '7d',
    level: 'debug',
    format: jsonFormatter,
  }),
);

// Daily rotating file for errors only
transports.push(
  new DailyRotateFile({
    filename: 'logs/errors-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxDays: isProduction ? '60d' : '14d',
    level: 'error',
    format: jsonFormatter,
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
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '30d',
      format: jsonFormatter,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '30d',
      format: jsonFormatter,
    }),
  ],
});

export default winstonLogger;
