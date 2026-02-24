import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_REMINDERS = [
  { id: 'b1', message: '3 patients due for sepsis screening (qSOFA)', icon: '🦠', priority: 'high' },
  { id: 'b2', message: 'DVT prophylaxis reminder for 2 post-op patients', icon: '🩸', priority: 'medium' },
  { id: 'b3', message: 'Fall risk reassessment due for Room 204', icon: '⚠️', priority: 'medium' },
  { id: 'b4', message: 'Flu vaccination campaign — 5 eligible patients this shift', icon: '💉', priority: 'low' },
];

/**
 * ClinicalBanner — Clinical decision support banner (rotating reminders)
 */
export const ClinicalBanner = ({ reminders: propReminders, onDismiss, onSnooze }) => {
  const { t } = useLanguage();
  const reminders = propReminders || DEFAULT_REMINDERS;
  const [dismissed, setDismissed] = useState(new Set());
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1100px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 1100px)');
    const handleChange = (event) => setIsMobile(event.matches);
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const visible = useMemo(
    () => reminders.filter((r) => !dismissed.has(r.id)),
    [reminders, dismissed]
  );

  if (visible.length === 0) return null;

  const current = visible[0];

  const priorityStyles = {
    high: { bg: 'linear-gradient(90deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))', border: '#EF4444', text: '#B91C1C' },
    medium: { bg: 'linear-gradient(90deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', border: '#F59E0B', text: '#92400E' },
    low: { bg: 'linear-gradient(90deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))', border: '#3B82F6', text: '#1E40AF' },
  };

  const ps = priorityStyles[current.priority] || priorityStyles.medium;

  const handleDismiss = () => {
    setDismissed((prev) => new Set(prev).add(current.id));
    onDismiss?.(current.id);
  };

  const handleSnooze = () => {
    setDismissed((prev) => new Set(prev).add(current.id));
    onSnooze?.(current.id);
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: 'var(--space-3)',
        flexDirection: isMobile ? 'column' : 'row',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        borderLeft: `4px solid ${ps.border}`,
        background: ps.bg,
        animation: 'slideUp 0.3s var(--ease-smooth)',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <span style={{ fontSize: '20px', flexShrink: 0, alignSelf: isMobile ? 'flex-start' : 'auto' }}>{current.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: ps.text }}>{current.message}</div>
        {visible.length > 1 && (
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            +{visible.length - 1} {t('widgets.clinicalBanner.moreClinicalReminders')}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
        <button
          onClick={handleSnooze}
          style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${ps.border}40`, background: 'transparent', color: ps.text, cursor: 'pointer', flex: isMobile ? 1 : '0 0 auto' }}
        >
          {t('widgets.clinicalBanner.snooze1h')}
        </button>
        <button
          onClick={handleDismiss}
          style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', border: 'none', background: `${ps.border}15`, color: ps.text, cursor: 'pointer', flex: isMobile ? 1 : '0 0 auto' }}
        >
          {t('widgets.clinicalBanner.done')} ✓
        </button>
      </div>
    </div>
  );
};

export default ClinicalBanner;
