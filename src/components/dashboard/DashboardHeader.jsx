import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationDropdown } from './NotificationDropdown';

/**
 * DashboardHeader — Compact single-row clinical bar
 * EMR-density: greeting (left) + all actions (right) in ~44px
 */
export const DashboardHeader = ({
  userName = 'User',
  onNewPatient,
  onEmergency,
  onSearch,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  systemStatus = 'online',
  onRefresh,
  refreshing = false,
  autoRefresh = true,
  connectionState = 'disconnected',
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
}) => {
  const { t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  const isTiny = typeof window !== 'undefined' && window.innerWidth <= 380;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '☀️';
    if (h < 17) return '🌤️';
    return '🌙';
  };

  const getShortDate = () =>
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });

  const connColor = connectionState === 'connected' ? '#22C55E'
                  : connectionState === 'connecting' ? '#F59E0B'
                  : '#6B7280';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  const iconBtn = (extraStyle = {}) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle)',
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: '15px',
    flexShrink: 0,
    padding: 0,
    transition: 'background 0.15s',
    ...extraStyle
  });

  return (
    <header style={{
      padding: '6px 0 8px',
      borderBottom: '1px solid var(--border-subtle)',
      marginBottom: '10px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'nowrap',
        minHeight: '40px'
      }}>

        {/* ── Left: Greeting ── */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.25
          }}>
            {getGreeting()} {userName}
          </span>
          <span style={{
            fontSize: '10px',
            color: 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
            lineHeight: 1.3
          }}>
            {getShortDate()}
          </span>
        </div>

        {/* ── Right: Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>

          {/* Inline search */}
          {onSearchChange && (
            showSearch ? (
              <input
                ref={searchRef}
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit?.(searchValue); if (e.key === 'Escape') setShowSearch(false); }}
                onBlur={() => { if (!searchValue) setShowSearch(false); }}
                placeholder={t('dashboard.searchPatients')}
                aria-label={t('dashboard.searchPatients')}
                style={{
                  width: '160px',
                  height: '32px',
                  padding: '0 10px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-1)',
                  outline: 'none'
                }}
              />
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                aria-label={t('dashboard.searchPatients')}
                title={t('dashboard.searchPatients')}
                style={iconBtn()}
              >🔍</button>
            )
          )}

          {/* New Patient */}
          {onNewPatient && (
            <button
              onClick={onNewPatient}
              aria-label={t('dashboard.newPatient')}
              title={t('dashboard.newPatient')}
              style={{
                ...iconBtn({ background: 'var(--clinical-primary, #3B82F6)', borderColor: 'transparent', color: '#fff', width: 'auto', padding: '0 10px', gap: 4, fontSize: '12px', fontWeight: 600 }),
                display: 'flex'
              }}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>
              <span style={{ whiteSpace: 'nowrap' }}>{t('dashboard.newPatient')}</span>
            </button>
          )}

          {/* Emergency */}
          {onEmergency && (
            <button
              onClick={onEmergency}
              aria-label={t('dashboard.emergency')}
              title={t('dashboard.emergency')}
              style={iconBtn({ borderColor: '#EF4444', color: '#EF4444' })}
            >🚨</button>
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              title="Refresh dashboard"
              style={iconBtn({
                cursor: refreshing ? 'not-allowed' : 'pointer',
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                opacity: refreshing ? 0.6 : 1
              })}
            >🔄</button>
          )}

          {/* Notification bell */}
          <div ref={notificationsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              title="Notifications"
              style={iconBtn({
                borderColor: showNotifications ? 'var(--clinical-primary, #3B82F6)' : undefined,
                background: showNotifications ? 'rgba(59,130,246,0.1)' : undefined,
                position: 'relative'
              })}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 3px',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#fff',
                  background: '#EF4444',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  border: '2px solid var(--surface-0, #0d1117)'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                onMarkRead={onMarkRead}
                onMarkAllRead={onMarkAllRead}
                onClearAll={onClearAll}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* Connection status dot */}
          <span
            title={connectionState === 'connected' ? t('dashboard.realtimeActive')
                 : connectionState === 'connecting' ? t('dashboard.connectingStream')
                 : t('dashboard.disconnectedReconnect')}
            aria-label={`Status: ${connectionState}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 999,
              border: `1px solid ${connColor}44`,
              background: `${connColor}11`,
              fontSize: '10px',
              fontWeight: 600,
              color: connColor,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: connColor,
              flexShrink: 0,
              animation: connectionState === 'connected' ? 'livePulse 2s ease-in-out infinite'
                       : connectionState === 'connecting' ? 'livePulse 0.8s ease-in-out infinite'
                       : 'none'
            }} />
            {connectionState === 'connected' ? t('dashboard.live')
             : connectionState === 'connecting' ? t('dashboard.connecting')
             : t('status.offline')}
          </span>

        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
