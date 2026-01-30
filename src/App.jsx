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
import AuthShell from './layout/AuthShell';
import AppShell from './layout/AppShell';
import { UserProvider, useUser, Permission } from './contexts/UserContext';
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
  const { authToken, setAuthToken, signOut: userSignOut, isAuthenticated } = useUser();
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
  const isAuthed = isAuthenticated;

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
    setAuthToken(token);
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
      <Routes>
        <Route element={<AuthShell isAuthed={isAuthed} />}>
          <Route path="/auth" element={<Auth onAddToast={addToast} onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/auth/callback" element={<AuthCallback onAddToast={addToast} onAuthSuccess={handleAuthSuccess} />} />
        </Route>
        <Route
          element={(
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
            />
          )}
        >
          <Route
            path="/"
            element={(
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
            )}
          />
          <Route path="/onboarding" element={<Onboarding onAddToast={addToast} />} />
          <Route path="/settings" element={<Settings onAddToast={addToast} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile-settings" element={<ProfileSettings onAddToast={addToast} />} />
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
        </Route>
        <Route path="*" element={<Navigate to={isAuthed ? '/' : '/auth'} replace />} />
      </Routes>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
