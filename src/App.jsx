import { lazy, Suspense } from 'react';
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
const DrugDatabase = lazy(() => import('@/pages/DrugDatabase'));
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
          <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
          <Route path="/lab-values" element={<ProtectedRoute><LabValues /></ProtectedRoute>} />
          <Route path="/procedures" element={<ProtectedRoute><Procedures /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />

          {/* Protected + Verified Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requireVerification={true}>
                <Profile />
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