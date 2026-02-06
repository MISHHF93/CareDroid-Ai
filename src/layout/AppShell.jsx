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
    <div className="app-shell" style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: 'var(--navy-bg)',
      color: 'var(--text-color)',
      overflow: 'hidden',
      position: 'relative'
    }}>
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

      {/* Main Content Area - Pushed by sidebar width */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: isSidebarCollapsed ? '70px' : '280px',
        minWidth: 0,
        height: '100vh',
        overflow: 'auto',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {children}
      </div>
    </div>
  );
};

export default AppShell;
