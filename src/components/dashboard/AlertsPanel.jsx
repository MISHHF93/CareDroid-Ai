import React, { useState } from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';
import { Button } from '../ui/atoms/Button';

/**
 * AlertsPanel - Clinical alerts and notifications panel
 * Displays actionable alerts with severity levels
 */
export const AlertsPanel = ({ alerts = [], onAcknowledge, onAlertClick }) => {
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#EF4444',
      high: '#F59E0B',
      medium: '#10B981',
      low: '#63B3ED'
    };
    return colors[severity] || colors.medium;
  };

  const getSeverityBadgeVariant = (severity) => {
    const variants = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary'
    };
    return variants[severity] || 'secondary';
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
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
            Active Alerts
            {alerts.length > 0 && (
              <Badge variant="danger" size="sm">
                {alerts.length}
              </Badge>
            )}
          </h3>
        </div>

        {/* Alerts List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {alerts.length === 0 ? (
            <div style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>✅</div>
              <p style={{ margin: 0 }}>No active alerts</p>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
                All systems normal
              </p>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <div
                key={alert.id || index}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                  background: `${getSeverityColor(alert.severity)}10`,
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)'
                }}>
                  {/* Alert Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)'
                  }}>
                    <Badge
                      variant={getSeverityBadgeVariant(alert.severity)}
                      size="sm"
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)'
                    }}>
                      {getRelativeTime(alert.timestamp)}
                    </span>
                  </div>

                  {/* Alert Message */}
                  <div
                    onClick={() => onAlertClick?.(alert)}
                    style={{
                      cursor: onAlertClick ? 'pointer' : 'default'
                    }}
                  >
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {alert.message}
                    </div>
                    {(alert.patient || alert.patientName) && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}>
                        Patient: {alert.patient || alert.patientName}
                      </div>
                    )}
                    {alert.location && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}>
                        Location: {alert.location}
                      </div>
                    )}
                  </div>

                  {/* Acknowledge Button */}
                  {onAcknowledge && !alert.acknowledged && !acknowledgingIds.has(alert.id) && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: 'var(--space-1)'
                    }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setAcknowledgingIds(prev => new Set(prev).add(alert.id));
                          try {
                            await onAcknowledge(alert.id);
                          } finally {
                            setAcknowledgingIds(prev => {
                              const next = new Set(prev);
                              next.delete(alert.id);
                              return next;
                            });
                          }
                        }}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  )}
                  {acknowledgingIds.has(alert.id) && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: 'var(--space-1)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-tertiary)'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          animation: 'spin 1s linear infinite'
                        }}>⏳</span>
                        Acknowledging...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default AlertsPanel;
