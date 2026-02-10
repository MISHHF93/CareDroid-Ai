import React, { useState, useMemo } from 'react';
import { Card } from '../ui/molecules/Card';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_BEDS = [
  { id: 'b1', room: '201', status: 'occupied', patient: 'Smith, J.', acuity: 'critical', unit: 'Unit 3A' },
  { id: 'b2', room: '202', status: 'occupied', patient: 'Johnson, M.', acuity: 'urgent', unit: 'Unit 3A' },
  { id: 'b3', room: '203', status: 'available', patient: null, acuity: null, unit: 'Unit 3A' },
  { id: 'b4', room: '204', status: 'occupied', patient: 'Davis, R.', acuity: 'critical', unit: 'Unit 3A' },
  { id: 'b5', room: '205', status: 'occupied', patient: 'Lee, K.', acuity: 'stable', unit: 'Unit 3B' },
  { id: 'b6', room: '206', status: 'available', patient: null, acuity: null, unit: 'Unit 3B' },
  { id: 'b7', room: '207', status: 'cleaning', patient: null, acuity: null, unit: 'Unit 3B' },
  { id: 'b8', room: '208', status: 'occupied', patient: 'Brown, A.', acuity: 'stable', unit: 'Unit 3B' },
  { id: 'b9', room: '209', status: 'occupied', patient: 'Wilson, T.', acuity: 'urgent', unit: 'ICU' },
  { id: 'b10', room: '210', status: 'available', patient: null, acuity: null, unit: 'ICU' },
  { id: 'b11', room: '211', status: 'occupied', patient: 'Martinez, C.', acuity: 'stable', unit: 'ICU' },
  { id: 'b12', room: '212', status: 'occupied', patient: 'Taylor, S.', acuity: 'stable', unit: 'ICU' },
];

/**
 * BedBoard — Census / bed occupancy overview with unit filter
 */
export const BedBoard = ({ beds: propBeds, unit = 'Unit 3A' }) => {
  const { t } = useLanguage();
  const allBeds = propBeds || DEFAULT_BEDS;

  // Extract unique units from bed data
  const units = useMemo(() => {
    const set = new Set(allBeds.map((b) => b.unit || unit));
    return ['All', ...Array.from(set)];
  }, [allBeds, unit]);

  const [selectedUnit, setSelectedUnit] = useState('All');

  const beds = useMemo(() => {
    if (selectedUnit === 'All') return allBeds;
    return allBeds.filter((b) => (b.unit || unit) === selectedUnit);
  }, [allBeds, selectedUnit, unit]);
  const occupied = beds.filter((b) => b.status === 'occupied').length;
  const total = beds.length;
  const occupancy = Math.round((occupied / total) * 100);

  const statusColors = {
    occupied: 'var(--clinical-error)',
    available: 'var(--clinical-success)',
    cleaning: 'var(--clinical-warning)',
    reserved: 'var(--clinical-info)',
  };

  const statusHex = {
    occupied: '#EF4444',
    available: '#10B981',
    cleaning: '#F59E0B',
    reserved: '#63B3ED',
  };

  const acuityColors = {
    critical: 'var(--clinical-error)',
    urgent: 'var(--clinical-warning)',
    stable: 'var(--clinical-success)',
  };

  return (
    <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          🛏️ {t('widgets.bedBoard.title')}
        </h3>
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          aria-label="Filter by unit"
          style={{
            fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)', background: 'var(--surface-secondary)',
            cursor: 'pointer',
          }}
        >
          {units.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Occupancy bar */}
      <div style={{ padding: 'var(--space-3) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{occupied}/{total} {t('widgets.bedBoard.bedsOccupied')}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: occupancy > 85 ? 'var(--clinical-error)' : occupancy > 70 ? 'var(--clinical-warning)' : 'var(--clinical-success)' }}>
            {occupancy}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={occupancy}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Bed occupancy: ${occupancy}%`}
          style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-tertiary)', overflow: 'hidden' }}
        >
          <div style={{
            height: '100%', borderRadius: '3px', width: `${occupancy}%`,
            background: occupancy > 85 ? 'var(--clinical-error)' : occupancy > 70 ? 'var(--clinical-warning)' : 'var(--clinical-success)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Bed Grid */}
      <div role="grid" aria-label="Bed occupancy grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: '6px', paddingTop: 'var(--space-2)' }}>
        {beds.map((bed) => (
          <div
            key={bed.id}
            role="gridcell"
            aria-label={bed.patient ? `Room ${bed.room}: ${bed.patient}, ${bed.acuity}` : `Room ${bed.room}: ${bed.status}`}
            title={bed.patient ? `${bed.room}: ${bed.patient} (${bed.acuity})` : `${bed.room}: ${bed.status}`}
            style={{
              width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-md)',
              background: `${statusHex[bed.status]}20`,
              border: `2px solid ${statusColors[bed.status]}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700, color: statusHex[bed.status],
              cursor: 'default', position: 'relative',
            }}
          >
            <span>{bed.room}</span>
            {bed.acuity && (
              <span aria-label={`Acuity: ${bed.acuity}`} style={{ width: '6px', height: '6px', borderRadius: '50%', background: acuityColors[bed.acuity], position: 'absolute', top: '3px', right: '3px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
        {Object.entries(statusHex).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
            <span>{t('widgets.bedBoard.status_' + status)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BedBoard;
