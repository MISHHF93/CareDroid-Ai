import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import AppShell from '../layout/AppShell';
import { VitalsInput, buildVitalsPayload } from '../components/clinical/VitalsInput';
import dashboardService from '../services/dashboardService';
import '../components/dashboard/NewPatientModal.css';
import './NewPatientPage.css';
import { useLanguage } from '../contexts/LanguageContext';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const STATUS_OPTIONS = [
  { value: 'stable', label: 'Stable' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];
const ALERT_SEVERITIES = ['critical', 'high', 'warning', 'info'];

const EMPTY_FORM = {
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
 * NewPatientPage — Full patient intake form.
 * Sections: Demographics, Clinical Status, Vitals, Medications, Alerts.
 * Accessible via /patients/new or "Open Full Form" from NewPatientModal.
 */
function NewPatientPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useUser();
  const { t } = useLanguage();

  // Pre-fill from modal if navigated via "Open Full Form"
  const prefill = location.state?.prefill;

  const [form, setForm] = useState(() => (prefill ? { ...EMPTY_FORM, ...prefill } : EMPTY_FORM));
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [medications, setMedications] = useState(['']);
  const [alerts, setAlerts] = useState([]);
  const [errors, setErrors] = useState({});
  const [vitalsErrors, setVitalsErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    demographics: true,
    clinical: true,
    vitals: false,
    medications: false,
    alerts: false,
  });

  // Clear location state after reading prefill (avoid stale data on refresh)
  useEffect(() => {
    if (prefill) {
      window.history.replaceState({}, document.title);
    }
  }, [prefill]);

  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

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
    setVitalsErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  // ─── Medications ───
  const addMedication = useCallback(() => {
    setMedications((prev) => [...prev, '']);
  }, []);

  const updateMedication = useCallback((index, value) => {
    setMedications((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const removeMedication = useCallback((index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Alerts ───
  const addAlert = useCallback(() => {
    setAlerts((prev) => [...prev, { message: '', severity: 'warning' }]);
  }, []);

  const updateAlert = useCallback((index, field, value) => {
    setAlerts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const removeAlert = useCallback((index) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Validation ───
  const validate = useCallback(() => {
    const errs = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) errs.name = t('newPatient.nameRequired');
    else if (trimmedName.length < 2) errs.name = t('newPatient.nameMinLength');

    const age = Number(form.age);
    if (form.age === '' || form.age === null || form.age === undefined) {
      errs.age = t('newPatient.ageRequired');
    } else if (isNaN(age) || !Number.isInteger(age) || age < 0 || age > 150) {
      errs.age = t('newPatient.ageInvalid');
    }

    if (!form.gender) errs.gender = t('newPatient.genderRequired');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // ─── Submit ───
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) {
      // Ensure demographics section is open to show errors
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
      if (validAlerts.length > 0) payload.alerts = validAlerts.map((a) => ({ message: a.message.trim(), severity: a.severity }));

      await dashboardService.createPatient(payload);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || t('newPatient.createFailed'));
    } finally {
      setSaving(false);
    }
  }, [form, vitals, medications, alerts, validate, navigate]);

  // ─── Section Header helper ───
  const SectionHeader = ({ id, title, icon, expanded }) => (
    <button
      type="button"
      className="npp-section-header"
      onClick={() => toggleSection(id)}
      aria-expanded={expanded}
      aria-controls={`npp-section-${id}`}
    >
      <span className="npp-section-icon">{icon}</span>
      <span className="npp-section-title">{title}</span>
      <span className={`npp-chevron ${expanded ? 'npp-chevron-open' : ''}`}>▾</span>
    </button>
  );

  return (
    <AppShell
      isAuthed={true}
      conversations={[]}
      activeConversation={null}
      onSelectConversation={() => {}}
      onNewConversation={() => {}}
      onSignOut={signOut}
      healthStatus="online"
    >
      <div className="npp-container">
        {/* Page Header */}
        <div className="npp-page-header">
          <div className="npp-page-header-left">
            <button
              type="button"
              className="npp-back-btn"
              onClick={() => navigate('/dashboard')}
              aria-label={t('newPatient.backToDashboard')}
            >
              ← {t('newPatient.back')}
            </button>
            <h1 className="npp-page-title">{t('newPatient.title')}</h1>
          </div>
          <p className="npp-page-subtitle">
            {t('newPatient.subtitle')}
          </p>
        </div>

        <form className="npp-form" onSubmit={handleSubmit} noValidate>
          {/* Server error */}
          {serverError && (
            <div className="np-server-error" role="alert">{serverError}</div>
          )}

          {/* ═══════ Demographics ═══════ */}
          <section className="npp-section">
            <SectionHeader id="demographics" title={t('newPatient.demographics')} icon="👤" expanded={expandedSections.demographics} />
            {expandedSections.demographics && (
              <div className="npp-section-body" id="npp-section-demographics">
                <div className="npp-field npp-field-full">
                  <label htmlFor="npp-name" className="np-label">{t('newPatient.fullName')} <span className="np-required">*</span></label>
                  <input
                    id="npp-name"
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

                <div className="npp-row-2">
                  <div className="npp-field">
                    <label htmlFor="npp-age" className="np-label">{t('newPatient.age')} <span className="np-required">*</span></label>
                    <input
                      id="npp-age"
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
                  <div className="npp-field">
                    <label htmlFor="npp-gender" className="np-label">{t('newPatient.gender')} <span className="np-required">*</span></label>
                    <select
                      id="npp-gender"
                      className={`np-select ${errors.gender ? 'np-input-error' : ''}`}
                      value={form.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                    >
                      <option value="">{t('newPatient.selectPlaceholder')}</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {errors.gender && <span className="np-error-msg">{errors.gender}</span>}
                  </div>
                </div>

                <div className="npp-row-3">
                  <div className="npp-field">
                    <label htmlFor="npp-room" className="np-label">{t('newPatient.room')}</label>
                    <input id="npp-room" type="text" className="np-input" placeholder="312" value={form.room} onChange={(e) => handleChange('room', e.target.value)} maxLength={20} />
                  </div>
                  <div className="npp-field">
                    <label htmlFor="npp-bed" className="np-label">{t('newPatient.bed')}</label>
                    <input id="npp-bed" type="text" className="np-input" placeholder="A" value={form.bed} onChange={(e) => handleChange('bed', e.target.value)} maxLength={20} />
                  </div>
                  <div className="npp-field" />
                </div>
              </div>
            )}
          </section>

          {/* ═══════ Clinical Status ═══════ */}
          <section className="npp-section">
            <SectionHeader id="clinical" title={t('newPatient.clinicalStatus')} icon="📋" expanded={expandedSections.clinical} />
            {expandedSections.clinical && (
              <div className="npp-section-body" id="npp-section-clinical">
                <div className="npp-field">
                  <label htmlFor="npp-status" className="np-label">{t('newPatient.acuityStatus')}</label>
                  <select id="npp-status" className="np-select" value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="npp-field npp-field-full">
                  <label htmlFor="npp-diag" className="np-label">{t('newPatient.admittingDiagnosis')}</label>
                  <textarea
                    id="npp-diag"
                    className="np-textarea"
                    rows={3}
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
          <section className="npp-section">
            <SectionHeader id="vitals" title={t('newPatient.vitalSigns')} icon="💓" expanded={expandedSections.vitals} />
            {expandedSections.vitals && (
              <div className="npp-section-body" id="npp-section-vitals">
                <VitalsInput vitals={vitals} onChange={handleVitalChange} errors={vitalsErrors} />
              </div>
            )}
          </section>

          {/* ═══════ Medications ═══════ */}
          <section className="npp-section">
            <SectionHeader id="medications" title={t('newPatient.medications')} icon="💊" expanded={expandedSections.medications} />
            {expandedSections.medications && (
              <div className="npp-section-body" id="npp-section-medications">
                {medications.map((med, i) => (
                  <div className="npp-list-row" key={i}>
                    <input
                      type="text"
                      className="np-input"
                      placeholder={`Medication ${i + 1}`}
                      value={med}
                      onChange={(e) => updateMedication(i, e.target.value)}
                    />
                    <button
                      type="button"
                      className="npp-remove-btn"
                      onClick={() => removeMedication(i)}
                      aria-label={`Remove medication ${i + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="npp-add-btn" onClick={addMedication}>
                  {t('newPatient.addMedication')}
                </button>
              </div>
            )}
          </section>

          {/* ═══════ Alerts ═══════ */}
          <section className="npp-section">
            <SectionHeader id="alerts" title={t('newPatient.alerts')} icon="🔔" expanded={expandedSections.alerts} />
            {expandedSections.alerts && (
              <div className="npp-section-body" id="npp-section-alerts">
                {alerts.map((alert, i) => (
                  <div className="npp-alert-row" key={i}>
                    <input
                      type="text"
                      className="np-input"
                      placeholder="Alert message"
                      value={alert.message}
                      onChange={(e) => updateAlert(i, 'message', e.target.value)}
                    />
                    <select
                      className="np-select npp-severity-select"
                      value={alert.severity}
                      onChange={(e) => updateAlert(i, 'severity', e.target.value)}
                    >
                      {ALERT_SEVERITIES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="npp-remove-btn"
                      onClick={() => removeAlert(i)}
                      aria-label={`Remove alert ${i + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="npp-add-btn" onClick={addAlert}>
                  {t('newPatient.addAlert')}
                </button>
              </div>
            )}
          </section>

          {/* ═══════ Form Actions ═══════ */}
          <div className="npp-actions">
            <button
              type="button"
              className="np-btn np-btn-cancel"
              onClick={() => navigate('/dashboard')}
              disabled={saving}
            >
              {t('newPatient.cancel')}
            </button>
            <button
              type="submit"
              className="np-btn np-btn-save"
              disabled={saving}
            >
              {saving ? t('newPatient.saving') : t('newPatient.savePatient')}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default NewPatientPage;
