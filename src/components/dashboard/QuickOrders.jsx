import React, { useState } from 'react';
import { Card } from '../ui/molecules/Card';
import { Button } from '../ui/atoms/Button';
import { Badge } from '../ui/atoms/Badge';
import { useLanguage } from '../../contexts/LanguageContext';

const ORDER_TEMPLATES = [
  { id: 'stat-cbc', label: 'Stat CBC', icon: '🩸', category: 'lab' },
  { id: 'bmp', label: 'BMP', icon: '🧪', category: 'lab' },
  { id: 'ua', label: 'Urinalysis', icon: '🫧', category: 'lab' },
  { id: 'vitals-q4', label: 'Vitals q4h', icon: '❤️', category: 'vitals' },
  { id: 'prn-tylenol', label: 'PRN Tylenol', icon: '💊', category: 'med' },
  { id: 'prn-zofran', label: 'PRN Zofran', icon: '💊', category: 'med' },
  { id: 'ns-bolus', label: 'NS Bolus 1L', icon: '💧', category: 'iv' },
  { id: 'ekg', label: 'Stat EKG', icon: '📈', category: 'procedure' },
];

/**
 * QuickOrders — One-click order placement widget
 */
export const QuickOrders = ({ patients = [], onPlaceOrder }) => {
  const { t } = useLanguage();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [placingId, setPlacingId] = useState(null);

  const handleOrder = async (template) => {
    if (!selectedPatient) return;
    setPlacingId(template.id);
    try {
      await onPlaceOrder?.({ patientId: selectedPatient, orderId: template.id, label: template.label });
      setRecentOrders((prev) => [{ ...template, patient: selectedPatient, time: new Date() }, ...prev].slice(0, 5));
    } finally {
      setPlacingId(null);
    }
  };

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          {t('widgets.quickOrders.title')}
        </h3>
        <Badge variant="info" size="sm">⚡ {t('widgets.quickOrders.fastPath')}</Badge>
      </div>

      {/* Patient Selector */}
      <div style={{ padding: 'var(--space-3) 0' }}>
        <select
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          aria-label="Select patient for order"
          style={{
            width: '100%', padding: '8px 10px', fontSize: '13px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            background: 'var(--surface-secondary)', color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <option value="">{t('widgets.quickOrders.selectPatient')}</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {p.room || t('widgets.quickOrders.noRoom')}</option>
          ))}
        </select>
      </div>

      {/* Order Templates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)', flex: 1 }}>
        {ORDER_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => handleOrder(tpl)}
            disabled={!selectedPatient || placingId === tpl.id}
            aria-label={`Order ${tpl.label}${!selectedPatient ? ' (select patient first)' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 10px', fontSize: '12px', fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: placingId === tpl.id ? 'var(--clinical-primary-light)' : 'var(--surface-secondary)',
              color: !selectedPatient ? 'var(--text-disabled)' : 'var(--text-primary)',
              cursor: !selectedPatient ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span>{tpl.icon}</span>
            <span>{tpl.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '6px' }}>{t('widgets.quickOrders.recentOrders')}</div>
          {recentOrders.map((o, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Reorder ${o.label}`}
              onClick={() => handleOrder(o)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOrder(o); } }}
              style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 6px', cursor: selectedPatient ? 'pointer' : 'not-allowed', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '4px', transition: 'background 0.15s' }}
              onMouseEnter={(e) => { if (selectedPatient) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{o.icon}</span>
              <span style={{ flex: 1 }}>{o.label}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{new Date(o.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {selectedPatient && <span style={{ fontSize: '10px', color: 'var(--clinical-primary)', fontWeight: 600 }}>↻</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default QuickOrders;
