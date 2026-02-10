import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, Permission } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToolPreferences } from '../contexts/ToolPreferencesContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useLanguage } from '../contexts/LanguageContext';
import PermissionGate from './PermissionGate';
import WorkspaceCreationModal from './WorkspaceCreationModal';
import toolRegistry, { toolRegistryById } from '../data/toolRegistry';
import './Sidebar.css';

/* ─── role style map ─── */
const ROLE_AVATAR = {
  physician: { gradient: 'linear-gradient(135deg,#3B82F6,#2563EB)', border: 'rgba(59,130,246,0.3)' },
  nurse:     { gradient: 'linear-gradient(135deg,#10B981,#059669)', border: 'rgba(16,185,129,0.3)' },
  student:   { gradient: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', border: 'rgba(139,92,246,0.3)' },
  admin:     { gradient: 'linear-gradient(135deg,#F59E0B,#D97706)', border: 'rgba(245,158,11,0.3)' },
};
const STATUS_COLORS = { available: '#10B981', busy: '#F59E0B', dnd: '#EF4444', 'in-surgery': '#F59E0B', 'off-shift': '#6B7280' };
const STATUS_KEYS = { available: 'status.available', busy: 'status.busy', dnd: 'status.doNotDisturb', 'in-surgery': 'status.inSurgery', 'off-shift': 'status.offShift' };

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
  onToolSelect,
  isCollapsed = false,
  onToggleCollapse = () => {}
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { notifications } = useNotifications();
  const {
    favorites,
    pinned,
    recentTools,
    toggleFavorite,
    togglePinned,
    recordToolAccess,
    clearRecentTools
  } = useToolPreferences();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    addWorkspace
  } = useWorkspace();
  const { t } = useLanguage();
  const [showToolsSection, setShowToolsSection] = useState(true);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProfileFlyout, setShowProfileFlyout] = useState(false);
  const [userStatus, setUserStatus] = useState('available');
  const profileFlyoutRef = useRef(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close flyout on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileFlyoutRef.current && !profileFlyoutRef.current.contains(e.target)) {
        setShowProfileFlyout(false);
      }
    };
    if (showProfileFlyout) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileFlyout]);

  const role = user?.role || 'student';
  const avatarStyle = ROLE_AVATAR[role] || ROLE_AVATAR.student;
  const avatarUrl = user?.profile?.avatarUrl || user?.avatarUrl || null;
  const specialty = user?.profile?.specialty || user?.specialty || null;
  const statusColor = STATUS_COLORS[userStatus] || STATUS_COLORS.available;

  // Medical Tools - Enhanced with navigation
  const medicalTools = toolRegistry;
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);
  const workspaceToolIds = activeWorkspace?.toolIds?.length
    ? activeWorkspace.toolIds
    : medicalTools.map((tool) => tool.id);
  const workspaceTools = medicalTools.filter((tool) => workspaceToolIds.includes(tool.id));
  const favoriteTools = workspaceTools.filter((tool) => favorites.includes(tool.id));
  const pinnedTools = workspaceTools.filter((tool) => pinned.includes(tool.id));
  const unpinnedTools = workspaceTools.filter((tool) => !pinned.includes(tool.id));
  const orderedTools = [...pinnedTools, ...unpinnedTools];
  const recentToolItems = recentTools
    .map((toolId) => toolRegistryById[toolId])
    .filter((tool) => tool && workspaceToolIds.includes(tool.id));

  // Navigation Items
  const navItems = [
    { id: 'chat', icon: '💬', label: t('nav.dashboard'), path: '/dashboard' },
    { id: 'profile', icon: '👤', label: t('nav.profile'), path: '/profile' },
    { id: 'team', icon: '👥', label: t('nav.team'), path: '/team', permission: Permission.MANAGE_USERS },
    { id: 'audit', icon: '📜', label: t('nav.auditLogs'), path: '/audit-logs', permission: Permission.VIEW_AUDIT_LOGS },
    { id: 'analytics', icon: '📊', label: t('nav.analytics'), path: '/analytics', permission: Permission.VIEW_ANALYTICS },
    { id: 'settings', icon: '⚙️', label: t('nav.settings'), path: '/settings' }
  ];

  const recentConversations = conversations.slice(-5).reverse();

  const handleNavClick = (path) => {
    navigate(path);
  };

  const handleToolClick = (tool) => {
    recordToolAccess(tool.id);
    navigate(tool.path);
    onToolSelect?.(tool.id);
  };

  const renderToolCard = (tool) => {
    const isActive = location.pathname === tool.path;
    const isSelected = currentTool === tool.id;
    const isFavorite = favorites.includes(tool.id);
    const isPinned = pinned.includes(tool.id);

    return (
      <div
        key={tool.id}
        className={`tool-card ${isActive || isSelected ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handleToolClick(tool);
        }}
        style={{
          padding: '10px',
          margin: '6px 0',
          borderRadius: '8px',
          border: `2px solid ${isActive || isSelected ? tool.color : 'transparent'}`,
          backgroundColor: isActive || isSelected
            ? `${tool.color}15`
            : 'var(--panel-background)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!isActive && !isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--panel-hover, #f5f5f5)';
            e.currentTarget.style.borderColor = `${tool.color}40`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--panel-background, white)';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
        title={`${tool.name} - ${tool.description}\n\nShortcut: ${tool.shortcut}\nClick to navigate or use in chat with /${tool.id}`}
      >
        <div className="tool-action-buttons">
          <button
            className={`tool-action-btn ${isFavorite ? 'active' : ''}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(tool.id);
            }}
          >
            ★
          </button>
          <button
            className={`tool-action-btn ${isPinned ? 'active' : ''}`}
            title={isPinned ? 'Unpin tool' : 'Pin tool to top'}
            onClick={(e) => {
              e.stopPropagation();
              togglePinned(tool.id);
            }}
          >
            📌
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span
            style={{
              fontSize: '22px',
              filter: isActive || isSelected ? 'none' : 'grayscale(0.2)',
              lineHeight: 1
            }}
          >
            {tool.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: '600',
              fontSize: '12px',
              color: 'var(--text-primary, #1a1a1a)',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {tool.name}
              <span style={{
                fontSize: '9px',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: 'var(--panel-border, #e0e0e0)',
                color: 'var(--text-secondary, #666)',
                fontFamily: 'monospace',
                fontWeight: '500'
              }}>
                {tool.shortcut.replace('Ctrl+', '⌘')}
              </span>
            </div>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-secondary, #666)',
              lineHeight: '1.3',
              marginBottom: '4px'
            }}>
              {tool.description}
            </div>
            <div style={{
              fontSize: '9px',
              padding: '2px 5px',
              borderRadius: '3px',
              backgroundColor: `${tool.color}20`,
              color: tool.color,
              display: 'inline-block',
              fontWeight: '600'
            }}>
              {tool.category}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🏥</div>
          <div className="logo-text">
            <h1>CareDroid</h1>
            <span className="logo-subtitle">{t('app.subtitle')}</span>
          </div>
        </div>
        <button 
          className={`sidebar-toggle ${isCollapsed ? 'collapsed' : ''}`}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          <span className="sidebar-toggle-icon" aria-hidden="true">
            {isCollapsed ? '»' : '«'}
          </span>
        </button>
      </div>

      {/* User Profile — interactive with flyout */}
      <div ref={profileFlyoutRef} style={{ position: 'relative' }}>
        <div
          className="sidebar-user"
          onClick={() => setShowProfileFlyout((v) => !v)}
          style={{ cursor: 'pointer' }}
          title={isCollapsed ? `${user?.name || t('status.user')} — ${user?.role || t('status.clinician')}` : undefined}
        >
          {/* Role-colored avatar with status dot */}
          <div className="user-avatar" style={{
            background: avatarUrl ? `url(${avatarUrl}) center/cover no-repeat` : avatarStyle.gradient,
            borderColor: avatarStyle.border,
            position: 'relative',
          }}>
            {!avatarUrl && (user?.name?.charAt(0).toUpperCase() || 'U')}
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 12, height: 12, borderRadius: '50%',
              background: statusColor,
              border: '2px solid #0f1724',
              boxShadow: `0 0 6px ${statusColor}80`,
            }} />
          </div>
          {!isCollapsed && (
            <>
              <div className="user-info">
                <div className="user-name">{user?.name || t('status.user')}</div>
                <div className="user-role">
                  {user?.role || t('status.clinician')}
                  {specialty ? ` · ${specialty}` : ''}
                </div>
              </div>
              <div className={`health-indicator ${healthStatus}`}>
                <div className="health-dot"></div>
              </div>
            </>
          )}
        </div>

        {/* Profile Flyout */}
        {showProfileFlyout && (
          <div style={{
            position: 'absolute',
            top: isCollapsed ? 0 : '100%',
            left: isCollapsed ? '70px' : '12px',
            right: isCollapsed ? 'auto' : '12px',
            width: isCollapsed ? '260px' : 'auto',
            zIndex: 9999,
            background: 'var(--sb-deep-bg)',
            border: '1px solid var(--sb-layer-4)',
            borderRadius: '12px',
            boxShadow: '0 12px 40px var(--sb-shadow)',
            padding: '16px',
            animation: 'fadeIn 0.15s ease',
          }}>
            {/* Flyout header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--sb-divider)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : avatarStyle.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: avatarUrl ? 0 : '20px', fontWeight: 700, color: 'var(--sb-text)',
                border: `2px solid ${avatarStyle.border}`, flexShrink: 0,
              }}>
                {!avatarUrl && (user?.name?.charAt(0).toUpperCase() || 'U')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sb-text)' }}>{user?.name || t('status.user')}</div>
                <div style={{ fontSize: '12px', color: 'var(--sb-text-muted)' }}>
                  {user?.role || t('status.clinician')}
                  {specialty ? ` · ${specialty}` : ''}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--sb-text-ghost)', marginTop: '2px' }}>{user?.email || ''}</div>
              </div>
            </div>

            {/* Status switcher */}
            <div style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--sb-divider)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--sb-text-ghost)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{t('status.status')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(STATUS_KEYS).map(([key, tKey]) => (
                  <button
                    key={key}
                    onClick={() => setUserStatus(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 10px', borderRadius: '6px', border: 'none',
                      background: userStatus === key ? 'var(--sb-layer-3)' : 'transparent',
                      color: userStatus === key ? 'var(--sb-text)' : 'var(--sb-text-muted)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: userStatus === key ? 600 : 400,
                      textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[key], flexShrink: 0 }} />
                    {t(tKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                onClick={() => { navigate('/profile'); setShowProfileFlyout(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '6px', border: 'none',
                  background: 'transparent', color: 'var(--sb-text-secondary)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 500, width: '100%', textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sb-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '15px' }}>👤</span> {t('status.viewProfile')}
              </button>
              <button
                onClick={() => { navigate('/profile/settings'); setShowProfileFlyout(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '6px', border: 'none',
                  background: 'transparent', color: 'var(--sb-text-secondary)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 500, width: '100%', textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sb-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '15px' }}>⚙️</span> {t('nav.settings')}
              </button>
              <button
                onClick={() => { setShowProfileFlyout(false); onSignOut(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '6px', border: 'none',
                  background: 'transparent', color: '#F87171',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%', textAlign: 'left',
                  marginTop: '4px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '15px' }}>🚪</span> {t('status.signOut')}
              </button>
            </div>

            {/* Connection indicator */}
            <div style={{
              marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--sb-divider)',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--sb-text-ghost)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: healthStatus === 'online' ? '#10B981' : '#EF4444' }} />
              {healthStatus === 'online' ? t('status.connectedLive') : t('status.offline')}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="sidebar-content">
        {/* New Conversation Button */}
        <button 
          className="btn-new-conversation"
          onClick={() => {
            navigate('/chat');
            onNewConversation();
          }}
        >
          <span className="btn-icon">✨</span>
          {!isCollapsed && <span>{t('nav.newConversation')}</span>}
        </button>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {!isCollapsed && t('nav.navigation')}
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

        {/* Medical Tools Section - Enhanced */}
        {!isCollapsed && (
          <div className="sidebar-section">
            <div 
              className="section-header tools-section-toggle"
              onClick={() => setShowToolsSection(!showToolsSection)}
            >
              <span className="section-icon">🔧</span>
              <span className="section-title">{t('nav.clinicalTools')}</span>
              <span
                className={`section-toggle-icon ${showToolsSection ? 'open' : ''}`}
                aria-hidden="true"
              >
                ▼
              </span>
            </div>

            <div className="tools-controls">
              <select
                value={activeWorkspaceId}
                onChange={(e) => setActiveWorkspaceId(e.target.value)}
                className="tools-workspace-select"
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.icon ? `${workspace.icon} ` : ''}{workspace.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowWorkspaceModal(true)}
                className="tools-workspace-button"
              >
                <span>+</span>
                <span>{t('nav.newWorkspace')}</span>
              </button>
            </div>

            {showToolsSection && (
              <div className="medical-tools-list" style={{ marginTop: '8px' }}>
                {favoriteTools.length > 0 && (
                  <div className="tools-subsection">
                    <div className="tools-subsection-header">★ {t('nav.favorites')}</div>
                    <div className="tools-subsection-list">
                      {favoriteTools.map(renderToolCard)}
                    </div>
                  </div>
                )}

                {recentToolItems.length > 0 && (
                  <div className="tools-subsection">
                    <div className="tools-subsection-header tools-subsection-header-row">
                      <span>🕓 {t('nav.recentTools')}</span>
                      <button
                        className="tools-clear-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearRecentTools();
                        }}
                        type="button"
                      >
                        {t('nav.clear')}
                      </button>
                    </div>
                    <div className="recent-tools-list">
                      {recentToolItems.map((tool) => (
                        <button
                          key={tool.id}
                          className="recent-tool-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToolClick(tool);
                          }}
                          type="button"
                        >
                          <span className="recent-tool-icon">{tool.icon}</span>
                          <span className="recent-tool-name">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="tools-subsection">
                  <div className="tools-subsection-header">{t('nav.allTools')}</div>
                  <div className="tools-subsection-list">
                    {orderedTools.map(renderToolCard)}
                  </div>
                </div>
                
                {/* Quick Action: View All Tools */}
                <button
                  onClick={() => navigate('/tools')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '8px',
                    borderRadius: '6px',
                    border: '1px dashed var(--panel-border, #e0e0e0)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary, #666)',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent, #3B82F6)';
                    e.currentTarget.style.color = 'var(--accent, #3B82F6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--panel-border, #e0e0e0)';
                    e.currentTarget.style.color = 'var(--text-secondary, #666)';
                  }}
                >
                  <span>⚡</span>
                  <span>{t('nav.viewAllTools')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent Conversations */}
        {!isCollapsed && recentConversations.length > 0 && (
          <div className="sidebar-section">
            <div className="section-header">
              <span className="section-icon">💭</span>
              <span className="section-title">{t('nav.recent')}</span>
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
            <span className="hipaa-text">{t('nav.hipaaCompliant')}</span>
          </div>
        )}
      </div>
    </aside>

    {/* Workspace Creation Modal */}
    <WorkspaceCreationModal
      isOpen={showWorkspaceModal}
      onClose={() => setShowWorkspaceModal(false)}
      onCreateWorkspace={(workspace) => {
        addWorkspace(workspace);
        setActiveWorkspaceId(workspace.id);
        setShowWorkspaceModal(false);
      }}
    />
    </>
  );
};

export default Sidebar;
