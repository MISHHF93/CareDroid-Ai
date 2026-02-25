import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';
import { Button } from '../ui/atoms/Button';
import { useLanguage } from '../../contexts/LanguageContext';

const CATEGORY_TABS = [
  { id: 'all', labelKey: 'all', icon: '📋' },
  { id: 'lab', labelKey: 'labs', icon: '🧪' },
  { id: 'medication', labelKey: 'meds', icon: '💊' },
  { id: 'vital', labelKey: 'vitals', icon: '❤️' },
  { id: 'note', labelKey: 'notes', icon: '📝' },
  { id: 'imaging', labelKey: 'imaging', icon: '🔬' },
];

/** Priority levels — critical items pin to top */
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, normal: 3, low: 4 };

/**
 * CommandFeed — Upgraded ActivityFeed with category filters, priority pinning & unread markers
 */
export const CommandFeed = ({ activities = [], onActivityClick, onAction, lastVisitTimestamp }) => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');

  /** Sort by priority (critical → top), then by recency */
  const filtered = useMemo(() => {
    const items = activeCategory === 'all' ? activities : activities.filter((a) => a.type === activeCategory);
    return [...items].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? PRIORITY_ORDER.normal;
      const pb = PRIORITY_ORDER[b.priority] ?? PRIORITY_ORDER.normal;
      if (pa !== pb) return pa - pb;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [activities, activeCategory]);

  /** Unread = arrived after last visit */
  const isUnread = useCallback((activity) => {
    if (!lastVisitTimestamp) return false;
    return new Date(activity.timestamp) > new Date(lastVisitTimestamp);
  }, [lastVisitTimestamp]);

  const unreadCount = useMemo(() => activities.filter(isUnread).length, [activities, isUnread]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    activities.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  const getRelativeTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t('widgets.commandFeed.justNow');
    if (m < 60) return `${m}${t('widgets.commandFeed.mAgo')}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}${t('widgets.commandFeed.hAgo')}`;
    return `${Math.floor(h / 24)}${t('widgets.commandFeed.dAgo')}`;
  };

  const getIcon = (type) =>
    ({ lab: '🧪', medication: '💊', vital: '❤️', admission: '🏥', procedure: '⚕️', note: '📝', imaging: '🔬', consult: '👨‍⚕️', discharge: '🚪' })[type] || '📋';

  const getInlineAction = (activity) => {
    const map = {
      lab: { label: t('widgets.commandFeed.viewResult'), action: 'viewLabResult' },
      medication: { label: t('widgets.commandFeed.markAdministered'), action: 'markAdministered' },
      vital: { label: t('widgets.commandFeed.viewTrend'), action: 'viewTrend' },
      imaging: { label: t('widgets.commandFeed.openImage'), action: 'openImage' },
      note: { label: t('widgets.commandFeed.readNote'), action: 'readNote' },
    };
    return map[activity.type] || null;
  };

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '7px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 0 }}>
        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          {t('widgets.commandFeed.title')}
          <span role="status" aria-label="Live feed active" style={{ fontSize: '9px', fontWeight: 700, color: 'var(--clinical-success)', padding: '1px 5px', borderRadius: '999px', background: 'var(--clinical-success-light)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--clinical-success)', animation: 'pulse 2s ease-in-out infinite' }} />
            {t('widgets.commandFeed.live')}
          </span>
          {unreadCount > 0 && (
            <span role="status" aria-label={`${unreadCount} new items`} style={{ fontSize: '9px', fontWeight: 700, color: '#fff', padding: '1px 5px', borderRadius: '999px', background: 'var(--clinical-error)', minWidth: '16px', textAlign: 'center' }}>
              {unreadCount}
            </span>
          )}
        </h3>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{filtered.length} {t('widgets.commandFeed.items')}</span>
      </div>

      {/* Category Tabs */}
      <div role="tablist" aria-label="Activity categories" style={{ display: 'flex', gap: 3, padding: '6px 0 5px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
        {CATEGORY_TABS.map((tab) => {
          const count = tab.id === 'all' ? activities.length : categoryCounts[tab.id] || 0;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls="command-feed-list"
              onClick={() => setActiveCategory(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                borderRadius: '999px', border: 'none', cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: isActive ? 'var(--clinical-primary-light)' : 'transparent',
                color: isActive ? 'var(--clinical-primary)' : 'var(--text-secondary)',
              }}
            >
              <span>{tab.icon}</span>
              <span>{t('widgets.commandFeed.tab_' + tab.labelKey)}</span>
              {count > 0 && (
                <span style={{
                  fontSize: '10px', padding: '0 5px', borderRadius: '999px',
                  background: isActive ? 'var(--clinical-primary)' : 'var(--surface-tertiary)',
                  color: isActive ? '#fff' : 'var(--text-tertiary)',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feed List */}
      <div id="command-feed-list" role="tabpanel" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1, maxHeight: '280px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '24px', marginBottom: 4 }}>📭</div>
            <p style={{ margin: 0 }}>{t('widgets.commandFeed.noActivity')}</p>
          </div>
        ) : (
          filtered.map((activity, idx) => {
            const inlineAction = getInlineAction(activity);
            const unread = isUnread(activity);
            const isPinned = activity.priority === 'critical' || activity.priority === 'high';
            return (
              <div
                key={activity.id || idx}
                role="button"
                tabIndex={0}
                aria-label={`${isPinned ? 'Pinned: ' : ''}${activity.title || activity.message} — ${getRelativeTime(activity.timestamp)}${unread ? ' (new)' : ''}`}
                onClick={() => onActivityClick?.(activity)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivityClick?.(activity); } }}
                style={{ display: 'flex', gap: 8, padding: '5px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.12s', position: 'relative', borderLeft: isPinned ? '2px solid var(--clinical-error)' : '2px solid transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Unread dot */}
                {unread && (
                  <span aria-hidden="true" style={{ position: 'absolute', left: isPinned ? '-8px' : '-5px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--clinical-primary)' }} />
                )}
                <div style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>{getIcon(activity.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: unread ? 700 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isPinned && <span aria-label="Pinned" title="Priority item" style={{ fontSize: '11px' }}>📌</span>}
                    {activity.title || activity.message}
                  </div>
                  {(activity.patient || activity.patientName) && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      {t('widgets.commandFeed.patient')}: {activity.patient || activity.patientName}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{getRelativeTime(activity.timestamp)}</span>
                    {inlineAction && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAction?.(activity, inlineAction.action); }}
                        style={{ fontSize: '11px', fontWeight: 600, color: 'var(--clinical-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--clinical-primary-light)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        {inlineAction.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default CommandFeed;
