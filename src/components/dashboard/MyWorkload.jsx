import React, { useState, useEffect } from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * MyWorkload — Shift handoff panel with tasks, shift timer, handoff notes
 */
export const MyWorkload = ({ tasks: initialTasks, shiftEnd, onToggleTask, onUpdateHandoff }) => {
  const { t } = useLanguage();
  const [handoffNote, setHandoffNote] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Default mock tasks if none provided
  const tasks = initialTasks || [
    { id: 't1', label: 'Review CBC — Smith, J.', done: false, priority: 'high' },
    { id: 't2', label: 'Sign heparin order — Johnson, M.', done: false, priority: 'high' },
    { id: 't3', label: 'Respond to cardiology consult', done: true, priority: 'medium' },
    { id: 't4', label: 'Update care plan — Davis, R.', done: false, priority: 'medium' },
    { id: 't5', label: 'Document wound assessment — Lee, K.', done: false, priority: 'low' },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Shift timer
  useEffect(() => {
    const endTime = shiftEnd ? new Date(shiftEnd).getTime() : Date.now() + 3 * 3600000 + 22 * 60000; // default 3h 22m
    const update = () => {
      const diff = Math.max(0, endTime - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, '0')}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [shiftEnd]);

  const priorityColor = { high: 'var(--clinical-error)', medium: 'var(--clinical-warning)', low: 'var(--clinical-info)' };

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '7px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t('widgets.myWorkload.title')}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{t('widgets.myWorkload.shiftEndsIn')}</span>
          <Badge variant="info" size="sm">⏱ {timeLeft}</Badge>
        </div>
      </div>

      {/* Progress */}
      <div style={{ paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {completedCount}/{tasks.length} {t('widgets.myWorkload.tasksDone')}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: progress === 100 ? 'var(--clinical-success)' : 'var(--text-primary)' }}>
            {progress}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Workload progress: ${progress}%`}
          style={{ height: '4px', borderRadius: '2px', background: 'var(--surface-tertiary)', overflow: 'hidden' }}
        >
          <div style={{ height: '100%', borderRadius: '2px', width: `${progress}%`, background: progress === 100 ? 'var(--clinical-success)' : 'var(--clinical-primary)', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto', maxHeight: '160px' }}>
        {tasks.map((task) => (
          <label
            key={task.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              background: task.done ? 'var(--surface-secondary)' : 'transparent',
              transition: 'background 0.12s',
            }}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggleTask?.(task.id)}
              style={{ accentColor: 'var(--clinical-primary)', width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{
              fontSize: '12px', fontWeight: 500, flex: 1,
              color: task.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
              textDecoration: task.done ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {task.label}
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: priorityColor[task.priority] || '#63B3ED', flexShrink: 0 }} />
          </label>
        ))}
      </div>

      {/* Handoff Notes */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
          📝 {t('widgets.myWorkload.shiftHandoffNotes')}
        </div>
        <textarea
          value={handoffNote}
          onChange={(e) => { setHandoffNote(e.target.value); onUpdateHandoff?.(e.target.value); }}
          placeholder={t('widgets.myWorkload.handoffPlaceholder')}
          aria-label="Shift handoff notes"
          rows={2}
          style={{
            width: '100%', padding: '6px 8px', fontSize: '11px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)', background: 'var(--surface-secondary)',
            resize: 'vertical', fontFamily: 'inherit', color: 'var(--text-primary)',
            boxSizing: 'border-box'
          }}
        />
      </div>
    </Card>
  );
};

export default MyWorkload;
