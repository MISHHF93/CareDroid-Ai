import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './NewPatientModal.css';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];

const STATUS_OPTIONS = [
  { value: 'stable',   label: 'Stable',   desc: 'Routine care' },
  { value: 'moderate', label: 'Moderate', desc: 'Closer monitoring' },
  { value: 'urgent',   label: 'Urgent',   desc: 'Prompt attention' },
  { value: 'critical', label: 'Critical', desc: 'Immediate care' },
];

const ALERT_SEVERITIES = ['critical', 'high', 'warning', 'info'];

const VITALS_FIELDS = [
  { key: 'heartRate',   label: 'Heart Rate',   unit: 'bpm',   placeholder: '72',  min: 20,  max: 300 },
  { key: 'systolic',    label: 'Systolic BP',  unit: 'mmHg',  placeholder: '120', min: 40,  max: 300 },
  { key: 'diastolic',   label: 'Diastolic BP', unit: 'mmHg',  placeholder: '80',  min: 20,  max: 200 },
  { key: 'temperature', label: 'Temperature',  unit: '°C',    placeholder: '37.0',min: 30,  max: 45  },
  { key: 'oxygenSat',   label: 'SpO₂',         unit: '%',     placeholder: '98',  min: 50,  max: 100 },
];

const INITIAL_FORM = {
  name: '', age: '', gender: '', status: 'stable',
  room: '', bed: '', admittingDiagnosis: '',
};

const EMPTY_VITALS = {
  heartRate: '', systolic: '', diastolic: '', temperature: '', oxygenSat: '',
};

export function NewPatientModal({ isOpen, onClose, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM);
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [medications, setMedications] = useState(['']);
  const [alerts, setAlerts] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const nameRef = useRef(null);
  const overlayRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setVitals(EMPTY_VITALS);
      setMedications(['']);
      setAlerts([]);
      setErrors({});
      setServerError('');
      setSaving(false);
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [isOpen]);

  // Escape + focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const modal = overlayRef.current?.querySelector('.np-modal');
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
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ─── Handlers ───
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { if (!prev[field]) return prev; const n = { ...prev }; delete n[field]; return n; });
    setServerError('');
  }, []);

  const handleVitalChange = useCallback((field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Medications
  const addMedication    = useCallback(() => setMedications((p) => [...p, '']), []);
  const updateMedication = useCallback((i, v) => setMedications((p) => { const n=[...p]; n[i]=v; return n; }), []);
  const removeMedication = useCallback((i) => setMedications((p) => p.filter((_, x) => x !== i)), []);

  // Alerts
  const addAlert    = useCallback(() => setAlerts((p) => [...p, { message: '', severity: 'warning' }]), []);
  const updateAlert = useCallback((i, f, v) => setAlerts((p) => { const n=[...p]; n[i]={...n[i],[f]:v}; return n; }), []);
  const removeAlert = useCallback((i) => setAlerts((p) => p.filter((_, x) => x !== i)), []);

  // ─── Validation ───
  const validate = useCallback(() => {
    const errs = {};
    const trimmed = form.name.trim();
    if (!trimmed) errs.name = t('widgets.newPatientModal.nameRequired');
    else if (trimmed.length < 2) errs.name = t('widgets.newPatientModal.nameMinLength');

    const age = Number(form.age);
    if (form.age === '' || form.age === null || form.age === undefined)
      errs.age = t('widgets.newPatientModal.ageRequired');
    else if (isNaN(age) || !Number.isInteger(age) || age < 0 || age > 150)
      errs.age = t('widgets.newPatientModal.ageInvalid');

    if (!form.gender) errs.gender = t('widgets.newPatientModal.genderRequired');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, t]);

  // ─── Submit ───
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    try {
      const payload = {
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        status: form.status || 'stable',
      };
      if (form.room.trim()) payload.room = form.room.trim();
      if (form.bed.trim())  payload.bed  = form.bed.trim();
      if (form.admittingDiagnosis.trim()) payload.admittingDiagnosis = form.admittingDiagnosis.trim();

      const vitalsPayload = {};
      VITALS_FIELDS.forEach(({ key }) => {
        const v = vitals[key];
        if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) {
          vitalsPayload[key] = { value: Number(v) };
        }
      });
      if (Object.keys(vitalsPayload).length > 0) payload.vitals = vitalsPayload;

      const meds = medications.map((m) => m.trim()).filter(Boolean);
      if (meds.length > 0) payload.medications = meds;

      const validAlerts = alerts.filter((a) => a.message.trim());
      if (validAlerts.length > 0)
        payload.alerts = validAlerts.map((a) => ({ message: a.message.trim(), severity: a.severity }));

      await onSave(payload);
      onClose();
    } catch (err) {
      setServerError(err.message || t('widgets.newPatientModal.failedToCreate'));
    } finally {
      setSaving(false);
    }
  }, [form, vitals, medications, alerts, validate, onSave, onClose, t]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="np-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="np-title"
    >
      <div className="np-modal">
        {/* ── Header ── */}
        <div className="np-header">
          <div className="np-header-icon">🏥</div>
          <div className="np-header-text">
            <h2 id="np-title" className="np-title">
              {t('widgets.newPatientModal.title') || 'New Patient Intake'}
            </h2>
            <p className="np-subtitle">Fill in the patient details below — required fields are marked *</p>
          </div>
          <button className="np-close" onClick={onClose} aria-label="Close" type="button">✕</button>
        </div>

        {/* ── Scrollable Form ── */}
        <form id="np-form" className="np-body" onSubmit={handleSubmit} noValidate>
          <div className="np-form-content">

            {/* Server error */}
            {serverError && (
              <div className="np-server-error" role="alert">
                ⚠ {serverError}
              </div>
            )}

            {/* ══ 1. Patient Identity ══ */}
            <section className="np-section" aria-labelledby="np-sec-demo">
              <div className="np-section-hd">
                <div className="np-section-badge demo">👤</div>
                <span className="np-section-label" id="np-sec-demo">Patient Identity</span>
              </div>

              <div className="np-grid">
                {/* Full Name */}
                <div className="np-field np-field-span">
                  <label htmlFor="np-name" className="np-label">
                    Full Name <span className="np-required">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="np-name"
                    type="text"
                    className={`np-input${errors.name ? ' np-input-error' : ''}`}
                    placeholder="e.g. Sarah Johnson"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    maxLength={120}
                    autoComplete="off"
                  />
                  {errors.name && <span className="np-error-msg">⚠ {errors.name}</span>}
                </div>

                {/* Age */}
                <div className="np-field">
                  <label htmlFor="np-age" className="np-label">
                    Age <span className="np-required">*</span>
                  </label>
                  <input
                    id="np-age"
                    type="number"
                    className={`np-input${errors.age ? ' np-input-error' : ''}`}
                    placeholder="45"
                    value={form.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    min={0}
                    max={150}
                  />
                  {errors.age && <span className="np-error-msg">⚠ {errors.age}</span>}
                </div>

                {/* Gender */}
                <div className="np-field">
                  <label htmlFor="np-gender" className="np-label">
                    Gender <span className="np-required">*</span>
                  </label>
                  <select
                    id="np-gender"
                    className={`np-select${errors.gender ? ' np-input-error' : ''}`}
                    value={form.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.gender && <span className="np-error-msg">⚠ {errors.gender}</span>}
                </div>

                {/* Room */}
                <div className="np-field">
                  <label htmlFor="np-room" className="np-label">Room</label>
                  <input
                    id="np-room" type="text" className="np-input"
                    placeholder="e.g. 312"
                    value={form.room}
                    onChange={(e) => handleChange('room', e.target.value)}
                    maxLength={20}
                  />
                </div>

                {/* Bed */}
                <div className="np-field">
                  <label htmlFor="np-bed" className="np-label">Bed</label>
                  <input
                    id="np-bed" type="text" className="np-input"
                    placeholder="e.g. A"
                    value={form.bed}
                    onChange={(e) => handleChange('bed', e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>
            </section>

            {/* ══ 2. Clinical Status ══ */}
            <section className="np-section" aria-labelledby="np-sec-clin">
              <div className="np-section-hd">
                <div className="np-section-badge clin">📋</div>
                <span className="np-section-label" id="np-sec-clin">Clinical Status</span>
              </div>

              {/* Acuity chips */}
              <div>
                <p className="np-label" style={{ marginBottom: '10px' }}>Acuity Level</p>
                <div className="np-status-grid">
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`np-status-chip${form.status === value ? ' active' : ''}`}
                      data-status={value}
                      onClick={() => handleChange('status', value)}
                    >
                      <span className="sc-dot" />
                      <span className="sc-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Admitting Diagnosis */}
              <div className="np-field">
                <label htmlFor="np-diagnosis" className="np-label">Admitting Diagnosis</label>
                <textarea
                  id="np-diagnosis"
                  className="np-textarea"
                  rows={2}
                  placeholder="e.g. Acute Myocardial Infarction with cardiogenic shock"
                  value={form.admittingDiagnosis}
                  onChange={(e) => handleChange('admittingDiagnosis', e.target.value)}
                  maxLength={400}
                />
              </div>
            </section>

            {/* ══ 3. Vital Signs ══ */}
            <section className="np-section" aria-labelledby="np-sec-vital">
              <div className="np-section-hd">
                <div className="np-section-badge vital">💓</div>
                <span className="np-section-label" id="np-sec-vital">Vital Signs</span>
                <span className="np-section-opt">Optional</span>
              </div>

              <div className="np-vitals-grid">
                {VITALS_FIELDS.map(({ key, label, unit, placeholder, min, max }) => (
                  <div className="np-vital-field" key={key}>
                    <label className="np-vital-label">
                      {label} <span className="np-vital-unit">{unit}</span>
                    </label>
                    <input
                      type="number"
                      className="np-input"
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

            {/* ══ 4. Medications ══ */}
            <section className="np-section" aria-labelledby="np-sec-meds">
              <div className="np-section-hd">
                <div className="np-section-badge meds">💊</div>
                <span className="np-section-label" id="np-sec-meds">Current Medications</span>
                <span className="np-section-opt">Optional</span>
              </div>

              <div className="np-list-rows">
                {medications.map((med, i) => (
                  <div className="np-list-row" key={i}>
                    <input
                      type="text"
                      className="np-input"
                      placeholder={`Medication ${i + 1} — e.g. Aspirin 81mg`}
                      value={med}
                      onChange={(e) => updateMedication(i, e.target.value)}
                    />
                    {medications.length > 1 && (
                      <button
                        type="button"
                        className="np-remove-btn"
                        onClick={() => removeMedication(i)}
                        aria-label={`Remove medication ${i + 1}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="np-add-btn" onClick={addMedication}>
                + Add Medication
              </button>
            </section>

            {/* ══ 5. Alerts ══ */}
            <section className="np-section" aria-labelledby="np-sec-alrt">
              <div className="np-section-hd">
                <div className="np-section-badge alrt">🔔</div>
                <span className="np-section-label" id="np-sec-alrt">Clinical Alerts</span>
                <span className="np-section-opt">Optional</span>
              </div>

              {alerts.length > 0 && (
                <div className="np-list-rows">
                  {alerts.map((alert, i) => (
                    <div className="np-alert-row" key={i}>
                      <input
                        type="text"
                        className="np-input"
                        placeholder="Alert message — e.g. Allergy: Penicillin"
                        value={alert.message}
                        onChange={(e) => updateAlert(i, 'message', e.target.value)}
                      />
                      <select
                        className="np-select np-severity-select"
                        value={alert.severity}
                        onChange={(e) => updateAlert(i, 'severity', e.target.value)}
                      >
                        {ALERT_SEVERITIES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="np-remove-btn"
                        onClick={() => removeAlert(i)}
                        aria-label={`Remove alert ${i + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="np-add-btn" onClick={addAlert}>
                + Add Alert
              </button>
            </section>

          </div>
        </form>

        {/* ── Sticky Footer ── */}
        <div className="np-footer">
          <p className="np-footer-hint">Fields marked <span>*</span> are required</p>
          <div className="np-footer-actions">
            <button type="button" className="np-btn np-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="np-form" className="np-btn np-btn-save" disabled={saving}>
              {saving ? 'Saving…' : '✓ Save Patient'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewPatientModal;
