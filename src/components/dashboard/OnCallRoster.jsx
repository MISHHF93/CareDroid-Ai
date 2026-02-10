import React from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_ROSTER = [
  { id: 'r1', name: 'Dr. Kim', specialty: 'Cardiology', status: 'available', phone: 'x4521' },
  { id: 'r2', name: 'Dr. Patel', specialty: 'General Surgery', status: 'in-surgery', phone: 'x4102' },
  { id: 'r3', name: 'Dr. Lee', specialty: 'Nephrology', status: 'off-site', phone: 'x4330' },
  { id: 'r4', name: 'Dr. Wu', specialty: 'ICU Attending', status: 'available', phone: 'x4001' },
  { id: 'r5', name: 'Dr. Garcia', specialty: 'Pulmonology', status: 'available', phone: 'x4215' },
  { id: 'r6', name: 'Dr. Nguyen', specialty: 'Neurology', status: 'in-surgery', phone: 'x4440' },
];

/**
 * OnCallRoster — Show on-call clinicians by specialty with page/message actions
 */
export const OnCallRoster = ({ roster: propRoster, onPage, onMessage }) => {
  const { t } = useLanguage();
  const roster = propRoster || DEFAULT_ROSTER;

  const statusConfig = {
    available: { label: t('widgets.onCallRoster.available'), color: 'var(--clinical-success)', hex: '#10B981', dot: '🟢' },
    'in-surgery': { label: t('widgets.onCallRoster.inSurgery'), color: 'var(--clinical-warning)', hex: '#F59E0B', dot: '🟡' },
    'off-site': { label: t('widgets.onCallRoster.offSite'), color: 'var(--clinical-error)', hex: '#EF4444', dot: '🔴' },
    busy: { label: t('widgets.onCallRoster.busy'), color: 'var(--clinical-warning)', hex: '#F59E0B', dot: '🟡' },
  };

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          📞 {t('widgets.onCallRoster.title')}
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{t('widgets.onCallRoster.today')}</span>
      </div>

      {/* Roster List */}
      <div role="list" aria-label="On-call roster" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, overflowY: 'auto', maxHeight: '260px', paddingTop: 'var(--space-3)' }}>
        {roster.map((person) => {
          const sc = statusConfig[person.status] || statusConfig.available;
          return (
            <div
              key={person.id}
              role="listitem"
              aria-label={`${person.name}, ${person.specialty}, ${sc.label}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                background: 'var(--surface-secondary)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${sc.hex}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: sc.hex, flexShrink: 0 }}>
                {person.name.charAt(person.name.indexOf(' ') + 1) || person.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{person.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{person.specialty}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: sc.color, fontWeight: 600 }}>
                  <span>{sc.dot}</span> {sc.label}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {onPage && (
                    <button
                      onClick={() => onPage(person)}
                      aria-label={`Page ${person.name}`}
                      style={{
                        fontSize: '10px', fontWeight: 600, color: 'var(--clinical-primary)',
                        background: 'var(--clinical-primary-light)', border: 'none',
                        borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      📟 {t('widgets.onCallRoster.page')}
                    </button>
                  )}
                  {onMessage && (
                    <button
                      onClick={() => onMessage(person)}
                      aria-label={`Message ${person.name}`}
                      style={{
                        fontSize: '10px', fontWeight: 600, color: 'var(--clinical-info)',
                        background: 'var(--clinical-info-light, rgba(99,179,237,0.1))', border: 'none',
                        borderRadius: 'var(--radius-sm)', padding: '2px 8px', cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      💬 {t('widgets.onCallRoster.msg')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default OnCallRoster;
