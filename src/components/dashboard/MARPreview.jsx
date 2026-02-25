import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * MARPreview — Medication Administration Record preview (next 2 hours)
 * Supports quick "administered" checkbox and click-to-open full MAR
 */
export const MARPreview = ({ medications: propMeds, onAdminister, onViewMAR }) => {
  const { t } = useLanguage();
  const [now, setNow] = useState(Date.now());
  const [administeringId, setAdministeringId] = useState(null);
  const [administeredIds, setAdministeredIds] = useState(new Set());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAdminister = useCallback(async (med, e) => {
    e.stopPropagation();
    setAdministeringId(med.id);
    try {
      await onAdminister?.(med);
      setAdministeredIds((prev) => new Set(prev).add(med.id));
    } finally {
      setAdministeringId(null);
    }
  }, [onAdminister]);

  // Default mock medications if none provided
  const medications = propMeds || [
    { id: 'm1', name: 'Metoprolol 25mg', patient: 'Smith, J.', dueAt: new Date(Date.now() - 20 * 60000).toISOString(), route: 'PO' },
    { id: 'm2', name: 'Insulin sliding scale', patient: 'Johnson, M.', dueAt: new Date(Date.now() + 5 * 60000).toISOString(), route: 'SubQ' },
    { id: 'm3', name: 'Vancomycin 1g', patient: 'Davis, R.', dueAt: new Date(Date.now() + 45 * 60000).toISOString(), route: 'IV' },
    { id: 'm4', name: 'Lasix 40mg', patient: 'Lee, K.', dueAt: new Date(Date.now() + 75 * 60000).toISOString(), route: 'IV' },
    { id: 'm5', name: 'Heparin 5000u', patient: 'Smith, J.', dueAt: new Date(Date.now() + 110 * 60000).toISOString(), route: 'SubQ' },
  ];

  const getStatus = (dueAt) => {
    const diff = new Date(dueAt).getTime() - now;
    if (diff < -15 * 60000) return { label: t('widgets.marPreview.overdue'), color: 'var(--clinical-error)', hex: '#EF4444', bg: 'var(--clinical-error-light)' };
    if (diff < 15 * 60000) return { label: t('widgets.marPreview.dueNow'), color: 'var(--clinical-warning)', hex: '#F59E0B', bg: 'var(--clinical-warning-light)' };
    return { label: t('widgets.marPreview.upcoming'), color: 'var(--clinical-success)', hex: '#10B981', bg: 'var(--clinical-success-light)' };
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const overdueCount = medications.filter((m) => getStatus(m.dueAt).label === 'OVERDUE').length;

  const sorted = [...medications].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          💊 {t('widgets.marPreview.title')}
          {overdueCount > 0 && <Badge variant="danger" size="sm">{overdueCount} {t('widgets.marPreview.overdueLabel')}</Badge>}
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {t('widgets.marPreview.next2Hours')}
          {onViewMAR && (
            <button
              onClick={() => onViewMAR()}
              style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clinical-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--clinical-primary-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {t('widgets.marPreview.openFullMAR')} →
            </button>
          )}
        </span>
      </div>

      {/* Medication List */}
      <div role="list" aria-label="Upcoming medications" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, overflowY: 'auto', maxHeight: '260px', paddingTop: 'var(--space-3)' }}>
        {sorted.map((med) => {
          const status = getStatus(med.dueAt);
          const isAdministered = administeredIds.has(med.id);
          return (
            <div
              key={med.id}
              role="listitem"
              aria-label={`${med.name} for ${med.patient} — ${isAdministered ? 'ADMINISTERED' : status.label}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${isAdministered ? 'var(--clinical-success)' : status.color}`,
                background: isAdministered ? 'var(--clinical-success-light)' : status.bg,
                opacity: isAdministered ? 0.7 : 1,
                transition: 'opacity 0.2s, background 0.2s',
              }}
            >
              {/* Administered checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isAdministered}
                  disabled={administeringId === med.id}
                  onChange={(e) => !isAdministered && handleAdminister(med, e)}
                  aria-label={`Mark ${med.name} as administered`}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--clinical-success)', cursor: 'pointer' }}
                />
              </label>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAdministered ? 'var(--clinical-success)' : status.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: isAdministered ? 'line-through' : 'none' }}>{med.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {med.patient} · {med.route}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: isAdministered ? 'var(--clinical-success)' : status.color }}>{isAdministered ? `✓ ${t('widgets.marPreview.done')}` : formatTime(med.dueAt)}</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: isAdministered ? 'var(--clinical-success)' : status.color }}>{isAdministered ? t('widgets.marPreview.administered') : status.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default MARPreview;
