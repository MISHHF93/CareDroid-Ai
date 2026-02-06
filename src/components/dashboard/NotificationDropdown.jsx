import React from 'react';
import { Card } from '../ui/molecules/Card';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export const NotificationDropdown = ({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onClose,
}) => {
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: 0,
        width: '360px',
        maxWidth: '80vw',
        zIndex: 40,
      }}
    >
      <Card padding="md" shadow="lg">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span style={{
                  padding: '2px 8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: '#fff',
                  background: '#EF4444',
                  borderRadius: '999px'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                color: 'var(--text-tertiary)'
              }}
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{
              padding: 'var(--space-4)',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: 'var(--space-2)' }}>🔕</div>
              <p style={{ margin: 0 }}>No notifications</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              maxHeight: '320px',
              overflowY: 'auto'
            }}>
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => onMarkRead?.(notification.id)}
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: notification.read ? 'transparent' : 'var(--surface-2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  aria-label={`Notification: ${notification.title || notification.message || 'Update'}`}
                >
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: notification.read ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: '4px'
                  }}>
                    {notification.title || notification.message || 'Update'}
                  </div>
                  {notification.message && notification.title && (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}>
                      {notification.message}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)'
                  }}>
                    <span>{getRelativeTime(notification.timestamp)}</span>
                    {notification.type && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: 'var(--surface-3)',
                        textTransform: 'uppercase',
                        fontSize: '10px'
                      }}>
                        {notification.type}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--space-2)'
            }}>
              <button
                type="button"
                onClick={onMarkAllRead}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={onClearAll}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: 'var(--font-size-xs)',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NotificationDropdown;
