import React, { useState } from 'react';
import { Button } from '../ui/atoms/Button';
import { Badge } from '../ui/atoms/Badge';
import { NotificationDropdown } from './NotificationDropdown';

/**
 * DashboardHeader - Top header section of the dashboard
 * Displays greeting, quick actions, and system status
 */
export const DashboardHeader = ({
  userName = 'User',
  notificationCount = 0,
  notifications = [],
  onNewPatient,
  onEmergency,
  onSearch,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  onNotificationClick,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearNotifications,
  systemStatus = 'online',
  onRefresh,
  refreshing = false
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusColors = {
    online: '#10B981',
    offline: '#EF4444',
    degraded: '#F59E0B'
  };

  return (
    <header style={{
      padding: 'var(--space-6) 0',
      borderBottom: '1px solid var(--border-subtle)',
      marginBottom: 'var(--space-6)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        flexWrap: 'wrap'
      }}>
        {/* Left: Greeting */}
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{
            margin: 0,
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-1)'
          }}>
            {getGreeting()}, {userName}
          </h1>
          <p style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span>{getFormattedDate()}</span>
            <span>•</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: statusColors[systemStatus],
                boxShadow: `0 0 6px ${statusColors[systemStatus]}`
              }} />
              <span style={{ textTransform: 'capitalize' }}>{systemStatus}</span>
            </span>
          </p>
        </div>

        {/* Right: Actions and Notifications */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flex: '0 0 auto'
        }}>
          {onSearchChange && (
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onSearchSubmit?.(searchValue);
                  }
                }}
                placeholder="Search patients"
                aria-label="Search patients"
                style={{
                  width: '220px',
                  padding: '8px 12px',
                  fontSize: 'var(--font-size-sm)',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-1)'
                }}
              />
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onNewPatient}
          >
            <span style={{ marginRight: '6px' }}>+</span>
            New Patient
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={onEmergency}
          >
            <span style={{ marginRight: '6px' }}>🚨</span>
            Emergency
          </Button>

          {onSearch && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => onSearch(searchValue)}
              aria-label="Search"
            >
              🔍
            </Button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              style={{
                padding: 'var(--space-2)',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                opacity: refreshing ? 0.6 : 1
              }}
              aria-label="Refresh dashboard"
              title="Refresh"
            >
              <span style={{
                display: 'inline-block',
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }}>
                🔄
              </span>
            </button>
          )}

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                onNotificationClick?.();
                setIsNotificationsOpen((prev) => !prev);
              }}
              style={{
                position: 'relative',
                padding: 'var(--space-2)',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
              aria-expanded={isNotificationsOpen}
            >
              🔔
              {notificationCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-bold)',
                  color: '#fff',
                  background: '#EF4444',
                  borderRadius: '10px',
                  border: '2px solid var(--background)'
                }}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <NotificationDropdown
                notifications={notifications}
                onMarkRead={onMarkNotificationRead}
                onMarkAllRead={onMarkAllNotificationsRead}
                onClearAll={onClearNotifications}
                onClose={() => setIsNotificationsOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
