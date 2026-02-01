import React from 'react';
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
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onSignOut={onSignOut}
        healthStatus={healthStatus}
        currentTool={currentTool}
        onToolSelect={onToolSelect}
      />

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: '280px',
        minWidth: 0,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {children}
      </div>
    </div>
  );
};

export default AppShell;
