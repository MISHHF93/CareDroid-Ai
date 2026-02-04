/**
 * Simple logger utility respecting app configuration log level
 * Integrates with appConfig.logging.level
 */

import appConfig from '../config/appConfig';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  constructor() {
    const configLevel = appConfig.logging.level;
    this.currentLevel = LOG_LEVELS[configLevel] !== undefined ? configLevel : 'info';
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message, error, ...args) {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error.message, error.stack, ...args);
      } else {
        console.error(`[ERROR] ${message}`, error, ...args);
      }
    }
  }

  setLevel(level) {
    this.currentLevel = level;
  }

  getLevel() {
    return this.currentLevel;
  }
}

export default new Logger();
