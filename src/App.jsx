import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConversationProvider } from './contexts/ConversationContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { CostTrackingProvider } from './contexts/CostTrackingContext';
import { ToolPreferencesProvider } from './contexts/ToolPreferencesContext';
import ErrorBoundary from './components/ErrorBoundary';
import logger from './utils/logger';

// ==================== PAGES ====================
// Auth & Public
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';

// Main App
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

// User Pages
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import Settings from './pages/Settings';
import NotificationPreferences from './pages/NotificationPreferences';
import TwoFactorSetup from './pages/TwoFactorSetup';
import BiometricSetup from './pages/BiometricSetup';

// Analytics & Monitoring
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CostAnalyticsDashboard from './pages/CostAnalyticsDashboard';
import AuditLogs from './pages/AuditLogs';
import ClinicalAlertsPage from './pages/ClinicalAlertsPage';
import ClinicalDashboard from './pages/ClinicalDashboard';

// Tools
import ToolsOverview from './pages/tools/ToolsOverview';
import DrugChecker from './pages/tools/DrugChecker';
import LabInterpreter from './pages/tools/LabInterpreter';
import Protocols from './pages/tools/Protocols';
import Calculators from './pages/tools/Calculators';
import DiagnosisAssistant from './pages/tools/DiagnosisAssistant';
import ProcedureGuide from './pages/tools/ProcedureGuide';
import SharedToolSession from './pages/tools/SharedToolSession';

// Team Management
import { TeamManagement } from './pages/team/TeamManagement';

// Legal & Compliance
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { ConsentFlow } from './pages/legal/ConsentFlow';
import { ConsentHistory } from './pages/legal/ConsentHistory';
import HIPAANotice from './pages/HIPAANotice';
import GDPRNotice from './pages/GDPRNotice';

// Help & Support
import HelpCenter from './pages/HelpCenter';

// Shells
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
                <ToolPreferencesProvider>
                  <CostTrackingProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                      {/* ==================== PUBLIC ROUTES ==================== */}
                      <Route path="/" element={<PublicShell><WelcomePage /></PublicShell>} />
                      <Route path="/auth" element={<PublicShell><Auth /></PublicShell>} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      
                      {/* Legal & Compliance */}
                      <Route path="/privacy" element={<PublicShell><PrivacyPolicy /></PublicShell>} />
                      <Route path="/terms" element={<PublicShell><TermsOfService /></PublicShell>} />
                      <Route path="/help" element={<PublicShell><HelpCenter /></PublicShell>} />
                      <Route path="/hipaa" element={<PublicShell><HIPAANotice /></PublicShell>} />
                      <Route path="/gdpr" element={<PublicShell><GDPRNotice /></PublicShell>} />

                      {/* ==================== PROTECTED ROUTES ==================== */}
                      {/* Main Dashboard - includes AppShell internally */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/chat" element={<Chat />} />
                      
                      {/* User & Settings */}
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/profile/settings" element={<ProfileSettings />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/settings/notifications" element={<NotificationPreferences />} />
                      <Route path="/settings/2fa" element={<TwoFactorSetup />} />
                      <Route path="/settings/biometric" element={<BiometricSetup />} />
                      
                      {/* Analytics & Monitoring */}
                      <Route path="/analytics" element={<AnalyticsDashboard />} />
                      <Route path="/analytics/costs" element={<CostAnalyticsDashboard />} />
                      <Route path="/clinical-dashboard" element={<ClinicalDashboard />} />
                      <Route path="/audit-logs" element={<AuditLogs />} />
                      <Route path="/alerts" element={<ClinicalAlertsPage />} />
                      
                      {/* Clinical Tools */}
                      <Route path="/tools" element={<ToolsOverview />} />
                      <Route path="/tools/drug-checker" element={<DrugChecker />} />
                      <Route path="/tools/lab-interpreter" element={<LabInterpreter />} />
                      <Route path="/tools/protocols" element={<Protocols />} />
                      <Route path="/tools/calculators" element={<Calculators />} />
                      <Route path="/tools/diagnosis" element={<DiagnosisAssistant />} />
                      <Route path="/tools/procedures" element={<ProcedureGuide />} />
                      <Route path="/tools/session/:sessionId" element={<SharedToolSession />} />
                      
                      {/* Team Management */}
                      <Route path="/team" element={<TeamManagement />} />
                      
                      {/* Consent Management */}
                      <Route path="/consent" element={<ConsentFlow />} />
                      <Route path="/consent/history" element={<ConsentHistory />} />

                      {/* ==================== FALLBACK ==================== */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </CostTrackingProvider>
              </ToolPreferencesProvider>
            </WorkspaceProvider>
          </ConversationProvider>
        </NotificationProvider>
      </UserProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
