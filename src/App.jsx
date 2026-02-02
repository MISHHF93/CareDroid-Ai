import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';

// Import pages (fix imports to match actual filenames)
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ChatInterface from './components/ChatInterface';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import Onboarding from './pages/Onboarding';
import AuditLogs from './pages/AuditLogs';
import TeamManagement from './pages/team/TeamManagement';
import ErrorBoundary from './components/ErrorBoundary';
import PermissionGate from './components/PermissionGate';
import Toast from './components/Toast';
import { Permission } from './contexts/UserContext';

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
          <p>✓ React is loaded</p>
          <p>✓ Context providers ready</p>
          <p>✓ Router initialized</p>
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
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 20px rgba(0, 255, 136, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

/**
 * AppRoutes - Main routing component with auth checks
 */
function AppRoutes() {
  const { user, isAuthenticated } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Small delay to allow UserContext to hydrate from localStorage
    const timer = setTimeout(() => setIsChecking(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const addToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

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
        background: 'var(--navy-bg, #0b1220)',
        color: 'var(--text-color, #fff)',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Initializing CareDroid...</h1>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {!isAuthenticated ? (
        // Unauthenticated routes
        <>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </>
      ) : (
        // Authenticated routes (to be added progressively)
        <>
          <Route path="/" element={<ChatInterface conversationId={1} messages={[]} onAppendMessage={() => {}} onTrackEvent={() => {}} onAddToast={() => {}} authToken={null} />} />
          <Route path="/chat" element={<ChatInterface conversationId={1} messages={[]} onAppendMessage={() => {}} onTrackEvent={() => {}} onAddToast={() => {}} authToken={null} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile-settings" element={<ProfileSettings />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route 
            path="/audit-logs" 
            element={
              <PermissionGate 
                permission={Permission.VIEW_AUDIT_LOGS}
                fallback={<Navigate to="/" replace />}
              >
                <AuditLogs />
              </PermissionGate>
            } 
          />
          <Route 
            path="/team" 
            element={
              <PermissionGate 
                permission={Permission.MANAGE_USERS}
                fallback={<Navigate to="/" replace />}
              >
                <TeamManagement />
              </PermissionGate>
            } 
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
    <Toast toasts={toasts} onDismiss={dismissToast} />
  );
}

function App() {
  console.log('✓ App() rendering with all providers');
  
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

const SESSION_KEY = 'caredroid_session_id';
const AUTH_TOKEN_KEY = 'caredroid_access_token';

const getSessionId = () => {
  if (typeof window === 'undefined') return 'session-server';
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const generated = (window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
};

const createInitialMessages = () => ([{
  role: 'assistant',
  content: 'Hello! I\'m CareDroid, your AI clinical assistant. How can I help you today?',
  timestamp: new Date()
}]);

function AppContent() {
  console.log('✓ AppContent component rendering...');
  
  const { authToken, setAuthToken, signOut: userSignOut, user, isAuthenticated, setUser } = useUser();
  const navigate = useNavigate();
  const [currentTool, setCurrentTool] = useState(null);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [prefillText, setPrefillText] = useState('');
  const [sessionId] = useState(() => getSessionId());
  const [toasts, setToasts] = useState([]);
  const [healthStatus, setHealthStatus] = useState('checking');
  const [conversations, setConversations] = useState([
    { id: 1, title: 'New Conversation', timestamp: new Date() }
  ]);
  const [activeConversation, setActiveConversation] = useState(1);
  const [messagesByConversation, setMessagesByConversation] = useState({
    1: createInitialMessages()
  });
  
  // Use isAuthenticated from UserContext (checks both token AND user)
  const isAuthed = isAuthenticated;

  // Debug logging
  useEffect(() => {
    console.log('=== AppContent render ===');
    console.log('authToken exists:', !!authToken);
    console.log('authToken value:', authToken);
    console.log('user exists:', !!user);
    console.log('user value:', user);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('isAuthed:', isAuthed);
    console.log('current URL:', window.location.pathname);
    console.log('localStorage token:', localStorage.getItem('caredroid_access_token'));
    console.log('localStorage profile:', localStorage.getItem('caredroid_user_profile'));
    
    if (isAuthed) {
      console.log('✅ AUTHENTICATED - Should render AppShell');
    } else {
      console.log('❌ NOT AUTHENTICATED - Should render LoginPage');
    }
  }, [authToken, user, isAuthenticated, isAuthed]);

  // Auto-navigate when authenticated (handles edge cases)
  useEffect(() => {
    if (isAuthenticated && window.location.pathname.includes('/auth')) {
      console.log('🔄 Auto-navigation: Authenticated user on auth page, redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let isActive = true;

    const checkHealth = async () => {
      try {
        const response = await apiFetch('/health');
        if (!isActive) return;
        setHealthStatus(response.ok ? 'online' : 'offline');
      } catch (error) {
        if (!isActive) return;
        setHealthStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  const addToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleAuthSuccess = (token, mockUser = null) => {
    console.log('\n\n=== 🔑 handleAuthSuccess called ===');
    console.log('token:', token);
    console.log('mockUser:', mockUser);
    
    if (!token) {
      console.error('❌ ERROR: No token provided');
      return;
    }
    
    // Set user in state immediately if provided
    if (mockUser && setUser) {
      console.log('👤 Setting user in UserContext state...');
      setUser(mockUser);
      console.log('✅ User set in context');
    }
    
    console.log('💾 localStorage status:');
    console.log('- Token:', !!localStorage.getItem('caredroid_access_token'));
    console.log('- Profile:', !!localStorage.getItem('caredroid_user_profile'));
    
    // Track login event
    try {
      AnalyticsService.trackEvent({
        event: 'user_login',
        properties: {
          timestamp: new Date().toISOString(),
          auth_method: 'direct_signin'
        }
      });
    } catch (error) {
      console.error('Failed to track login event:', error);
    }
    
    console.log('🔄 Setting authToken in state...');
    setAuthToken(token);
    console.log('✅ Token set in context');
    console.log('📍 Current URL:', window.location.pathname);
    
    addToast('Signed in successfully!', 'success');
    
    // Navigate using React Router (no page reload needed since state is already updated)
    console.log('🚀 Navigating to home...');
    setTimeout(() => {
      console.log('🎯 Executing navigation');
      console.log('- isAuthenticated should now be true');
      console.log('- Token in state:', !!authToken || !!token);
      console.log('- User in state:', !!user || !!mockUser);
      
      // Use different approach: force state check then navigate
      if (window.location.pathname === '/auth') {
        navigate('/', { replace: true });
        console.log('✅ Navigation initiated via React Router');
      } else {
        console.log('⚠️ Already at correct path');
      }
    }, 100);

    NotificationService.registerPushToken().catch(() => {});
  };

  const handleSignOut = () => {
    try {
      // Track logout event
      AnalyticsService.trackEvent({
        event: 'user_logout',
        properties: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track logout event:', error);
    }
    
    userSignOut();
    addToast('Signed out.', 'info');
  };

  const trackEvent = (eventName, parameters = {}) => {
    // Track in analytics service for client-side and Segment integration
    try {
      AnalyticsService.trackEvent({
        event: eventName,
        properties: parameters
      });
    } catch (error) {
      console.error('Failed to track event in AnalyticsService:', error);
    }

    // Also send to backend analytics API
    const payload = {
      sessionId,
      events: [{
        eventName,
        parameters,
        timestamp: Date.now(),
        sessionId,
      }]
    };

    apiFetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  const appendMessage = (conversationId, message) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message]
    }));
  };

  const handleToolSelect = (tool) => {
    setCurrentTool(tool);
    setCurrentFeature(null);
    setPrefillText('');
    if (tool) {
      trackEvent('tool_selected', { tool });
    }
  };

  const handleFeatureSelect = (featureId) => {
    setCurrentFeature(featureId);
    setCurrentTool(null);
    const item = getInventoryItem(featureId);
    setPrefillText(item?.prompt || '');
    if (featureId) {
      trackEvent('feature_selected', { feature: featureId });
    }
  };

  const handleSelectConversation = (conversationId) => {
    setActiveConversation(conversationId);
    setMessagesByConversation((prev) => {
      if (prev[conversationId]) return prev;
      return { ...prev, [conversationId]: createInitialMessages() };
    });
  };

  const handleNewConversation = () => {
    const newId = conversations.length + 1;
    setConversations([...conversations, {
      id: newId,
      title: `New Conversation`,
      timestamp: new Date()
    }]);
    setActiveConversation(newId);
    setMessagesByConversation((prev) => ({
      ...prev,
      [newId]: createInitialMessages()
    }));
    trackEvent('conversation_created', { conversationId: newId });
  };



  // Common props for all authenticated routes
  const appRouteProps = {
    isAuthed,
    conversations,
    activeConversation,
    onSelectConversation: handleSelectConversation,
    onNewConversation: handleNewConversation,
    onSignOut: handleSignOut,
    authToken,
    healthStatus,
    currentTool,
    currentFeature,
    onToolSelect: handleToolSelect,
    onFeatureSelect: handleFeatureSelect
  };

  return (
    <ErrorBoundary>
      {typeof isAuthed === 'undefined' ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--navy-bg)',
          color: 'var(--text-color)',
          fontFamily: 'system-ui'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1>Loading...</h1>
            <p style={{ opacity: 0.7 }}>Initializing CareDroid</p>
          </div>
        </div>
      ) : !isAuthed ? (
        // AUTH SECTION - Show when NOT logged in
        <Routes>
          <Route path="/auth" element={<AuthShell><Auth onAddToast={addToast} onAuthSuccess={handleAuthSuccess} /></AuthShell>} />
          <Route path="/auth/callback" element={<AuthShell><AuthCallback onAddToast={addToast} onAuthSuccess={handleAuthSuccess} /></AuthShell>} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/consent" element={<ConsentFlow />} />
          <Route path="/consent-history" element={<ConsentHistory />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      ) : (
        // APP SECTION - Show when logged in
        <Routes>
          {/* Home/Chat page */}
          <Route path="/" element={
            <AppRoute {...appRouteProps}>
              <ChatInterface
                currentTool={currentTool}
                currentFeature={currentFeature}
                prefillText={prefillText}
                conversationId={activeConversation}
                messages={messagesByConversation[activeConversation] || []}
                onAppendMessage={appendMessage}
                onTrackEvent={trackEvent}
                onAddToast={addToast}
                authToken={authToken}
                onToolSelect={handleToolSelect}
                onFeatureSelect={handleFeatureSelect}
              />
            </AppRoute>
          } />

          {/* Settings page */}
          <Route path="/settings" element={
            <AppRoute {...appRouteProps}>
              <Settings onAddToast={addToast} />
            </AppRoute>
          } />

          {/* Profile page */}
          <Route path="/profile" element={
            <AppRoute {...appRouteProps}>
              <Profile />
            </AppRoute>
          } />

          {/* Profile Settings page */}
          <Route path="/profile-settings" element={
            <AppRoute {...appRouteProps}>
              <ProfileSettings onAddToast={addToast} />
            </AppRoute>
          } />

          {/* Onboarding page */}
          <Route path="/onboarding" element={
            <AppRoute {...appRouteProps}>
              <Onboarding onAddToast={addToast} />
            </AppRoute>
          } />

          {/* Audit Logs page */}
          <Route path="/audit-logs" element={
            <AppRoute {...appRouteProps}>
              <PermissionGate permission={Permission.VIEW_AUDIT_LOGS} fallback={<Navigate to="/" replace />}>
                <AuditLogs />
              </PermissionGate>
            </AppRoute>
          } />

          {/* Team page */}
          <Route path="/team" element={
            <AppRoute {...appRouteProps}>
              <PermissionGate permission={Permission.MANAGE_USERS} fallback={<Navigate to="/" replace />}>
                <TeamManagement />
              </PermissionGate>
            </AppRoute>
          } />

          {/* Public Legal Routes for authenticated users */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/consent" element={<ConsentFlow />} />
          <Route path="/consent-history" element={<ConsentHistory />} />

          {/* Catch all redirects to home when logged in */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </ErrorBoundary>
  );
}

function App() {
  console.log('✓ App() function called - rendering providers...');
  
  return (
    <UserProvider>
      <NotificationProvider>
        <SystemConfigProvider>
          <AppContent />
        </SystemConfigProvider>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;
