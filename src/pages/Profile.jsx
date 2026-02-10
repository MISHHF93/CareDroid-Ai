import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, Permission } from '../contexts/UserContext';
import { useToolPreferences } from '../contexts/ToolPreferencesContext';
import toolRegistry from '../data/toolRegistry';
import AppShell from '../layout/AppShell';
import { colors, alpha, gradients, text, surfaces, borders } from '../config/theme';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';
const T = text; const S = surfaces; const B = borders;

/* ─── helpers ─── */

const ROLE_STYLES = {
  physician: { label: 'Physician', color: colors.primary, bg: alpha.primary(0.15), gradient: gradients.physician },
  nurse:     { label: 'Nurse',     color: colors.success, bg: alpha.success(0.15), gradient: gradients.nurse },
  student:   { label: 'Student',   color: colors.purple,  bg: alpha.purple(0.15),  gradient: gradients.student },
  admin:     { label: 'Admin',     color: colors.warning, bg: alpha.warning(0.15), gradient: gradients.admin },
};

const PERMISSION_GROUPS = [
  { tKey: 'profile.permissions.phiDataAccess', perms: [Permission.READ_PHI, Permission.WRITE_PHI, Permission.EXPORT_PHI, Permission.DELETE_PHI] },
  { tKey: 'profile.permissions.clinicalTools', perms: [Permission.USE_CALCULATORS, Permission.USE_DRUG_CHECKER, Permission.USE_LAB_INTERPRETER, Permission.USE_PROTOCOLS, Permission.USE_AI_CHAT] },
  { tKey: 'profile.permissions.userManagement', perms: [Permission.MANAGE_USERS, Permission.MANAGE_ROLES, Permission.VIEW_USERS] },
  { tKey: 'profile.permissions.auditCompliance', perms: [Permission.VIEW_AUDIT_LOGS, Permission.EXPORT_AUDIT_LOGS, Permission.VERIFY_AUDIT_INTEGRITY] },
  { tKey: 'profile.permissions.systemAdmin', perms: [Permission.CONFIGURE_SYSTEM, Permission.MANAGE_ENCRYPTION, Permission.MANAGE_SUBSCRIPTIONS, Permission.VIEW_ANALYTICS] },
  { tKey: 'profile.permissions.emergencySafety', perms: [Permission.TRIGGER_EMERGENCY_PROTOCOL, Permission.OVERRIDE_SAFETY_CHECKS] },
];

function formatPermission(p) {
  return p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── shared styles ─── */
const cardInner = {
  padding: '20px',
  borderRadius: '12px',
  background: S.layer1,
  border: `1px solid ${B.default}`,
};
const secTitle = {
  margin: '0 0 16px 0',
  fontSize: '13px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  color: T.muted,
};
const fRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: `1px solid ${B.subtle}`,
  fontSize: '13px',
};
const fLabel = { color: T.tertiary, fontWeight: 500 };
const fVal   = { color: T.primary, fontWeight: 600, textAlign: 'right' };

/* ═══════════════════════════════════════ */

const Profile = () => {
  const navigate = useNavigate();
  const { user, hasPermission, signOut } = useUser();
  const { recentTools } = useToolPreferences();
  useAppearance(); // re-render on theme/accent change
  const { t } = useLanguage();

  const role = user?.role || 'student';
  const rs = ROLE_STYLES[role] || ROLE_STYLES.student;
  const profile = user?.profile || {};

  const specialty   = profile.specialty   || user?.specialty   || '—';
  const institution = profile.institution || user?.institution || '—';
  const license     = profile.licenseNumber || profile.license || user?.licenseNumber || null;
  const avatarUrl   = profile.avatarUrl   || user?.avatarUrl   || null;
  const verified    = profile.verified    ?? user?.verified    ?? false;
  const trustScore  = profile.trustScore  ?? user?.trustScore  ?? 0;
  const timezone    = profile.timezone    || user?.timezone    || Intl.DateTimeFormat().resolvedOptions().timeZone || '—';
  const language    = profile.languagePreference || profile.language || user?.language || 'English';
  const country     = profile.country     || user?.country     || '—';
  const memberSince = user?.createdAt     || profile.createdAt || null;
  const email       = user?.email         || '—';
  const emailVerified = user?.isEmailVerified ?? user?.emailVerified ?? false;
  const twoFA       = user?.twoFactorEnabled ?? false;
  const lastLogin   = user?.lastLoginAt   || null;
  const lastLoginIp = user?.lastLoginIp   || null;
  const fullName    = profile.fullName    || user?.fullName    || user?.name || 'Clinician';

  // Top 3 most-used tools
  const topTools = useMemo(() => {
    const counts = {};
    (recentTools || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => {
        const tool = toolRegistry.find((t) => t.id === id);
        return tool ? { ...tool, count } : null;
      })
      .filter(Boolean);
  }, [recentTools]);

  const maskedLicense = license ? '●●●●-' + license.slice(-4) : '—';

  // Profile completeness
  const completenessFields = [
    { label: t('profile.completeness.avatar'), done: !!avatarUrl },
    { label: t('profile.completeness.name'), done: fullName !== 'Clinician' && fullName !== '—' },
    { label: t('profile.completeness.specialty'), done: specialty !== '—' },
    { label: t('profile.completeness.institution'), done: institution !== '—' },
    { label: t('profile.completeness.license'), done: !!license },
    { label: t('profile.completeness.twoFA'), done: twoFA },
    { label: t('profile.completeness.timezone'), done: timezone !== '—' },
  ];
  const completedCount = completenessFields.filter((f) => f.done).length;
  const completenessPercent = Math.round((completedCount / completenessFields.length) * 100);

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
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>

        {/* ═══ PROFILE HEADER ═══ */}
        <div style={{ ...cardInner, display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', padding: '28px' }}>
          {/* Avatar */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : rs.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: avatarUrl ? 0 : '36px', fontWeight: 700, color: T.primary,
            border: `3px solid ${rs.color}50`,
            boxShadow: `0 0 24px ${rs.color}30`,
            flexShrink: 0, position: 'relative',
          }}>
            {!avatarUrl && (fullName.charAt(0).toUpperCase())}
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 14, height: 14, borderRadius: '50%',
              background: colors.success, border: `2px solid ${S.panel}`,
            }} />
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: T.primary }}>{fullName}</h1>
              {verified && (
                <span title={t('profile.verifiedClinician')} style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px',
                  background: alpha.success(0.15), color: colors.success, display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>✅ {t('profile.verified')}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                background: rs.bg, color: rs.color,
              }}>{t('profile.role.' + role)}</span>
              {specialty !== '—' && (
                <span style={{ fontSize: '13px', color: T.secondary }}>· {specialty}</span>
              )}
            </div>
            {institution !== '—' && (
              <div style={{ fontSize: '13px', color: T.tertiary, marginTop: '4px' }}>🏥 {institution}</div>
            )}
            {trustScore > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: T.muted, fontWeight: 600 }}>{t('profile.trustScore')}</span>
                <div style={{ flex: 1, maxWidth: '160px', height: '6px', borderRadius: '3px', background: B.medium }}>
                  <div style={{ width: `${trustScore}%`, height: '100%', borderRadius: '3px', background: rs.color, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '11px', color: rs.color, fontWeight: 700 }}>{trustScore}/100</span>
              </div>
            )}
          </div>

          {/* Completeness Ring + Edit Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* SVG ring */}
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke={B.default} strokeWidth="5" />
                <circle
                  cx="36" cy="36" r="30" fill="none"
                  stroke={completenessPercent === 100 ? colors.success : rs.color}
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - completenessPercent / 100)}`}
                  transform="rotate(-90 36 36)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <span style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: 700, color: completenessPercent === 100 ? colors.success : rs.color,
              }}>
                {completenessPercent}%
              </span>
            </div>
            <span style={{ fontSize: '11px', color: T.muted, fontWeight: 600 }}>{t('profile.profileComplete')}</span>

            <button
              onClick={() => navigate('/profile/settings')}
              style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                background: rs.bg, color: rs.color, border: `1px solid ${rs.color}40`,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              ✏️ {t('profile.editProfile')}
            </button>
          </div>
        </div>

        {/* Completeness nudge banner */}
        {completenessPercent < 100 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
            borderRadius: '10px', marginBottom: '20px',
            background: `linear-gradient(135deg, ${rs.color}12, ${rs.color}06)`,
            border: `1px solid ${rs.color}25`,
          }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: rs.color }}>
                {t('profile.completeYourProfile')} ({completedCount}/{completenessFields.length})
              </span>
              <span style={{ fontSize: '12px', color: T.muted, marginLeft: '8px' }}>
                {t('profile.missing')}: {completenessFields.filter((f) => !f.done).map((f) => f.label).join(', ')}
              </span>
            </div>
            <button
              onClick={() => navigate('/profile/settings')}
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                background: rs.color, color: S.panel, border: 'none', cursor: 'pointer',
              }}
            >
              {t('profile.completeNow')}
            </button>
          </div>
        )}

        {/* ═══ TWO-COLUMN CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Professional Details */}
          <div style={cardInner}>
            <h3 style={secTitle}>{t('profile.professionalDetails')}</h3>
            <div style={fRow}><span style={fLabel}>{t('profile.license')}</span><span style={fVal}>{maskedLicense}</span></div>
            <div style={fRow}><span style={fLabel}>{t('profile.specialty')}</span><span style={fVal}>{specialty}</span></div>
            <div style={fRow}><span style={fLabel}>{t('profile.institution')}</span><span style={fVal}>{institution}</span></div>
            <div style={fRow}><span style={fLabel}>{t('profile.country')}</span><span style={fVal}>{country}</span></div>
            <div style={fRow}><span style={fLabel}>{t('profile.timezone')}</span><span style={fVal}>{timezone}</span></div>
            <div style={{ ...fRow, borderBottom: 'none' }}><span style={fLabel}>{t('profile.language')}</span><span style={fVal}>{language}</span></div>
            {memberSince && (
              <div style={{ fontSize: '11px', color: T.ghost, marginTop: '8px' }}>
                {t('profile.memberSince')} {new Date(memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Account & Security */}
          <div style={cardInner}>
            <h3 style={secTitle}>{t('profile.accountSecurity')}</h3>
            <div style={fRow}>
              <span style={fLabel}>{t('profile.email')}</span>
              <span style={{ ...fVal, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {email}
                {emailVerified
                  ? <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: alpha.success(0.15), color: colors.success, fontWeight: 700 }}>✓ {t('profile.verified')}</span>
                  : <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '999px', background: alpha.warning(0.15), color: colors.warning, fontWeight: 700 }}>{t('profile.unverified')}</span>
                }
              </span>
            </div>
            <div style={fRow}>
              <span style={fLabel}>{t('profile.twoFactorAuth')}</span>
              <span style={fVal}>
                {twoFA
                  ? <span style={{ color: colors.success }}>✅ {t('profile.enabled')}</span>
                  : <span style={{ color: colors.warning }}>⚠️ {t('profile.notConfigured')}</span>
                }
              </span>
            </div>
            <div style={fRow}>
              <span style={fLabel}>{t('profile.lastLogin')}</span>
              <span style={fVal}>{lastLogin ? new Date(lastLogin).toLocaleString() : '—'}</span>
            </div>
            {lastLoginIp && (
              <div style={fRow}>
                <span style={fLabel}>{t('profile.lastIP')}</span>
                <span style={fVal}>{lastLoginIp}</span>
              </div>
            )}
            <div style={{ ...fRow, borderBottom: 'none' }}>
              <span style={fLabel}>{t('profile.password')}</span>
              <button
                onClick={() => navigate('/profile/settings')}
                style={{
                  fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '6px',
                  background: alpha.primary(0.15), color: colors.primaryLight, border: 'none', cursor: 'pointer',
                }}
              >
                {t('profile.changePassword')}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ SECOND ROW ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Activity Summary */}
          <div style={cardInner}>
            <h3 style={secTitle}>{t('profile.activitySummary')}</h3>
            {topTools.length > 0 ? (
              <>
                <div style={{ fontSize: '12px', color: T.muted, marginBottom: '12px', fontWeight: 600 }}>🔧 {t('profile.topToolsUsed')}</div>
                {topTools.map((tool) => (
                  <div key={tool.id} style={fRow}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: T.secondary }}>
                      <span style={{ fontSize: '18px' }}>{tool.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{tool.name}</span>
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: rs.color }}>{tool.count}×</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize: '13px', color: T.muted, padding: '12px 0' }}>
                {t('profile.noToolUsage')}
              </div>
            )}
            <button
              onClick={() => navigate('/audit-logs')}
              style={{
                marginTop: '14px', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '6px',
                background: 'transparent', color: T.tertiary, border: `1px solid ${B.medium}`,
                cursor: 'pointer', width: '100%', textAlign: 'center',
              }}
            >
              📜 {t('profile.viewAuditLog')}
            </button>
          </div>

          {/* Permissions & Access */}
          <div style={cardInner}>
            <h3 style={secTitle}>{t('profile.permissionsAccess')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.title}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: T.ghost, marginBottom: '6px' }}>{t(group.tKey)}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {group.perms.map((perm) => {
                      const has = hasPermission(perm);
                      return (
                        <span key={perm} style={{
                          fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                          background: has ? alpha.success(0.12) : alpha.error(0.08),
                          color: has ? colors.success : alpha.error(0.5),
                          whiteSpace: 'nowrap',
                        }}>
                          {has ? '✓' : '✗'} {formatPermission(perm)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Profile;
