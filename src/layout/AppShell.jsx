import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

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
  healthStatus
}) => {
  if (!isAuthed) {
    return <Navigate to="/auth" replace />;
  }

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
        <div style={{
          height: '72px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '16px',
          background: 'var(--surface-2)',
          backdropFilter: 'blur(12px)'
        }}>
          {isMobile && (
            <button
              onClick={onToggleSidebar}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-color)',
                cursor: 'pointer',
                fontSize: '22px'
              }}
            >
              ☰
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00FF88, #00FFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              CareDroid Clinical AI
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {authToken && (
              <div style={{
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                background: 'rgba(0, 255, 136, 0.08)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                color: '#00FF88'
              }}>
                ✅ Signed In
              </div>
            )}
            {healthStatus && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: healthStatus === 'online' ? '#00FF88' : healthStatus === 'offline' ? '#FF6B6B' : 'var(--muted-text)',
                border: '1px solid var(--panel-border)',
                padding: '6px 10px',
                borderRadius: '16px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: healthStatus === 'online' ? '#00FF88' : healthStatus === 'offline' ? '#FF6B6B' : '#FFD166'
                }} />
                {healthStatus === 'online' ? 'Healthy' : healthStatus === 'offline' ? 'Offline' : 'Checking'}
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
