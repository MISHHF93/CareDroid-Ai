import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VitalsInput, buildVitalsPayload } from '../clinical/VitalsInput';
import { useLanguage } from '../../contexts/LanguageContext';
import './EmergencyModal.css';

const SEVERITY_OPTIONS = [
  { value: 'critical', labelKey: 'severityCritical', icon: '🔴' },
  { value: 'urgent', labelKey: 'severityUrgent', icon: '🟠' },
  { value: 'moderate', labelKey: 'severityModerate', icon: '🟡' },
];

const EMERGENCY_TYPES = [
  { value: 'cardiac', labelKey: 'typeCardiac' },
  { value: 'respiratory', labelKey: 'typeRespiratory' },
  { value: 'stroke', labelKey: 'typeStroke' },
  { value: 'trauma', labelKey: 'typeTrauma' },
  { value: 'sepsis', labelKey: 'typeSepsis' },
  { value: 'anaphylaxis', labelKey: 'typeAnaphylaxis' },
  { value: 'seizure', labelKey: 'typeSeizure' },
  { value: 'overdose', labelKey: 'typeOverdose' },
  { value: 'other', labelKey: 'typeOther' },
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
  heartRate: '',
  systolic: '',
  diastolic: '',
  temperature: '',
  oxygenSat: '',
};

/**
 * EmergencyModal
 * Full emergency intake popup on the Dashboard — mirrors the NewPatientModal pattern.
 *
 * Collapsible sections:
 *  1. Patient Identification
 *  2. Emergency Classification
 *  3. Vital Signs
 *  4. Immediate Actions
 *  5. Clinical Notes & Documentation
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - patients: Array<{ id, name, room }> — existing patients for quick-select
 */
export function EmergencyModal({ isOpen, onClose, patients = [] }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(INITIAL_FORM);
  const [vitals, setVitals] = useState(EMPTY_VITALS);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [actionsTaken, setActionsTaken] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    patient: true,
    classification: true,
    vitals: false,
    actions: true,
    notes: false,
  });
  const overlayRef = useRef(null);
  const patientRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setVitals(EMPTY_VITALS);
      setErrors({});
      setSubmitting(false);
      setSubmitted(false);
      setActionsTaken([]);
      setSelectedPatientId('');
      setExpandedSections({
        patient: true,
        classification: true,
        vitals: false,
        actions: true,
        notes: false,
      });
      requestAnimationFrame(() => patientRef.current?.focus());
    }
  }, [isOpen]);

  // Escape key + focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const modal = overlayRef.current?.querySelector('.em-modal');
        if (!modal) return;
        const focusable = modal.querySelectorAll(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ─── Handlers ───
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) { const next = { ...prev }; delete next[field]; return next; }
      return prev;
    });
  }, []);

  const handleVitalChange = useCallback((field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handlePatientSelect = useCallback((e) => {
    const id = e.target.value;
    setSelectedPatientId(id);
    if (id && patients.length) {
      const patient = patients.find((p) => String(p.id) === String(id));
      if (patient) {
        setForm((prev) => ({
          ...prev,
          patientName: patient.name || '',
          patientRoom: patient.room || '',
        }));
      }
    }
  }, [patients]);

  // ─── Emergency Actions ───
  const logAction = useCallback((action) => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setActionsTaken((prev) => [...prev, { action, timestamp }]);
  }, []);

  const handleCall911 = useCallback(() => {
    logAction('Called 911 — Emergency services dispatched');
    if (window.navigator.userAgent.match(/iPhone|Android/i)) {
      window.location.href = 'tel:911';
    }
  }, [logAction]);

  const handleEscalateMD = useCallback(() => {
    logAction('Escalated to Attending Physician');
  }, [logAction]);

  const handleActivateCode = useCallback(() => {
    const codeType = form.emergencyType === 'cardiac' ? 'Code Blue'
      : form.emergencyType === 'stroke' ? 'Code Stroke'
      : form.emergencyType === 'trauma' ? 'Code Trauma'
      : 'Rapid Response';
    logAction(`${codeType} activated — Team paged`);
    handleChange('codeActivated', true);
  }, [form.emergencyType, logAction, handleChange]);

  const handlePageRRT = useCallback(() => {
    logAction('Rapid Response Team paged');
  }, [logAction]);

  // ─── Validation ───
  const validate = useCallback(() => {
    const errs = {};
    if (!form.patientName.trim()) errs.patientName = t('widgets.emergencyModal.patientNameRequired');
    if (!form.emergencyType) errs.emergencyType = t('widgets.emergencyModal.selectEmergencyType');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // ─── Submit / Close & Document ───
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) {
      setExpandedSections((prev) => ({ ...prev, patient: true, classification: true }));
      return;
    }
    setSubmitting(true);

    // Build payload (could be sent to a backend endpoint in the future)
    const payload = {
      patientName: form.patientName.trim(),
      patientRoom: form.patientRoom.trim(),
      severity: form.severity,
      emergencyType: form.emergencyType,
      chiefComplaint: form.chiefComplaint.trim(),
      clinicalNotes: form.clinicalNotes.trim(),
      codeActivated: form.codeActivated,
      actionsTaken,
      timestamp: new Date().toISOString(),
    };

    const vitalsPayload = buildVitalsPayload(vitals);
    if (vitalsPayload) payload.vitals = vitalsPayload;

    // Simulate backend save (audit log)
    await new Promise((r) => setTimeout(r, 400));
    console.info('[EmergencyModal] Documented emergency:', payload);

    setSubmitting(false);
    setSubmitted(true);
  }, [form, vitals, actionsTaken, validate]);

  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  // ─── Section Header helper ───
  const SectionHeader = ({ id, title, icon, expanded }) => (
    <button
      type="button"
      className="em-section-header"
      onClick={() => toggleSection(id)}
      aria-expanded={expanded}
      aria-controls={`em-section-${id}`}
    >
      <span className="em-section-icon">{icon}</span>
      <span className="em-section-title">{title}</span>
      <span className={`em-chevron ${expanded ? 'em-chevron-open' : ''}`}>▾</span>
    </button>
  );

  if (!isOpen) return null;

  // ─── Post-submit confirmation ───
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
        <div className="em-modal em-modal-full">
          <div className="em-header em-header-critical">
            <h2 id="em-title" className="em-title">🚨 {t('widgets.emergencyModal.documented')}</h2>
            <button className="em-close" onClick={handleDone} aria-label="Close" type="button">✕</button>
          </div>
          <div className="em-confirmation">
            <div className="em-conf-icon">✓</div>
            <h3 className="em-conf-heading">{t('widgets.emergencyModal.recordSaved')}</h3>
            <p className="em-conf-patient">{form.patientName} — {t('widgets.emergencyModal.room')} {form.patientRoom || 'N/A'}</p>
            <p className="em-conf-type">
              {EMERGENCY_TYPES.find((et) => et.value === form.emergencyType) ? t('widgets.emergencyModal.' + EMERGENCY_TYPES.find((et) => et.value === form.emergencyType).labelKey) : form.emergencyType}
              {' '}({form.severity.toUpperCase()})
            </p>
            {actionsTaken.length > 0 && (
              <div className="em-conf-actions">
                <h4>{t('widgets.emergencyModal.actionsTaken')}</h4>
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
            <button type="button" className="em-btn em-btn-done" onClick={handleDone}>{t('widgets.emergencyModal.done')}</button>
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
      <div className="em-modal em-modal-full">
        {/* Header */}
        <div className="em-header em-header-critical">
          <h2 id="em-title" className="em-title">🚨 {t('widgets.emergencyModal.title')}</h2>
          <button className="em-close" onClick={onClose} aria-label="Close" type="button">✕</button>
        </div>

        {/* Form */}
        <form className="em-body" onSubmit={handleSubmit} noValidate>

          {/* ═══════ Patient Identification ═══════ */}
          <section className="em-section">
            <SectionHeader id="patient" title={t('widgets.emergencyModal.patientIdentification')} icon="🏥" expanded={expandedSections.patient} />
            {expandedSections.patient && (
              <div className="em-section-body" id="em-section-patient">
                {patients.length > 0 && (
                  <div className="em-field em-field-full">
                    <label htmlFor="em-patient-select" className="em-label">{t('widgets.emergencyModal.quickSelectPatient')}</label>
                    <select
                      id="em-patient-select"
                      className="em-select"
                      value={selectedPatientId}
                      onChange={handlePatientSelect}
                      ref={patientRef}
                    >
                      <option value="">— {t('widgets.emergencyModal.selectExistingPatient')} —</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.room ? ` (Room ${p.room})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="em-row">
                  <div className="em-field">
                    <label htmlFor="em-patient-name" className="em-label">
                      {t('widgets.emergencyModal.patientName')} <span className="em-required">*</span>
                    </label>
                    <input
                      id="em-patient-name"
                      type="text"
                      className={`em-input ${errors.patientName ? 'em-input-error' : ''}`}
                      placeholder="e.g. John Doe"
                      value={form.patientName}
                      onChange={(e) => handleChange('patientName', e.target.value)}
                      ref={patients.length === 0 ? patientRef : undefined}
                      maxLength={120}
                      autoComplete="off"
                    />
                    {errors.patientName && <span className="em-error-msg">{errors.patientName}</span>}
                  </div>
                  <div className="em-field">
                    <label htmlFor="em-patient-room" className="em-label">{t('widgets.emergencyModal.roomLocation')}</label>
                    <input
                      id="em-patient-room"
                      type="text"
                      className="em-input"
                      placeholder="ICU-4A"
                      value={form.patientRoom}
                      onChange={(e) => handleChange('patientRoom', e.target.value)}
                      maxLength={40}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ═══════ Emergency Classification ═══════ */}
          <section className="em-section em-section-emergency">
            <SectionHeader id="classification" title={t('widgets.emergencyModal.emergencyClassification')} icon="⚠️" expanded={expandedSections.classification} />
            {expandedSections.classification && (
              <div className="em-section-body" id="em-section-classification">
                {/* Severity */}
                <div className="em-field em-field-full">
                  <label className="em-label">{t('widgets.emergencyModal.severityLevel')} <span className="em-required">*</span></label>
                  <div className="em-severity-grid">
                    {SEVERITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`em-severity-btn em-severity-${opt.value} ${form.severity === opt.value ? 'em-severity-active' : ''}`}
                        onClick={() => handleChange('severity', opt.value)}
                      >
                        <span className="em-severity-icon">{opt.icon}</span>
                        <span className="em-severity-label">{t('widgets.emergencyModal.' + opt.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Type */}
                <div className="em-field em-field-full">
                  <label htmlFor="em-type" className="em-label">
                    {t('widgets.emergencyModal.emergencyType')} <span className="em-required">*</span>
                  </label>
                  <select
                    id="em-type"
                    className={`em-select ${errors.emergencyType ? 'em-input-error' : ''}`}
                    value={form.emergencyType}
                    onChange={(e) => handleChange('emergencyType', e.target.value)}
                  >
                    <option value="">{t('widgets.emergencyModal.selectEmergencyTypePlaceholder')}</option>
                    {EMERGENCY_TYPES.map((et) => (
                      <option key={et.value} value={et.value}>{t('widgets.emergencyModal.' + et.labelKey)}</option>
                    ))}
                  </select>
                  {errors.emergencyType && <span className="em-error-msg">{errors.emergencyType}</span>}
                </div>

                {/* Chief Complaint */}
                <div className="em-field em-field-full">
                  <label htmlFor="em-complaint" className="em-label">{t('widgets.emergencyModal.chiefComplaint')}</label>
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
              </div>
            )}
          </section>

          {/* ═══════ Vital Signs ═══════ */}
          <section className="em-section">
            <SectionHeader id="vitals" title={t('widgets.emergencyModal.vitalSigns')} icon="💓" expanded={expandedSections.vitals} />
            {expandedSections.vitals && (
              <div className="em-section-body" id="em-section-vitals">
                <VitalsInput vitals={vitals} onChange={handleVitalChange} errors={{}} />
              </div>
            )}
          </section>

          {/* ═══════ Immediate Actions ═══════ */}
          <section className="em-section em-section-actions">
            <SectionHeader id="actions" title={t('widgets.emergencyModal.immediateActions')} icon="🚑" expanded={expandedSections.actions} />
            {expandedSections.actions && (
              <div className="em-section-body" id="em-section-actions">
                <div className="em-action-grid">
                  <button
                    type="button"
                    className="em-action-btn em-action-911"
                    onClick={handleCall911}
                  >
                    <span className="em-action-icon">📞</span>
                    <span className="em-action-text">
                      <span className="em-action-main">{t('widgets.emergencyModal.call911')}</span>
                      <span className="em-action-sub">{t('widgets.emergencyModal.dispatchEmergency')}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="em-action-btn em-action-md"
                    onClick={handleEscalateMD}
                  >
                    <span className="em-action-icon">👨‍⚕️</span>
                    <span className="em-action-text">
                      <span className="em-action-main">{t('widgets.emergencyModal.escalateToMD')}</span>
                      <span className="em-action-sub">{t('widgets.emergencyModal.notifyAttending')}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`em-action-btn em-action-code ${form.codeActivated ? 'em-action-activated' : ''}`}
                    onClick={handleActivateCode}
                    disabled={form.codeActivated}
                  >
                    <span className="em-action-icon">🔔</span>
                    <span className="em-action-text">
                      <span className="em-action-main">{form.codeActivated ? t('widgets.emergencyModal.codeActivated') : t('widgets.emergencyModal.activateCode')}</span>
                      <span className="em-action-sub">
                        {form.codeActivated ? t('widgets.emergencyModal.teamPaged') : t('widgets.emergencyModal.pageCodeTeam')}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="em-action-btn em-action-rrt"
                    onClick={handlePageRRT}
                  >
                    <span className="em-action-icon">🏃</span>
                    <span className="em-action-text">
                      <span className="em-action-main">{t('widgets.emergencyModal.pageRRT')}</span>
                      <span className="em-action-sub">{t('widgets.emergencyModal.rapidResponseTeam')}</span>
                    </span>
                  </button>
                </div>

                {/* Action log */}
                {actionsTaken.length > 0 && (
                  <div className="em-action-log">
                    <h4 className="em-action-log-title">{t('widgets.emergencyModal.actionLog')}</h4>
                    {actionsTaken.map((a, i) => (
                      <div key={i} className="em-action-log-entry">
                        <span className="em-action-log-time">{a.timestamp}</span>
                        <span className="em-action-log-text">{a.action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ═══════ Clinical Notes ═══════ */}
          <section className="em-section">
            <SectionHeader id="notes" title={t('widgets.emergencyModal.clinicalNotesDoc')} icon="📝" expanded={expandedSections.notes} />
            {expandedSections.notes && (
              <div className="em-section-body" id="em-section-notes">
                <div className="em-field em-field-full">
                  <label htmlFor="em-notes" className="em-label">{t('widgets.emergencyModal.clinicalNotes')}</label>
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
              </div>
            )}
          </section>

          {/* ═══════ Footer ═══════ */}
          <div className="em-footer">
            <div className="em-disclaimer">
              ⚠️ <strong>{t('widgets.emergencyModal.medicalDisclaimer')}:</strong> {t('widgets.emergencyModal.disclaimerText')}
            </div>
            <div className="em-footer-actions">
              <button
                type="button"
                className="em-btn em-btn-cancel"
                onClick={onClose}
                disabled={submitting}
              >
                {t('widgets.emergencyModal.cancel')}
              </button>
              <button
                type="submit"
                className="em-btn em-btn-submit"
                disabled={submitting}
              >
                {submitting ? t('widgets.emergencyModal.documenting') : t('widgets.emergencyModal.documentAndClose')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmergencyModal;
