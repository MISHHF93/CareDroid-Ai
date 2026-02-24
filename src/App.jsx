import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConversationProvider } from './contexts/ConversationContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { CostTrackingProvider } from './contexts/CostTrackingContext';
import { ToolPreferencesProvider } from './contexts/ToolPreferencesContext';
import { AppearanceProvider } from './contexts/AppearanceContext';
import { LanguageProvider } from './contexts/LanguageContext';
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

// Community (MedX) — lazy-loaded
const Community = lazy(() => import('./pages/community/Community'));
const PostDetail = lazy(() => import('./pages/community/PostDetail'));

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

// Welcome page
function WelcomePage() {
  const navigate = useNavigate();
  const valuePillars = [
    'Rapid clinical reasoning at triage speed',
    'Evidence-aligned recommendations with context',
    'Secure team workflow for healthcare environments'
  ];

  return (
    <section className="landing" aria-labelledby="landing-title">
      <div className="landing-shell">
        <header className="landing-brand" aria-label="Brand header">
          <div className="landing-brand-icon" aria-hidden="true">⚕️</div>
          <p className="landing-brand-text">Clinical Intelligence Platform</p>
        </header>

        <div className="landing-body">
          <h1 id="landing-title" className="landing-title">CareDroid</h1>
          <p className="landing-subtitle">
            AI-powered clinical decision support designed for healthcare teams.
          </p>

          <ul className="landing-points" aria-label="Core strengths">
            {valuePillars.map((item) => (
              <li key={item} className="landing-point">{item}</li>
            ))}
          </ul>

          <div className="landing-trust" aria-label="Trust and compliance capabilities">
            <span>HIPAA Ready</span>
            <span>Encrypted</span>
            <span>Audit Logs</span>
            <span>Role-Based Access</span>
          </div>

          <p className="landing-disclaimer">
            Decision support only. Always apply licensed clinical judgment and local protocols.
          </p>
        </div>

        <div className="landing-actions">
          <button
            onClick={() => navigate('/auth')}
            className="landing-cta"
          >
            Enter Secure Clinical Workspace
          </button>
          <div className="landing-links" aria-label="Utility links">
            <button type="button" onClick={() => navigate('/help')}>Help</button>
            <button type="button" onClick={() => navigate('/privacy')}>Privacy</button>
            <button type="button" onClick={() => navigate('/terms')}>Terms</button>
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
                    <Suspense fallback={null}>
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
                      <Route path="/auth/help" element={<PublicShell><HelpCenter /></PublicShell>} />
                      <Route path="/auth/Help" element={<PublicShell><HelpCenter /></PublicShell>} />
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
                      
                      {/* Community (MedX) */}
                      <Route path="/community" element={<Community />} />
                      <Route path="/community/post/:postId" element={<PostDetail />} />

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
