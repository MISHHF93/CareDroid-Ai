import React from 'react';
import { Card } from '../ui/molecules/Card';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * ActivityFeed - Recent activity feed component
 * Displays recent clinical activities and updates
 */
export const ActivityFeed = ({ activities = [], onActivityClick }) => {
  const { t } = useLanguage();

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('widgets.activityFeed.justNow');
    if (diffMins < 60) return `${diffMins} ${t('widgets.activityFeed.minAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('widgets.activityFeed.hourAgo')}`;
    return `${diffDays} ${t('widgets.activityFeed.dayAgo')}`;
  };

  const getActivityIcon = (type) => {
    const icons = {
      lab: '🧪',
      medication: '💊',
      vital: '❤️',
      admission: '🏥',
      procedure: '⚕️',
      note: '📝',
      imaging: '🔬',
      consult: '👨‍⚕️'
    };
    return icons[type] || '📋';
  };

  return (
    <Card padding="lg">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            {t('widgets.activityFeed.title')}
            <span style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-semibold)',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              {t('widgets.activityFeed.live')}
            </span>
          </h3>
          <span style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-tertiary)'
          }}>
            {t('widgets.activityFeed.last24Hours')}
          </span>
        </div>

        {/* Activity List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {activities.length === 0 ? (
            <div style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>📭</div>
              <p style={{ margin: 0 }}>{t('widgets.activityFeed.noRecentActivity')}</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={activity.id || index}
                onClick={() => onActivityClick?.(activity)}
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: onActivityClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (onActivityClick) {
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Icon */}
                <div style={{
                  fontSize: '24px',
                  lineHeight: 1,
                  flexShrink: 0
                }}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {activity.title || activity.message}
                  </div>
                  {(activity.patient || activity.patientName) && (
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      marginBottom: '2px'
                    }}>
                      {t('widgets.activityFeed.patient')}: {activity.patient || activity.patientName}
                    </div>
                  )}
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)'
                  }}>
                    {getRelativeTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default ActivityFeed;
