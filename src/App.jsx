import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';

console.log('✓ App.jsx loaded');

/**
 * LandingPage - Simple startup confirmation screen
 */
function LandingPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b1220 0%, #1a3a52 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
        padding: '40px'
      }}>
        <h1 style={{
          fontSize: '48px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #00ff88, #00ffff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          CareDroid AI
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '40px'
        }}>
          Clinical AI Assistant Platform
        </p>

        <div style={{
          background: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '40px',
          fontSize: '14px',
          lineHeight: '1.8'
        }}>
          <p>✓ App Loaded Successfully</p>
          <p>✓ All Providers Active</p>
          <p>✓ Ready to Use</p>
        </div>

        <button 
          onClick={() => window.location.href = '/auth'}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #00ff88, #00ffff)',
            color: '#0b1220',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

/**
 * AuthPage - Simple auth placeholder
 */
function AuthPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b1220 0%, #1a3a52 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        padding: '40px'
      }}>
        <h1 style={{
          fontSize: '32px',
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #00ff88, #00ffff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Login
        </h1>
        
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '20px'
        }}>
          Authentication Page
        </p>

        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            background: 'rgba(0, 255, 136, 0.2)',
            color: '#00ff88',
            border: '1px solid rgba(0, 255, 136, 0.4)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

/**
 * AppRoutes - Main routing component
 */
function AppRoutes() {
  const { isAuthenticated } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsChecking(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0b1220',
        color: '#fff',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Initializing...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

/**
 * App - Root component with all providers
 */
function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <NotificationProvider>
          <SystemConfigProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </SystemConfigProvider>
        </NotificationProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
