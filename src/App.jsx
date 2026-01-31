import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import { getInventoryItem } from './data/featureInventory';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import AuditLogs from './pages/AuditLogs';
import { TeamManagement } from './pages/team/TeamManagement';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { ConsentFlow } from './pages/legal/ConsentFlow';
import { ConsentHistory } from './pages/legal/ConsentHistory';
import { PublicShell } from './layout/PublicShell';
import AuthShell from './layout/AuthShell';
import AppShell from './layout/AppShell';
import { UserProvider, useUser, Permission } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import OfflineProvider from './contexts/OfflineProvider';
import PermissionGate from './components/PermissionGate';

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
  const { authToken, setAuthToken, signOut: userSignOut } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
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
  
  // Use authToken directly for routing - this will trigger re-render immediately
  const isAuthed = Boolean(authToken);

  // Debug logging
  useEffect(() => {
    console.log('=== AppContent render ===');
    console.log('authToken exists:', !!authToken);
    console.log('authToken value:', authToken);
    console.log('isAuthed:', isAuthed);
    console.log('localStorage token:', localStorage.getItem('caredroid_access_token'));
    
    if (isAuthed) {
      console.log('✅ AUTHENTICATED - Should render AppShell');
    } else {
      console.log('❌ NOT AUTHENTICATED - Should render LoginPage');
    }
  }, [authToken, isAuthed]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
    } else {
      media.addListener(handleChange);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handleChange);
      } else {
        media.removeListener(handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    let isActive = true;

    const checkHealth = async () => {
      try {
        const response = await fetch('/health');
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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

  const handleAuthSuccess = (token) => {
    console.log('=== handleAuthSuccess called ===');
    console.log('token received:', !!token);
    console.log('token value:', token);
    
    if (!token) {
      console.error('ERROR: No token provided to handleAuthSuccess');
      return;
    }
    
    // Save token to localStorage immediately
    localStorage.setItem('caredroid_access_token', token);
    console.log('=== Token saved to localStorage ===');
    console.log('localStorage check:', localStorage.getItem('caredroid_access_token'));
    
    // Update React state - this will trigger re-render and routing
    setAuthToken(token);
    console.log('=== setAuthToken called - state updated ===');
    console.log('isAuthed should now be:', !!token);
    
    addToast('Signed in successfully.', 'success');
  };

  const handleSignOut = () => {
    userSignOut();
    addToast('Signed out.', 'info');
  };

  const trackEvent = (eventName, parameters = {}) => {
    const payload = {
      sessionId,
      events: [{
        eventName,
        parameters,
        timestamp: Date.now(),
        sessionId,
      }]
    };

    fetch('/api/analytics/events', {
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



  return (
    <ErrorBoundary>
      {!isAuthed ? (
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
            <AppShell
              isAuthed={isAuthed}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSignOut={handleSignOut}
              authToken={authToken}
              healthStatus={healthStatus}
            >
              <ChatInterface
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={toggleSidebar}
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
                showHeader={false}
              />
            </AppShell>
          } />

          {/* Settings page */}
          <Route path="/settings" element={
            <AppShell
              isAuthed={isAuthed}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSignOut={handleSignOut}
              authToken={authToken}
              healthStatus={healthStatus}
            >
              <Settings onAddToast={addToast} />
            </AppShell>
          } />

          {/* Profile page */}
          <Route path="/profile" element={
            <AppShell
              isAuthed={isAuthed}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSignOut={handleSignOut}
              authToken={authToken}
              healthStatus={healthStatus}
            >
              <Profile />
            </AppShell>
          } />

          {/* Profile Settings page */}
          <Route path="/profile-settings" element={
            <AppShell
              isAuthed={isAuthed}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSignOut={handleSignOut}
              authToken={authToken}
              healthStatus={healthStatus}
            >
              <ProfileSettings onAddToast={addToast} />
            </AppShell>
          } />

          {/* Onboarding page */}
          <Route path="/onboarding" element={
            <AppShell
              isAuthed={isAuthed}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSignOut={handleSignOut}
              authToken={authToken}
              healthStatus={healthStatus}
            >
              <Onboarding onAddToast={addToast} />
            </AppShell>
          } />

          {/* Audit Logs page */}
          <Route path="/audit-logs" element={
            <AppShell
              isAuthed={isAuthed}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSignOut={handleSignOut}
              authToken={authToken}
              healthStatus={healthStatus}
            >
              <PermissionGate permission={Permission.VIEW_AUDIT_LOGS} fallback={<Navigate to="/" replace />}>
                <AuditLogs />
              </PermissionGate>
            </AppShell>
          } />

          {/* Team page */}
          <Route path="/team" element={
            <AppShell
              isAuthed={isAuthed}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
              onToggleSidebar={toggleSidebar}
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onSignOut={handleSignOut}
              authToken={authToken}
              healthStatus={healthStatus}
            >
              <PermissionGate permission={Permission.MANAGE_USERS} fallback={<Navigate to="/" replace />}>
                <TeamManagement />
              </PermissionGate>
            </AppShell>
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
  return (
    <UserProvider>
      <NotificationProvider>
        <OfflineProvider>
          <AppContent />
        </OfflineProvider>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;
