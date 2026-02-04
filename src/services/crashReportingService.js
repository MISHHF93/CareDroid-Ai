/**
 * Crash Reporting Service for CareDroid-AI
 * Simplified implementation for error tracking
 * In production, integrate with Sentry by installing @sentry/react
 */
import logger from '../utils/logger';

class CrashReportingService {
  constructor() {
    this.initialized = false;
    this.config = {};
  }

  initialize(config) {
    this.config = config;
    this.initialized = true;
    logger.info('Crash reporting service initialized');
  }

  captureException(error, context) {
    if (!this.initialized) return;
    logger.error('Exception captured', { message: error.message, context });
  }

  captureMessage(message, level = 'error') {
    if (!this.initialized) return;
    logger.warn(`[${level}] ${message}`);
  }

  setUser(userId, email, name) {
    if (!this.initialized) return;
    sessionStorage.setItem('analytics_user', JSON.stringify({ userId, email, name }));
  }

  clearUser() {
    sessionStorage.removeItem('analytics_user');
  }

  addBreadcrumb(message, category = 'default', data) {
    if (!this.initialized) return;
    logger.debug(`[${category}] ${message}`, { data });
  }

  isInitialized() {
    return this.initialized;
  }
}

const crashReportingService = new CrashReportingService();
export default crashReportingService;
