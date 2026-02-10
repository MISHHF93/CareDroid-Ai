import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConversationProvider } from './contexts/ConversationContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { CostTrackingProvider } from './contexts/CostTrackingContext';
import { ToolPreferencesProvider } from './contexts/ToolPreferencesContext';
import { AppearanceProvider } from './contexts/AppearanceContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import logger from './utils/logger';

// ==================== PAGES ====================
// Auth & Public (keep eager — critical path)
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';

// Main App (keep eager — most visited)
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

// User Pages — lazy-loaded
const Profile = lazy(() => import('./pages/Profile'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const Settings = lazy(() => import('./pages/Settings'));
const NotificationPreferences = lazy(() => import('./pages/NotificationPreferences'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
const BiometricSetup = lazy(() => import('./pages/BiometricSetup'));

// Analytics & Monitoring — lazy-loaded
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const CostAnalyticsDashboard = lazy(() => import('./pages/CostAnalyticsDashboard'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const ClinicalAlertsPage = lazy(() => import('./pages/ClinicalAlertsPage'));
const ClinicalDashboard = lazy(() => import('./pages/ClinicalDashboard'));

// Patient Pages — lazy-loaded
const NewPatientPage = lazy(() => import('./pages/NewPatientPage'));

// Tools — lazy-loaded
const ToolsOverview = lazy(() => import('./pages/tools/ToolsOverview'));
const DrugChecker = lazy(() => import('./pages/tools/DrugChecker'));
const LabInterpreter = lazy(() => import('./pages/tools/LabInterpreter'));
const Protocols = lazy(() => import('./pages/tools/Protocols'));
const Calculators = lazy(() => import('./pages/tools/Calculators'));
const DiagnosisAssistant = lazy(() => import('./pages/tools/DiagnosisAssistant'));
const ProcedureGuide = lazy(() => import('./pages/tools/ProcedureGuide'));
const SharedToolSession = lazy(() => import('./pages/tools/SharedToolSession'));

// Team Management — lazy-loaded
const TeamManagement = lazy(() => import('./pages/team/TeamManagement').then(m => ({ default: m.TeamManagement })));

// Legal & Compliance — lazy-loaded
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService').then(m => ({ default: m.TermsOfService })));
const ConsentFlow = lazy(() => import('./pages/legal/ConsentFlow').then(m => ({ default: m.ConsentFlow })));
const ConsentHistory = lazy(() => import('./pages/legal/ConsentHistory').then(m => ({ default: m.ConsentHistory })));
const HIPAANotice = lazy(() => import('./pages/HIPAANotice'));
const GDPRNotice = lazy(() => import('./pages/GDPRNotice'));

// Help & Support — lazy-loaded
const HelpCenter = lazy(() => import('./pages/HelpCenter'));

// Shells
import { PublicShell } from './layout/PublicShell';

// Loading component
const PageLoader = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  let label = 'Loading...';
  try { const { t } = useLanguage(); label = t('app.loading'); } catch { /* fallback */ }
  return (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    background: '#000000',
    color: '#f8fafc',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid rgba(148, 163, 184, 0.3)',
      borderTopColor: 'var(--accent, #3B82F6)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <div style={{ fontSize: '14px', color: 'rgba(248,250,252,0.6)' }}>{label}</div>
  </div>
  );
};

// Welcome page
function WelcomePage() {
  const { t } = useLanguage();
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      background: '#000000',
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>🏥 {t('app.name')}</h1>
        <p style={{ fontSize: '18px', marginBottom: '40px', color: 'rgba(248,250,252,0.7)' }}>
          {t('app.tagline')}
        </p>
        <button
          onClick={() => window.location.href = '/auth'}
          style={{
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 600,
            background: 'var(--accent, #3B82F6)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {t('app.signIn')}
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
        <AppearanceProvider>
        <LanguageProvider>
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
                      <Route path="/patients/new" element={<NewPatientPage />} />
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
      </LanguageProvider>
      </AppearanceProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
