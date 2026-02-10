import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Permission } from '../../contexts/UserContext';
import { apiFetch } from '../../services/apiClient';
import { buildApiUrl } from '../../services/apiClient';
import AppShell from '../../layout/AppShell';
import { colors, alpha, gradients, text, surfaces, borders } from '../../config/theme';
import { useAppearance } from '../../contexts/AppearanceContext';
import { useLanguage } from '../../contexts/LanguageContext';

// ═══ Theme shorthand ═══
const T = text;
const S = surfaces;
const B = borders;
import './TeamManagement.css';

// ═══ Design Tokens (from centralized theme) ═══
const ROLE_STYLES = {
  physician: { color: colors.primary, bg: alpha.primary(0.12), gradient: gradients.physician, label: 'team.roles.physician' },
  nurse:     { color: colors.success, bg: alpha.success(0.12), gradient: gradients.nurse,     label: 'team.roles.nurse' },
  student:   { color: colors.purple,  bg: alpha.purple(0.12),  gradient: gradients.student,   label: 'team.roles.student' },
  admin:     { color: colors.warning, bg: alpha.warning(0.12), gradient: gradients.admin,     label: 'team.roles.admin' },
};

const STATUS_CONFIG = {
  available:  { color: colors.success, label: 'team.status.available' },
  busy:       { color: colors.warning, label: 'team.status.busy' },
  dnd:        { color: colors.error,   label: 'team.status.dnd' },
  'in-surgery': { color: colors.warning, label: 'team.status.inSurgery' },
  'off-shift':  { color: T.dim,            label: 'team.status.offShift' },
};

// Mock data for dev fallback when backend doesn't have real users
const MOCK_TEAM = [
  { id: 't1', email: 'sarah.mitchell@jhh.edu', role: 'physician', isActive: true, lastLoginAt: new Date(Date.now() - 1800000).toISOString(), lastLoginIp: '10.0.1.42', createdAt: '2024-01-15T00:00:00Z', profile: { fullName: 'Dr. Sarah Mitchell', firstName: 'Sarah', lastName: 'Mitchell', specialty: 'Critical Care Medicine', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 82, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'MD-2024-74521' } },
  { id: 't2', email: 'emily.davis@jhh.edu', role: 'nurse', isActive: true, lastLoginAt: new Date(Date.now() - 900000).toISOString(), lastLoginIp: '10.0.1.58', createdAt: '2024-03-22T00:00:00Z', profile: { fullName: 'Emily Davis', firstName: 'Emily', lastName: 'Davis', specialty: 'ICU Floor Nursing', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 76, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'RN-2023-91204' } },
  { id: 't3', email: 'michael.chen@jhh.edu', role: 'physician', isActive: true, lastLoginAt: new Date(Date.now() - 7200000).toISOString(), lastLoginIp: '10.0.1.33', createdAt: '2023-11-01T00:00:00Z', profile: { fullName: 'Dr. Michael Chen', firstName: 'Michael', lastName: 'Chen', specialty: 'Cardiology', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 91, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'MD-2021-38210' } },
  { id: 't4', email: 'james.thompson@jhh.edu', role: 'student', isActive: true, lastLoginAt: new Date(Date.now() - 86400000).toISOString(), lastLoginIp: '10.0.2.15', createdAt: '2025-09-01T00:00:00Z', profile: { fullName: 'James Thompson', firstName: 'James', lastName: 'Thompson', specialty: 'Internal Medicine (Rotation)', institution: 'Johns Hopkins School of Medicine', verified: false, trustScore: 35, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: null } },
  { id: 't5', email: 'priya.patel@jhh.edu', role: 'physician', isActive: true, lastLoginAt: new Date(Date.now() - 3600000).toISOString(), lastLoginIp: '10.0.1.71', createdAt: '2024-06-15T00:00:00Z', profile: { fullName: 'Dr. Priya Patel', firstName: 'Priya', lastName: 'Patel', specialty: 'General Surgery', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 88, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'MD-2022-55893' } },
  { id: 't6', email: 'robert.kim@jhh.edu', role: 'admin', isActive: true, lastLoginAt: new Date(Date.now() - 600000).toISOString(), lastLoginIp: '10.0.1.10', createdAt: '2023-06-01T00:00:00Z', profile: { fullName: 'Robert Kim', firstName: 'Robert', lastName: 'Kim', specialty: 'Healthcare IT', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 95, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: null } },
  { id: 't7', email: 'lisa.nguyen@jhh.edu', role: 'nurse', isActive: true, lastLoginAt: new Date(Date.now() - 5400000).toISOString(), lastLoginIp: '10.0.1.44', createdAt: '2024-08-10T00:00:00Z', profile: { fullName: 'Lisa Nguyen', firstName: 'Lisa', lastName: 'Nguyen', specialty: 'Emergency Nursing', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 71, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'RN-2024-47812' } },
  { id: 't8', email: 'carlos.garcia@jhh.edu', role: 'physician', isActive: false, lastLoginAt: new Date(Date.now() - 604800000).toISOString(), lastLoginIp: '10.0.3.22', createdAt: '2024-02-20T00:00:00Z', profile: { fullName: 'Dr. Carlos Garcia', firstName: 'Carlos', lastName: 'Garcia', specialty: 'Pulmonology', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 79, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'MD-2023-62104' } },
  { id: 't9', email: 'amanda.wright@jhh.edu', role: 'nurse', isActive: true, lastLoginAt: new Date(Date.now() - 10800000).toISOString(), lastLoginIp: '10.0.1.67', createdAt: '2025-01-05T00:00:00Z', profile: { fullName: 'Amanda Wright', firstName: 'Amanda', lastName: 'Wright', specialty: 'Pediatric Nursing', institution: 'Johns Hopkins Hospital', verified: false, trustScore: 52, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'RN-2025-10331' } },
  { id: 't10', email: 'david.lee@jhh.edu', role: 'physician', isActive: true, lastLoginAt: new Date(Date.now() - 14400000).toISOString(), lastLoginIp: '10.0.1.55', createdAt: '2023-09-12T00:00:00Z', profile: { fullName: 'Dr. David Lee', firstName: 'David', lastName: 'Lee', specialty: 'Nephrology', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 86, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'MD-2020-83746' } },
  { id: 't11', email: 'jessica.wu@jhh.edu', role: 'physician', isActive: true, lastLoginAt: new Date(Date.now() - 300000).toISOString(), lastLoginIp: '10.0.1.29', createdAt: '2024-04-18T00:00:00Z', profile: { fullName: 'Dr. Jessica Wu', firstName: 'Jessica', lastName: 'Wu', specialty: 'Neurology', institution: 'Johns Hopkins Hospital', verified: true, trustScore: 90, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: 'MD-2022-97135' } },
  { id: 't12', email: 'mark.brown@jhh.edu', role: 'student', isActive: true, lastLoginAt: null, lastLoginIp: null, createdAt: '2026-01-20T00:00:00Z', profile: { fullName: 'Mark Brown', firstName: 'Mark', lastName: 'Brown', specialty: null, institution: 'Johns Hopkins School of Medicine', verified: false, trustScore: 10, avatarUrl: null, country: 'United States', timezone: 'America/New_York', licenseNumber: null } },
];

// On-call roster IDs (mapped from dashboard stub data)
const ON_CALL_IDS = new Set(['t3', 't5', 't10', 't11']);

// Helper: status from login recency
const inferStatus = (u) => {
  if (!u.isActive) return 'off-shift';
  if (!u.lastLoginAt) return 'off-shift';
  const ago = Date.now() - new Date(u.lastLoginAt).getTime();
  if (ago < 600000) return 'available';    // <10 min
  if (ago < 3600000) return 'busy';         // <1 hour
  if (ago < 86400000) return 'off-shift';   // <24 h
  return 'off-shift';
};

const timeAgo = (iso, t) => {
  if (!iso) return t('team.time.never');
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return t('team.time.justNow');
  if (s < 3600) return `${Math.floor(s / 60)}${t('team.time.minuteShort')}`;
  if (s < 86400) return `${Math.floor(s / 3600)}${t('team.time.hourShort')}`;
  return `${Math.floor(s / 86400)}${t('team.time.dayShort')}`;
};

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export const TeamManagement = () => {
  const { user, signOut } = useUser();
  const navigate = useNavigate();
  useAppearance(); // re-render on theme/accent change
  const { t } = useLanguage();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedUser, setSelectedUser] = useState(null); // drawer
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activityFeed, setActivityFeed] = useState([]);

  // SSE presence
  useEffect(() => {
    let es;
    try {
      es = new EventSource(buildApiUrl('/api/dashboard/stream'));
      es.addEventListener('team:presence', (e) => {
        const data = JSON.parse(e.data);
        setActivityFeed((prev) => [{ ...data, ts: new Date().toISOString() }, ...prev].slice(0, 20));
        // Refresh user list on role/deactivation changes
        if (data.type === 'role-changed' || data.type === 'deactivated' || data.type === 'reactivated') {
          fetchUsers();
        }
      });
    } catch { /* SSE unavailable in dev — ok */ }
    return () => es?.close();
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('caredroid_access_token') || localStorage.getItem('authToken');
      const res = await apiFetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.length > 0 ? data : MOCK_TEAM);
      } else {
        // Backend didn't return users — use mock
        setUsers(MOCK_TEAM);
      }
      setError(null);
    } catch {
      setUsers(MOCK_TEAM);
      setError(null); // silently use mock
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ═══ Stats ═══
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const online = users.filter((u) => {
      if (!u.isActive || !u.lastLoginAt) return false;
      return (Date.now() - new Date(u.lastLoginAt).getTime()) < 3600000;
    }).length;
    const onCall = users.filter((u) => ON_CALL_IDS.has(u.id)).length;
    const byRole = {};
    users.forEach((u) => { byRole[u.role] = (byRole[u.role] || 0) + 1; });
    return { total, active, online, onCall, byRole };
  }, [users]);

  // ═══ Filter + Search ═══
  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter);
    if (statusFilter === 'active') list = list.filter((u) => u.isActive);
    if (statusFilter === 'inactive') list = list.filter((u) => !u.isActive);
    if (statusFilter === 'on-call') list = list.filter((u) => ON_CALL_IDS.has(u.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((u) =>
        (u.profile?.fullName || '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.profile?.specialty || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, statusFilter, searchQuery]);

  // ═══ Actions ═══
  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('caredroid_access_token') || localStorage.getItem('authToken');
      await apiFetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userId) setSelectedUser((p) => ({ ...p, role: newRole }));
    } catch { /* toast error */ }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm(t('team.confirmDeactivate'))) return;
    try {
      const token = localStorage.getItem('caredroid_access_token') || localStorage.getItem('authToken');
      await apiFetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: false } : u));
      if (selectedUser?.id === userId) setSelectedUser((p) => ({ ...p, isActive: false }));
    } catch { /* toast error */ }
  };

  const handleReactivate = async (userId) => {
    try {
      const token = localStorage.getItem('caredroid_access_token') || localStorage.getItem('authToken');
      await apiFetch(`/api/users/${userId}/reactivate`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: true } : u));
      if (selectedUser?.id === userId) setSelectedUser((p) => ({ ...p, isActive: true }));
    } catch { /* toast error */ }
  };

  const handleInvite = async (email, role) => {
    try {
      const token = localStorage.getItem('caredroid_access_token') || localStorage.getItem('authToken');
      const res = await apiFetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) fetchUsers();
      setShowInviteModal(false);
    } catch { /* toast error */ }
  };

  // ═══ Shared card styles ═══
  const cardBase = {
    background: S.layer1,
    border: `1px solid ${B.default}`,
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(12px)',
  };

  // ═══ RENDER ═══
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
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: T.primary }}>{t('team.title')}</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: T.tertiary }}>
              {t('team.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              padding: '10px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: gradients.nurse, color: T.primary,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span> {t('team.inviteMember')}
          </button>
        </div>

        {/* ═══ STAT CARDS ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { icon: '👥', label: t('team.stats.total'), value: stats.total, accent: T.primary },
            { icon: '🟢', label: t('team.stats.online'), value: stats.online, accent: colors.success },
            { icon: '🩺', label: t('team.stats.onCall'), value: stats.onCall, accent: colors.primary },
            { icon: '🔵', label: t('team.stats.physicians'), value: stats.byRole.physician || 0, accent: colors.primary },
            { icon: '🟢', label: t('team.stats.nurses'), value: stats.byRole.nurse || 0, accent: colors.success },
            { icon: '🟣', label: t('team.stats.students'), value: stats.byRole.student || 0, accent: colors.purple },
          ].map((s) => (
            <div key={s.label} style={{
              ...cardBase, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '22px' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: s.accent }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: T.muted, fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ FILTERS BAR ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', opacity: 0.4 }}>🔍</span>
            <input
              type="text"
              placeholder={t('team.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', fontSize: '13px',
                background: S.layer2, border: `1px solid ${B.medium}`,
                color: T.primary, outline: 'none',
              }}
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
              background: S.layer2, border: `1px solid ${B.medium}`,
              color: T.primary, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="all">{t('team.filters.allRoles')}</option>
            <option value="physician">{t('team.roles.physician')}</option>
            <option value="nurse">{t('team.roles.nurse')}</option>
            <option value="student">{t('team.roles.student')}</option>
            <option value="admin">{t('team.roles.admin')}</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
              background: S.layer2, border: `1px solid ${B.medium}`,
              color: T.primary, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="all">{t('team.filters.allStatus')}</option>
            <option value="active">{t('team.filters.active')}</option>
            <option value="inactive">{t('team.filters.inactive')}</option>
            <option value="on-call">{t('team.filters.onCall')}</option>
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${B.medium}` }}>
            {['grid', 'list'].map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                style={{
                  padding: '8px 14px', fontSize: '13px', border: 'none', cursor: 'pointer',
                  background: viewMode === v ? S.pressed : S.layer0,
                  color: viewMode === v ? T.primary : T.muted,
                  fontWeight: viewMode === v ? 600 : 400,
                }}
              >
                {v === 'grid' ? '▦' : '☰'}
              </button>
            ))}
          </div>

          {/* Count */}
          <span style={{ fontSize: '12px', color: T.muted, fontWeight: 600 }}>
            {filtered.length} {filtered.length !== 1 ? t('team.membersPlural') : t('team.memberSingular')}
          </span>
        </div>

        {/* ═══ LOADING ═══ */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: `3px solid ${alpha.success(0.2)}`, borderTopColor: colors.success,
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        )}

        {/* ═══ ERROR ═══ */}
        {error && (
          <div style={{
            padding: '14px 20px', borderRadius: '10px', marginBottom: '20px',
            background: alpha.error(0.1), border: `1px solid ${alpha.error(0.25)}`,
            color: colors.error, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: colors.error, cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        )}

        {/* ═══ GRID VIEW ═══ */}
        {!loading && viewMode === 'grid' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map((u) => (
              <MemberCard
                key={u.id}
                member={u}
                isOnCall={ON_CALL_IDS.has(u.id)}
                onSelect={() => setSelectedUser(u)}
              />
            ))}
          </div>
        )}

        {/* ═══ LIST VIEW ═══ */}
        {!loading && viewMode === 'list' && (
          <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${B.default}` }}>
                  {[t('team.table.name'), t('team.table.role'), t('team.table.specialty'), t('team.table.status'), t('team.table.lastSeen'), t('team.table.actions')].map((h) => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: '11px',
                      fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const rs = ROLE_STYLES[u.role] || ROLE_STYLES.student;
                  const st = STATUS_CONFIG[inferStatus(u)] || STATUS_CONFIG['off-shift'];
                  const name = u.profile?.fullName || u.email;
                  return (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${S.layer2}`, cursor: 'pointer' }}
                      onClick={() => setSelectedUser(u)}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: u.profile?.avatarUrl ? `url(${u.profile.avatarUrl}) center/cover` : rs.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 700, color: T.primary, flexShrink: 0,
                            position: 'relative',
                          }}>
                            {!u.profile?.avatarUrl && name.charAt(0).toUpperCase()}
                            <div style={{
                              position: 'absolute', bottom: -1, right: -1, width: '10px', height: '10px',
                              borderRadius: '50%', background: st.color, border: `2px solid ${S.panel}`,
                            }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: T.primary }}>{name}</div>
                            <div style={{ fontSize: '11px', color: T.muted }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                          background: rs.bg, color: rs.color,
                        }}>{t(rs.label)}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: T.tertiary }}>
                        {u.profile?.specialty || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: st.color }} />
                          <span style={{ fontSize: '12px', color: st.color }}>{t(st.label)}</span>
                          {ON_CALL_IDS.has(u.id) && (
                            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: alpha.primary(0.15), color: colors.primary, fontWeight: 700 }}>{t('team.badges.onCall')}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: T.muted }}>
                        {timeAgo(u.lastLoginAt, t)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                            background: S.hover, color: T.primary, border: `1px solid ${B.medium}`,
                            cursor: 'pointer',
                          }}
                        >{t('team.actions.view')}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {!loading && filtered.length === 0 && (
          <div style={{
            ...cardBase, padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <p style={{ fontSize: '15px', color: T.tertiary, margin: '0 0 12px' }}>{t('team.emptyState')}</p>
            {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setRoleFilter('all'); setStatusFilter('all'); }}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontSize: '12px',
                  background: alpha.success(0.1), color: colors.success, border: `1px solid ${alpha.success(0.2)}`,
                  cursor: 'pointer',
                }}
              >{t('team.clearFilters')}</button>
            )}
          </div>
        )}

        {/* ═══ ACTIVITY FEED ═══ */}
        {activityFeed.length > 0 && (
          <div style={{ ...cardBase, marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: T.secondary }}>{t('team.recentActivity')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activityFeed.slice(0, 5).map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                  borderRadius: '6px', background: S.layer0,
                  fontSize: '12px', color: T.tertiary,
                }}>
                  <span>
                    {a.type === 'role-changed' && '🔄'}
                    {a.type === 'deactivated' && '🔒'}
                    {a.type === 'reactivated' && '🔓'}
                    {a.type === 'login' && '🟢'}
                    {a.type === 'logout' && '⚫'}
                    {a.type === 'status-changed' && '💬'}
                  </span>
                  <span style={{ flex: 1 }}>
                    {a.type === 'role-changed' && `${t('team.activity.roleChanged')} ${a.role}`}
                    {a.type === 'deactivated' && t('team.activity.deactivated')}
                    {a.type === 'reactivated' && t('team.activity.reactivated')}
                    {a.type === 'login' && `${a.userId} ${t('team.activity.cameOnline')}`}
                    {a.type === 'logout' && `${a.userId} ${t('team.activity.wentOffline')}`}
                    {a.type === 'status-changed' && `${a.userId} ${t('team.activity.isNow')} ${a.status}`}
                  </span>
                  <span style={{ fontSize: '11px', color: T.ghost }}>{timeAgo(a.ts, t)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ═══ MEMBER DETAIL DRAWER ═══ */}
      {selectedUser && (
        <MemberDrawer
          member={selectedUser}
          isOnCall={ON_CALL_IDS.has(selectedUser.id)}
          onClose={() => setSelectedUser(null)}
          onRoleChange={handleRoleChange}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />
      )}

      {/* ═══ INVITE MODAL ═══ */}
      {showInviteModal && (
        <InviteModal
          onInvite={handleInvite}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </AppShell>
  );
};

// ═══════════════════════════════════════════════════
// MEMBER CARD (Grid item)
// ═══════════════════════════════════════════════════
const MemberCard = ({ member: u, isOnCall, onSelect }) => {
  const { t } = useLanguage();
  const rs = ROLE_STYLES[u.role] || ROLE_STYLES.student;
  const st = STATUS_CONFIG[inferStatus(u)] || STATUS_CONFIG['off-shift'];
  const name = u.profile?.fullName || u.email;

  return (
    <div
      onClick={onSelect}
      style={{
        background: S.layer1,
        border: `1px solid ${B.default}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${rs.color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = B.default; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* On-call badge */}
      {isOnCall && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
          background: alpha.primary(0.15), color: colors.primary,
        }}>{ t('team.badges.onCall')}</div>
      )}

      {/* Inactive overlay */}
      {!u.isActive && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
          background: alpha.error(0.15), color: colors.error,
        }}>{t('team.badges.inactive')}</div>
      )}

      {/* Avatar + Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: u.profile?.avatarUrl ? `url(${u.profile.avatarUrl}) center/cover` : rs.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 700, color: T.primary, flexShrink: 0,
          border: `2px solid ${rs.color}40`, position: 'relative',
          opacity: u.isActive ? 1 : 0.5,
        }}>
          {!u.profile?.avatarUrl && name.charAt(0).toUpperCase()}
          <div style={{
            position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px',
            borderRadius: '50%', background: st.color, border: `2px solid ${S.panel}`,
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: T.primary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
              background: rs.bg, color: rs.color,
            }}>{t(rs.label)}</span>
            {u.profile?.verified && (
              <span title={t('team.verified')} style={{ fontSize: '10px' }}>✅</span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ fontSize: '12px', color: T.tertiary, marginBottom: '12px' }}>
        {u.profile?.specialty && <div style={{ marginBottom: '3px' }}>🩺 {u.profile.specialty}</div>}
        {u.profile?.institution && <div>🏥 {u.profile.institution}</div>}
      </div>

      {/* Status row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '12px', borderTop: `1px solid ${B.subtle}`,
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color }} />
          <span style={{ color: st.color, fontWeight: 600 }}>{t(st.label)}</span>
        </div>
        <span style={{ color: T.muted }}>{timeAgo(u.lastLoginAt, t)}</span>
      </div>

      {/* Trust score bar */}
      {u.profile?.trustScore > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: B.subtle }}>
            <div style={{ width: `${u.profile.trustScore}%`, height: '100%', borderRadius: '2px', background: rs.color, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '10px', color: T.muted, fontWeight: 600 }}>{u.profile.trustScore}</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// MEMBER DETAIL DRAWER
// ═══════════════════════════════════════════════════
const MemberDrawer = ({ member: u, isOnCall, onClose, onRoleChange, onDeactivate, onReactivate }) => {
  const { t } = useLanguage();
  const drawerRef = useRef(null);
  const rs = ROLE_STYLES[u.role] || ROLE_STYLES.student;
  const st = STATUS_CONFIG[inferStatus(u)] || STATUS_CONFIG['off-shift'];
  const name = u.profile?.fullName || u.email;
  const maskedLicense = u.profile?.licenseNumber ? '●●●●-' + u.profile.licenseNumber.slice(-4) : '—';

  // Click outside
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const secTitle = { fontSize: '13px', fontWeight: 700, color: T.tertiary, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const fRow = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${S.layer2}`, fontSize: '13px' };
  const fLabel = { color: T.muted };
  const fVal = { color: T.primary, fontWeight: 500, textAlign: 'right' };

  const ROLE_PERMISSIONS = {
    admin: ['team.permissions.readAll', 'team.permissions.writeAll', 'team.permissions.manageUsers', 'team.permissions.manageRoles', 'team.permissions.viewAuditLogs', 'team.permissions.configureSystem'],
    physician: ['team.permissions.readPHI', 'team.permissions.writePHI', 'team.permissions.useDrugChecker', 'team.permissions.useLabInterpreter', 'team.permissions.useCalculators', 'team.permissions.useProtocols', 'team.permissions.orderTests', 'team.permissions.prescribe'],
    nurse: ['team.permissions.readPHI', 'team.permissions.writePHI', 'team.permissions.updateVitals', 'team.permissions.documentCare', 'team.permissions.useCalculators', 'team.permissions.useLabInterpreter'],
    student: ['team.permissions.readCases', 'team.permissions.useCalculators', 'team.permissions.viewGuidelines', 'team.permissions.educationalResources'],
  };

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
        animation: 'fadeIn 0.2s ease',
      }} />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', maxWidth: '90vw',
          background: S.panel, borderLeft: `1px solid ${B.default}`,
          zIndex: 1000, overflowY: 'auto', padding: '0',
          animation: 'slideInRight 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: `1px solid ${B.default}`,
          background: `linear-gradient(135deg, ${rs.color}08, transparent)`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', color: T.muted, fontWeight: 600 }}>{t('team.drawer.title')}</span>
            <button onClick={onClose} style={{
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: S.hover, color: T.primary, cursor: 'pointer',
              fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: u.profile?.avatarUrl ? `url(${u.profile.avatarUrl}) center/cover` : rs.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 700, color: T.primary, flexShrink: 0,
              border: `3px solid ${rs.color}40`,
              opacity: u.isActive ? 1 : 0.5,
              position: 'relative',
            }}>
              {!u.profile?.avatarUrl && name.charAt(0).toUpperCase()}
              <div style={{
                position: 'absolute', bottom: 1, right: 1, width: '14px', height: '14px',
                borderRadius: '50%', background: st.color, border: `2px solid ${S.panel}`,
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: T.primary }}>{name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                  background: rs.bg, color: rs.color,
                }}>{t(rs.label)}</span>
                {u.profile?.verified && <span style={{ fontSize: '11px', color: colors.success }}>✅ {t('team.drawer.verified')}</span>}
                {isOnCall && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: alpha.primary(0.15), color: colors.primary }}>{t('team.badges.onCall')}</span>}
                {!u.isActive && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: alpha.error(0.15), color: colors.error }}>{t('team.badges.inactive')}</span>}
              </div>
              {u.profile?.specialty && <div style={{ fontSize: '12px', color: T.tertiary, marginTop: '4px' }}>🩺 {u.profile.specialty}</div>}
              {u.profile?.institution && <div style={{ fontSize: '12px', color: T.muted, marginTop: '2px' }}>🏥 {u.profile.institution}</div>}
            </div>
          </div>

          {/* Trust score */}
          {u.profile?.trustScore > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
              <span style={{ fontSize: '11px', color: T.muted, fontWeight: 600 }}>{t('team.drawer.trustScore')}</span>
              <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: B.default }}>
                <div style={{ width: `${u.profile.trustScore}%`, height: '100%', borderRadius: '3px', background: rs.color, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: '11px', color: rs.color, fontWeight: 700 }}>{u.profile.trustScore}/100</span>
            </div>
          )}
        </div>

        {/* Sections */}
        <div style={{ padding: '20px 24px' }}>

          {/* Professional Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={secTitle}>📋 {t('team.drawer.professionalDetails')}</h3>
            <div style={fRow}><span style={fLabel}>{t('team.drawer.license')}</span><span style={fVal}>{maskedLicense}</span></div>
            <div style={fRow}><span style={fLabel}>{t('team.drawer.specialty')}</span><span style={fVal}>{u.profile?.specialty || '—'}</span></div>
            <div style={fRow}><span style={fLabel}>{t('team.drawer.institution')}</span><span style={fVal}>{u.profile?.institution || '—'}</span></div>
            <div style={fRow}><span style={fLabel}>{t('team.drawer.country')}</span><span style={fVal}>{u.profile?.country || '—'}</span></div>
            <div style={fRow}><span style={fLabel}>{t('team.drawer.timezone')}</span><span style={fVal}>{u.profile?.timezone || '—'}</span></div>
            <div style={{ ...fRow, borderBottom: 'none' }}><span style={fLabel}>{t('team.drawer.memberSince')}</span><span style={fVal}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span></div>
          </div>

          {/* Role & Permissions */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={secTitle}>🔐 {t('team.drawer.rolePermissions')}</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: T.muted, marginBottom: '4px', display: 'block' }}>{t('team.drawer.assignedRole')}</label>
              <select
                value={u.role}
                onChange={(e) => onRoleChange(u.id, e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                  background: S.layer2, border: `1px solid ${B.medium}`,
                  color: T.primary, cursor: 'pointer', outline: 'none',
                }}
              >
                {Object.entries(ROLE_STYLES).map(([k, v]) => (
                  <option key={k} value={k}>{t(v.label)}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(ROLE_PERMISSIONS[u.role] || []).map((p) => (
                <span key={p} style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px',
                  background: alpha.success(0.1), color: colors.success,
                }}>✓ {t(p)}</span>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={secTitle}>📊 {t('team.drawer.activity')}</h3>
            <div style={fRow}>
              <span style={fLabel}>{t('team.drawer.lastLogin')}</span>
              <span style={fVal}>{timeAgo(u.lastLoginAt, t)}</span>
            </div>
            <div style={fRow}>
              <span style={fLabel}>{t('team.drawer.lastIp')}</span>
              <span style={fVal}>{u.lastLoginIp || '—'}</span>
            </div>
            <div style={fRow}>
              <span style={fLabel}>{t('team.drawer.email')}</span>
              <span style={fVal}>{u.email}</span>
            </div>
            <div style={{ ...fRow, borderBottom: 'none' }}>
              <span style={fLabel}>{t('team.drawer.statusLabel')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: st.color }} />
                <span style={{ fontSize: '12px', color: st.color, fontWeight: 600 }}>{t(st.label)}</span>
              </div>
            </div>
          </div>

          {/* Schedule info (on-call) */}
          {isOnCall && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={secTitle}>📅 {t('team.drawer.schedule')}</h3>
              <div style={{
                padding: '12px 16px', borderRadius: '8px',
                background: alpha.primary(0.08), border: `1px solid ${alpha.primary(0.15)}`,
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, marginBottom: '4px' }}>🩺 {t('team.drawer.currentlyOnCall')}</div>
                <div style={{ fontSize: '12px', color: T.tertiary }}>{t('team.drawer.onCallDescription')}</div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div style={{
            display: 'flex', gap: '10px', paddingTop: '16px',
            borderTop: `1px solid ${B.subtle}`,
          }}>
            <button
              onClick={() => window.location.href = `mailto:${u.email}`}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                background: alpha.primary(0.1), color: colors.primary,
                border: `1px solid ${alpha.primary(0.2)}`, cursor: 'pointer',
              }}
            >📧 {t('team.actions.message')}</button>
            {u.isActive ? (
              <button
                onClick={() => onDeactivate(u.id)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: alpha.error(0.08), color: colors.error,
                  border: `1px solid ${alpha.error(0.2)}`, cursor: 'pointer',
                }}
              >🔒 {t('team.actions.deactivate')}</button>
            ) : (
              <button
                onClick={() => onReactivate(u.id)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: alpha.success(0.08), color: colors.success,
                  border: `1px solid ${alpha.success(0.2)}`, cursor: 'pointer',
                }}
              >🔓 {t('team.actions.reactivate')}</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════
// INVITE MODAL
// ═══════════════════════════════════════════════════
const InviteModal = ({ onInvite, onClose }) => {
  const { t } = useLanguage();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('student');
  const [sending, setSending] = useState(false);

  const validEmails = emails.split(/[,;\n]+/).map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const handleSubmit = async () => {
    setSending(true);
    for (const email of validEmails) {
      await onInvite(email, role);
    }
    setSending(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1001 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '460px', maxWidth: '92vw', background: S.panel,
        border: `1px solid ${B.medium}`, borderRadius: '14px',
        zIndex: 1002, animation: 'slideUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${B.default}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: T.primary }}>{t('team.invite.title')}</h2>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: S.hover, color: T.primary, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '13px', color: T.tertiary, margin: '0 0 20px' }}>
            {t('team.invite.description')}
          </p>

          {/* Emails */}
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.tertiary, marginBottom: '6px' }}>{t('team.invite.emailLabel')}</label>
          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={t('team.invite.emailPlaceholder')}
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '13px',
              background: S.layer2, border: `1px solid ${B.medium}`,
              color: T.primary, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
            }}
          />
          {emails && validEmails.length > 0 && (
            <div style={{ fontSize: '11px', color: colors.success, marginTop: '4px' }}>
              ✓ {validEmails.length} {t('team.invite.validEmails')}
            </div>
          )}
          {emails && validEmails.length === 0 && (
            <div style={{ fontSize: '11px', color: colors.error, marginTop: '4px' }}>
              {t('team.invite.invalidEmail')}
            </div>
          )}

          {/* Role selector */}
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.tertiary, marginTop: '16px', marginBottom: '6px' }}>{t('team.invite.assignRole')}</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(ROLE_STYLES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setRole(k)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  background: role === k ? v.bg : S.layer0,
                  color: role === k ? v.color : T.muted,
                  border: `1px solid ${role === k ? v.color + '40' : B.default}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{t(v.label)}</button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${B.default}`, display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: S.layer2, color: T.primary,
            border: `1px solid ${B.medium}`, cursor: 'pointer',
          }}>{t('team.invite.cancel')}</button>
          <button
            onClick={handleSubmit}
            disabled={validEmails.length === 0 || sending}
            style={{
              padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: validEmails.length > 0 ? gradients.nurse : S.layer2,
              color: validEmails.length > 0 ? T.primary : T.ghost,
              border: 'none', cursor: validEmails.length > 0 ? 'pointer' : 'not-allowed',
              opacity: sending ? 0.6 : 1,
            }}
          >{sending ? t('team.invite.sending') : validEmails.length > 1 ? t('team.invite.sendInvites') : t('team.invite.sendInvite')}</button>
        </div>
      </div>
    </>
  );
};
