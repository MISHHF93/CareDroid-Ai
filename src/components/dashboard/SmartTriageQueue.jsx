import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';
import { useLanguage } from '../../contexts/LanguageContext';

/** Generate an SBAR summary for a cluster of alerts for the same patient */
function generateSBAR(patientName, alertCluster) {
  const severities = alertCluster.map((a) => a.severity);
  const topSeverity = severities.includes('critical') ? 'critical' : severities.includes('high') ? 'high' : severities[0];
  const messages = alertCluster.map((a) => a.message);

  return {
    situation: `${patientName} has ${alertCluster.length} active alert${alertCluster.length > 1 ? 's' : ''} (highest: ${topSeverity}).`,
    background: messages.join('; ') + '.',
    assessment: topSeverity === 'critical'
      ? 'Immediate clinical assessment required.'
      : topSeverity === 'high'
        ? 'Urgent evaluation recommended.'
        : 'Monitor and reassess as scheduled.',
    recommendation: topSeverity === 'critical'
      ? 'Escalate to attending. Consider bedside evaluation.'
      : topSeverity === 'high'
        ? 'Notify covering physician. Order follow-up labs if indicated.'
        : 'Continue monitoring. Reassess in 30–60 minutes.',
  };
}

/**
 * SmartTriageQueue — Upgraded AlertsPanel with escalation timers, routing,
 * grouping, SBAR summaries, and resolved alerts archive
 */
export const SmartTriageQueue = ({ alerts = [], onAcknowledge, onAlertClick, onRoute }) => {
  const { t } = useLanguage();
  const [acknowledgingIds, setAcknowledgingIds] = useState(new Set());
  const [resolvedAlerts, setResolvedAlerts] = useState([]);
  const [showResolved, setShowResolved] = useState(false);
  const [expandedSBAR, setExpandedSBAR] = useState(new Set());
  const [now, setNow] = useState(Date.now());

  // Update timers every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  // Group alerts by patient
  const groupedAlerts = useMemo(() => {
    const groups = {};
    const sorted = [...alerts].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));
    sorted.forEach((alert) => {
      const key = alert.patientName || alert.patient || alert.id;
      if (!groups[key]) groups[key] = { patient: key, alerts: [], topSeverity: alert.severity };
      groups[key].alerts.push(alert);
    });
    return Object.values(groups);
  }, [alerts]);

  const getSeverityColor = (s) => ({ critical: 'var(--clinical-error)', high: 'var(--clinical-warning)', medium: 'var(--clinical-success)', low: 'var(--clinical-info)' })[s] || 'var(--clinical-info)';
  const getSeverityHex = (s) => ({ critical: '#EF4444', high: '#F59E0B', medium: '#10B981', low: '#63B3ED' })[s] || '#63B3ED';
  const getSeverityVariant = (s) => ({ critical: 'danger', high: 'warning', medium: 'info', low: 'secondary' })[s] || 'secondary';

  const getEscalationTime = (alert) => {
    const escalateMs = { critical: 5 * 60000, high: 15 * 60000, medium: 30 * 60000, low: 60 * 60000 };
    const created = new Date(alert.timestamp).getTime();
    const deadline = created + (escalateMs[alert.severity] || 30 * 60000);
    const remaining = Math.max(0, deadline - now);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return { remaining, display: `${mins}m ${secs.toString().padStart(2, '0')}s`, overdue: remaining === 0 };
  };

  const handleAcknowledge = useCallback(async (alertId) => {
    setAcknowledgingIds((prev) => new Set(prev).add(alertId));
    try {
      await onAcknowledge?.(alertId);
      // Move to resolved archive with audit entry
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        setResolvedAlerts((prev) => [{
          ...alert,
          resolvedAt: new Date().toISOString(),
          resolvedBy: 'Current User',
          action: 'acknowledged',
        }, ...prev].slice(0, 50)); // Keep last 50
      }
    } finally {
      setAcknowledgingIds((prev) => { const n = new Set(prev); n.delete(alertId); return n; });
    }
  }, [alerts, onAcknowledge]);

  const toggleSBAR = useCallback((patientKey) => {
    setExpandedSBAR((prev) => {
      const next = new Set(prev);
      if (next.has(patientKey)) next.delete(patientKey);
      else next.add(patientKey);
      return next;
    });
  }, []);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'visible' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 id="triage-queue-title" style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {t('widgets.smartTriageQueue.title')}
          {alerts.length > 0 && <Badge variant="danger" size="sm" role="status" aria-label={`${alerts.length} alerts`}>{alerts.length}</Badge>}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }} aria-label="Alert severity counts" role="group">
          {criticalCount > 0 && (
            <span role="status" aria-label={`${criticalCount} critical`} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clinical-error)', padding: '2px 8px', borderRadius: '999px', background: 'var(--clinical-error-light)' }}>
              🔴 {criticalCount}
            </span>
          )}
          {highCount > 0 && (
            <span role="status" aria-label={`${highCount} high priority`} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--clinical-warning)', padding: '2px 8px', borderRadius: '999px', background: 'var(--clinical-warning-light)' }}>
              🟡 {highCount}
            </span>
          )}
          {resolvedAlerts.length > 0 && (
            <button
              onClick={() => setShowResolved(!showResolved)}
              aria-label={`${showResolved ? 'Hide' : 'Show'} ${resolvedAlerts.length} resolved alerts`}
              style={{
                fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '999px',
                border: '1px solid var(--border-subtle)', cursor: 'pointer',
                background: showResolved ? 'var(--clinical-success-light)' : 'transparent',
                color: showResolved ? 'var(--clinical-success)' : 'var(--text-tertiary)',
              }}
            >
              {showResolved ? t('widgets.smartTriageQueue.active') : `${resolvedAlerts.length} ${t('widgets.smartTriageQueue.resolved')}`}
            </button>
          )}
        </div>
      </div>

      {/* Alert Groups / Resolved Archive */}
      <div role="list" aria-labelledby="triage-queue-title" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflowY: 'auto', overflowX: 'hidden', flex: 1, maxHeight: '380px', paddingTop: 'var(--space-3)', minWidth: 0 }}>
        {showResolved ? (
          /* Resolved Alerts Archive */
          resolvedAlerts.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <p style={{ margin: 0 }}>{t('widgets.smartTriageQueue.noResolvedAlerts')}</p>
            </div>
          ) : (
            resolvedAlerts.map((ra, idx) => (
              <div key={`resolved-${ra.id}-${idx}`} role="listitem" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--surface-secondary)', opacity: 0.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <Badge variant="secondary" size="sm">{ra.severity?.toUpperCase()}</Badge>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {new Date(ra.resolvedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>{ra.message}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {ra.patient || ra.patientName ? `${t('widgets.smartTriageQueue.patient')}: ${ra.patient || ra.patientName} · ` : ''}
                  {ra.action} {t('widgets.smartTriageQueue.by')} {ra.resolvedBy}
                </div>
              </div>
            ))
          )
        ) : (
        groupedAlerts.length === 0 ? (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>✅</div>
            <p style={{ margin: 0 }}>{t('widgets.smartTriageQueue.noActiveAlerts')}</p>
            <p style={{ margin: 0, fontSize: '13px', marginTop: 4 }}>{t('widgets.smartTriageQueue.allSystemsNormal')}</p>
          </div>
        ) : (
          groupedAlerts.map((group) => {
            const sbar = generateSBAR(group.patient, group.alerts);
            const sbarOpen = expandedSBAR.has(group.patient);
            return (
            <div key={group.patient} style={{ borderRadius: 'var(--radius-md)', border: `1px solid ${getSeverityColor(group.topSeverity)}30`, background: `${getSeverityColor(group.topSeverity)}08` }}>
              {/* Group header */}
              {group.alerts.length > 1 && (
                <div style={{ padding: '6px 12px', background: `${getSeverityColor(group.topSeverity)}15`, fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👤</span>
                    <span>{group.patient}</span>
                    <Badge variant={getSeverityVariant(group.topSeverity)} size="sm">{group.alerts.length} {t('widgets.smartTriageQueue.alerts')}</Badge>
                    <button
                      onClick={() => toggleSBAR(group.patient)}
                      aria-label={`${sbarOpen ? 'Hide' : 'Show'} SBAR summary for ${group.patient}`}
                      style={{
                        marginLeft: 'auto', fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '999px', border: '1px solid var(--border-subtle)', cursor: 'pointer',
                        background: sbarOpen ? 'var(--clinical-info-light)' : 'transparent',
                        color: sbarOpen ? 'var(--clinical-info)' : 'var(--text-tertiary)',
                      }}
                    >
                      {sbarOpen ? t('widgets.smartTriageQueue.hideSBAR') : t('widgets.smartTriageQueue.sbar')}
                    </button>
                  </div>
                  {sbarOpen && (
                    <div data-testid={`sbar-panel-${group.patient}`} style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--surface-primary)', borderRadius: 'var(--radius-sm)', fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                      <div><strong>S:</strong> {sbar.situation}</div>
                      <div><strong>B:</strong> {sbar.background}</div>
                      <div><strong>A:</strong> {sbar.assessment}</div>
                      <div><strong>R:</strong> {sbar.recommendation}</div>
                    </div>
                  )}
                </div>
              )}
              {/* Individual alerts */}
              {group.alerts.map((alert) => {
                const escalation = getEscalationTime(alert);
                const isAcking = acknowledgingIds.has(alert.id);
                return (
                  <div key={alert.id} style={{ padding: '12px', borderLeft: `4px solid ${getSeverityColor(alert.severity)}`, borderBottom: '1px solid var(--border-subtle)', minWidth: 0 }}>
                    {/* Row 1: severity badge + timer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <Badge variant={getSeverityVariant(alert.severity)} size="sm">{alert.severity.toUpperCase()}</Badge>
                      <span aria-live="off" aria-label={escalation.overdue ? 'Overdue' : `Escalates in ${escalation.display}`} style={{ fontSize: '11px', fontWeight: 600, color: escalation.overdue ? 'var(--clinical-error)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        ⏱ {escalation.overdue ? t('widgets.smartTriageQueue.overdue') : escalation.display}
                      </span>
                    </div>
                    {/* Row 2: alert message */}
                    <div role="button" tabIndex={0} onClick={() => onAlertClick?.(alert)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAlertClick?.(alert); } }} style={{ cursor: 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', wordBreak: 'break-word' }}>{alert.message}</div>
                      {group.alerts.length === 1 && (alert.patient || alert.patientName) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t('widgets.smartTriageQueue.patient')}: {alert.patient || alert.patientName}</div>
                      )}
                      {alert.location && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>📍 {alert.location}</div>}
                    </div>
                    {/* Row 3: action buttons */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {onRoute && (
                        <button
                          onClick={() => onRoute(alert)}
                          style={{
                            flex: 1,
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '8px 0',
                            borderRadius: '6px',
                            border: '1px solid #60a5fa',
                            background: '#2563eb',
                            color: '#ffffff',
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                        >
                          📞 {t('widgets.smartTriageQueue.route')}
                        </button>
                      )}
                      {!alert.acknowledged && !isAcking && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          style={{
                            flex: 1,
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '8px 0',
                            borderRadius: '6px',
                            border: 'none',
                            background: getSeverityHex(alert.severity),
                            color: '#ffffff',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: `0 2px 6px ${getSeverityHex(alert.severity)}40`,
                          }}
                        >
                          ✓ {t('widgets.smartTriageQueue.acknowledge')}
                        </button>
                      )}
                      {isAcking && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{t('widgets.smartTriageQueue.acknowledging')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );})
        )
        )}
      </div>
    </Card>
  );
};

export default SmartTriageQueue;
