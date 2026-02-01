import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import appConfig from './config/appConfig';

// Import services for initialization
import CrashReportingService from './services/crashReportingService';
import AnalyticsService from './services/analyticsService';
import { NotificationService } from './services/NotificationService';
import syncService from './services/syncService';
import offlineService from './services/offlineService';

// ================================
// Initialize Crash Reporting (Sentry)
// ================================
if (appConfig.crashReporting.enabled && appConfig.crashReporting.dsn) {
  try {
    CrashReportingService.initialize({
      dsn: appConfig.crashReporting.dsn,
      environment: appConfig.crashReporting.environment,
      tracesSampleRate: appConfig.crashReporting.tracesSampleRate,
      profilesSampleRate: appConfig.crashReporting.profilesSampleRate,
      debug: appConfig.crashReporting.debug,
    });
    console.log('✓ Sentry crash reporting initialized');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

// ================================
// Initialize Analytics Service
// ================================
if (appConfig.analytics.enabled) {
  try {
    if (appConfig.analytics.segmentWriteKey) {
      // Initialize with Segment if available
      AnalyticsService.initializeSegment(appConfig.analytics.segmentWriteKey);
    }
    AnalyticsService.trackEvent({
      event: 'app_initialized',
      properties: {
        app_version: appConfig.app.version,
        app_environment: appConfig.app.environment,
      }
    });
    console.log('✓ Analytics service initialized');
  } catch (error) {
    console.error('Failed to initialize Analytics:', error);
  }
}

// ================================
// Initialize Notifications
// ================================
if (appConfig.features.enablePushNotifications) {
  // Request notification permission on app start
  NotificationService.requestPermission()
    .then((granted) => {
      if (granted) {
        console.log('✓ Notification permissions granted');
        NotificationService.registerPushToken().catch(() => {});
      } else {
        console.log('ℹ Notification permissions not granted');
      }
    })
    .catch(error => console.error('Failed to request notification permission:', error));
}

// ================================
// Initialize Offline Mode (Dexie + Sync Service)
// ================================
if (appConfig.features.enableOfflineMode) {
  try {
    // Initialize offline storage
    offlineService.initialize()
      .then((success) => {
        if (success) {
          console.log('✓ Offline storage initialized');
          // Initialize sync service for background synchronization
          syncService.initialize();
          console.log('✓ Sync service initialized');
        } else {
          console.error('Failed to initialize offline storage');
        }
      })
      .catch(error => console.error('Failed to initialize offline mode:', error));
  } catch (error) {
    console.error('Failed to initialize offline services:', error);
  }
}

// ================================
// Service Worker Registration
// ================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✓ Service Worker registered:', registration);
        // Set up periodic background sync if offline mode enabled
        if (appConfig.features.enableOfflineMode && 'periodicSync' in registration) {
          registration.periodicSync.register('sync-data', { minInterval: 24 * 60 * 60 * 1000 })
            .then(() => console.log('✓ Periodic background sync registered'))
            .catch(err => console.log('ℹ Periodic background sync not available:', err));
        }
      })
      .catch(error => console.log('Service Worker registration failed:', error));
  });
}

// ================================
// Global Error Handler (Integrates with Sentry)
// ================================
window.addEventListener('error', (event) => {
  if (appConfig.crashReporting.enabled) {
    try {
      CrashReportingService.captureException(event.error, {
        tags: {
          source: 'uncaught_error'
        }
      });
    } catch (error) {
      console.error('Failed to report error to Sentry:', error);
    }
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (appConfig.crashReporting.enabled) {
    try {
      CrashReportingService.captureException(event.reason, {
        tags: {
          source: 'unhandled_promise_rejection'
        }
      });
    } catch (error) {
      console.error('Failed to report rejection to Sentry:', error);
    }
  }
});

// ================================
// Mount React App
// ================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
