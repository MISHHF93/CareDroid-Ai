```typescript
/**
 * Crash Reporting Service for CareDroid-AI
 * Integrates with Sentry for error tracking and crash reporting
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

interface CrashReportConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  debug?: boolean;
}

class CrashReportingService {
  private initialized: boolean = false;

  /**
   * Initialize crash reporting
   */
  initialize(config: CrashReportConfig) {
    if (this.initialized) {
      console.warn('Crash reporting already initialized');
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release || `caredroid-ai@${process.env.REACT_APP_VERSION || '1.0.0'}`,
        integrations: [
          new BrowserTracing(),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: config.tracesSampleRate || 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        debug: config.debug || false,
        beforeSend(event, hint) {
          // Sanitize sensitive data
          if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
              delete event.request.headers['Authorization'];
              delete event.request.headers['Cookie'];
            }
          }

          // Remove PHI from breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
              if (breadcrumb.data) {
                // Remove potential PHI fields
                const sanitized = { ...breadcrumb.data };
                delete sanitized.email;
                delete sanitized.phone;
                delete sanitized.ssn;
                delete sanitized.medicalRecord;
                breadcrumb.data = sanitized;
              }
              return breadcrumb;
            });
          }

          return event;
        },
      });

      this.initialized = true;
      console.log('Crash reporting initialized (Sentry)');
    } catch (error) {
      console.error('Failed to initialize crash reporting:', error);
    }
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string, role?: string) {
    if (!this.initialized) return;

    Sentry.setUser({
      id: userId,
      email: email,
      role: role,
    });
  }

  /**
   * Clear user context (e.g., on logout)
   */
  clearUser() {
    if (!this.initialized) return;

    Sentry.setUser(null);
  }

  /**
   * Set custom context
   */
  setContext(name: string, context: Record<string, any>) {
    if (!this.initialized) return;

    Sentry.setContext(name, context);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.initialized) {
      console.error('Crash reporting not initialized. Error:', error);
      return;
    }

    if (context) {
      Sentry.withScope((scope) => {
        Object.keys(context).forEach(key => {
          scope.setExtra(key, context[key]);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) return;

    Sentry.captureMessage(message, level);
  }

  /**
   * Capture network error
   */
  captureNetworkError(url: string, method: string, statusCode: number, error: Error) {
    this.captureException(error, {
      type: 'network_error',
      url,
      method,
      statusCode,
    });
  }

  /**
   * Capture API error
   */
  captureAPIError(endpoint: string, error: Error, response?: any) {
    this.captureException(error, {
      type: 'api_error',
      endpoint,
      response: response ? JSON.stringify(response) : undefined,
    });
  }

  /**
   * Capture performance issue
   */
  capturePerformanceIssue(metric: string, value: number, threshold: number) {
    this.captureMessage(
      `Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`,
      'warning'
    );
  }

  /**
   * Start transaction (performance monitoring)
   */
  startTransaction(name: string, op: string) {
    if (!this.initialized) return null;

    return Sentry.startTransaction({
      name,
      op,
    });
  }

  /**
   * Flush pending events
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.initialized) return true;

    return await Sentry.flush(timeout);
  }

  /**
   * Close SDK (cleanup)
   */
  async close(timeout: number = 2000): Promise<boolean> {
    if (!this.initialized) return true;

    return await Sentry.close(timeout);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
const crashReportingService = new CrashReportingService();
export default crashReportingService;
const crashReportingService = new CrashReportingService();
export default crashReportingService;
```
