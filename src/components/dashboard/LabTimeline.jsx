import React, { useState, useMemo } from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_EVENTS = [
  { id: 'l1', test: 'CBC', patient: 'Smith, J.', status: 'resulted', orderedAt: new Date(Date.now() - 4 * 3600000).toISOString(), resultedAt: new Date(Date.now() - 2 * 3600000).toISOString(), critical: false, value: 'WBC 7.2, Hgb 13.1, Plt 245', refRange: 'WBC 4.5-11.0, Hgb 12-16, Plt 150-400' },
  { id: 'l2', test: 'Troponin', patient: 'Davis, R.', status: 'resulted', orderedAt: new Date(Date.now() - 3 * 3600000).toISOString(), resultedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(), critical: true, value: '0.42 ng/mL', refRange: '< 0.04 ng/mL' },
  { id: 'l3', test: 'BMP', patient: 'Johnson, M.', status: 'resulted', orderedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(), resultedAt: new Date(Date.now() - 0.5 * 3600000).toISOString(), critical: false, value: 'Na 138, K 4.1, Cr 0.9, Glu 112', refRange: 'Na 136-145, K 3.5-5.0, Cr 0.6-1.2, Glu 70-100' },
  { id: 'l4', test: 'Lactate', patient: 'Davis, R.', status: 'pending', orderedAt: new Date(Date.now() - 1 * 3600000).toISOString(), resultedAt: null, critical: false },
  { id: 'l5', test: 'UA + Culture', patient: 'Lee, K.', status: 'pending', orderedAt: new Date(Date.now() - 0.5 * 3600000).toISOString(), resultedAt: null, critical: false },
  { id: 'l6', test: 'PT/INR', patient: 'Smith, J.', status: 'pending', orderedAt: new Date(Date.now() - 0.25 * 3600000).toISOString(), resultedAt: null, critical: false },
];

/**
 * LabTimeline — Last 12h lab events timeline with expand detail & filter
 */
export const LabTimeline = ({ events: propEvents, onViewResult, lastViewedTimestamp }) => {
  const { t } = useLanguage();
  const events = propEvents || DEFAULT_EVENTS;
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Unique test types for filter
  const testTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.test));
    return ['all', ...Array.from(types)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e) => e.test === filterType);
  }, [events, filterType]);

  const criticalCount = events.filter((e) => e.critical).length;
  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const newCount = lastViewedTimestamp
    ? events.filter((e) => e.resultedAt && new Date(e.resultedAt) > new Date(lastViewedTimestamp)).length
    : 0;

  const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const sorted = useMemo(() => [...filteredEvents].sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt)), [filteredEvents]);

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          🧪 {t('widgets.labTimeline.title')}
          {criticalCount > 0 && <Badge variant="danger" size="sm">{criticalCount} {t('widgets.labTimeline.critical')}</Badge>}
          {newCount > 0 && (
            <span role="status" aria-label={`${newCount} new results`} style={{ fontSize: '10px', fontWeight: 700, color: '#fff', padding: '2px 7px', borderRadius: '999px', background: 'var(--clinical-primary)', minWidth: '18px', textAlign: 'center' }}>
              {newCount} {t('widgets.labTimeline.new')}
            </span>
          )}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            aria-label="Filter by lab type"
            style={{
              fontSize: '11px', padding: '3px 6px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)', background: 'var(--surface-secondary)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {testTypes.map((labType) => (
              <option key={labType} value={labType}>{labType === 'all' ? t('widgets.labTimeline.allLabs') : labType}</option>
            ))}
          </select>
          {pendingCount > 0 && (
            <span role="status" aria-label={`${pendingCount} pending`} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clinical-warning)', padding: '2px 8px', borderRadius: '999px', background: 'var(--clinical-warning-light)' }}>
              {pendingCount} {t('widgets.labTimeline.pending')}
            </span>
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{t('widgets.labTimeline.last12h')}</span>
        </div>
      </div>

      {/* Timeline */}
      <div role="list" aria-label="Lab events timeline" style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, overflowY: 'auto', maxHeight: '260px', paddingTop: 'var(--space-3)' }}>
        {sorted.map((event, idx) => {
          const isLast = idx === sorted.length - 1;
          const dotColor = event.critical ? 'var(--clinical-error)' : event.status === 'pending' ? 'var(--clinical-warning)' : 'var(--clinical-success)';
          const isExpanded = expandedId === event.id;
          const isNew = lastViewedTimestamp && event.resultedAt && new Date(event.resultedAt) > new Date(lastViewedTimestamp);
          return (
            <div key={event.id} role="listitem" aria-label={`${event.test} for ${event.patient} — ${event.status}${event.critical ? ', critical' : ''}${isNew ? ', new result' : ''}`} style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {/* Timeline track */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                <div style={{
                  width: event.critical ? '12px' : '10px',
                  height: event.critical ? '12px' : '10px',
                  borderRadius: '50%',
                  background: dotColor,
                  border: event.critical ? '2px solid #FCA5A5' : 'none',
                  flexShrink: 0, marginTop: '4px',
                  boxShadow: event.critical ? '0 0 8px rgba(239,68,68,0.4)' : 'none',
                }} />
                {!isLast && <div style={{ flex: 1, width: '2px', background: 'var(--border-subtle)', minHeight: '20px' }} />}
              </div>

              {/* Content */}
              <div
                style={{ flex: 1, paddingBottom: isLast ? 0 : 'var(--space-3)', cursor: event.status === 'resulted' ? 'pointer' : 'default' }}
                onClick={() => {
                  if (event.status === 'resulted') {
                    setExpandedId(isExpanded ? null : event.id);
                    onViewResult?.(event);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{event.test}</span>
                  {event.critical && <Badge variant="danger" size="sm">{t('widgets.labTimeline.criticalBadge')}</Badge>}
                  {isNew && <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', padding: '1px 5px', borderRadius: '999px', background: 'var(--clinical-primary)' }}>{t('widgets.labTimeline.newBadge')}</span>}
                  <span style={{
                    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                    color: event.status === 'pending' ? 'var(--clinical-warning)' : 'var(--clinical-success)',
                  }}>
                    {t('widgets.labTimeline.status_' + event.status)}
                  </span>
                  {event.status === 'resulted' && (
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{isExpanded ? '▼' : '▶'}</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {event.patient} · {t('widgets.labTimeline.ordered')} {formatTime(event.orderedAt)}
                  {event.resultedAt && ` · ${t('widgets.labTimeline.resulted')} ${formatTime(event.resultedAt)}`}
                </div>
                {/* Expanded detail panel */}
                {isExpanded && event.value && (
                  <div style={{
                    marginTop: '6px', padding: '8px 10px', borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-secondary)', border: '1px solid var(--border-subtle)',
                    fontSize: '12px', lineHeight: 1.5,
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{t('widgets.labTimeline.result')}</div>
                    <div style={{ color: event.critical ? 'var(--clinical-error)' : 'var(--text-secondary)', fontWeight: event.critical ? 600 : 400 }}>{event.value}</div>
                    {event.refRange && (
                      <>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '2px' }}>{t('widgets.labTimeline.referenceRange')}</div>
                        <div style={{ color: 'var(--text-tertiary)' }}>{event.refRange}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default LabTimeline;
