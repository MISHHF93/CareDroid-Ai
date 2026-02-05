import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConversationProvider } from './contexts/ConversationContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { CostTrackingProvider } from './contexts/CostTrackingContext';
import ErrorBoundary from './components/ErrorBoundary';
import logger from './utils/logger';

// ==================== PAGES ====================
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

// Legal pages
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';

// Shells
import AppShell from './layout/AppShell';
import { PublicShell } from './layout/PublicShell';

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0b1220',
    color: '#f8fafc',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid rgba(148, 163, 184, 0.3)',
      borderTopColor: '#00ff88',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <div style={{ fontSize: '14px', color: 'rgba(248,250,252,0.6)' }}>Loading...</div>
  </div>
);

// Welcome page
function WelcomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      background: '#0b1220',
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>🏥 CareDroid</h1>
        <p style={{ fontSize: '18px', marginBottom: '40px', color: 'rgba(248,250,252,0.7)' }}>
          Clinical AI Platform for Healthcare Professionals
        </p>
        <button
          onClick={() => window.location.href = '/auth'}
          style={{
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 600,
            background: '#00ff88',
            color: '#0b1220',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

// ==================== APP ====================
function App() {
  logger.info('App loaded - Starting up');

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <UserProvider>
          <NotificationProvider>
            <ConversationProvider>
              <WorkspaceProvider>
                <CostTrackingProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<PublicShell><WelcomePage /></PublicShell>} />
                      <Route path="/auth" element={<PublicShell><Auth /></PublicShell>} />
                      <Route path="/privacy" element={<PublicShell><PrivacyPolicy /></PublicShell>} />
                      <Route path="/terms" element={<PublicShell><TermsOfService /></PublicShell>} />

                      {/* Protected routes */}
                      <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </CostTrackingProvider>
              </WorkspaceProvider>
            </ConversationProvider>
          </NotificationProvider>
        </UserProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
