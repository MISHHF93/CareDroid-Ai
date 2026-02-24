import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';
import Sidebar from '../components/Sidebar';

const AppShell = ({
  isAuthed,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onSignOut,
  authToken,
  healthStatus,
  currentTool = null,
  currentFeature = null,
  onToolSelect = null,
  onFeatureSelect = null,
  children
}) => {
  const { notifications } = useNotifications();
  const { user } = useUser();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1100px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1100px)');
    const syncSidebarState = (event) => {
      setIsSidebarCollapsed(event.matches);
    };

    syncSidebarState(mq);
    mq.addEventListener('change', syncSidebarState);
    return () => mq.removeEventListener('change', syncSidebarState);
  }, []);

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'app-shell-collapsed' : ''}`}>
      {/* Sidebar - Fixed Position */}
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onSignOut={onSignOut}
        healthStatus={healthStatus}
        currentTool={currentTool}
        onToolSelect={onToolSelect}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <button
        className="app-shell-overlay"
        onClick={() => setIsSidebarCollapsed(true)}
        aria-label="Close sidebar"
        type="button"
      />

      {isSidebarCollapsed && (
        <button
          className="app-shell-mobile-menu"
          onClick={() => setIsSidebarCollapsed(false)}
          aria-label="Open sidebar"
          type="button"
        >
          ☰
        </button>
      )}

      {/* Main Content Area - Pushed by sidebar width */}
      <div className="app-shell-main">
        <div className="app-shell-phone-frame">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
