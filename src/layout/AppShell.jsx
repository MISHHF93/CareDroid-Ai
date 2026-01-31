import React from 'react';
import Sidebar from '../components/Sidebar';
import { HeaderNav } from '../components/navigation/Navigation';
import { useNotifications } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';

const AppShell = ({
  isAuthed,
  isSidebarOpen,
  isMobile,
  onToggleSidebar,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onSignOut,
  authToken,
  healthStatus,
  children
}) => {
  const { notifications } = useNotifications();
  const { user } = useUser();
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get user info from context or localStorage fallback
  const userInfo = user || {
    name: localStorage.getItem('userName') || 'User',
    email: localStorage.getItem('userEmail') || 'user@hospital.org',
    role: localStorage.getItem('userRole') || 'User',
  };

  return (
    <div className="app-shell" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'var(--navy-bg)',
      color: 'var(--text-color)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* New Header Navigation */}
      <HeaderNav user={userInfo} notificationCount={unreadCount} showBreadcrumbs={false} />

      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0
      }}>
        <Sidebar
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onToggle={onToggleSidebar}
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={onSelectConversation}
          onNewConversation={onNewConversation}
          authToken={authToken}
          onSignOut={onSignOut}
        />
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: 0,
          width: '100%'
        }}>
          <div style={{ flex: 1, display: 'flex' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
