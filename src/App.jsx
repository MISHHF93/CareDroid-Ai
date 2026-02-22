import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
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
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AuditLogs from './pages/AuditLogs';

// Main App routes — lazy-loaded to reduce initial bundle
const Chat = lazy(() => import('./pages/Chat'));

// User Pages — lazy-loaded
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const Settings = lazy(() => import('./pages/Settings'));
const NotificationPreferences = lazy(() => import('./pages/NotificationPreferences'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
const BiometricSetup = lazy(() => import('./pages/BiometricSetup'));

// Analytics & Monitoring — lazy-loaded
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));
const CostAnalyticsDashboard = lazy(() => import('./pages/CostAnalyticsDashboard'));
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
  const { t } = useLanguage();
  const label = t('app.loading');
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
  const navigate = useNavigate();
  const valuePillars = [
    {
      title: 'Rapid Clinical Reasoning',
      detail: 'Triage-focused support built for urgent decisions.',
    },
    {
      title: 'Evidence-Aligned Guidance',
      detail: 'Actionable recommendations with structured context.',
    },
    {
      title: 'Secure Team Workflow',
      detail: 'Designed for healthcare collaboration and compliance.',
    },
  ];

  return (
    <section className="welcome-hero" aria-labelledby="welcome-title">
      <div className="welcome-surface">
        <div className="welcome-brand-mark" aria-hidden="true">⚕️</div>

        <div className="welcome-content">
          <p className="welcome-eyebrow">Clinical Intelligence Platform</p>
          <h1 id="welcome-title" className="welcome-title">{t('app.name')}</h1>
          <p className="welcome-tagline">{t('app.tagline')}</p>

          <div className="welcome-pillars" aria-label="Core platform strengths">
            {valuePillars.map((item) => (
              <article key={item.title} className="welcome-pillar">
                <h2 className="welcome-pillar-title">{item.title}</h2>
                <p className="welcome-pillar-detail">{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="welcome-actions">
            <button
              onClick={() => navigate('/auth')}
              className="welcome-cta"
            >
              {t('app.signIn')}
            </button>
          </div>

          <div className="welcome-utility-links" aria-label="Landing quick navigation">
            <Link to="/help" className="welcome-utility-link">Help</Link>
            <Link to="/privacy" className="welcome-utility-link">Privacy</Link>
            <Link to="/terms" className="welcome-utility-link">Terms</Link>
          </div>

          <div className="welcome-meta-strip" aria-label="Trust and compliance indicators">
            <span className="welcome-meta-chip">🔒 HIPAA Compliant</span>
            <span className="welcome-meta-chip">Clinical-grade Security</span>
            <span className="welcome-meta-chip">24/7 Care Workflow Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==================== APP ====================
function App() {
  logger.info('App loaded - Starting up');

  useEffect(() => {
    const prefetchRoutes = () => {
      void import('./pages/Chat');
      void import('./pages/Settings');
      void import('./pages/tools/ToolsOverview');
      void import('./pages/AnalyticsDashboard');
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetchRoutes, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

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
