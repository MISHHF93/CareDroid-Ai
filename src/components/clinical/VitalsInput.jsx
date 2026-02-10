import React from 'react';

const VITAL_FIELDS = [
  {
    key: 'heartRate',
    label: 'Heart Rate',
    unit: 'bpm',
    placeholder: '72',
    min: 20,
    max: 300,
    normalRange: { min: 60, max: 100 },
  },
  {
    key: 'systolic',
    label: 'Systolic BP',
    unit: 'mmHg',
    placeholder: '120',
    min: 40,
    max: 300,
    normalRange: { min: 90, max: 140 },
    group: 'bloodPressure',
  },
  {
    key: 'diastolic',
    label: 'Diastolic BP',
    unit: 'mmHg',
    placeholder: '80',
    min: 20,
    max: 200,
    normalRange: { min: 60, max: 90 },
    group: 'bloodPressure',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°F',
    placeholder: '98.6',
    min: 85,
    max: 115,
    step: 0.1,
    normalRange: { min: 97, max: 99 },
  },
  {
    key: 'oxygenSat',
    label: 'SpO₂',
    unit: '%',
    placeholder: '98',
    min: 0,
    max: 100,
    normalRange: { min: 95, max: 100 },
  },
];

/**
 * VitalsInput — Reusable vitals entry grid.
 *
 * Props:
 *  - vitals: flat object { heartRate, systolic, diastolic, temperature, oxygenSat }
 *  - onChange: (field, value) => void
 *  - errors: object of field → message
 */
export function VitalsInput({ vitals = {}, onChange, errors = {} }) {
  return (
    <div className="vitals-input-grid">
      {VITAL_FIELDS.map((f) => {
        const val = vitals[f.key] ?? '';
        const numVal = Number(val);
        const isAbnormal =
          val !== '' &&
          !isNaN(numVal) &&
          (numVal < f.normalRange.min || numVal > f.normalRange.max);

        return (
          <div className="vitals-input-field" key={f.key}>
            <label htmlFor={`vital-${f.key}`} className="np-label">
              {f.label}
              <span className="vitals-unit">({f.unit})</span>
            </label>
            <input
              id={`vital-${f.key}`}
              type="number"
              className={`np-input ${errors[f.key] ? 'np-input-error' : ''} ${isAbnormal ? 'vitals-abnormal' : ''}`}
              placeholder={f.placeholder}
              value={val}
              onChange={(e) => onChange(f.key, e.target.value)}
              min={f.min}
              max={f.max}
              step={f.step || 1}
            />
            <span className="vitals-range-hint">
              Normal: {f.normalRange.min}–{f.normalRange.max} {f.unit}
            </span>
            {errors[f.key] && (
              <span className="np-error-msg">{errors[f.key]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Convert flat vitals input to the API shape expected by PatientCard / backend.
 */
export function buildVitalsPayload(flat) {
  const has = (k) => flat[k] !== '' && flat[k] !== undefined && flat[k] !== null;
  if (!has('heartRate') && !has('systolic') && !has('temperature') && !has('oxygenSat')) {
    return undefined; // nothing entered
  }

  const vitals = {};

  if (has('heartRate')) {
    vitals.heartRate = {
      value: Number(flat.heartRate),
      unit: 'bpm',
      range: { min: 60, max: 100 },
    };
  }

  if (has('systolic') || has('diastolic')) {
    vitals.bloodPressure = {
      systolic: has('systolic') ? Number(flat.systolic) : null,
      diastolic: has('diastolic') ? Number(flat.diastolic) : null,
      unit: 'mmHg',
      range: { min: 90, max: 140 },
    };
  }

  if (has('temperature')) {
    vitals.temperature = {
      value: Number(flat.temperature),
      unit: 'F',
      range: { min: 97, max: 99 },
    };
  }

  if (has('oxygenSat')) {
    vitals.oxygenSat = {
      value: Number(flat.oxygenSat),
      unit: '%',
      range: { min: 95, max: 100 },
    };
  }

  return vitals;
}

export default VitalsInput;
