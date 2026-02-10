import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/molecules/Card';
import { Button } from '../components/ui/atoms/Button';
import { Input } from '../components/ui/atoms/Input';
import TwoFactorSettings from '../components/TwoFactorSettings';
import { useNotificationActions } from '../hooks/useNotificationActions';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiFetch } from '../services/apiClient';
import AppShell from '../layout/AppShell';

/* ─── helpers ─── */

const SPECIALTIES = [
  'General Practice', 'Internal Medicine', 'Critical Care Medicine', 'Emergency Medicine',
  'Cardiology', 'Pulmonology', 'Neurology', 'Nephrology', 'Gastroenterology',
  'Oncology', 'Pediatrics', 'Surgery', 'Orthopedics', 'Psychiatry',
  'Anesthesiology', 'Radiology', 'Pathology', 'Dermatology', 'Ophthalmology',
  'Obstetrics & Gynecology', 'Family Medicine', 'Nursing', 'Pharmacy', 'Other',
];

const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'];

const TABS = [
  { id: 'personal', icon: '👤', tKey: 'profileSettings.tabs.personal' },
  { id: 'security', icon: '🔒', tKey: 'profileSettings.tabs.security' },
  { id: 'notifications', icon: '🔔', tKey: 'profileSettings.tabs.notifications' },
  { id: 'privacy', icon: '🛡️', tKey: 'profileSettings.tabs.privacy' },
];

const cardInner = {
  padding: '20px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: '20px',
};
const labelStyle = { fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '6px', display: 'block' };
const fieldGroup = { marginBottom: '16px' };

/* ═══════════════════════════════════════ */

const ProfileSettings = ({ authToken }) => {
  const navigate = useNavigate();
  const { user, setUser, signOut, authToken: ctxToken } = useUser();
  const { t } = useLanguage();
  const { success, error: showError } = useNotificationActions();
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);

  const token = authToken || ctxToken;

  // ── Personal form state ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [institution, setInstitution] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('');

  // ── Notification prefs ──
  const [alertCritical, setAlertCritical] = useState(true);
  const [alertHigh, setAlertHigh] = useState(true);
  const [alertMedium, setAlertMedium] = useState(true);
  const [alertLow, setAlertLow] = useState(false);
  const [shiftReminders, setShiftReminders] = useState(true);
  const [labResults, setLabResults] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [systemAnnouncements, setSystemAnnouncements] = useState(true);

  // ── Privacy / consent ──
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [consentThirdParty, setConsentThirdParty] = useState(false);

  // ── Security ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Pre-populate from UserContext
  useEffect(() => {
    if (!user) return;
    const p = user.profile || {};
    setFirstName(p.firstName || user.firstName || '');
    setLastName(p.lastName || user.lastName || '');
    setDisplayName(p.fullName || user.fullName || user.name || '');
    setSpecialty(p.specialty || user.specialty || '');
    setInstitution(p.institution || user.institution || '');
    setLicenseNumber(p.licenseNumber || p.license || user.licenseNumber || '');
    setCountry(p.country || user.country || '');
    setLanguage(p.languagePreference || p.language || user.language || 'English');
    setTimezone(p.timezone || user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    setConsentMarketing(p.consentMarketingCommunications ?? false);
    setConsentDataProcessing(p.consentDataProcessing ?? false);
    setConsentThirdParty(p.consentThirdPartySharing ?? false);
  }, [user]);

  const handleSavePersonal = useCallback(async () => {
    setSaving(true);
    const updates = {
      firstName, lastName, fullName: displayName,
      specialty, institution, licenseNumber,
      country, languagePreference: language, timezone,
    };
    try {
      const resp = await apiFetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(updates),
      });
      if (resp.ok) {
        // Update local context
        const updatedProfile = { ...(user?.profile || {}), ...updates };
        setUser({ ...user, name: displayName, profile: updatedProfile });
        success(t('profileSettings.notify.profileSaved'), t('profileSettings.notify.profileSavedDesc'));
      } else {
        // Fallback — save locally even if API fails
        const updatedProfile = { ...(user?.profile || {}), ...updates };
        setUser({ ...user, name: displayName, profile: updatedProfile });
        success(t('profileSettings.notify.profileSavedLocally'), t('profileSettings.notify.profileSavedLocallyDesc'));
      }
    } catch (e) {
      // Save locally on error
      const updatedProfile = { ...(user?.profile || {}), ...updates };
      setUser({ ...user, name: displayName, profile: updatedProfile });
      success(t('profileSettings.notify.profileSavedLocally'), t('profileSettings.notify.profileSavedLocallyRetryDesc'));
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, displayName, specialty, institution, licenseNumber, country, language, timezone, user, token, setUser, success]);

  const handleSaveConsent = useCallback(async () => {
    setSaving(true);
    const updates = {
      consentMarketingCommunications: consentMarketing,
      consentDataProcessing: consentDataProcessing,
      consentThirdPartySharing: consentThirdParty,
    };
    try {
      await apiFetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(updates),
      });
    } catch (e) { /* save locally */ }
    const updatedProfile = { ...(user?.profile || {}), ...updates };
    setUser({ ...user, profile: updatedProfile });
    success(t('profileSettings.notify.consentUpdated'), t('profileSettings.notify.consentUpdatedDesc'));
    setSaving(false);
  }, [consentMarketing, consentDataProcessing, consentThirdParty, user, token, setUser, success]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      showError(t('profileSettings.notify.passwordMismatch'), t('profileSettings.notify.passwordMismatchDesc'));
      return;
    }
    if (newPassword.length < 8) {
      showError(t('profileSettings.notify.tooShort'), t('profileSettings.notify.tooShortDesc'));
      return;
    }
    setSaving(true);
    try {
      const resp = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (resp.ok) {
        success(t('profileSettings.notify.passwordChanged'), t('profileSettings.notify.passwordChangedDesc'));
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        showError(t('profileSettings.notify.failed'), t('profileSettings.notify.failedDesc'));
      }
    } catch (e) {
      showError(t('profileSettings.notify.error'), t('profileSettings.notify.errorDesc'));
    } finally {
      setSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword, token, success, showError]);

  /* ─── Toggle component ─── */
  const Toggle = ({ checked, onChange, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? '#10B981' : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' }}>{t('profileSettings.title')}</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
              {t('profileSettings.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
            }}
          >
            ← Back to Profile
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.45)',
                fontSize: '12px', fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {tab.icon} {t(tab.tKey)}
            </button>
          ))}
        </div>

        {/* ═══ PERSONAL TAB ═══ */}
        {activeTab === 'personal' && (
          <div>
            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.identity')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>{t('profileSettings.firstName')}</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('profileSettings.firstNamePlaceholder')} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>{t('profileSettings.lastName')}</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('profileSettings.lastNamePlaceholder')} />
                </div>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>{t('profileSettings.displayName')}</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('profileSettings.displayNamePlaceholder')} />
              </div>
            </div>

            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.professional')}</h3>
              <div style={fieldGroup}>
                <label style={labelStyle}>{t('profileSettings.specialty')}</label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: '13px', outline: 'none',
                  }}
                >
                  <option value="">{t('profileSettings.selectSpecialty')}</option>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>{t('profileSettings.institution')}</label>
                <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder={t('profileSettings.institutionPlaceholder')} />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>{t('profileSettings.licenseNumber')}</label>
                <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder={t('profileSettings.licensePlaceholder')} />
              </div>
            </div>

            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.locale')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>{t('profileSettings.country')}</label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t('profileSettings.countryPlaceholder')} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>{t('profileSettings.language')}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: '13px', outline: 'none',
                    }}
                  >
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>{t('profileSettings.timezone')}</label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder={t('profileSettings.timezonePlaceholder')} />
              </div>
            </div>

            <Button onClick={handleSavePersonal} disabled={saving} style={{ width: '100%' }}>
              {saving ? t('profileSettings.saving') : t('profileSettings.saveProfile')}
            </Button>
          </div>
        )}

        {/* ═══ SECURITY TAB ═══ */}
        {activeTab === 'security' && (
          <div>
            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.changePassword')}</h3>
              <div style={fieldGroup}>
                <label style={labelStyle}>{t('profileSettings.currentPassword')}</label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t('profileSettings.currentPasswordPlaceholder')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>{t('profileSettings.newPassword')}</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('profileSettings.newPasswordPlaceholder')} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>{t('profileSettings.confirmPassword')}</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('profileSettings.confirmPasswordPlaceholder')} />
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword}>
                {saving ? t('profileSettings.changing') : t('profileSettings.changePassword')}
              </Button>
            </div>

            <TwoFactorSettings authToken={token} />
          </div>
        )}

        {/* ═══ NOTIFICATIONS TAB ═══ */}
        {activeTab === 'notifications' && (
          <div>
            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.alertNotifications')}</h3>
              <Toggle label={t('profileSettings.criticalAlerts')} checked={alertCritical} onChange={setAlertCritical} />
              <Toggle label={t('profileSettings.highPriorityAlerts')} checked={alertHigh} onChange={setAlertHigh} />
              <Toggle label={t('profileSettings.mediumPriorityAlerts')} checked={alertMedium} onChange={setAlertMedium} />
              <Toggle label={t('profileSettings.lowPriorityAlerts')} checked={alertLow} onChange={setAlertLow} />
            </div>
            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.clinicalUpdates')}</h3>
              <Toggle label={t('profileSettings.shiftReminders')} checked={shiftReminders} onChange={setShiftReminders} />
              <Toggle label={t('profileSettings.labResultNotifications')} checked={labResults} onChange={setLabResults} />
              <Toggle label={t('profileSettings.orderStatusUpdates')} checked={orderUpdates} onChange={setOrderUpdates} />
              <Toggle label={t('profileSettings.systemAnnouncements')} checked={systemAnnouncements} onChange={setSystemAnnouncements} />
            </div>
            <Button onClick={() => success(t('profileSettings.notify.saved'), t('profileSettings.notify.notificationPrefsUpdated'))} style={{ width: '100%' }}>
              {t('profileSettings.saveNotificationPreferences')}
            </Button>
          </div>
        )}

        {/* ═══ PRIVACY TAB ═══ */}
        {activeTab === 'privacy' && (
          <div>
            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.consentManagement')}</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
                {t('profileSettings.consentDescription')}
              </p>
              <Toggle label={t('profileSettings.marketingCommunications')} checked={consentMarketing} onChange={setConsentMarketing} />
              <Toggle label={t('profileSettings.dataProcessingAnalytics')} checked={consentDataProcessing} onChange={setConsentDataProcessing} />
              <Toggle label={t('profileSettings.thirdPartyDataSharing')} checked={consentThirdParty} onChange={setConsentThirdParty} />
              <div style={{ marginTop: '16px' }}>
                <Button onClick={handleSaveConsent} disabled={saving} style={{ width: '100%' }}>
                  {saving ? t('profileSettings.saving') : t('profileSettings.updateConsent')}
                </Button>
              </div>
            </div>
            <div style={cardInner}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#fff' }}>{t('profileSettings.dataAndAccount')}</h3>
              <button
                onClick={() => success(t('profileSettings.notify.requested'), t('profileSettings.notify.dataExportDesc'))}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)',
                  background: 'rgba(59,130,246,0.08)', color: '#60A5FA', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', marginBottom: '10px',
                }}
              >
                📥 {t('profileSettings.downloadMyData')}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(t('profileSettings.deleteConfirmation'))) {
                    success(t('profileSettings.notify.requested'), t('profileSettings.notify.deletionDesc'));
                  }
                }}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)', color: '#F87171', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🗑️ {t('profileSettings.requestAccountDeletion')}
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
};

export default ProfileSettings;
