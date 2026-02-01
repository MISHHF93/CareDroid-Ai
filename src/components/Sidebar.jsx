import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, Permission } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import PermissionGate from './PermissionGate';
import './Sidebar.css';

/**
 * CareDroid Professional Sidebar
 * Clinical AI Platform Navigation
 */
const Sidebar = ({ 
  conversations = [], 
  activeConversation, 
  onSelectConversation,
  onNewConversation,
  onSignOut,
  healthStatus = 'online',
  currentTool = null,
  onToolSelect
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { notifications } = useNotifications();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Clinical Tools
  const clinicalTools = [
    { 
      id: 'drug-interactions', 
      icon: '💊', 
      name: 'Drug Checker',
      color: '#FF6B9D',
      description: 'Check drug interactions'
    },
    { 
      id: 'lab-interpreter', 
      icon: '🔬', 
      name: 'Lab Interpreter',
      color: '#4ECDC4',
      description: 'Interpret lab results'
    },
    { 
      id: 'sofa-calculator', 
      icon: '📊', 
      name: 'SOFA Calculator',
      color: '#95E1D3',
      description: 'Calculate SOFA score'
    },
    { 
      id: 'protocols', 
      icon: '📋', 
      name: 'Protocols',
      color: '#A8E6CF',
      description: 'Clinical protocols'
    }
  ];

  // Navigation Items
  const navItems = [
    { id: 'chat', icon: '💬', label: 'Chat', path: '/' },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
    { id: 'team', icon: '👥', label: 'Team', path: '/team', permission: Permission.MANAGE_USERS },
    { id: 'audit', icon: '📜', label: 'Audit Logs', path: '/audit-logs', permission: Permission.VIEW_AUDIT_LOGS },
    { id: 'settings', icon: '⚙️', label: 'Settings', path: '/settings' }
  ];

  const recentConversations = conversations.slice(-5).reverse();

  const handleToolClick = (toolId) => {
    if (onToolSelect) {
      onToolSelect(toolId);
    }
    navigate('/');
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🏥</div>
          {!isCollapsed && (
            <div className="logo-text">
              <h1>CareDroid</h1>
              <span className="logo-subtitle">Clinical AI</span>
            </div>
          )}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role || 'Clinician'}</div>
          </div>
          <div className={`health-indicator ${healthStatus}`}>
            <div className="health-dot"></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="sidebar-content">
        {/* New Conversation Button */}
        <button 
          className="btn-new-conversation"
          onClick={onNewConversation}
        >
          <span className="btn-icon">✨</span>
          {!isCollapsed && <span>New Conversation</span>}
        </button>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {!isCollapsed && 'Navigation'}
          </div>
          {navItems.map(item => {
            const NavButton = (
              <button
                key={item.id}
                className={`nav-item ${window.location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                title={isCollapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </button>
            );

            return item.permission ? (
              <PermissionGate key={item.id} permission={item.permission} hideIfDenied>
                {NavButton}
              </PermissionGate>
            ) : NavButton;
          })}
        </nav>

        {/* Clinical Tools */}
        {!isCollapsed && (
          <div className="sidebar-section">
            <div className="section-header">
              <span className="section-icon">🧰</span>
              <span className="section-title">Clinical Tools</span>
            </div>
            <div className="tools-grid">
              {clinicalTools.map(tool => (
                <button
                  key={tool.id}
                  className={`tool-card ${currentTool === tool.id ? 'active' : ''}`}
                  onClick={() => handleToolClick(tool.id)}
                  style={{ '--tool-color': tool.color }}
                >
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-name">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Conversations */}
        {!isCollapsed && recentConversations.length > 0 && (
          <div className="sidebar-section">
            <div className="section-header">
              <span className="section-icon">💭</span>
              <span className="section-title">Recent</span>
            </div>
            <div className="conversations-list">
              {recentConversations.map(conv => (
                <button
                  key={conv.id}
                  className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <span className="conversation-title">
                    {conv.title.length > 25 ? conv.title.substring(0, 25) + '...' : conv.title}
                  </span>
                  <span className="conversation-time">
                    {new Date(conv.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Notifications */}
        <button 
          className="footer-action"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <span className="action-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {/* HIPAA Badge */}
        {!isCollapsed && (
          <div className="hipaa-badge">
            <span className="hipaa-icon">🔒</span>
            <span className="hipaa-text">HIPAA Compliant</span>
          </div>
        )}

        {/* Sign Out */}
        <button 
          className="btn-signout"
          onClick={onSignOut}
          title="Sign Out"
        >
          <span className="signout-icon">🚪</span>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
