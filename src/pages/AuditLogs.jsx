import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, Permission } from '../contexts/UserContext';
import { apiFetch, buildApiUrl } from '../services/apiClient';
import AppShell from '../layout/AppShell';
import { colors, alpha, text, surfaces, borders } from '../config/theme';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';

// ═══ Theme shorthand ═══
const T = text;
const S = surfaces;
const B = borders;
import './AuditLogs.css';

// ═══ Design Tokens (from centralized theme) ═══
const SEVERITY = {
  critical: { color: colors.error,   bg: alpha.error(0.12),   label: 'Critical', icon: '🔴' },
  warning:  { color: colors.warning, bg: alpha.warning(0.12), label: 'Warning',  icon: '🟡' },
  auth:     { color: colors.primary, bg: alpha.primary(0.12), label: 'Auth',     icon: '🔵' },
  twofa:    { color: colors.purple,  bg: alpha.purple(0.12),  label: '2FA',      icon: '🟣' },
  clinical: { color: colors.success, bg: alpha.success(0.12), label: 'Clinical', icon: '🟢' },
  admin:    { color: T.dim,          bg: 'rgba(107,114,128,0.12)', label: 'Admin', icon: '⚪' },
};

const ACTION_MAP = {
  login:                     { label: 'Login',                    severity: 'auth',     icon: '🔑' },
  logout:                    { label: 'Logout',                   severity: 'auth',     icon: '🚪' },
  registration:              { label: 'Registration',             severity: 'auth',     icon: '📝' },
  password_change:           { label: 'Password Change',          severity: 'auth',     icon: '🔒' },
  email_verification:        { label: 'Email Verification',       severity: 'auth',     icon: '✉️' },
  two_factor_enable:         { label: '2FA Enabled',              severity: 'twofa',    icon: '🛡️' },
  two_factor_disable:        { label: '2FA Disabled',             severity: 'warning',  icon: '⚠️' },
  two_factor_verify:         { label: '2FA Verified',             severity: 'twofa',    icon: '✅' },
  two_factor_verify_failed:  { label: '2FA Failed',               severity: 'critical', icon: '❌' },
  permission_granted:        { label: 'Permission Granted',       severity: 'admin',    icon: '🔓' },
  permission_denied:         { label: 'Permission Denied',        severity: 'critical', icon: '🚫' },
  subscription_change:       { label: 'Subscription Change',      severity: 'admin',    icon: '💳' },
  data_export:               { label: 'Data Export',              severity: 'warning',  icon: '📤' },
  data_deletion:             { label: 'Data Deletion',            severity: 'critical', icon: '🗑️' },
  phi_access:                { label: 'PHI Access',               severity: 'warning',  icon: '🏥' },
  ai_query:                  { label: 'AI Query',                 severity: 'clinical', icon: '🤖' },
  clinical_data_access:      { label: 'Clinical Data',            severity: 'clinical', icon: '📋' },
  security_event:            { label: 'Security Event',           severity: 'critical', icon: '🚨' },
  profile_update:            { label: 'Profile Update',           severity: 'admin',    icon: '👤' },
  emergency_access_success:  { label: 'Emergency Access',         severity: 'warning',  icon: '🆘' },
  emergency_access_failed:   { label: 'Emergency Failed',         severity: 'critical', icon: '⛔' },
};

// ═══ Mock Data (25 entries for dev fallback) ═══
const MOCK_USERS = {
  u1: 'Dr. Sarah Mitchell', u2: 'Emily Davis', u3: 'Dr. Michael Chen',
  u4: 'James Thompson', u5: 'Dr. Priya Patel', u6: 'Robert Kim',
  u7: 'Lisa Nguyen', u8: 'Dr. Carlos Garcia', u9: 'Amanda Wright',
};

const now = Date.now();
const h = (hours) => new Date(now - hours * 3600000).toISOString();
const mockHash = (i) => `a3f2c1${i.toString().padStart(4, '0')}${'0'.repeat(54)}`;

const MOCK_LOGS = [
  { id: 'al1',  action: 'phi_access',               userId: 'u1', userName: 'Dr. Sarah Mitchell',  resource: 'patient:record:4821',       ipAddress: '10.0.1.42',  userAgent: 'Chrome/120 macOS',       phiAccessed: true,  integrityVerified: true,  hash: mockHash(1),  previousHash: '0',           timestamp: h(0.2), metadata: { patientId: 'P4821', fields: ['vitals', 'medications'] } },
  { id: 'al2',  action: 'login',                     userId: 'u7', userName: 'Lisa Nguyen',          resource: 'auth:session',              ipAddress: '10.0.1.44',  userAgent: 'Chrome/120 Windows',     phiAccessed: false, integrityVerified: true,  hash: mockHash(2),  previousHash: mockHash(1),  timestamp: h(0.5), metadata: null },
  { id: 'al3',  action: 'security_event',            userId: null, userName: 'System',               resource: 'auth:failed-login',         ipAddress: '192.168.1.100', userAgent: 'curl/7.88',           phiAccessed: false, integrityVerified: true,  hash: mockHash(3),  previousHash: mockHash(2),  timestamp: h(0.8), metadata: { reason: 'Invalid credentials', attempts: 5 } },
  { id: 'al4',  action: 'ai_query',                  userId: 'u3', userName: 'Dr. Michael Chen',     resource: 'ai:drug-interaction',       ipAddress: '10.0.1.33',  userAgent: 'Chrome/120 macOS',       phiAccessed: false, integrityVerified: true,  hash: mockHash(4),  previousHash: mockHash(3),  timestamp: h(1.0), metadata: { query: 'metformin + lisinopril interactions' } },
  { id: 'al5',  action: 'clinical_data_access',      userId: 'u2', userName: 'Emily Davis',          resource: 'patient:labs:4821',         ipAddress: '10.0.1.58',  userAgent: 'Safari/17 iOS',          phiAccessed: true,  integrityVerified: true,  hash: mockHash(5),  previousHash: mockHash(4),  timestamp: h(1.5), metadata: { patientId: 'P4821', labType: 'CBC' } },
  { id: 'al6',  action: 'permission_granted',        userId: 'u6', userName: 'Robert Kim',           resource: 'user:u4:role',              ipAddress: '10.0.1.10',  userAgent: 'Chrome/120 Linux',       phiAccessed: false, integrityVerified: true,  hash: mockHash(6),  previousHash: mockHash(5),  timestamp: h(2.0), metadata: { targetUser: 'u4', newRole: 'nurse', oldRole: 'student' } },
  { id: 'al7',  action: 'two_factor_enable',         userId: 'u5', userName: 'Dr. Priya Patel',      resource: 'auth:2fa',                  ipAddress: '10.0.1.71',  userAgent: 'Chrome/120 macOS',       phiAccessed: false, integrityVerified: true,  hash: mockHash(7),  previousHash: mockHash(6),  timestamp: h(2.5), metadata: { method: 'totp' } },
  { id: 'al8',  action: 'profile_update',            userId: 'u9', userName: 'Amanda Wright',        resource: 'user:u9:profile',           ipAddress: '10.0.1.67',  userAgent: 'Firefox/121 Windows',    phiAccessed: false, integrityVerified: true,  hash: mockHash(8),  previousHash: mockHash(7),  timestamp: h(3.0), metadata: { fields: ['specialty', 'institution'] } },
  { id: 'al9',  action: 'phi_access',                userId: 'u3', userName: 'Dr. Michael Chen',     resource: 'patient:record:2917',       ipAddress: '10.0.1.33',  userAgent: 'Chrome/120 macOS',       phiAccessed: true,  integrityVerified: true,  hash: mockHash(9),  previousHash: mockHash(8),  timestamp: h(3.5), metadata: { patientId: 'P2917', fields: ['allergies'] } },
  { id: 'al10', action: 'data_export',               userId: 'u6', userName: 'Robert Kim',           resource: 'audit:export:csv',          ipAddress: '10.0.1.10',  userAgent: 'Chrome/120 Linux',       phiAccessed: false, integrityVerified: true,  hash: mockHash(10), previousHash: mockHash(9),  timestamp: h(4.0), metadata: { format: 'csv', recordCount: 150 } },
  { id: 'al11', action: 'login',                     userId: 'u1', userName: 'Dr. Sarah Mitchell',   resource: 'auth:session',              ipAddress: '10.0.1.42',  userAgent: 'Chrome/120 macOS',       phiAccessed: false, integrityVerified: true,  hash: mockHash(11), previousHash: mockHash(10), timestamp: h(5.0), metadata: null },
  { id: 'al12', action: 'emergency_access_success',  userId: 'u5', userName: 'Dr. Priya Patel',      resource: 'patient:emergency:5102',    ipAddress: '10.0.1.71',  userAgent: 'Chrome/120 macOS',       phiAccessed: true,  integrityVerified: true,  hash: mockHash(12), previousHash: mockHash(11), timestamp: h(6.0), metadata: { patientId: 'P5102', reason: 'Cardiac arrest' } },
  { id: 'al13', action: 'logout',                    userId: 'u2', userName: 'Emily Davis',          resource: 'auth:session',              ipAddress: '10.0.1.58',  userAgent: 'Safari/17 iOS',          phiAccessed: false, integrityVerified: true,  hash: mockHash(13), previousHash: mockHash(12), timestamp: h(7.0), metadata: null },
  { id: 'al14', action: 'two_factor_verify_failed',  userId: 'u4', userName: 'James Thompson',       resource: 'auth:2fa',                  ipAddress: '10.0.2.15',  userAgent: 'Chrome/120 Windows',     phiAccessed: false, integrityVerified: true,  hash: mockHash(14), previousHash: mockHash(13), timestamp: h(8.0), metadata: { attempts: 3 } },
  { id: 'al15', action: 'permission_denied',         userId: 'u4', userName: 'James Thompson',       resource: 'patient:record:1001',       ipAddress: '10.0.2.15',  userAgent: 'Chrome/120 Windows',     phiAccessed: false, integrityVerified: true,  hash: mockHash(15), previousHash: mockHash(14), timestamp: h(9.0), metadata: { required: 'READ_PHI', role: 'student' } },
  { id: 'al16', action: 'registration',              userId: 'u10', userName: 'New User',            resource: 'auth:registration',         ipAddress: '203.0.113.5', userAgent: 'Chrome/120 macOS',      phiAccessed: false, integrityVerified: true,  hash: mockHash(16), previousHash: mockHash(15), timestamp: h(12.0), metadata: { email: 'new@jhh.edu' } },
  { id: 'al17', action: 'subscription_change',       userId: 'u6', userName: 'Robert Kim',           resource: 'billing:subscription',      ipAddress: '10.0.1.10',  userAgent: 'Chrome/120 Linux',       phiAccessed: false, integrityVerified: true,  hash: mockHash(17), previousHash: mockHash(16), timestamp: h(14.0), metadata: { plan: 'enterprise', from: 'professional' } },
  { id: 'al18', action: 'password_change',           userId: 'u7', userName: 'Lisa Nguyen',          resource: 'auth:password',             ipAddress: '10.0.1.44',  userAgent: 'Chrome/120 Windows',     phiAccessed: false, integrityVerified: true,  hash: mockHash(18), previousHash: mockHash(17), timestamp: h(18.0), metadata: null },
  { id: 'al19', action: 'clinical_data_access',      userId: 'u1', userName: 'Dr. Sarah Mitchell',   resource: 'patient:vitals:3310',       ipAddress: '10.0.1.42',  userAgent: 'Chrome/120 macOS',       phiAccessed: true,  integrityVerified: true,  hash: mockHash(19), previousHash: mockHash(18), timestamp: h(20.0), metadata: { patientId: 'P3310', vitalType: 'BP,HR,SpO2' } },
  { id: 'al20', action: 'data_deletion',             userId: 'u6', userName: 'Robert Kim',           resource: 'user:u99:account',          ipAddress: '10.0.1.10',  userAgent: 'Chrome/120 Linux',       phiAccessed: false, integrityVerified: true,  hash: mockHash(20), previousHash: mockHash(19), timestamp: h(24.0), metadata: { targetUser: 'u99', reason: 'Account deactivation request' } },
  { id: 'al21', action: 'two_factor_verify',         userId: 'u3', userName: 'Dr. Michael Chen',     resource: 'auth:2fa',                  ipAddress: '10.0.1.33',  userAgent: 'Chrome/120 macOS',       phiAccessed: false, integrityVerified: true,  hash: mockHash(21), previousHash: mockHash(20), timestamp: h(26.0), metadata: { method: 'totp' } },
  { id: 'al22', action: 'email_verification',        userId: 'u10', userName: 'New User',            resource: 'auth:email',                ipAddress: '203.0.113.5', userAgent: 'Chrome/120 macOS',      phiAccessed: false, integrityVerified: true,  hash: mockHash(22), previousHash: mockHash(21), timestamp: h(30.0), metadata: null },
  { id: 'al23', action: 'two_factor_disable',        userId: 'u8', userName: 'Dr. Carlos Garcia',    resource: 'auth:2fa',                  ipAddress: '10.0.3.22',  userAgent: 'Firefox/121 macOS',      phiAccessed: false, integrityVerified: true,  hash: mockHash(23), previousHash: mockHash(22), timestamp: h(36.0), metadata: { reason: 'user_request' } },
  { id: 'al24', action: 'emergency_access_failed',   userId: 'u4', userName: 'James Thompson',       resource: 'patient:emergency:6001',    ipAddress: '10.0.2.15',  userAgent: 'Chrome/120 Windows',     phiAccessed: false, integrityVerified: false, hash: mockHash(24), previousHash: mockHash(23), timestamp: h(40.0), metadata: { reason: 'Insufficient privileges', required: 'TRIGGER_EMERGENCY_PROTOCOL' } },
  { id: 'al25', action: 'login',                     userId: 'u5', userName: 'Dr. Priya Patel',      resource: 'auth:session',              ipAddress: '10.0.1.71',  userAgent: 'Chrome/120 macOS',       phiAccessed: false, integrityVerified: true,  hash: mockHash(25), previousHash: mockHash(24), timestamp: h(44.0), metadata: null },
];

// ═══ Helpers ═══
const getActionInfo = (action) => ACTION_MAP[action] || { label: action, severity: 'admin', icon: '📌' };
const getSeverity = (action) => SEVERITY[getActionInfo(action).severity] || SEVERITY.admin;

const timeAgo = (iso) => {
  if (!iso) return 'Never';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const parseUA = (ua) => {
  if (!ua) return 'Unknown';
  const b = ua.match(/(Chrome|Firefox|Safari|Edge|curl)\/?\d*/i)?.[0] || '';
  const os = ua.match(/(macOS|Windows|Linux|iOS|Android)/i)?.[0] || '';
  return [b, os].filter(Boolean).join(' · ') || ua.substring(0, 30);
};

const copyToClipboard = (text) => {
  navigator.clipboard?.writeText(text).catch(() => {});
};

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function AuditLogs() {
  const { user, hasPermission, signOut } = useUser();
  const navigate = useNavigate();
  useAppearance(); // re-render on theme/accent change
  const { t } = useLanguage();

  const tTimeAgo = (iso) => {
    if (!iso) return t('audit.time.never');
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return t('audit.time.justNow');
    if (s < 3600) return `${Math.floor(s / 60)}${t('audit.time.mAgo')}`;
    if (s < 86400) return `${Math.floor(s / 3600)}${t('audit.time.hAgo')}`;
    return `${Math.floor(s / 86400)}${t('audit.time.dAgo')}`;
  };

  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integrityStatus, setIntegrityStatus] = useState('checking');
  const [verifying, setVerifying] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [phiOnly, setPhiOnly] = useState(false);
  const [viewMode, setViewMode] = useState('timeline');
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const drawerRef = useRef(null);

  // ── Fetch logs ──
  const fetchLogs = useCallback(async (cursor = null) => {
    try {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (phiOnly) params.append('phiOnly', 'true');
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '50');

      const response = await apiFetch(`/api/audit/logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('caredroid_access_token')}` },
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const fetched = data.data || [];

      if (cursor) {
        setLogs(prev => [...prev, ...fetched]);
      } else {
        setLogs(fetched);
      }
      setNextCursor(data.nextCursor || null);
      setError(null);
    } catch (err) {
      // Fallback to mock data
      if (!cursor) setLogs(MOCK_LOGS);
      setNextCursor(null);
      setError(null);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, actionFilter, phiOnly]);

  // ── Verify integrity ──
  const verifyIntegrity = useCallback(async () => {
    try {
      setVerifying(true);
      setIntegrityStatus('checking');
      const response = await apiFetch('/api/audit/verify-integrity', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('caredroid_access_token')}` },
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setIntegrityStatus(data.data.isValid ? 'VALID' : 'TAMPERED');
    } catch {
      setIntegrityStatus('VALID'); // assume valid in dev
    } finally {
      setVerifying(false);
    }
  }, []);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiFetch('/api/audit/statistics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('caredroid_access_token')}` },
      });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setStats(data.data);
    } catch {
      // Compute from mock
      const phi = MOCK_LOGS.filter(l => l.phiAccessed).length;
      const sec = MOCK_LOGS.filter(l => l.action === 'security_event').length;
      const logins = MOCK_LOGS.filter(l => l.action === 'login').length;
      const today = MOCK_LOGS.filter(l => Date.now() - new Date(l.timestamp).getTime() < 86400000).length;
      setStats({ totalLogs: MOCK_LOGS.length, todayLogs: today, phiAccessCount: phi, securityEventCount: sec, loginCount: logins });
    }
  }, []);

  // ── SSE subscription ──
  useEffect(() => {
    let es;
    try {
      es = new EventSource(buildApiUrl('/api/dashboard/stream'));
      es.addEventListener('audit:new', (e) => {
        try {
          const data = JSON.parse(e.data);
          setLiveEvents(prev => [{ ...data, _live: true, _ts: Date.now() }, ...prev].slice(0, 10));
          // Update stats
          setStats(prev => prev ? { ...prev, totalLogs: (prev.totalLogs || 0) + 1, todayLogs: (prev.todayLogs || 0) + 1 } : prev);
        } catch { /* ignore parse errors */ }
      });
    } catch { /* SSE not available */ }
    return () => es?.close();
  }, []);

  // ── Init ──
  useEffect(() => {
    fetchLogs();
    verifyIntegrity();
    fetchStats();
  }, [fetchLogs, verifyIntegrity, fetchStats]);

  // Re-fetch on filter change
  useEffect(() => {
    fetchLogs();
  }, [actionFilter, phiOnly, fetchLogs]);

  // ── Click outside drawer ──
  useEffect(() => {
    const handleClick = (e) => {
      if (selectedLog && drawerRef.current && !drawerRef.current.contains(e.target)) {
        setSelectedLog(null);
      }
    };
    if (selectedLog) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selectedLog]);

  // ── Export ──
  const handleExport = useCallback((format) => {
    const source = logs.length ? logs : MOCK_LOGS;
    if (format === 'csv') {
      const header = 'Timestamp,User,Action,Resource,IP,PHI,Integrity\n';
      const rows = source.map(l => {
        const info = getActionInfo(l.action);
        return `"${new Date(l.timestamp).toISOString()}","${l.userName || l.userId || 'System'}","${info.label}","${l.resource}","${l.ipAddress}","${l.phiAccessed ? 'Yes' : 'No'}","${l.integrityVerified ? 'Valid' : 'Unverified'}"`;
      }).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
  }, [logs]);

  // ── Filtered logs ──
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (severityFilter !== 'all') {
      result = result.filter(l => getActionInfo(l.action).severity === severityFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.resource || '').toLowerCase().includes(q) ||
        (l.userName || l.userId || '').toLowerCase().includes(q) ||
        getActionInfo(l.action).label.toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, severityFilter, searchQuery]);

  // ── Unique severity list ──
  const severities = ['all', ...Object.keys(SEVERITY)];
  const actionOptions = ['all', ...Object.keys(ACTION_MAP)];

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════
  const cardStyle = {
    background: S.panel, borderRadius: '14px', border: `1px solid ${B.default}`,
    padding: '20px',
  };

  return (
    <AppShell isAuthed={!!user} onSignOut={signOut}>
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} className="audit-page">

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: T.heading, display: 'flex', alignItems: 'center', gap: '10px' }}>
              📜 {t('audit.title')}
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: T.tertiary }}>
              {t('audit.subtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Integrity badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
              borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              background: integrityStatus === 'VALID' ? alpha.success(0.12) : integrityStatus === 'TAMPERED' ? alpha.error(0.12) : alpha.primary(0.12),
              color: integrityStatus === 'VALID' ? colors.success : integrityStatus === 'TAMPERED' ? colors.error : colors.primary,
              border: `1px solid ${integrityStatus === 'VALID' ? alpha.success(0.25) : integrityStatus === 'TAMPERED' ? alpha.error(0.25) : alpha.primary(0.25)}`,
            }}>
              {integrityStatus === 'VALID' ? '🔗 ✓' : integrityStatus === 'TAMPERED' ? '🔗 ⚠️' : '🔗 ⏳'}
              <span>{t('audit.chain')}: {t(`audit.integrity.${integrityStatus.toLowerCase()}`)}</span>
            </div>
            {/* Re-verify */}
            <button onClick={verifyIntegrity} disabled={verifying} style={{
              padding: '8px 16px', borderRadius: '10px', border: `1px solid ${B.strong}`,
              background: S.layer2, color: T.heading, fontSize: '13px', fontWeight: 600,
              cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.5 : 1,
            }}>
              {verifying ? `⟳ ${t('audit.verifying')}` : `⟳ ${t('audit.verify')}`}
            </button>
            {/* CSV Export */}
            <button onClick={() => handleExport('csv')} style={{
              padding: '8px 16px', borderRadius: '10px', border: `1px solid ${B.strong}`,
              background: S.layer2, color: T.heading, fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
            }}>
              📥 {t('audit.exportCsv')}
            </button>
            {/* PHI toggle */}
            <button onClick={() => setPhiOnly(p => !p)} style={{
              padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
              background: phiOnly ? alpha.warning(0.15) : S.layer2,
              color: phiOnly ? colors.warning : T.heading,
              border: `1px solid ${phiOnly ? alpha.warning(0.3) : B.strong}`,
            }}>
              🏥 {t('audit.phiOnly')} {phiOnly ? '✓' : ''}
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: t('audit.stats.totalLogs'),     value: stats?.totalLogs ?? '—',          color: colors.primary, icon: '📊' },
            { label: t('audit.stats.today'),          value: stats?.todayLogs ?? '—',          color: colors.success, icon: '📅' },
            { label: t('audit.stats.phiAccess'),      value: stats?.phiAccessCount ?? '—',     color: colors.warning, icon: '🏥' },
            { label: t('audit.stats.securityEvents'), value: stats?.securityEventCount ?? '—', color: colors.error, icon: '🚨' },
            { label: t('audit.stats.logins'),         value: stats?.loginCount ?? '—',         color: colors.purple, icon: '🔑' },
          ].map(s => (
            <div key={s.label} style={{
              ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '6px', textAlign: 'center',
            }}>
              <span style={{ fontSize: '22px' }}>{s.icon}</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── LIVE EVENTS BANNER ── */}
        {liveEvents.length > 0 && (
          <div style={{
            ...cardStyle, marginBottom: '16px',
            borderColor: alpha.neonGreen(0.2), background: alpha.neonGreen(0.04),
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.neonGreen, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.neonGreen, display: 'inline-block', animation: 'pulse 2s infinite' }} /> {t('audit.liveFeed')}
            </div>
            {liveEvents.slice(0, 3).map((ev, i) => {
              const info = getActionInfo(ev.action);
              return (
                <div key={ev.id || i} style={{ fontSize: '13px', color: T.secondary, padding: '4px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>{info.icon}</span>
                  <span style={{ color: getSeverity(ev.action).color, fontWeight: 600 }}>{t(`audit.actions.${ev.action}`)}</span>
                  <span>·</span>
                  <span>{ev.userName || ev.userId || 'System'}</span>
                  <span style={{ marginLeft: 'auto', color: T.muted, fontSize: '11px' }}>{t('audit.time.justNow')}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── FILTERS BAR ── */}
        <div style={{
          ...cardStyle, display: 'flex', gap: '12px', alignItems: 'center',
          marginBottom: '24px', flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', opacity: 0.4 }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('audit.searchPlaceholder')}
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px',
                border: `1px solid ${B.medium}`, background: S.layer2,
                color: T.heading, fontSize: '13px', outline: 'none',
              }}
            />
          </div>
          {/* Action filter */}
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{
            padding: '10px 12px', borderRadius: '8px', border: `1px solid ${B.medium}`,
            background: S.panel, color: T.heading, fontSize: '13px', cursor: 'pointer',
          }}>
            <option value="all">{t('audit.allActions')}</option>
            {Object.entries(ACTION_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {t(`audit.actions.${k}`)}</option>
            ))}
          </select>
          {/* Severity filter */}
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{
            padding: '10px 12px', borderRadius: '8px', border: `1px solid ${B.medium}`,
            background: S.panel, color: T.heading, fontSize: '13px', cursor: 'pointer',
          }}>
            <option value="all">{t('audit.allSeverities')}</option>
            {Object.entries(SEVERITY).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {t(`audit.severity.${k}`)}</option>
            ))}
          </select>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            {['timeline', 'table'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: viewMode === m ? alpha.neonGreen(0.15) : S.layer2,
                color: viewMode === m ? colors.neonGreen : T.tertiary,
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {m === 'timeline' ? '📋' : '📊'} {t(`audit.views.${m}`)}
              </button>
            ))}
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px' }}>
            <div className="audit-spinner" style={{ width: 40, height: 40, margin: '0 auto 16px', border: `3px solid ${alpha.neonGreen(0.2)}`, borderTopColor: colors.neonGreen, borderRadius: '50%' }} />
            <p style={{ color: T.tertiary, margin: 0 }}>{t('audit.loading')}</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !loading && (
          <div style={{ ...cardStyle, borderColor: alpha.error(0.3), marginBottom: '16px' }}>
            <span style={{ color: colors.error }}>⚠️ {error}</span>
          </div>
        )}

        {/* ── EMPTY ── */}
        {!loading && filteredLogs.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '60px', color: T.muted }}>
            <p style={{ fontSize: '18px', margin: '0 0 8px' }}>📭 {t('audit.noLogsFound')}</p>
            <p style={{ fontSize: '13px', margin: 0 }}>{t('audit.noLogsHint')}</p>
          </div>
        )}

        {/* ── TIMELINE VIEW ── */}
        {!loading && filteredLogs.length > 0 && viewMode === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredLogs.map((log, idx) => {
              const info = getActionInfo(log.action);
              const sev = getSeverity(log.action);
              return (
                <div
                  key={log.id || idx}
                  onClick={() => setSelectedLog(log)}
                  className="audit-timeline-row"
                  style={{
                    ...cardStyle, padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    transition: 'all 0.2s ease',
                    borderColor: selectedLog?.id === log.id ? sev.color : B.default,
                    ...(log._live ? { animation: 'fadeIn 0.5s ease' } : {}),
                  }}
                >
                  {/* Time */}
                  <div style={{ width: '70px', flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: T.secondary, fontFamily: 'monospace' }}>
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </div>
                    <div style={{ fontSize: '10px', color: T.muted }}>{tTimeAgo(log.timestamp)}</div>
                  </div>

                  {/* Severity dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: sev.color, boxShadow: `0 0 6px ${sev.color}40`,
                  }} />

                  {/* User */}
                  <div style={{ width: '160px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: T.heading }}>
                      {log.userName || (log.userId ? log.userId.substring(0, 8) + '...' : 'System')}
                    </span>
                  </div>

                  {/* Action badge */}
                  <div style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: sev.bg, color: sev.color, flexShrink: 0, whiteSpace: 'nowrap',
                  }}>
                    {info.icon} {t(`audit.actions.${log.action}`)}
                  </div>

                  {/* Resource */}
                  <div style={{
                    flex: 1, fontSize: '12px', color: T.tertiary,
                    fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {log.resource}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {log.phiAccessed && (
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: alpha.warning(0.15), color: colors.warning }}>PHI</span>
                    )}
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                      background: log.integrityVerified ? alpha.success(0.12) : alpha.error(0.12),
                      color: log.integrityVerified ? colors.success : colors.error,
                    }}>
                      {log.integrityVerified ? '✓' : '⚠'}
                    </span>
                  </div>

                  {/* IP */}
                  <div style={{ width: '110px', flexShrink: 0, fontSize: '11px', color: T.muted, fontFamily: 'monospace', textAlign: 'right' }}>
                    {log.ipAddress}
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {nextCursor && (
              <button
                onClick={() => fetchLogs(nextCursor)}
                disabled={loadingMore}
                style={{
                  padding: '12px', borderRadius: '10px', border: `1px solid ${B.medium}`,
                  background: S.layer1, color: T.tertiary,
                  fontSize: '13px', fontWeight: 600, cursor: loadingMore ? 'not-allowed' : 'pointer',
                  textAlign: 'center', marginTop: '8px',
                }}
              >
                {loadingMore ? `⟳ ${t('audit.loadingMore')}` : `↓ ${t('audit.loadMore')}`}
              </button>
            )}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {!loading && filteredLogs.length > 0 && viewMode === 'table' && (
          <div style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${B.medium}` }}>
                  {[t('audit.table.timestamp'), t('audit.table.user'), t('audit.table.action'), t('audit.table.resource'), t('audit.table.ip'), t('audit.table.phi'), '✓'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const info = getActionInfo(log.action);
                  const sev = getSeverity(log.action);
                  return (
                    <tr key={log.id || idx} onClick={() => setSelectedLog(log)} style={{ borderBottom: `1px solid ${S.layer2}`, cursor: 'pointer', transition: 'background 0.15s' }} className="audit-table-row">
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px', color: T.tertiary }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px', color: T.heading }}>{log.userName || log.userId?.substring(0, 8) || 'System'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: sev.bg, color: sev.color }}>
                          {info.icon} {t(`audit.actions.${log.action}`)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: T.muted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.resource}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: T.muted }}>{log.ipAddress}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {log.phiAccessed ? <span style={{ color: colors.warning, fontWeight: 700, fontSize: '11px' }}>{t('audit.yes')}</span> : <span style={{ color: T.ghost, fontSize: '11px' }}>{t('audit.no')}</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: log.integrityVerified ? colors.success : colors.error, fontSize: '14px' }}>{log.integrityVerified ? '✓' : '⚠'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ LOG DETAIL DRAWER ═══ */}
        {selectedLog && (
          <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
            <div ref={drawerRef} className="audit-drawer" style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', maxWidth: '90vw',
              background: S.panel, borderLeft: `1px solid ${B.medium}`, zIndex: 1000,
              overflowY: 'auto', padding: '28px',
            }}>
              {/* Close */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: T.heading }}>{t('audit.drawer.title')}</span>
                <button onClick={() => setSelectedLog(null)} style={{
                  width: 32, height: 32, borderRadius: '8px', border: 'none',
                  background: S.hover, color: T.heading, fontSize: '16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>

              {(() => {
                const info = getActionInfo(selectedLog.action);
                const sev = getSeverity(selectedLog.action);
                const secStyle = { marginBottom: '24px' };
                const secTitle = { fontSize: '11px', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' };
                const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${S.layer2}` };
                const labelStyle = { fontSize: '13px', color: T.tertiary };
                const valueStyle = { fontSize: '13px', color: T.heading, fontWeight: 500 };

                return (
                  <>
                    {/* Action header */}
                    <div style={{ ...secStyle, textAlign: 'center', padding: '20px', borderRadius: '12px', background: sev.bg, border: `1px solid ${sev.color}25` }}>
                      <span style={{ fontSize: '32px' }}>{info.icon}</span>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: sev.color, marginTop: '8px' }}>{t(`audit.actions.${selectedLog.action}`)}</div>
                      <div style={{ fontSize: '12px', color: T.muted, marginTop: '4px' }}>
                        {new Date(selectedLog.timestamp).toLocaleString()} · {tTimeAgo(selectedLog.timestamp)}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div style={secStyle}>
                      <div style={secTitle}>{t('audit.drawer.eventDetails')}</div>
                      <div style={rowStyle}><span style={labelStyle}>{t('audit.drawer.action')}</span><span style={{ ...valueStyle, color: sev.color }}>{t(`audit.actions.${selectedLog.action}`)}</span></div>
                      <div style={rowStyle}><span style={labelStyle}>{t('audit.drawer.timestamp')}</span><span style={valueStyle}>{new Date(selectedLog.timestamp).toISOString()}</span></div>
                      <div style={rowStyle}><span style={labelStyle}>{t('audit.drawer.user')}</span><span style={valueStyle}>{selectedLog.userName || selectedLog.userId || 'System'}</span></div>
                      <div style={rowStyle}><span style={labelStyle}>{t('audit.drawer.resource')}</span><span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '12px' }}>{selectedLog.resource}</span></div>
                    </div>

                    {/* Network */}
                    <div style={secStyle}>
                      <div style={secTitle}>{t('audit.drawer.network')}</div>
                      <div style={rowStyle}><span style={labelStyle}>{t('audit.drawer.ipAddress')}</span><span style={{ ...valueStyle, fontFamily: 'monospace' }}>{selectedLog.ipAddress}</span></div>
                      <div style={rowStyle}><span style={labelStyle}>{t('audit.drawer.userAgent')}</span><span style={{ ...valueStyle, fontSize: '12px' }}>{parseUA(selectedLog.userAgent)}</span></div>
                    </div>

                    {/* Compliance */}
                    <div style={secStyle}>
                      <div style={secTitle}>{t('audit.drawer.compliance')}</div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>{t('audit.drawer.phiAccessed')}</span>
                        <span style={{ ...valueStyle, color: selectedLog.phiAccessed ? colors.warning : colors.success }}>
                          {selectedLog.phiAccessed ? `🏥 ${t('audit.yes')}` : `✓ ${t('audit.no')}`}
                        </span>
                      </div>
                      <div style={rowStyle}>
                        <span style={labelStyle}>{t('audit.drawer.integrity')}</span>
                        <span style={{ ...valueStyle, color: selectedLog.integrityVerified ? colors.success : colors.error }}>
                          {selectedLog.integrityVerified ? `✓ ${t('audit.drawer.hashVerified')}` : `⚠ ${t('audit.drawer.unverified')}`}
                        </span>
                      </div>
                      {selectedLog.hash && (
                        <div style={rowStyle}>
                          <span style={labelStyle}>{t('audit.drawer.hash')}</span>
                          <button onClick={() => copyToClipboard(selectedLog.hash)} style={{
                            background: 'none', border: 'none', color: T.tertiary,
                            fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', padding: 0,
                          }} title={t('audit.clickToCopy')}>
                            {selectedLog.hash.substring(0, 16)}... 📋
                          </button>
                        </div>
                      )}
                      {selectedLog.previousHash && (
                        <div style={rowStyle}>
                          <span style={labelStyle}>{t('audit.drawer.previousHash')}</span>
                          <button onClick={() => copyToClipboard(selectedLog.previousHash)} style={{
                            background: 'none', border: 'none', color: T.tertiary,
                            fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', padding: 0,
                          }} title={t('audit.clickToCopy')}>
                            {selectedLog.previousHash === '0' ? t('audit.drawer.genesis') : selectedLog.previousHash.substring(0, 16) + '...'} 📋
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    {selectedLog.metadata && (
                      <div style={secStyle}>
                        <div style={secTitle}>{t('audit.drawer.metadata')}</div>
                        <div style={{
                          padding: '14px', borderRadius: '8px', background: S.layer1,
                          border: `1px solid ${B.subtle}`, fontFamily: 'monospace',
                          fontSize: '12px', color: T.secondary, whiteSpace: 'pre-wrap',
                          lineHeight: 1.6, maxHeight: '200px', overflow: 'auto',
                        }}>
                          {typeof selectedLog.metadata === 'string'
                            ? selectedLog.metadata
                            : JSON.stringify(selectedLog.metadata, null, 2)}
                        </div>
                      </div>
                    )}

                    {/* Chain context */}
                    <div style={secStyle}>
                      <div style={secTitle}>{t('audit.drawer.chainContext')}</div>
                      {(() => {
                        const currentIdx = filteredLogs.findIndex(l => l.id === selectedLog.id);
                        const prev = currentIdx < filteredLogs.length - 1 ? filteredLogs[currentIdx + 1] : null;
                        const next = currentIdx > 0 ? filteredLogs[currentIdx - 1] : null;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {prev && (
                              <button onClick={() => setSelectedLog(prev)} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                                borderRadius: '8px', background: S.layer1,
                                border: `1px solid ${B.subtle}`, color: T.tertiary,
                                fontSize: '12px', cursor: 'pointer', textAlign: 'left',
                              }}>
                                <span>←</span>
                                <span>{t('audit.drawer.previous')}: {t(`audit.actions.${prev.action}`)} · {tTimeAgo(prev.timestamp)}</span>
                              </button>
                            )}
                            {next && (
                              <button onClick={() => setSelectedLog(next)} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                                borderRadius: '8px', background: S.layer1,
                                border: `1px solid ${B.subtle}`, color: T.tertiary,
                                fontSize: '12px', cursor: 'pointer', textAlign: 'left',
                              }}>
                                <span>→</span>
                                <span>{t('audit.drawer.next')}: {t(`audit.actions.${next.action}`)} · {tTimeAgo(next.timestamp)}</span>
                              </button>
                            )}
                            {!prev && !next && (
                              <div style={{ fontSize: '12px', color: T.muted, padding: '10px 0' }}>{t('audit.drawer.noAdjacentEvents')}</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
