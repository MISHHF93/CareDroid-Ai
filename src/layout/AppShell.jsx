import React, { useState } from 'react';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

      {/* Main Content Area - Pushed by sidebar width */}
      <div className="app-shell-main">
        {children}
      </div>
    </div>
  );
};

export default AppShell;
