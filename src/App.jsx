import { lazy, Suspense } from 'react';
import lazyWithRetry from '@/lib/lazyWithRetry';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from "@/components/ui/toaster";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AppLayout from '@/components/layouts/AppLayout';
import { ProtectedRoute, PublicRoute } from '@/components/routes/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import useSessionActivity from '@/hooks/useSessionActivity';

// Lazy load pages for code splitting
const Welcome = lazy(() => import('@/pages/Welcome'));
const Login = lazy(() => import('@/pages/Login'));
const LoginEnhanced = lazy(() => import('@/pages/LoginEnhanced'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const SubscriptionSelect = lazy(() => import('@/pages/SubscriptionSelect'));
const Setup2FA = lazy(() => import('@/pages/Setup2FA'));

const Home = lazy(() => import('@/pages/Home'));
const Search = lazy(() => import('@/pages/Search'));
const Protocols = lazy(() => import('@/pages/Protocols'));
const Calculators = lazy(() => import('@/pages/Calculators'));
const Profile = lazy(() => import('@/pages/Profile'));
const DrugDatabase = lazyWithRetry(() => import('@/pages/DrugDatabase'));
const DrugInteractions = lazy(() => import('@/pages/DrugInteractions'));
const Algorithms = lazy(() => import('@/pages/Algorithms'));
const Abbreviations = lazy(() => import('@/pages/Abbreviations'));
const ScoringSystem = lazy(() => import('@/pages/ScoringSystem'));
const ClinicalPearls = lazy(() => import('@/pages/ClinicalPearls'));
const QuickReference = lazy(() => import('@/pages/QuickReference'));
const Images = lazy(() => import('@/pages/Images'));
const OfflineManager = lazy(() => import('@/pages/OfflineManager'));
const AuditLog = lazy(() => import('@/pages/AuditLog'));
const EncounterSummary = lazy(() => import('@/pages/EncounterSummary'));
const JSONViewer = lazy(() => import('@/pages/JSONViewer'));
const TechnicalSpec = lazy(() => import('@/pages/TechnicalSpec'));
const DiagnosticTest = lazy(() => import('@/pages/DiagnosticTest'));
const ProfileEnhanced = lazy(() => import('@/pages/ProfileEnhanced'));
const ComplianceCenter = lazy(() => import('@/pages/ComplianceCenter'));
const InstitutionalPortal = lazy(() => import('@/pages/InstitutionalPortal'));
const LabImageAnalyzer = lazy(() => import('@/pages/LabImageAnalyzer'));
const SavedQueries = lazy(() => import('@/pages/SavedQueries'));
const Emergency = lazy(() => import('@/pages/Emergency'));
const LabValues = lazy(() => import('@/pages/LabValues'));
const Procedures = lazy(() => import('@/pages/Procedures'));
const Library = lazy(() => import('@/pages/Library'));
const AlgorithmAI = lazy(() => import('@/pages/AlgorithmAI'));
const LabInterpreter = lazy(() => import('@/pages/LabInterpreter'));
const DifferentialDx = lazy(() => import('@/pages/DifferentialDx'));
const ClinicalTrials = lazy(() => import('@/pages/ClinicalTrials'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="text-center">
      <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
      <p className="text-neutral-600 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  // Track user activity for session management
  useSessionActivity();

  return (
    <AppLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes - Hidden navigation */}
          <Route path="/" element={<PublicRoute><LoginEnhanced /></PublicRoute>} />
          <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginEnhanced /></PublicRoute>} />
          <Route path="/login-old" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/subscription-select" element={<SubscriptionSelect />} />
          <Route path="/setup-2fa" element={<Setup2FA />} />

          {/* Protected Routes - Show navigation */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/protocols" element={<ProtectedRoute><Protocols /></ProtectedRoute>} />
          <Route path="/calculators" element={<ProtectedRoute><Calculators /></ProtectedRoute>} />
          <Route path="/drug-database" element={<ProtectedRoute><DrugDatabase /></ProtectedRoute>} />
          <Route path="/drug-interactions" element={<ProtectedRoute><DrugInteractions /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
          <Route path="/lab-values" element={<ProtectedRoute><LabValues /></ProtectedRoute>} />
          <Route path="/procedures" element={<ProtectedRoute><Procedures /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/saved-queries" element={<ProtectedRoute><SavedQueries /></ProtectedRoute>} />
          <Route path="/algorithms" element={<ProtectedRoute><Algorithms /></ProtectedRoute>} />
          <Route path="/abbreviations" element={<ProtectedRoute><Abbreviations /></ProtectedRoute>} />
          <Route path="/scoring-system" element={<ProtectedRoute><ScoringSystem /></ProtectedRoute>} />
          <Route path="/clinical-pearls" element={<ProtectedRoute><ClinicalPearls /></ProtectedRoute>} />
          <Route path="/quick-reference" element={<ProtectedRoute><QuickReference /></ProtectedRoute>} />
          <Route path="/images" element={<ProtectedRoute><Images /></ProtectedRoute>} />
          <Route path="/offline-manager" element={<ProtectedRoute><OfflineManager /></ProtectedRoute>} />
          <Route path="/json-viewer" element={<ProtectedRoute><JSONViewer /></ProtectedRoute>} />
          <Route path="/encounter-summary" element={<ProtectedRoute><EncounterSummary /></ProtectedRoute>} />
          <Route path="/technical-spec" element={<ProtectedRoute><TechnicalSpec /></ProtectedRoute>} />
          <Route path="/diagnostic-test" element={<ProtectedRoute><DiagnosticTest /></ProtectedRoute>} />

          {/* Protected + Verified Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requireVerification={true}>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile-enhanced" 
            element={
              <ProtectedRoute requireVerification={true}>
                <ProfileEnhanced />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/compliance-center" 
            element={
              <ProtectedRoute requireVerification={true}>
                <ComplianceCenter />
              </ProtectedRoute>
            } 
          />

          {/* Protected + Subscription Routes */}
          <Route 
            path="/algorithm-ai" 
            element={
              <ProtectedRoute requireSubscription={true}>
                <AlgorithmAI />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lab-image-analyzer" 
            element={
              <ProtectedRoute requireSubscription={true}>
                <LabImageAnalyzer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lab-interpreter" 
            element={
              <ProtectedRoute requireSubscription={true}>
                <LabInterpreter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/differential-dx" 
            element={
              <ProtectedRoute requireSubscription={true}>
                <DifferentialDx />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clinical-trials" 
            element={
              <ProtectedRoute requireSubscription={true}>
                <ClinicalTrials />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/institutional-portal" 
            element={
              <ProtectedRoute requireSubscription={true} tier="INSTITUTIONAL">
                <InstitutionalPortal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/audit-log" 
            element={
              <ProtectedRoute requireSubscription={true} tier="INSTITUTIONAL">
                <AuditLog />
              </ProtectedRoute>
            } 
          />

          {/* Catch all - redirect to home or login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>

      <Toaster />
      <PWAInstallPrompt />
    </AppLayout>
  );
}

export default App; 