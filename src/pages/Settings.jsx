import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { apiFetch, buildApiUrl } from '../services/apiClient';
import AppShell from '../layout/AppShell';
import { colors, alpha, gradients, text, surfaces, borders } from '../config/theme';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';
const T = text; const S = surfaces; const B = borders;
import './Settings.css';

/* ═══════════════════════════════════════════════════
   CONSTANTS & CONFIGURATION
   ═══════════════════════════════════════════════════ */

const TABS = [
  { id: 'appearance', icon: '🎨', label: 'Appearance', desc: 'Theme, colors, layout' },
  { id: 'accessibility', icon: '♿', label: 'Accessibility', desc: 'Motion, contrast, reader' },
  { id: 'security', icon: '🔒', label: 'Security', desc: 'Sessions, 2FA, locks' },
  { id: 'notifications', icon: '🔔', label: 'Notifications', desc: 'Alerts, channels' },
  { id: 'storage', icon: '💾', label: 'Data & Storage', desc: 'Cache, export, logs' },
  { id: 'about', icon: 'ℹ️', label: 'About', desc: 'Version, health, links' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System', icon: '💻', desc: 'Follow OS preference', preview: ['#1a1b1e', '#ffffff', '#3B82F6'] },
  { value: 'light', label: 'Light', icon: '☀️', desc: 'Bright background', preview: ['#ffffff', '#f1f5f9', '#3B82F6'] },
  { value: 'dark', label: 'Dark', icon: '🌙', desc: 'Easy on the eyes', preview: ['#0a0b0d', '#1a1b1e', '#3B82F6'] },
];

const ACCENT_COLORS = [
  { value: 'default', color: colors.primary, label: 'Blue' },
  { value: 'green', color: colors.success, label: 'Green' },
  { value: 'purple', color: colors.purple, label: 'Purple' },
  { value: 'amber', color: colors.warning, label: 'Amber' },
  { value: 'rose', color: colors.rose, label: 'Rose' },
  { value: 'cyan', color: colors.cyan, label: 'Cyan' },
];

const FONT_SIZES = [
  { value: 'small', label: 'S', px: '12px', title: 'Small' },
  { value: 'medium', label: 'M', px: '14px', title: 'Medium' },
  { value: 'large', label: 'L', px: '16px', title: 'Large' },
];

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact', icon: '▪️' },
  { value: 'comfortable', label: 'Comfortable', icon: '◾' },
  { value: 'spacious', label: 'Spacious', icon: '⬛' },
];

const CODE_FONTS = [
  { value: 'standard', label: 'Standard', sample: 'Aa Bb 123' },
  { value: 'mono', label: 'Monospace', sample: 'Aa Bb 123' },
  { value: 'dyslexic', label: 'Dyslexia-friendly', sample: 'Aa Bb 123' },
];

const LOCK_OPTIONS = [
  { value: 5, label: '5m' }, { value: 10, label: '10m' },
  { value: 15, label: '15m' }, { value: 30, label: '30m' },
  { value: 60, label: '1h' }, { value: 0, label: 'Never' },
];

const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  { value: 'he', label: 'עברית', flag: '🇮🇱' },
];

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl + K', key: 'commandPalette', action: 'Command palette' },
  { keys: 'Ctrl + /', key: 'toggleSidebar', action: 'Toggle sidebar' },
  { keys: 'Ctrl + N', key: 'newConversation', action: 'New conversation' },
  { keys: 'Ctrl + Shift + E', key: 'exportData', action: 'Export data' },
  { keys: 'Ctrl + ,', key: 'openSettings', action: 'Open settings' },
  { keys: 'Ctrl + Shift + T', key: 'toggleTheme', action: 'Toggle theme' },
  { keys: 'Esc', key: 'closeModals', action: 'Close modals' },
  { keys: 'Tab', key: 'nextField', action: 'Next field' },
];

const DEFAULT_SETTINGS = {
  theme: 'system', compactMode: false, fontSize: 'medium',
  highContrast: false, reducedMotion: false, screenReader: false,
  autoLockMinutes: 15, safetyBanner: true, language: 'en',
  accentColor: 'default', soundEffects: true, hapticFeedback: true,
  density: 'comfortable', codeFont: 'standard', showTooltips: true,
  animateCharts: true, developerMode: false,
};

const MOCK_STORAGE = {
  analyticsEvents: 1284, auditLogs: 567, chatMessages: 342,
  settingsChanges: 23, estimatedStorageMB: 2.14,
  lastSync: new Date().toISOString(),
};

const MOCK_SESSIONS = [
  { id: 'sess_1', device: 'Desktop', browser: 'Chrome', ip: '192.168.1.42', lastActive: new Date().toISOString(), current: true },
  { id: 'sess_2', device: 'Mobile', browser: 'Safari', ip: '10.0.0.15', lastActive: new Date(Date.now() - 3600000).toISOString(), current: false },
];

const MOCK_ACTIVITY = [
  { id: '1', action: 'settings.updated', details: '{"theme":{"from":"system","to":"dark"}}', createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: '2', action: 'settings.updated', details: '{"fontSize":{"from":"medium","to":"large"}}', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', action: 'settings.reset', details: null, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', action: 'settings.exported', details: null, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

/* ═══════════════════════════════════════════════════
   INLINE SVG COMPONENTS
   ═══════════════════════════════════════════════════ */

const DonutChart = ({ segments, size = 120, strokeWidth = 14 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={B.subtle} strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle
            key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        );
      })}
      <text
        x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={T.primary} fontSize="18" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {total > 0 ? `${(segments[0]?.value / total * 100).toFixed(0)}%` : '0%'}
      </text>
    </svg>
  );
};

const MiniGraph = ({ data, color = colors.primary, width = 120, height = 32 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height * 0.8 - height * 0.1}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ═══════════════════════════════════════════════════
   REUSABLE CONTROLS
   ═══════════════════════════════════════════════════ */

const Toggle = ({ checked, onChange, label, description, accent }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: `1px solid ${B.subtle}`,
  }}>
    <div style={{ flex: 1, marginRight: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: T.primary }}>{label}</div>
      {description && <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px', lineHeight: 1.4 }}>{description}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      aria-label={`${label}: ${checked ? 'on' : 'off'}`}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? (accent || colors.success) : B.strong,
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  </div>
);

const SegmentedControl = ({ options, value, onChange, label }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <div style={{ fontSize: '12px', fontWeight: 600, color: T.tertiary, marginBottom: '8px' }}>{label}</div>}
    <div style={{ display: 'flex', gap: '4px', background: S.layer2, borderRadius: '10px', padding: '3px' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.title || opt.label}
          style={{
            flex: 1, padding: '7px 10px', borderRadius: '8px', border: 'none',
            background: value === opt.value ? alpha.primary(0.2) : 'transparent',
            color: value === opt.value ? T.primary : T.muted,
            fontSize: '12px', fontWeight: value === opt.value ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.15s',
            outline: value === opt.value ? `1px solid ${alpha.primary(0.4)}` : 'none',
          }}
        >
          {opt.icon && <span style={{ marginRight: '4px' }}>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const LinkCard = ({ icon, label, description, status, statusColor, onClick, danger }) => (
  <button
    onClick={onClick}
    className="settings-link-card"
    style={{
      display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px',
      background: danger ? alpha.error(0.04) : S.layer1,
      border: `1px solid ${danger ? alpha.error(0.15) : B.default}`,
      borderRadius: '10px', cursor: 'pointer', marginBottom: '8px',
      transition: 'all 0.15s',
    }}
  >
    <span style={{ fontSize: '20px', marginRight: '12px', flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1, textAlign: 'left' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: danger ? colors.errorLight : T.primary }}>{label}</div>
      {description && <div style={{ fontSize: '11px', color: T.ghost, marginTop: '2px' }}>{description}</div>}
    </div>
    {status && (
      <span style={{
        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px',
        background: `${statusColor || colors.success}20`, color: statusColor || colors.success,
        marginRight: '8px', flexShrink: 0,
      }}>
        {status}
      </span>
    )}
    <span style={{ color: T.ghost, fontSize: '16px', flexShrink: 0 }}>›</span>
  </button>
);

const InfoRow = ({ label, value, mono, copyable }) => {
  const handleCopy = () => {
    if (copyable && typeof value === 'string') {
      navigator.clipboard.writeText(value).catch(() => {});
    }
  };
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: `1px solid ${B.subtle}`,
    }}>
      <span style={{ fontSize: '13px', color: T.tertiary }}>{label}</span>
      <span
        onClick={handleCopy}
        style={{
          fontSize: '13px', color: T.primary, fontWeight: 500,
          fontFamily: mono ? 'monospace' : 'inherit',
          cursor: copyable ? 'pointer' : 'default',
        }}
        title={copyable ? 'Click to copy' : undefined}
      >
        {value}
      </span>
    </div>
  );
};

const SectionCard = ({ title, icon, badge, children, collapsible, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="settings-section-card" style={{
      padding: '20px', borderRadius: '12px',
      background: S.layer1, border: `1px solid ${B.default}`,
      marginBottom: '16px', transition: 'border-color 0.2s',
    }}>
      {title && (
        <div
          onClick={collapsible ? () => setOpen(!open) : undefined}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            margin: open ? '0 0 16px' : 0, cursor: collapsible ? 'pointer' : 'default',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: T.primary }}>{title}</h3>
            {badge && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                background: alpha.primary(0.15), color: colors.primaryLight,
              }}>{badge}</span>
            )}
          </div>
          {collapsible && (
            <span style={{
              color: T.ghost, fontSize: '12px',
              transform: open ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}>▼</span>
          )}
        </div>
      )}
      {(!collapsible || open) && children}
    </div>
  );
};

/* ─── Toast Notification ─── */
const Toast = ({ message, type, onDismiss, action }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const bg = type === 'success' ? alpha.success(0.15) : type === 'error' ? alpha.error(0.15) : alpha.primary(0.15);
  const border = type === 'success' ? alpha.success(0.3) : type === 'error' ? alpha.error(0.3) : alpha.primary(0.3);
  const iconMap = { success: '✓', error: '✗', info: 'ℹ' };

  return (
    <div className="settings-toast" style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      padding: '12px 16px', borderRadius: '10px', background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '360px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <span style={{ fontSize: '16px' }}>{iconMap[type] || '✓'}</span>
      <span style={{ flex: 1, fontSize: '13px', color: T.primary, fontWeight: 500 }}>{message}</span>
      {action && (
        <button onClick={action.onClick} style={{
          background: 'none', border: 'none', color: colors.primaryLight, fontSize: '12px',
          fontWeight: 700, cursor: 'pointer', textDecoration: 'underline',
        }}>{action.label}</button>
      )}
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', color: T.muted,
        cursor: 'pointer', fontSize: '14px', padding: '0 2px',
      }}>×</button>
    </div>
  );
};

/* ─── Loading Skeleton ─── */
const SettingsSkeleton = () => (
  <div style={{ padding: '32px 40px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
    <div className="settings-shimmer" style={{ height: '32px', width: '200px', borderRadius: '8px', marginBottom: '24px', background: S.layer2 }} />
    <div style={{ display: 'flex', gap: '24px' }}>
      <div style={{ width: '200px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="settings-shimmer" style={{ height: '44px', borderRadius: '8px', marginBottom: '6px', background: S.layer2 }} />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="settings-shimmer" style={{ height: '140px', borderRadius: '12px', marginBottom: '16px', background: S.layer2 }} />
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useUser();
  const { updateAppearance, syncFromSettings, resetAppearance } = useAppearance();
  const { setLanguage, t } = useLanguage();

  // Appearance keys that should live-update the whole app
  const APPEARANCE_KEYS = ['theme', 'accentColor', 'fontSize', 'density', 'highContrast', 'reducedMotion', 'codeFont'];

  // ─── State ───
  const [activeTab, setActiveTab] = useState('appearance');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Storage
  const [storageStats, setStorageStats] = useState(MOCK_STORAGE);

  // Health
  const [healthStatus, setHealthStatus] = useState('checking');
  const [backendUptime, setBackendUptime] = useState(null);

  // Notifications summary
  const [notifSummary, setNotifSummary] = useState({ push: true, email: true, sms: false });

  // Security
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  // Activity log
  const [activityLog, setActivityLog] = useState(MOCK_ACTIVITY);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // Refs
  const sseRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ─── Computed ───
  const settingsCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (settings[key] !== DEFAULT_SETTINGS[key]) count++;
    }
    return count;
  }, [settings]);

  const changeCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(settings)) {
      if (settings[key] !== originalSettings[key]) count++;
    }
    return count;
  }, [settings, originalSettings]);

  /* ─── Keyboard shortcut: Ctrl+, for settings search ─── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.target.closest('.settings-layout')) {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch]);

  /* ─── Fetch on mount ─── */
  useEffect(() => {
    fetchData();
    return () => { if (sseRef.current) sseRef.current.close(); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      apiFetch('/api/settings').then((r) => r.ok ? r.json() : null),
      apiFetch('/api/settings/storage').then((r) => r.ok ? r.json() : null),
      apiFetch('/api/two-factor/status').then((r) => r.ok ? r.json() : null),
      apiFetch('/api/notifications/preferences').then((r) => r.ok ? r.json() : null),
      fetch(buildApiUrl('/health')).then((r) => r.ok ? r.json() : null),
      apiFetch('/api/settings/sessions').then((r) => r.ok ? r.json() : null),
      apiFetch('/api/settings/activity').then((r) => r.ok ? r.json() : null),
    ]);

    // Settings
    const sd = results[0].status === 'fulfilled' && results[0].value?.settings
      ? { ...DEFAULT_SETTINGS, ...results[0].value.settings }
      : { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('caredroid-settings') || '{}') };
    setSettings(sd);
    setOriginalSettings(sd);
    syncFromSettings(sd);

    // Storage
    if (results[1].status === 'fulfilled' && results[1].value?.stats) setStorageStats(results[1].value.stats);

    // 2FA
    if (results[2].status === 'fulfilled' && results[2].value) {
      setTwoFaEnabled(results[2].value.enabled || results[2].value.twoFactorEnabled || false);
    }

    // Notifications
    if (results[3].status === 'fulfilled' && results[3].value) {
      const np = results[3].value.preferences || results[3].value;
      setNotifSummary({ push: np.pushEnabled ?? true, email: np.emailEnabled ?? true, sms: np.smsEnabled ?? false });
    }

    // Health
    if (results[4].status === 'fulfilled' && results[4].value) {
      setHealthStatus('online');
      setBackendUptime(results[4].value.uptime || null);
    } else {
      setHealthStatus('offline');
    }

    // Sessions
    if (results[5].status === 'fulfilled' && results[5].value?.sessions) {
      setSessions(results[5].value.sessions);
    }

    // Activity
    if (results[6].status === 'fulfilled' && results[6].value?.activities?.length) {
      setActivityLog(results[6].value.activities);
    }

    setLastSynced(new Date().toISOString());
    setLoading(false);
    connectSSE();
  };

  /* ─── SSE ─── */
  const connectSSE = () => {
    try {
      const es = new EventSource(buildApiUrl('/api/dashboard/stream'));
      sseRef.current = es;
      es.addEventListener('settings:sync', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
            setOriginalSettings((prev) => ({ ...prev, ...data.settings }));
            setDirty(false);
            setLastSynced(data.timestamp || new Date().toISOString());
            localStorage.setItem('caredroid-settings', JSON.stringify(data.settings));
            syncFromSettings(data.settings);
            showToast('Settings synced from another device', 'info');
          }
        } catch { /* ignore */ }
      });
    } catch { /* SSE not available */ }
  };

  /* ─── Dirty tracking ─── */
  useEffect(() => {
    setDirty(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  /* ─── Actions ─── */
  const showToast = useCallback((message, type = 'success', action = null) => {
    setToast({ message, type, action });
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('caredroid-settings', JSON.stringify(next));
      return next;
    });
    // Live-preview appearance changes globally
    if (APPEARANCE_KEYS.includes(key)) {
      updateAppearance(key, value);
    }
  }, [updateAppearance]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const prev = { ...originalSettings };
    try {
      const resp = await apiFetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (resp.ok) {
        const data = await resp.json();
        const saved = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : settings;
        setOriginalSettings(saved);
        setDirty(false);
        setLastSynced(new Date().toISOString());
        showToast(`${changeCount} setting${changeCount !== 1 ? 's' : ''} saved`, 'success', {
          label: 'Undo',
          onClick: () => {
            setSettings(prev);
            setOriginalSettings(prev);
            localStorage.setItem('caredroid-settings', JSON.stringify(prev));
            apiFetch('/api/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(prev),
            }).catch(() => {});
            syncFromSettings(prev);
            showToast('Changes reverted', 'info');
          },
        });
      } else {
        setOriginalSettings(settings);
        setDirty(false);
        showToast('Saved locally (backend unavailable)', 'info');
      }
    } catch {
      setOriginalSettings(settings);
      setDirty(false);
      showToast('Saved locally (offline)', 'info');
    } finally {
      setSaving(false);
    }
  }, [settings, originalSettings, changeCount, showToast]);

  const handleReset = useCallback(async () => {
    if (!window.confirm('Reset all settings to defaults? This cannot be undone.')) return;
    const prev = { ...settings };
    try {
      const resp = await apiFetch('/api/settings/reset', { method: 'DELETE' });
      if (resp.ok) {
        const data = await resp.json();
        const reset = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS;
        setSettings(reset);
        setOriginalSettings(reset);
        localStorage.setItem('caredroid-settings', JSON.stringify(reset));
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setOriginalSettings(DEFAULT_SETTINGS);
      localStorage.setItem('caredroid-settings', JSON.stringify(DEFAULT_SETTINGS));
    }
    setDirty(false);
    resetAppearance();
    showToast('Settings reset to defaults', 'success', {
      label: 'Undo',
      onClick: () => {
        setSettings(prev);
        setOriginalSettings(prev);
        localStorage.setItem('caredroid-settings', JSON.stringify(prev));
        apiFetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prev),
        }).catch(() => {});
        syncFromSettings(prev);
        showToast('Reset reverted', 'info');
      },
    });
  }, [settings, showToast, syncFromSettings, resetAppearance]);

  const handleExportSettings = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/settings/export-json');
      const data = resp.ok ? await resp.json() : { settings };
      const blob = new Blob([JSON.stringify(data.settings || settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caredroid-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Settings exported', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  }, [settings, showToast]);

  const handleImportSettings = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      // Filter to only allowed keys
      const filtered = {};
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        if (imported[key] !== undefined) filtered[key] = imported[key];
      }
      const resp = await apiFetch('/api/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtered),
      });
      if (resp.ok) {
        const data = await resp.json();
        const newSettings = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : { ...DEFAULT_SETTINGS, ...filtered };
        setSettings(newSettings);
        setOriginalSettings(newSettings);
        localStorage.setItem('caredroid-settings', JSON.stringify(newSettings));
        syncFromSettings(newSettings);
      } else {
        setSettings((prev) => ({ ...prev, ...filtered }));
        setOriginalSettings((prev) => ({ ...prev, ...filtered }));
      }
      showToast(`Imported ${Object.keys(filtered).length} settings`, 'success');
    } catch {
      showToast('Invalid settings file', 'error');
    }
    e.target.value = '';
  }, [showToast]);

  const handleExportData = useCallback(async () => {
    try { await apiFetch('/api/settings/export', { method: 'POST' }); } catch { /* ignore */ }
    showToast('Data export queued — you\'ll be notified when ready', 'success');
  }, [showToast]);

  const handleClearCache = useCallback(() => {
    if (!window.confirm('Clear all offline cached data? This cannot be undone.')) return;
    if (window.indexedDB) {
      window.indexedDB.databases?.().then((dbs) => {
        dbs.forEach((db) => { if (db.name) window.indexedDB.deleteDatabase(db.name); });
      }).catch(() => {});
    }
    showToast('Offline cache cleared', 'success');
  }, [showToast]);

  const handleTestNotification = useCallback(async () => {
    try { await apiFetch('/api/notifications/test', { method: 'POST' }); showToast('Test notification sent!', 'success'); }
    catch { showToast('Notification service unavailable', 'error'); }
  }, [showToast]);

  const handleRevokeSession = useCallback(async (sessionId) => {
    try {
      await apiFetch(`/api/settings/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast('Session revoked', 'success');
    } catch {
      showToast('Failed to revoke session', 'error');
    }
  }, [showToast]);

  /* ─── Search filter ─── */
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results = [];
    const allSettings = [
      { tab: 'appearance', label: 'Theme', key: 'theme' },
      { tab: 'appearance', label: 'Accent Color', key: 'accentColor' },
      { tab: 'appearance', label: 'Compact Mode', key: 'compactMode' },
      { tab: 'appearance', label: 'Font Size', key: 'fontSize' },
      { tab: 'appearance', label: 'Layout Density', key: 'density' },
      { tab: 'appearance', label: 'Safety Banner', key: 'safetyBanner' },
      { tab: 'appearance', label: 'Sound Effects', key: 'soundEffects' },
      { tab: 'appearance', label: 'Haptic Feedback', key: 'hapticFeedback' },
      { tab: 'appearance', label: 'Animate Charts', key: 'animateCharts' },
      { tab: 'appearance', label: 'Tooltips', key: 'showTooltips' },
      { tab: 'appearance', label: 'Language', key: 'language' },
      { tab: 'accessibility', label: 'High Contrast', key: 'highContrast' },
      { tab: 'accessibility', label: 'Reduced Motion', key: 'reducedMotion' },
      { tab: 'accessibility', label: 'Screen Reader', key: 'screenReader' },
      { tab: 'accessibility', label: 'Code Font', key: 'codeFont' },
      { tab: 'security', label: 'Auto Lock Timeout', key: 'autoLockMinutes' },
      { tab: 'security', label: 'Two-Factor Authentication' },
      { tab: 'security', label: 'Biometric Authentication' },
      { tab: 'security', label: 'Developer Mode', key: 'developerMode' },
      { tab: 'notifications', label: 'Push Notifications' },
      { tab: 'notifications', label: 'Email Notifications' },
      { tab: 'notifications', label: 'SMS Notifications' },
    ];
    for (const s of allSettings) {
      if (s.label.toLowerCase().includes(q) || s.tab.toLowerCase().includes(q)) {
        results.push(s);
      }
    }
    return results;
  }, [searchQuery]);

  /* ─── Activity log helpers ─── */
  const formatAction = (action) => {
    const map = {
      'settings.updated': '✏️ Settings changed',
      'settings.reset': '🔄 Reset to defaults',
      'settings.imported': '📥 Settings imported',
      'settings.exported': '📤 Settings exported',
      'cache.cleared': '🗑️ Cache cleared',
    };
    return map[action] || action;
  };

  const formatRelativeTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (loading) {
    return (
      <AppShell isAuthed={true} conversations={[]} activeConversation={null}
        onSelectConversation={() => {}} onNewConversation={() => {}} onSignOut={signOut} healthStatus="online">
        <SettingsSkeleton />
      </AppShell>
    );
  }

  /* ═══ RENDER ═══ */
  return (
    <AppShell
      isAuthed={true} conversations={[]} activeConversation={null}
      onSelectConversation={() => {}} onNewConversation={() => {}} onSignOut={signOut} healthStatus="online"
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>

          {/* ═══ HEADER ═══ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: `linear-gradient(135deg, ${alpha.primary(0.2)}, ${alpha.purple(0.2)})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>⚙️</div>
              <div>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: T.primary }}>{t('settings.title')}</h1>
                <p style={{ margin: 0, fontSize: '12px', color: T.muted }}>
                  {settingsCount > 0 ? `${settingsCount} customized` : 'All defaults'} · {dirty ? `${changeCount} unsaved` : 'Up to date'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Search toggle */}
              <button
                onClick={() => { setShowSearch(!showSearch); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                style={{
                  width: 32, height: 32, borderRadius: '8px', border: 'none',
                  background: showSearch ? alpha.primary(0.2) : S.hover,
                  color: showSearch ? colors.primaryLight : T.muted,
                  cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s',
                }}
                title="Search settings (Ctrl+F)"
              >🔍</button>

              {/* Import */}
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportSettings} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 32, height: 32, borderRadius: '8px', border: 'none',
                  background: S.hover, color: T.muted,
                  cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s',
                }}
                title="Import settings"
              >📥</button>

              {/* Export */}
              <button
                onClick={handleExportSettings}
                style={{
                  width: 32, height: 32, borderRadius: '8px', border: 'none',
                  background: S.hover, color: T.muted,
                  cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s',
                }}
                title="Export settings"
              >📤</button>

              {/* Sync indicator */}
              {lastSynced && (
                <span style={{ fontSize: '11px', color: T.ghost, marginLeft: '4px' }}>
                  {new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {dirty && <span className="settings-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: colors.warning }} />}
            </div>
          </div>

          {/* ═══ SEARCH BAR ═══ */}
          {showSearch && (
            <div className="settings-content-fade" style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                background: S.layer2, borderRadius: '10px',
                border: `1px solid ${alpha.primary(0.2)}`,
              }}>
                <span style={{ color: T.ghost }}>🔍</span>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('settings.searchPlaceholder')}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: T.primary, fontSize: '13px',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{
                    background: 'none', border: 'none', color: T.ghost,
                    cursor: 'pointer', fontSize: '14px',
                  }}>×</button>
                )}
              </div>
              {searchResults && searchResults.length > 0 && (
                <div style={{ marginTop: '8px', background: S.layer1, borderRadius: '10px', border: `1px solid ${B.subtle}`, overflow: 'hidden' }}>
                  {searchResults.slice(0, 8).map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveTab(r.tab); setShowSearch(false); setSearchQuery(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                        padding: '10px 14px', background: 'none', border: 'none',
                        borderBottom: i < searchResults.length - 1 ? `1px solid ${S.layer2}` : 'none',
                        color: T.primary, cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{TABS.find((t) => t.id === r.tab)?.icon}</span>
                      <span style={{ fontSize: '13px', flex: 1 }}>{r.label}</span>
                      <span style={{ fontSize: '11px', color: T.ghost }}>{r.tab}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults && searchResults.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: T.ghost, fontSize: '13px' }}>
                  No settings found for "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* ═══ 2-COLUMN LAYOUT ═══ */}
          <div style={{ display: 'flex', gap: '20px' }} className="settings-layout">

            {/* ═══ TAB BAR ═══ */}
            <div style={{ width: '200px', flexShrink: 0 }} className="settings-tabs">
              <div style={{
                position: 'sticky', top: '28px',
                background: S.layer0, borderRadius: '12px', padding: '6px',
                border: `1px solid ${B.subtle}`,
              }}>
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="settings-tab-btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: activeTab === tab.id ? alpha.primary(0.12) : 'transparent',
                      color: activeTab === tab.id ? T.primary : T.muted,
                      fontSize: '12px', fontWeight: activeTab === tab.id ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                      marginBottom: '2px',
                      borderLeft: activeTab === tab.id ? `2px solid ${colors.primary}` : '2px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>{tab.icon}</span>
                    <div>
                      <div>{t(`settings.tabs.${tab.id === 'storage' ? 'dataStorage' : tab.id}`)}</div>
                      <div style={{ fontSize: '10px', color: T.ghost, fontWeight: 400, marginTop: '1px' }}>{t(`settings.tabs.${tab.id === 'storage' ? 'dataStorage' : tab.id}Desc`)}</div>
                    </div>
                  </button>
                ))}

                {/* Activity log toggle */}
                <div style={{ borderTop: `1px solid ${B.subtle}`, marginTop: '8px', paddingTop: '8px' }}>
                  <button
                    onClick={() => setShowActivityLog(!showActivityLog)}
                    className="settings-tab-btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: showActivityLog ? alpha.purple(0.12) : 'transparent',
                      color: showActivityLog ? colors.purpleFaint : T.ghost,
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>📜</span>
                    <div>
                      <div>{t('settings.recentActivity')}</div>
                      <div style={{ fontSize: '10px', color: T.ghost, fontWeight: 400 }}>{t('settings.recentActivity')}</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ CONTENT PANEL ═══ */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* ─── Activity Log Drawer ─── */}
              {showActivityLog && (
                <div className="settings-content-fade" style={{ marginBottom: '16px' }}>
                  <SectionCard title={t('settings.recentActivity')} icon="📜" badge={`${activityLog.length}`}>
                    {activityLog.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: T.ghost, fontSize: '13px' }}>
                        {t('settings.noActivity')}
                      </div>
                    ) : (
                      <div>
                        {activityLog.slice(0, 10).map((entry, i) => {
                          let details = null;
                          try { details = entry.details ? JSON.parse(entry.details) : null; } catch { /* ignore */ }
                          return (
                            <div key={entry.id || i} style={{
                              display: 'flex', alignItems: 'flex-start', gap: '10px',
                              padding: '10px 0',
                              borderBottom: i < activityLog.length - 1 ? `1px solid ${S.layer2}` : 'none',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', color: T.secondary }}>
                                  {formatAction(entry.action)}
                                </div>
                                {details && typeof details === 'object' && !details.fieldCount && (
                                  <div style={{ fontSize: '11px', color: T.ghost, marginTop: '2px' }}>
                                    {Object.entries(details).map(([k, v]) => (
                                      <span key={k} style={{ marginRight: '10px' }}>
                                        {k}: <span style={{ color: alpha.error(0.7), textDecoration: 'line-through' }}>{String(v.from)}</span>
                                        {' → '}
                                        <span style={{ color: alpha.success(0.8) }}>{String(v.to)}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: '11px', color: T.ghost, flexShrink: 0 }}>
                                {formatRelativeTime(entry.createdAt)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ═══════ APPEARANCE TAB ═══════ */}
              {activeTab === 'appearance' && (
                <div className="settings-content-fade">
                  <SectionCard title={t('settings.theme.title')} icon="🎨">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateSetting('theme', opt.value)}
                          className="settings-theme-card"
                          style={{
                            padding: '14px 10px', borderRadius: '10px', border: 'none',
                            background: settings.theme === opt.value ? alpha.primary(0.12) : S.layer1,
                            outline: settings.theme === opt.value ? `2px solid ${colors.primary}` : `1px solid ${B.default}`,
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                          }}
                        >
                          {/* Mini preview */}
                          <div style={{
                            width: '100%', height: '40px', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', gap: '3px', padding: '4px',
                            background: opt.preview[0], border: `1px solid ${B.medium}`,
                          }}>
                            <div style={{ height: '8px', borderRadius: '3px', background: opt.preview[2], width: '60%' }} />
                            <div style={{ height: '6px', borderRadius: '3px', background: opt.preview[1], width: '80%' }} />
                            <div style={{ height: '6px', borderRadius: '3px', background: opt.preview[1], width: '50%' }} />
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: T.primary }}>{t(`settings.theme.${opt.value}`)}</div>
                          <div style={{ fontSize: '10px', color: T.ghost, marginTop: '2px' }}>{t(`settings.theme.${opt.value}Desc`)}</div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.accentColor')} icon="🎯">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {ACCENT_COLORS.map((ac) => (
                        <button
                          key={ac.value}
                          onClick={() => updateSetting('accentColor', ac.value)}
                          title={ac.label}
                          style={{
                            width: 36, height: 36, borderRadius: '10px', border: 'none',
                            background: ac.color, cursor: 'pointer',
                            outline: settings.accentColor === ac.value ? '3px solid #fff' : '2px solid transparent',
                            outlineOffset: '2px', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {settings.accentColor === ac.value && <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>✓</span>}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: T.ghost, marginTop: '8px' }}>
                      Active: {ACCENT_COLORS.find((a) => a.value === settings.accentColor)?.label || 'Blue'}
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.display.title')} icon="📐">
                    <SegmentedControl label={t('settings.display.fontSize')} options={FONT_SIZES} value={settings.fontSize} onChange={(v) => updateSetting('fontSize', v)} />
                    <SegmentedControl label={t('settings.display.layoutDensity')} options={DENSITY_OPTIONS} value={settings.density} onChange={(v) => updateSetting('density', v)} />
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: S.layer2, marginTop: '4px' }}>
                      <span style={{
                        fontSize: FONT_SIZES.find((f) => f.value === settings.fontSize)?.px || '14px',
                        color: T.secondary, lineHeight: 1.5,
                      }}>
                        {t('settings.display.preview')}
                      </span>
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.feedback.title')} icon="✨">
                    <Toggle checked={settings.soundEffects} onChange={(v) => updateSetting('soundEffects', v)} label={t('settings.feedback.soundEffects')} description={t('settings.feedback.soundEffectsDesc')} />
                    <Toggle checked={settings.hapticFeedback} onChange={(v) => updateSetting('hapticFeedback', v)} label={t('settings.feedback.hapticFeedback')} description={t('settings.feedback.hapticFeedbackDesc')} />
                    <Toggle checked={settings.animateCharts} onChange={(v) => updateSetting('animateCharts', v)} label={t('settings.feedback.animateCharts')} description={t('settings.feedback.animateChartsDesc')} />
                    <Toggle checked={settings.showTooltips} onChange={(v) => updateSetting('showTooltips', v)} label={t('settings.feedback.showTooltips')} description={t('settings.feedback.showTooltipsDesc')} />
                  </SectionCard>

                  <SectionCard title={t('settings.language')} icon="🌐">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => {
                            updateSetting('language', lang.value);
                            setLanguage(lang.value);
                            window.dispatchEvent(new CustomEvent('caredroid-language-change', { detail: { language: lang.value } }));
                          }}
                          style={{
                            padding: '10px 8px', borderRadius: '8px', border: 'none',
                            background: settings.language === lang.value ? alpha.primary(0.15) : S.layer1,
                            outline: settings.language === lang.value ? `1px solid ${alpha.primary(0.4)}` : `1px solid ${B.subtle}`,
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: '18px' }}>{lang.flag}</div>
                          <div style={{ fontSize: '10px', color: settings.language === lang.value ? T.primary : T.muted, marginTop: '2px', fontWeight: 500 }}>
                            {lang.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.clinical.title')} icon="🏥">
                    <Toggle checked={settings.safetyBanner} onChange={(v) => updateSetting('safetyBanner', v)} label={t('settings.clinical.safetyBanner')} description={t('settings.clinical.safetyBannerDesc')} accent={colors.warning} />
                  </SectionCard>
                </div>
              )}

              {/* ═══════ ACCESSIBILITY TAB ═══════ */}
              {activeTab === 'accessibility' && (
                <div className="settings-content-fade">
                  <SectionCard title={t('settings.accessibility.visual')} icon="👁️">
                    <Toggle checked={settings.highContrast} onChange={(v) => updateSetting('highContrast', v)} label={t('settings.accessibility.highContrast')} description={t('settings.accessibility.highContrastDesc')} />
                    <Toggle checked={settings.reducedMotion} onChange={(v) => updateSetting('reducedMotion', v)} label={t('settings.accessibility.reducedMotion')} description={t('settings.accessibility.reducedMotionDesc')} />
                  </SectionCard>

                  <SectionCard title={t('settings.accessibility.assistiveTech')} icon="🦮">
                    <Toggle checked={settings.screenReader} onChange={(v) => updateSetting('screenReader', v)} label={t('settings.accessibility.screenReader')} description={t('settings.accessibility.screenReaderDesc')} />
                    <SegmentedControl label="Code & data font" options={CODE_FONTS} value={settings.codeFont} onChange={(v) => updateSetting('codeFont', v)} />
                    <div style={{ padding: '10px 14px', borderRadius: '8px', background: S.layer2, marginTop: '4px' }}>
                      <code style={{
                        fontFamily: settings.codeFont === 'mono' ? '"Courier New", monospace' : settings.codeFont === 'dyslexic' ? '"OpenDyslexic", sans-serif' : 'inherit',
                        color: T.secondary, fontSize: '13px',
                      }}>
                        Patient.vitals.heartRate = 72; // bpm
                      </code>
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.accessibility.keyboardShortcuts')} icon="⌨️" collapsible defaultOpen={false}>
                    {KEYBOARD_SHORTCUTS.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: i < KEYBOARD_SHORTCUTS.length - 1 ? `1px solid ${S.layer2}` : 'none',
                      }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {s.keys.split(' + ').map((k, j) => (
                            <span key={j} style={{
                              padding: '2px 7px', borderRadius: '4px',
                              background: B.default, color: T.primary,
                              fontSize: '11px', fontFamily: 'monospace', fontWeight: 600,
                              border: `1px solid ${B.medium}`,
                            }}>{k}</span>
                          ))}
                        </div>
                        <span style={{ fontSize: '12px', color: T.muted }}>{t(`shortcuts.${s.key}`) || s.action}</span>
                      </div>
                    ))}
                  </SectionCard>

                  <SectionCard title={t('settings.accessibility.accessibilityScore')} icon="📊">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: `conic-gradient(${colors.success} ${(settings.highContrast ? 33 : 0) + (settings.reducedMotion ? 33 : 0) + (settings.screenReader ? 34 : 0)}%, ${B.default} 0)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', background: S.app,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 700, color: colors.success,
                        }}>
                          {(settings.highContrast ? 33 : 0) + (settings.reducedMotion ? 33 : 0) + (settings.screenReader ? 34 : 0)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                          {[settings.highContrast, settings.reducedMotion, settings.screenReader].filter(Boolean).length}/3 {t('settings.accessibility.featuresEnabled')}
                        </div>
                        <div style={{ fontSize: '11px', color: T.muted, marginTop: '2px' }}>
                          {settings.highContrast && settings.reducedMotion && settings.screenReader
                            ? t('settings.accessibility.maxAccessibility')
                            : t('settings.accessibility.enableMore')}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* ═══════ SECURITY TAB ═══════ */}
              {activeTab === 'security' && (
                <div className="settings-content-fade">
                  <SectionCard title={t('settings.security.sessionLock')} icon="⏱️">
                    <SegmentedControl label={t('settings.security.autoLockTimeout')} options={LOCK_OPTIONS} value={settings.autoLockMinutes} onChange={(v) => updateSetting('autoLockMinutes', v)} />
                    <div style={{ fontSize: '11px', color: T.ghost, marginTop: '-8px', marginBottom: '8px' }}>
                      {settings.autoLockMinutes === 0 ? `⚠️ ${t('settings.security.neverLock')}` : `${t('settings.security.locksAfter')} ${settings.autoLockMinutes} ${t('settings.security.minutesInactive')}`}
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.security.activeSessions')} icon="🖥️" badge={`${sessions.length}`}>
                    {sessions.map((sess) => (
                      <div key={sess.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0',
                        borderBottom: `1px solid ${B.subtle}`,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '8px',
                          background: sess.current ? alpha.success(0.15) : S.layer2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                        }}>
                          {sess.device === 'Mobile' ? '📱' : '🖥️'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: T.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {sess.browser} on {sess.device}
                            {sess.current && (
                              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: alpha.success(0.15), color: colors.success, fontWeight: 700 }}>
                                {t('settings.security.thisDevice')}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: T.ghost }}>
                            {sess.ip} · Last active {formatRelativeTime(sess.lastActive)}
                          </div>
                        </div>
                        {!sess.current && (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            style={{
                              padding: '4px 10px', borderRadius: '6px', border: `1px solid ${alpha.error(0.3)}`,
                              background: alpha.error(0.08), color: colors.errorLight,
                              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            {t('settings.security.revoke')}
                          </button>
                        )}
                      </div>
                    ))}
                  </SectionCard>

                  <SectionCard title={t('settings.security.authentication')} icon="🔐">
                    <LinkCard
                      icon="🔐" label={t('settings.security.twoFactor')}
                      description={t('settings.security.twoFactorDesc')}
                      status={twoFaEnabled ? t('settings.security.enabled') : t('settings.security.notSetUp')}
                      statusColor={twoFaEnabled ? colors.success : colors.warning}
                      onClick={() => navigate('/settings/2fa')}
                    />
                    <LinkCard
                      icon="👆" label={t('settings.security.biometric')}
                      description={t('settings.security.biometricDesc')}
                      status={biometricEnrolled ? t('settings.security.enrolled') : t('settings.security.available')}
                      statusColor={biometricEnrolled ? colors.success : T.muted}
                      onClick={() => navigate('/settings/biometric')}
                    />
                    <LinkCard
                      icon="🔑" label={t('settings.security.changePassword')}
                      description={t('settings.security.changePasswordDesc')}
                      onClick={() => navigate('/profile/settings?tab=security')}
                    />
                  </SectionCard>

                  <SectionCard title={t('settings.security.developer')} icon="🛠️">
                    <Toggle checked={settings.developerMode} onChange={(v) => updateSetting('developerMode', v)}
                      label={t('settings.security.developerMode')}
                      description={t('settings.security.developerModeDesc')}
                      accent={colors.purple}
                    />
                  </SectionCard>
                </div>
              )}

              {/* ═══════ NOTIFICATIONS TAB ═══════ */}
              {activeTab === 'notifications' && (
                <div className="settings-content-fade">
                  <SectionCard title={t('settings.notificationsTab.channels')} icon="📡">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      {[
                        { label: t('settings.notificationsTab.push'), enabled: notifSummary.push, icon: '🔔', color: colors.primary },
                        { label: t('settings.notificationsTab.email'), enabled: notifSummary.email, icon: '📧', color: colors.success },
                        { label: t('settings.notificationsTab.sms'), enabled: notifSummary.sms, icon: '📱', color: colors.purple },
                      ].map((ch) => (
                        <div key={ch.label} style={{
                          padding: '16px 12px', borderRadius: '10px', textAlign: 'center',
                          background: ch.enabled ? `${ch.color}10` : S.layer0,
                          border: `1px solid ${ch.enabled ? `${ch.color}30` : B.subtle}`,
                          transition: 'all 0.2s',
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '6px' }}>{ch.icon}</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: ch.enabled ? ch.color : T.ghost }}>
                            {ch.label}
                          </div>
                          <div style={{
                            fontSize: '10px', fontWeight: 600, marginTop: '4px',
                            padding: '2px 6px', borderRadius: '4px', display: 'inline-block',
                            background: ch.enabled ? `${ch.color}15` : S.layer2,
                            color: ch.enabled ? ch.color : T.ghost,
                          }}>
                            {ch.enabled ? t('settings.notificationsTab.active') : t('settings.notificationsTab.off')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.notificationsTab.manage')} icon="⚙️">
                    <LinkCard icon="🔔" label={t('settings.notificationsTab.fullPreferences')} description={t('settings.notificationsTab.fullPreferencesDesc')} onClick={() => navigate('/settings/notifications')} />
                    <button
                      onClick={handleTestNotification}
                      className="settings-action-btn"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        border: `1px solid ${alpha.primary(0.25)}`, background: alpha.primary(0.06),
                        color: colors.primaryLight, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      }}
                    >
                      <span>📤</span> {t('settings.notificationsTab.sendTest')}
                    </button>
                  </SectionCard>
                </div>
              )}

              {/* ═══════ DATA & STORAGE TAB ═══════ */}
              {activeTab === 'storage' && (
                <div className="settings-content-fade">
                  <SectionCard title={t('settings.data.storageBreakdown')} icon="📊">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <DonutChart
                        segments={[
                          { value: storageStats.analyticsEvents || 1, color: colors.primary },
                          { value: storageStats.auditLogs || 1, color: colors.success },
                          { value: storageStats.chatMessages || 1, color: colors.purple },
                          { value: storageStats.settingsChanges || 1, color: colors.warning },
                        ]}
                        size={110}
                        strokeWidth={12}
                      />
                      <div style={{ flex: 1 }}>
                        {[
                          { label: t('settings.data.analyticsEvents'), value: storageStats.analyticsEvents, color: colors.primary },
                          { label: t('settings.data.auditLogs'), value: storageStats.auditLogs, color: colors.success },
                          { label: t('settings.data.chatMessages'), value: storageStats.chatMessages, color: colors.purple },
                          { label: t('settings.data.settingsChanges'), value: storageStats.settingsChanges, color: colors.warning },
                        ].map((item) => (
                          <div key={item.label} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0',
                          }}>
                            <span style={{ width: 8, height: 8, borderRadius: '2px', background: item.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: '12px', color: T.secondary }}>{item.label}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: T.primary }}>{(item.value || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', color: T.muted }}>{t('settings.data.totalStorage')}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: T.primary }}>{storageStats.estimatedStorageMB} MB</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: B.subtle, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          background: `linear-gradient(90deg, ${colors.primary}, ${colors.purple}, ${colors.warning})`,
                          width: `${Math.min((storageStats.estimatedStorageMB / 50) * 100, 100)}%`,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title={t('settings.data.syncInfo')} icon="🔄">
                    <InfoRow label={t('settings.data.lastSync')} value={storageStats.lastSync ? new Date(storageStats.lastSync).toLocaleString() : 'Never'} />
                    <InfoRow label={t('settings.data.localStorage')} value={`${((JSON.stringify(localStorage).length || 0) / 1024).toFixed(1)} KB`} />
                  </SectionCard>

                  <SectionCard title={t('settings.data.actions')} icon="⚡">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button onClick={handleExportData} className="settings-action-btn" style={{
                        padding: '14px 12px', borderRadius: '8px', border: `1px solid ${alpha.primary(0.25)}`,
                        background: alpha.primary(0.06), color: colors.primaryLight, fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                      }}>
                        📥 {t('settings.data.exportAll')}
                      </button>
                      <button onClick={handleClearCache} className="settings-action-btn" style={{
                        padding: '14px 12px', borderRadius: '8px', border: `1px solid ${alpha.error(0.25)}`,
                        background: alpha.error(0.06), color: colors.errorLight, fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                      }}>
                        🗑️ {t('settings.data.clearCache')}
                      </button>
                    </div>
                  </SectionCard>
                </div>
              )}

              {/* ═══════ ABOUT TAB ═══════ */}
              {activeTab === 'about' && (
                <div className="settings-content-fade">
                  <SectionCard title={t('settings.about.application')} icon="📱">
                    <InfoRow label="App" value="CareDroid AI" />
                    <InfoRow label="Version" value="1.0.0" mono copyable />
                    <InfoRow label="Build" value={import.meta.env.MODE || 'development'} mono />
                    <InfoRow label="Environment" value={
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                        background: import.meta.env.PROD ? alpha.success(0.12) : alpha.primary(0.12),
                        color: import.meta.env.PROD ? colors.success : colors.primaryLight,
                      }}>
                        {import.meta.env.PROD ? 'Production' : 'Development'}
                      </span>
                    } />
                    <InfoRow label="React" value={React.version} mono />
                  </SectionCard>

                  <SectionCard title={t('settings.about.backendStatus')} icon="🖧">
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                      borderRadius: '8px', marginBottom: '12px',
                      background: healthStatus === 'online' ? alpha.success(0.06) : alpha.error(0.06),
                      border: `1px solid ${healthStatus === 'online' ? alpha.success(0.15) : alpha.error(0.15)}`,
                    }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: healthStatus === 'online' ? colors.success : colors.error,
                      }} className={healthStatus === 'online' ? 'settings-pulse' : ''} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: healthStatus === 'online' ? colors.success : colors.error }}>
                          {healthStatus === 'online' ? t('settings.about.allOnline') : t('settings.about.backendOffline')}
                        </div>
                        {backendUptime && (
                          <div style={{ fontSize: '11px', color: T.ghost }}>Uptime: {backendUptime}</div>
                        )}
                      </div>
                    </div>
                    <InfoRow label="API Base" value={buildApiUrl('/api')} mono copyable />
                  </SectionCard>

                  <SectionCard title={t('settings.about.quickLinks')} icon="🔗">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[
                        { icon: '📖', label: t('settings.about.documentation'), url: '#' },
                        { icon: '📋', label: t('settings.about.changelog'), url: '#' },
                        { icon: '🐛', label: t('settings.about.reportIssue'), url: '#' },
                        { icon: '🔒', label: t('settings.about.privacyPolicy'), url: '#' },
                        { icon: '📜', label: t('settings.about.termsOfService'), url: '#' },
                        { icon: '💬', label: t('settings.about.support'), url: '#' },
                      ].map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          className="settings-link-card"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                            borderRadius: '8px', background: S.layer1,
                            border: `1px solid ${B.subtle}`,
                            color: T.secondary, fontSize: '12px', textDecoration: 'none',
                            fontWeight: 500, transition: 'all 0.15s',
                          }}
                        >
                          <span>{link.icon}</span> {link.label}
                        </a>
                      ))}
                    </div>
                  </SectionCard>

                  <div style={{ textAlign: 'center', padding: '16px 0', color: B.strong, fontSize: '11px' }}>
                    CareDroid AI v1.0.0 © {new Date().getFullYear()} · {t('settings.about.footer')}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ═══ FOOTER ═══ */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '24px', padding: '16px 0',
            borderTop: `1px solid ${B.subtle}`,
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleReset} className="settings-action-btn" style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                background: 'transparent', color: T.ghost,
                border: `1px solid ${B.default}`, cursor: 'pointer',
              }}>
                {t('settings.resetDefaults')}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {dirty && (
                <span style={{ fontSize: '11px', color: T.ghost }}>
                  {changeCount} unsaved change{changeCount !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className={dirty ? 'settings-save-btn' : ''}
                style={{
                  padding: '10px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  background: dirty ? `linear-gradient(135deg, ${colors.primary}, ${colors.purple})` : S.hover,
                  color: dirty ? T.primary : T.ghost,
                  border: 'none', cursor: dirty ? 'pointer' : 'default',
                  transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
                  boxShadow: dirty ? `0 4px 20px ${alpha.primary(0.3)}` : 'none',
                }}
              >
                {saving ? t('settings.saving') : dirty ? `${t('settings.save')} (${changeCount})` : t('settings.saved')}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} action={toast.action} onDismiss={() => setToast(null)} />}
    </AppShell>
  );
};

export default Settings;
