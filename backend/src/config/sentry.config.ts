import * as Sentry from '@sentry/node';

/**
 * Sentry Configuration for Error Tracking
 * Initializes Sentry client with environment-aware settings
 */

export const initSentry = (): void => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.APP_VERSION || 'unknown';

  if (!dsn) {
    console.warn(
      'SENTRY_DSN not configured. Error tracking disabled. Set SENTRY_DSN environment variable to enable.',
    );
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    integrations: [
      // Enable HTTP client/server integration
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express request/error handlers
      new Sentry.Integrations.Express({
        request: true,
        serverName: true,
      }),
      // Capture unhandled exceptions
      new Sentry.Integrations.OnUncaughtException(),
      // Capture unhandled promise rejections
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    // Capture 100% of transactions in development, 10% in production
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Capture 100% of errors
    attachStacktrace: true,
    // Maximum breadcrumbs to capture
    maxBreadcrumbs: 50,
    // Ignore certain errors
    ignore: [
      // Ignore 404s from monitoring services
      (error) => {
        if (error.status === 404) {
          return true;
        }
        return false;
      },
    ],
    // Denormalize errors in serverless/async contexts
    beforeSend(event, hint) {
      // Filter out certain error types
      if (event.exception) {
        const error = hint.originalException;
        // Don't send validation errors (already logged)
        if (error?.constructor?.name === 'BadRequestException') {
          return null;
        }
      }
      return event;
    },
  });

  console.log(`[Sentry] Initialized with DSN: ${dsn} | Environment: ${environment}`);
};

export default Sentry;
