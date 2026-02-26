import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './EmergencyModal.css';

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', icon: '🔴' },
  { value: 'urgent',   label: 'Urgent',   icon: '🟠' },
  { value: 'moderate', label: 'Moderate', icon: '🟡' },
];

const EMERGENCY_TYPES = [
  { value: 'cardiac',      label: 'Cardiac Arrest',  icon: '❤️' },
  { value: 'respiratory',  label: 'Respiratory',      icon: '🫁' },
  { value: 'stroke',       label: 'Stroke',           icon: '🧠' },
  { value: 'trauma',       label: 'Trauma',           icon: '🩸' },
  { value: 'sepsis',       label: 'Sepsis',           icon: '🦠' },
  { value: 'anaphylaxis',  label: 'Anaphylaxis',      icon: '⚡' },
  { value: 'seizure',      label: 'Seizure',          icon: '⚡' },
  { value: 'overdose',     label: 'Overdose',         icon: '💊' },
  { value: 'other',        label: 'Other',            icon: '🚨' },
];

const VITALS_FIELDS = [
  { key: 'heartRate',   label: 'Heart Rate',   unit: 'bpm',  placeholder: '72',   min: 0, max: 300 },
  { key: 'systolic',    label: 'Systolic BP',  unit: 'mmHg', placeholder: '120',  min: 0, max: 300 },
  { key: 'diastolic',   label: 'Diastolic BP', unit: 'mmHg', placeholder: '80',   min: 0, max: 200 },
  { key: 'temperature', label: 'Temperature',  unit: '°C',   placeholder: '37.0', min: 0, max: 50  },
  { key: 'oxygenSat',   label: 'SpO₂',         unit: '%',    placeholder: '98',   min: 0, max: 100 },
];

const INITIAL_FORM = {
  patientName: '',
  patientRoom: '',
  severity: 'critical',
  emergencyType: '',
  chiefComplaint: '',
  clinicalNotes: '',
  codeActivated: false,
};

const EMPTY_VITALS = {
  heartRate: '', systolic: '', diastolic: '', temperature: '', oxygenSat: '',
};

/**
 * EmergencyModal
 * Emergency protocol intake form on the Dashboard.
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - patients: Array<{ id, name, room }>
 */
export function EmergencyModal({ isOpen, onClose, patients = [] }) {
  const { t } = useLanguage();
  const [form, setForm]               = useState(INITIAL_FORM);
  const [vitals, setVitals]           = useState(EMPTY_VITALS);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [actionsTaken, setActionsTaken] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const overlayRef  = useRef(null);
  const patientRef  = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setVitals(EMPTY_VITALS);
      setErrors({});
      setSubmitting(false);
      setSubmitted(false);
      setActionsTaken([]);
      setSelectedPatientId('');
      requestAnimationFrame(() => patientRef.current?.focus());
    }
  }, [isOpen]);

  // Escape + focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const modal = overlayRef.current?.querySelector('.em-modal');
        if (!modal) return;
        const focusable = modal.querySelectorAll(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ─── Handlers ───
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { if (!prev[field]) return prev; const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleVitalChange = useCallback((field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePatientSelect = useCallback((e) => {
    const id = e.target.value;
    setSelectedPatientId(id);
    if (id) {
      const p = patients.find((x) => String(x.id) === String(id));
      if (p) setForm((prev) => ({ ...prev, patientName: p.name || '', patientRoom: p.room || '' }));
    }
  }, [patients]);

  // ─── Action Logging ───
  const logAction = useCallback((action) => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setActionsTaken((prev) => [...prev, { action, timestamp }]);
  }, []);

  const handleCall911       = useCallback(() => {
    logAction('Called 911 — Emergency services dispatched');
    if (/iPhone|Android/i.test(window.navigator.userAgent)) window.location.href = 'tel:911';
  }, [logAction]);

  const handleEscalateMD    = useCallback(() => logAction('Escalated to Attending Physician'), [logAction]);

  const handleActivateCode  = useCallback(() => {
    const code = form.emergencyType === 'cardiac' ? 'Code Blue'
      : form.emergencyType === 'stroke'   ? 'Code Stroke'
      : form.emergencyType === 'trauma'   ? 'Code Trauma'
      : 'Rapid Response';
    logAction(`${code} activated — Team paged`);
    handleChange('codeActivated', true);
  }, [form.emergencyType, logAction, handleChange]);

  const handlePageRRT       = useCallback(() => logAction('Rapid Response Team paged'), [logAction]);

  // ─── Validation ───
  const validate = useCallback(() => {
    const errs = {};
    if (!form.patientName.trim()) errs.patientName = 'Patient name is required';
    if (!form.emergencyType)      errs.emergencyType = 'Select an emergency type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // ─── Submit ───
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const vitalsPayload = {};
    VITALS_FIELDS.forEach(({ key }) => {
      const v = vitals[key];
      if (v !== '' && !isNaN(Number(v))) vitalsPayload[key] = { value: Number(v) };
    });

    const payload = {
      patientName:      form.patientName.trim(),
      patientRoom:      form.patientRoom.trim(),
      severity:         form.severity,
      emergencyType:    form.emergencyType,
      chiefComplaint:   form.chiefComplaint.trim(),
      clinicalNotes:    form.clinicalNotes.trim(),
      codeActivated:    form.codeActivated,
      actionsTaken,
      timestamp:        new Date().toISOString(),
      ...(Object.keys(vitalsPayload).length ? { vitals: vitalsPayload } : {}),
    };

    await new Promise((r) => setTimeout(r, 400));
    console.info('[EmergencyModal] Documented emergency:', payload);
    setSubmitting(false);
    setSubmitted(true);
  }, [form, vitals, actionsTaken, validate]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // ─── Confirmation screen ───
  if (submitted) {
    return (
      <div
        className="em-overlay"
        ref={overlayRef}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="em-title"
      >
        <div className="em-modal">
          <div className="em-header">
            <div className="em-header-icon">✅</div>
            <div className="em-header-text">
              <h2 id="em-title" className="em-title">Emergency Documented</h2>
              <p className="em-subtitle">Record saved successfully</p>
            </div>
            <button className="em-close" onClick={onClose} aria-label="Close" type="button">✕</button>
          </div>

          <div className="em-confirmation">
            <div className="em-conf-icon">✓</div>
            <h3 className="em-conf-heading">Record Saved</h3>
            <p className="em-conf-patient">{form.patientName}{form.patientRoom ? ` — Room ${form.patientRoom}` : ''}</p>
            <p className="em-conf-type">
              {EMERGENCY_TYPES.find((e) => e.value === form.emergencyType)?.label || form.emergencyType}
              {' '}({form.severity.toUpperCase()})
            </p>
            {actionsTaken.length > 0 && (
              <div className="em-conf-actions">
                <h4>Actions Taken</h4>
                <ul>
                  {actionsTaken.map((a, i) => (
                    <li key={i}>
                      <span className="em-conf-time">{a.timestamp}</span>
                      <span>{a.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" className="em-btn em-btn-done" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="em-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="em-title"
    >
      <div className="em-modal">
        {/* ── Header ── */}
        <div className="em-header">
          <div className="em-header-icon">🚨</div>
          <div className="em-header-text">
            <h2 id="em-title" className="em-title">Emergency Protocol</h2>
            <p className="em-subtitle">Document emergency — required fields marked *</p>
          </div>
          <button className="em-close" onClick={onClose} aria-label="Close" type="button">✕</button>
        </div>

        {/* ── Scrollable Form ── */}
        <form id="em-form" className="em-body" onSubmit={handleSubmit} noValidate>
          <div className="em-form-content">

            {/* ══ 1. Patient Identification ══ */}
            <section className="em-section" aria-labelledby="em-sec-patient">
              <div className="em-section-hd">
                <div className="em-section-badge patient">🏥</div>
                <span className="em-section-label" id="em-sec-patient">Patient Identification</span>
              </div>

              <div className="em-grid">
                {/* Quick-select existing patient */}
                {patients.length > 0 && (
                  <div className="em-field em-field-span">
                    <label htmlFor="em-patient-select" className="em-label">Quick-Select Existing Patient</label>
                    <select
                      id="em-patient-select"
                      className="em-select"
                      value={selectedPatientId}
                      onChange={handlePatientSelect}
                    >
                      <option value="">— Select patient —</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.room ? ` (Room ${p.room})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Patient Name */}
                <div className="em-field">
                  <label htmlFor="em-patient-name" className="em-label">
                    Patient Name <span className="em-required">*</span>
                  </label>
                  <input
                    ref={patientRef}
                    id="em-patient-name"
                    type="text"
                    className={`em-input${errors.patientName ? ' em-input-error' : ''}`}
                    placeholder="e.g. John Doe"
                    value={form.patientName}
                    onChange={(e) => handleChange('patientName', e.target.value)}
                    maxLength={120}
                    autoComplete="off"
                  />
                  {errors.patientName && <span className="em-error-msg">⚠ {errors.patientName}</span>}
                </div>

                {/* Room */}
                <div className="em-field">
                  <label htmlFor="em-patient-room" className="em-label">Room / Location</label>
                  <input
                    id="em-patient-room"
                    type="text"
                    className="em-input"
                    placeholder="e.g. ICU-4A"
                    value={form.patientRoom}
                    onChange={(e) => handleChange('patientRoom', e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>
            </section>

            {/* ══ 2. Emergency Classification ══ */}
            <section className="em-section" aria-labelledby="em-sec-class">
              <div className="em-section-hd">
                <div className="em-section-badge classif">⚠️</div>
                <span className="em-section-label" id="em-sec-class">Emergency Classification</span>
              </div>

              {/* Severity chips */}
              <div>
                <p className="em-label" style={{ marginBottom: '10px' }}>
                  Severity Level <span className="em-required">*</span>
                </p>
                <div className="em-severity-grid">
                  {SEVERITY_OPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      className={`em-severity-chip${form.severity === value ? ' active' : ''}`}
                      data-sev={value}
                      onClick={() => handleChange('severity', value)}
                    >
                      <span className="sc-icon">{icon}</span>
                      <span className="sc-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency type chips */}
              <div>
                <p className="em-label" style={{ marginBottom: '10px' }}>
                  Emergency Type <span className="em-required">*</span>
                </p>
                <div className="em-type-grid">
                  {EMERGENCY_TYPES.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      className={`em-type-chip${form.emergencyType === value ? ' active' : ''}`}
                      onClick={() => handleChange('emergencyType', value)}
                    >
                      <span className="tc-icon">{icon}</span>
                      <span className="tc-label">{label}</span>
                    </button>
                  ))}
                </div>
                {errors.emergencyType && <span className="em-error-msg" style={{ marginTop: '6px' }}>⚠ {errors.emergencyType}</span>}
              </div>

              {/* Chief Complaint */}
              <div className="em-field">
                <label htmlFor="em-complaint" className="em-label">Chief Complaint</label>
                <textarea
                  id="em-complaint"
                  className="em-textarea"
                  rows={2}
                  placeholder="Describe the presenting emergency…"
                  value={form.chiefComplaint}
                  onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                  maxLength={500}
                />
              </div>
            </section>

            {/* ══ 3. Vital Signs ══ */}
            <section className="em-section" aria-labelledby="em-sec-vital">
              <div className="em-section-hd">
                <div className="em-section-badge vital">💓</div>
                <span className="em-section-label" id="em-sec-vital">Vital Signs</span>
                <span className="em-section-opt">Optional</span>
              </div>

              <div className="em-vitals-grid">
                {VITALS_FIELDS.map(({ key, label, unit, placeholder, min, max }) => (
                  <div className="em-vital-field" key={key}>
                    <label className="em-vital-label">
                      {label} <span className="em-vital-unit">{unit}</span>
                    </label>
                    <input
                      type="number"
                      className="em-input"
                      placeholder={placeholder}
                      value={vitals[key]}
                      onChange={(e) => handleVitalChange(key, e.target.value)}
                      min={min}
                      max={max}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* ══ 4. Immediate Actions ══ */}
            <section className="em-section" aria-labelledby="em-sec-actions">
              <div className="em-section-hd">
                <div className="em-section-badge actions">🚑</div>
                <span className="em-section-label" id="em-sec-actions">Immediate Actions</span>
              </div>

              <div className="em-action-grid">
                <button type="button" className="em-action-btn em-action-911" onClick={handleCall911}>
                  <span className="em-action-icon">📞</span>
                  <span className="em-action-text">
                    <span className="em-action-main">Call 911</span>
                    <span className="em-action-sub">Dispatch emergency services</span>
                  </span>
                </button>

                <button type="button" className="em-action-btn em-action-md" onClick={handleEscalateMD}>
                  <span className="em-action-icon">👨‍⚕️</span>
                  <span className="em-action-text">
                    <span className="em-action-main">Escalate to MD</span>
                    <span className="em-action-sub">Notify attending physician</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={`em-action-btn em-action-code${form.codeActivated ? ' em-action-activated' : ''}`}
                  onClick={handleActivateCode}
                  disabled={form.codeActivated}
                >
                  <span className="em-action-icon">{form.codeActivated ? '✅' : '🔔'}</span>
                  <span className="em-action-text">
                    <span className="em-action-main">{form.codeActivated ? 'Code Activated' : 'Activate Code'}</span>
                    <span className="em-action-sub">{form.codeActivated ? 'Team paged' : 'Page code team'}</span>
                  </span>
                </button>

                <button type="button" className="em-action-btn em-action-rrt" onClick={handlePageRRT}>
                  <span className="em-action-icon">🏃</span>
                  <span className="em-action-text">
                    <span className="em-action-main">Page RRT</span>
                    <span className="em-action-sub">Rapid Response Team</span>
                  </span>
                </button>
              </div>

              {actionsTaken.length > 0 && (
                <div className="em-action-log">
                  <h4 className="em-action-log-title">Action Log</h4>
                  {actionsTaken.map((a, i) => (
                    <div key={i} className="em-action-log-entry">
                      <span className="em-action-log-time">{a.timestamp}</span>
                      <span className="em-action-log-text">{a.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ══ 5. Clinical Notes ══ */}
            <section className="em-section" aria-labelledby="em-sec-notes">
              <div className="em-section-hd">
                <div className="em-section-badge notes">📝</div>
                <span className="em-section-label" id="em-sec-notes">Clinical Notes</span>
                <span className="em-section-opt">Optional</span>
              </div>

              <div className="em-field">
                <label htmlFor="em-notes" className="em-label">Interventions, patient response, timeline…</label>
                <textarea
                  id="em-notes"
                  className="em-textarea"
                  rows={4}
                  placeholder="Document interventions, patient response, timeline of events…"
                  value={form.clinicalNotes}
                  onChange={(e) => handleChange('clinicalNotes', e.target.value)}
                  maxLength={2000}
                />
              </div>
            </section>

            {/* Disclaimer */}
            <div className="em-disclaimer">
              ⚠️ <strong>Medical Disclaimer:</strong> This tool is for documentation purposes only and does not replace clinical judgment. Always follow your institution's emergency protocols.
            </div>

          </div>
        </form>

        {/* ── Sticky Footer ── */}
        <div className="em-footer">
          <span style={{ fontSize: '0.75rem', color: 'rgba(252,165,165,0.45)' }}>Fields marked * are required</span>
          <div className="em-footer-actions">
            <button type="button" className="em-btn em-btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="em-form" className="em-btn em-btn-submit" disabled={submitting}>
              {submitting ? 'Documenting…' : '🚨 Document & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmergencyModal;
