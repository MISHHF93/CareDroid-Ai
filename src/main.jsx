import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Import services for initialization
import CrashReportingService from './services/crashReportingService';
import AnalyticsService from './services/analyticsService';
import { NotificationService } from './services/NotificationService';
import syncService from './services/syncService';
import offlineService from './services/offlineService';

// ================================
// Initialize Crash Reporting (Sentry)
// ================================
if (import.meta.env.VITE_ENABLE_CRASH_REPORTING === 'true' && import.meta.env.VITE_SENTRY_DSN) {
  try {
    CrashReportingService.initialize({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
      tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      debug: import.meta.env.VITE_DEBUG === 'true',
    });
    console.log('✓ Sentry crash reporting initialized');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

// ================================
// Initialize Analytics Service
// ================================
if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  try {
    if (import.meta.env.VITE_SEGMENT_WRITE_KEY) {
      // Initialize with Segment if available
      AnalyticsService.initializeSegment(import.meta.env.VITE_SEGMENT_WRITE_KEY);
    }
    AnalyticsService.trackEvent({
      event: 'app_initialized',
      properties: {
        app_version: import.meta.env.VITE_APP_VERSION,
        app_environment: import.meta.env.VITE_APP_ENVIRONMENT,
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
if (import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true') {
  // Request notification permission on app start
  NotificationService.requestPermission()
    .then((granted) => {
      if (granted) {
        console.log('✓ Notification permissions granted');
      } else {
        console.log('ℹ Notification permissions not granted');
      }
    })
    .catch(error => console.error('Failed to request notification permission:', error));
}

// ================================
// Initialize Offline Mode (Dexie + Sync Service)
// ================================
if (import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true') {
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
        if (import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true' && 'periodicSync' in registration) {
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
  if (import.meta.env.VITE_ENABLE_CRASH_REPORTING === 'true') {
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
  if (import.meta.env.VITE_ENABLE_CRASH_REPORTING === 'true') {
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
