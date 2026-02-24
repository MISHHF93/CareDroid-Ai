import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Full app with routing and contexts
import './index.css';
import appConfig from './config/appConfig';
import logger from './utils/logger';

// Add error handlers
window.addEventListener('error', (event) => {
  logger.error('Global error', { message: event.message, stack: event.error?.stack });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', { reason: event.reason });
});

// Mount app
try {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }

  logger.info('Mounting React app...');
  
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  logger.info('React app mounted successfully');
} catch (error) {
  logger.error('Failed to mount app', { error: error.message, stack: error.stack });
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: #ff4444; background: #1a1a1a; min-height: 100dvh;">
      <h1>⚠ App Failed to Load</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre style="background: #000; padding: 12px; border-radius: 4px; overflow: auto;">${error.stack || 'No stack trace'}</pre>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--accent, #3B82F6); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
        Reload Page
      </button>
    </div>
  `;
}
