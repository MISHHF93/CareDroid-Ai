import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VitalsInput, buildVitalsPayload } from '../clinical/VitalsInput';
import { useLanguage } from '../../contexts/LanguageContext';
import './NewPatientModal.css';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const STATUS_OPTIONS = [
  { value: 'stable', label: 'Stable' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];
const ALERT_SEVERITIES = ['critical', 'high', 'warning', 'info'];

const INITIAL_FORM = {
  name: '',
  age: '',
  gender: '',
  status: 'stable',
  room: '',
  bed: '',
  admittingDiagnosis: '',
};

const EMPTY_VITALS = {
  heartRate: '',
  systolic: '',
  diastolic: '',
  temperature: '',
  oxygenSat: '',
};

/**
 * NewPatientModal
 * Full patient intake form in an overlay on the Dashboard.
 * Sections: Demographics, Clinical Status, Vitals, Medications, Alerts.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onSave: (data) => Promise<Object>  (createPatient from useDashboard)
 */
export function NewPatientModal({ isOpen, onClose, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM);
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [medications, setMedications] = useState(['']);
  const [alerts, setAlerts] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    demographics: true,
    clinical: true,
    vitals: false,
    medications: false,
    alerts: false,
  });
  const nameRef = useRef(null);
  const overlayRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setVitals(EMPTY_VITALS);
      setMedications(['']);
      setAlerts([]);
      setErrors({});
      setServerError('');
      setSaving(false);
      setExpandedSections({
        demographics: true,
        clinical: true,
        vitals: false,
        medications: false,
        alerts: false,
      });
      requestAnimationFrame(() => nameRef.current?.focus());
    }
  }, [isOpen]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const modal = overlayRef.current?.querySelector('.np-modal');
        if (!modal) return;
        const focusable = modal.querySelectorAll(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ─── Handlers ───
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
    setServerError('');
  }, []);

  const handleVitalChange = useCallback((field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // ─── Medications ───
  const addMedication = useCallback(() => {
    setMedications((prev) => [...prev, '']);
  }, []);
  const updateMedication = useCallback((index, value) => {
    setMedications((prev) => { const next = [...prev]; next[index] = value; return next; });
  }, []);
  const removeMedication = useCallback((index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Alerts ───
  const addAlert = useCallback(() => {
    setAlerts((prev) => [...prev, { message: '', severity: 'warning' }]);
  }, []);
  const updateAlert = useCallback((index, field, value) => {
    setAlerts((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next; });
  }, []);
  const removeAlert = useCallback((index) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Validation ───
  const validate = useCallback(() => {
    const errs = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      errs.name = t('widgets.newPatientModal.nameRequired');
    } else if (trimmedName.length < 2) {
      errs.name = t('widgets.newPatientModal.nameMinLength');
    }

    const age = Number(form.age);
    if (form.age === '' || form.age === null || form.age === undefined) {
      errs.age = t('widgets.newPatientModal.ageRequired');
    } else if (isNaN(age) || !Number.isInteger(age) || age < 0 || age > 150) {
      errs.age = t('widgets.newPatientModal.ageInvalid');
    }

    if (!form.gender) {
      errs.gender = t('widgets.newPatientModal.genderRequired');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // ─── Submit ───
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) {
      setExpandedSections((prev) => ({ ...prev, demographics: true }));
      return;
    }

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
      if (form.bed.trim()) payload.bed = form.bed.trim();
      if (form.admittingDiagnosis.trim()) payload.admittingDiagnosis = form.admittingDiagnosis.trim();

      // Vitals
      const vitalsPayload = buildVitalsPayload(vitals);
      if (vitalsPayload) payload.vitals = vitalsPayload;

      // Medications (filter blanks)
      const meds = medications.map((m) => m.trim()).filter(Boolean);
      if (meds.length > 0) payload.medications = meds;

      // Alerts (filter blanks)
      const validAlerts = alerts.filter((a) => a.message.trim());
      if (validAlerts.length > 0) {
        payload.alerts = validAlerts.map((a) => ({
          message: a.message.trim(),
          severity: a.severity,
        }));
      }

      await onSave(payload);
      onClose();
    } catch (err) {
      setServerError(err.message || t('widgets.newPatientModal.failedToCreate'));
    } finally {
      setSaving(false);
    }
  }, [form, vitals, medications, alerts, validate, onSave, onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }, [onClose]);

  // ─── Section Header helper ───
  const SectionHeader = ({ id, title, icon, expanded }) => (
    <button
      type="button"
      className="np-section-header"
      onClick={() => toggleSection(id)}
      aria-expanded={expanded}
      aria-controls={`np-section-${id}`}
    >
      <span className="np-section-icon">{icon}</span>
      <span className="np-section-title">{title}</span>
      <span className={`np-chevron ${expanded ? 'np-chevron-open' : ''}`}>▾</span>
    </button>
  );

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
      <div className="np-modal np-modal-full">
        {/* Header */}
        <div className="np-header">
          <h2 id="np-title" className="np-title">{t('widgets.newPatientModal.title')}</h2>
          <button
            className="np-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form className="np-body" onSubmit={handleSubmit} noValidate>
          {/* Server error banner */}
          {serverError && (
            <div className="np-server-error" role="alert">
              {serverError}
            </div>
          )}

          {/* ═══════ Demographics ═══════ */}
          <section className="np-section">
            <SectionHeader id="demographics" title={t('widgets.newPatientModal.demographics')} icon="👤" expanded={expandedSections.demographics} />
            {expandedSections.demographics && (
              <div className="np-section-body" id="np-section-demographics">
                {/* Name */}
                <div className="np-field np-field-full">
                  <label htmlFor="np-name" className="np-label">
                    {t('widgets.newPatientModal.fullName')} <span className="np-required">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="np-name"
                    type="text"
                    className={`np-input ${errors.name ? 'np-input-error' : ''}`}
                    placeholder="e.g. Sarah Johnson"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    maxLength={120}
                    autoComplete="off"
                  />
                  {errors.name && <span className="np-error-msg">{errors.name}</span>}
                </div>

                {/* Age + Gender row */}
                <div className="np-row">
                  <div className="np-field">
                    <label htmlFor="np-age" className="np-label">
                      {t('widgets.newPatientModal.age')} <span className="np-required">*</span>
                    </label>
                    <input
                      id="np-age"
                      type="number"
                      className={`np-input ${errors.age ? 'np-input-error' : ''}`}
                      placeholder="45"
                      value={form.age}
                      onChange={(e) => handleChange('age', e.target.value)}
                      min={0}
                      max={150}
                    />
                    {errors.age && <span className="np-error-msg">{errors.age}</span>}
                  </div>
                  <div className="np-field">
                    <label htmlFor="np-gender" className="np-label">
                      {t('widgets.newPatientModal.gender')} <span className="np-required">*</span>
                    </label>
                    <select
                      id="np-gender"
                      className={`np-select ${errors.gender ? 'np-input-error' : ''}`}
                      value={form.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                    >
                      <option value="">{t('widgets.newPatientModal.selectPlaceholder')}</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {errors.gender && <span className="np-error-msg">{errors.gender}</span>}
                  </div>
                </div>

                {/* Room + Bed row */}
                <div className="np-row">
                  <div className="np-field">
                    <label htmlFor="np-room" className="np-label">{t('widgets.newPatientModal.room')}</label>
                    <input
                      id="np-room"
                      type="text"
                      className="np-input"
                      placeholder="312"
                      value={form.room}
                      onChange={(e) => handleChange('room', e.target.value)}
                      maxLength={20}
                    />
                  </div>
                  <div className="np-field">
                    <label htmlFor="np-bed" className="np-label">{t('widgets.newPatientModal.bed')}</label>
                    <input
                      id="np-bed"
                      type="text"
                      className="np-input"
                      placeholder="A"
                      value={form.bed}
                      onChange={(e) => handleChange('bed', e.target.value)}
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ═══════ Clinical Status ═══════ */}
          <section className="np-section">
            <SectionHeader id="clinical" title={t('widgets.newPatientModal.clinicalStatus')} icon="📋" expanded={expandedSections.clinical} />
            {expandedSections.clinical && (
              <div className="np-section-body" id="np-section-clinical">
                <div className="np-field">
                  <label htmlFor="np-status" className="np-label">{t('widgets.newPatientModal.acuityStatus')}</label>
                  <select
                    id="np-status"
                    className="np-select"
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="np-field np-field-full">
                  <label htmlFor="np-diagnosis" className="np-label">{t('widgets.newPatientModal.admittingDiagnosis')}</label>
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
              </div>
            )}
          </section>

          {/* ═══════ Vitals ═══════ */}
          <section className="np-section">
            <SectionHeader id="vitals" title={t('widgets.newPatientModal.vitalSigns')} icon="💓" expanded={expandedSections.vitals} />
            {expandedSections.vitals && (
              <div className="np-section-body" id="np-section-vitals">
                <VitalsInput vitals={vitals} onChange={handleVitalChange} errors={{}} />
              </div>
            )}
          </section>

          {/* ═══════ Medications ═══════ */}
          <section className="np-section">
            <SectionHeader id="medications" title={t('widgets.newPatientModal.medications')} icon="💊" expanded={expandedSections.medications} />
            {expandedSections.medications && (
              <div className="np-section-body" id="np-section-medications">
                {medications.map((med, i) => (
                  <div className="np-list-row" key={i}>
                    <input
                      type="text"
                      className="np-input"
                      placeholder={`Medication ${i + 1}`}
                      value={med}
                      onChange={(e) => updateMedication(i, e.target.value)}
                    />
                    <button
                      type="button"
                      className="np-remove-btn"
                      onClick={() => removeMedication(i)}
                      aria-label={`Remove medication ${i + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="np-add-btn" onClick={addMedication}>
                  + {t('widgets.newPatientModal.addMedication')}
                </button>
              </div>
            )}
          </section>

          {/* ═══════ Alerts ═══════ */}
          <section className="np-section">
            <SectionHeader id="alerts" title={t('widgets.newPatientModal.alerts')} icon="🔔" expanded={expandedSections.alerts} />
            {expandedSections.alerts && (
              <div className="np-section-body" id="np-section-alerts">
                {alerts.map((alert, i) => (
                  <div className="np-alert-row" key={i}>
                    <input
                      type="text"
                      className="np-input"
                      placeholder={t('widgets.newPatientModal.alertMessage')}
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
                <button type="button" className="np-add-btn" onClick={addAlert}>
                  + {t('widgets.newPatientModal.addAlert')}
                </button>
              </div>
            )}
          </section>

          {/* ═══════ Form Actions ═══════ */}
          <div className="np-footer">
            <div className="np-footer-actions">
              <button
                type="button"
                className="np-btn np-btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                {t('widgets.newPatientModal.cancel')}
              </button>
              <button
                type="submit"
                className="np-btn np-btn-save"
                disabled={saving}
              >
                {saving ? t('widgets.newPatientModal.saving') : t('widgets.newPatientModal.savePatient')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPatientModal;
