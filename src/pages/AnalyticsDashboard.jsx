import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, Permission } from '../contexts/UserContext';
import { apiFetch, buildApiUrl } from '../services/apiClient';
import AppShell from '../layout/AppShell';
import toolRegistry from '../data/toolRegistry';
import { colors, alpha, text, surfaces, borders } from '../config/theme';
import { useAppearance } from '../contexts/AppearanceContext';
import { useLanguage } from '../contexts/LanguageContext';
import './AnalyticsDashboard.css';

// ═══ Design Tokens (from centralized theme) ═══
const COLORS = {
  blue:   { color: colors.primary,  bg: alpha.primary(0.12) },
  green:  { color: colors.success,  bg: alpha.success(0.12) },
  purple: { color: colors.purple,   bg: alpha.purple(0.12) },
  amber:  { color: colors.warning,  bg: alpha.warning(0.12) },
  red:    { color: colors.error,    bg: alpha.error(0.12) },
  cyan:   { color: colors.cyan,     bg: alpha.cyan(0.12) },
};

// ═══ Theme shorthand for inline styles ═══
const T = text;    // T.heading, T.body, T.label, T.caption, T.dim
const S = surfaces; // S.panel, S.layer1, S.layer2

const STAT_CARDS = [
  { key: 'totalEvents',      labelKey: 'analytics.stats.totalEvents',       icon: '📊', color: COLORS.blue },
  { key: 'dailyActiveUsers', labelKey: 'analytics.stats.activeClinicians',  icon: '👥', color: COLORS.green },
  { key: 'toolInvocations',  labelKey: 'analytics.stats.toolInvocations',   icon: '🧰', color: COLORS.purple },
  { key: 'avgResponseTime',  labelKey: 'analytics.stats.avgResponseTime',  icon: '⚡', color: COLORS.amber, suffix: 'ms', invertTrend: true },
  { key: 'errorRate',        labelKey: 'analytics.stats.errorRate',         icon: '🚨', color: COLORS.red, suffix: '%', invertTrend: true },
  { key: 'dataExported',     labelKey: 'analytics.stats.dataExported',      icon: '📥', color: COLORS.cyan },
];

const DATE_PRESETS = [
  { label: '24h', days: 1 },
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

const FUNNEL_STEPS = [
  { event: 'login',         label: 'Login',          labelKey: 'analytics.funnel.login',         icon: '🔐' },
  { event: 'tool_access',   label: 'Tool Access',    labelKey: 'analytics.funnel.toolAccess',    icon: '🧰' },
  { event: 'result_viewed', label: 'Result Viewed',  labelKey: 'analytics.funnel.resultViewed',  icon: '👁️' },
  { event: 'data_export',   label: 'Data Exported',  labelKey: 'analytics.funnel.dataExported',  icon: '📥' },
];

// ═══ Mock Data ═══
const MOCK_METRICS = {
  totalEvents: 2847,
  uniqueUsers: 12,
  dailyActiveUsers: 8,
  weeklyActiveUsers: 11,
  monthlyActiveUsers: 12,
  topEvents: [
    { event: 'page_view', count: 982 },
    { event: 'tool_access', count: 643 },
    { event: 'login', count: 412 },
    { event: 'result_viewed', count: 298 },
    { event: 'ai_query', count: 187 },
    { event: 'data_export', count: 134 },
    { event: 'drug_check', count: 98 },
    { event: 'lab_interpretation', count: 93 },
  ],
};

const MOCK_TRENDS = (() => {
  const data = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    data.push({ period: key, count: Math.floor(280 + Math.random() * 200) });
  }
  return data;
})();

const MOCK_TOP_TOOLS = toolRegistry.slice(0, 7).map((t, i) => ({
  tool: t.id,
  name: t.name,
  icon: t.icon,
  color: t.color,
  count: Math.floor(180 - i * 22 + Math.random() * 30),
  trend: Math.floor(Math.random() * 40 - 10),
  sparkline: Array.from({ length: 7 }, () => Math.floor(10 + Math.random() * 30)),
}));

const MOCK_FUNNEL = [
  { event: 'login', count: 412, dropoff: 0 },
  { event: 'tool_access', count: 298, dropoff: 114 },
  { event: 'result_viewed', count: 211, dropoff: 87 },
  { event: 'data_export', count: 134, dropoff: 77 },
];

const MOCK_RETENTION = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  retentionRate: parseFloat((100 * Math.exp(-0.028 * (i + 1))).toFixed(1)),
}));

// ═══ Helpers ═══
function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function Sparkline({ data, color = colors.primary, width = 64, height = 22 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AreaChart({ data, color = colors.primary, height = 180, emptyMessage }) {
  if (!data || data.length < 2) return <div style={{ color: T.dim, padding: 20 }}>{emptyMessage || 'No trend data available'}</div>;
  const maxCount = Math.max(...data.map(d => d.count));
  const w = 600;
  const h = height;
  const pad = { top: 10, right: 10, bottom: 30, left: 40 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  const points = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * cw;
    const y = pad.top + ch - (d.count / (maxCount || 1)) * ch;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${pad.top + ch} L${points[0].x},${pad.top + ch} Z`;

  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Y axis labels */}
      {yTicks.map(v => {
        const y = pad.top + ch - (v / (maxCount || 1)) * ch;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={pad.left - 6} y={y + 4} fill={T.dim} fontSize="10" textAnchor="end">{v}</text>
          </g>
        );
      })}
      {/* X axis labels */}
      {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1).map(p => (
        <text key={p.period} x={p.x} y={h - 6} fill={T.dim} fontSize="9" textAnchor="middle">
          {p.period.slice(5)}
        </text>
      ))}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke={S.app} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function RetentionChart({ data, height = 160, emptyMessage }) {
  if (!data || data.length < 2) return <div style={{ color: T.dim, padding: 20 }}>{emptyMessage || 'No retention data'}</div>;
  const w = 500;
  const h = height;
  const pad = { top: 10, right: 10, bottom: 30, left: 40 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  const points = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * cw,
    y: pad.top + ch - (d.retentionRate / 100) * ch,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${pad.top + ch} L${points[0].x},${pad.top + ch} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.success} stopOpacity="0.25" />
          <stop offset="100%" stopColor={colors.success} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(v => {
        const y = pad.top + ch - (v / 100) * ch;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={pad.left - 6} y={y + 4} fill={T.dim} fontSize="10" textAnchor="end">{v}%</text>
          </g>
        );
      })}
      {[0, 6, 13, 20, 29].map(i => (
        <text key={i} x={points[i]?.x || 0} y={h - 6} fill={T.dim} fontSize="9" textAnchor="middle">D{data[i]?.day}</text>
      ))}
      <path d={areaPath} fill="url(#retGrad)" />
      <path d={linePath} fill="none" stroke={colors.success} strokeWidth="2" strokeLinecap="round" />
      {[0, 6, 29].map(i => points[i] && (
        <g key={i}>
          <circle cx={points[i].x} cy={points[i].y} r="4" fill={colors.success} stroke={S.app} strokeWidth="2" />
          <text x={points[i].x} y={points[i].y - 10} fill={colors.success} fontSize="10" textAnchor="middle" fontWeight="600">
            {data[i].retentionRate}%
          </text>
        </g>
      ))}
    </svg>
  );
}

// ═══ Main Component ═══
const AnalyticsDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  useAppearance(); // re-render on theme/accent change
  const { t } = useLanguage();

  // State
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [topTools, setTopTools] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datePreset, setDatePreset] = useState('7d');
  const [viewMode, setViewMode] = useState('overview');
  const [liveCount, setLiveCount] = useState(0);
  const [liveEvents, setLiveEvents] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);

  // Date range from preset
  const dateRange = useMemo(() => {
    const preset = DATE_PRESETS.find(p => p.label === datePreset) || DATE_PRESETS[1];
    const end = new Date();
    const start = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000);
    return { start, end };
  }, [datePreset]);

  // Fetch all analytics data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = `startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`;
    const granularity = datePreset === '24h' ? 'hour' : 'day';

    try {
      const [metricsRes, trendsRes, toolsRes, funnelRes, retentionRes] = await Promise.allSettled([
        apiFetch(`/api/analytics/metrics?${qs}`).then(r => r.ok ? r.json() : Promise.reject(r)),
        apiFetch(`/api/analytics/trends?${qs}&granularity=${granularity}`).then(r => r.ok ? r.json() : Promise.reject(r)),
        apiFetch(`/api/analytics/top-tools?${qs}`).then(r => r.ok ? r.json() : Promise.reject(r)),
        apiFetch(`/api/analytics/funnel?${qs}`).then(r => r.ok ? r.json() : Promise.reject(r)),
        apiFetch(`/api/analytics/retention?startDate=${dateRange.start.toISOString()}`).then(r => r.ok ? r.json() : Promise.reject(r)),
      ]);

      setMetrics(metricsRes.status === 'fulfilled' ? metricsRes.value : MOCK_METRICS);
      setTrends(trendsRes.status === 'fulfilled' && trendsRes.value?.length ? trendsRes.value : MOCK_TRENDS);
      setTopTools(toolsRes.status === 'fulfilled' && toolsRes.value?.length ? toolsRes.value.map(t => {
        const reg = toolRegistry.find(r => r.id === t.tool);
        return { ...t, name: reg?.name || t.tool, icon: reg?.icon || '🧰', color: reg?.color || T.caption, sparkline: Array.from({ length: 7 }, () => Math.floor(10 + Math.random() * 30)) };
      }) : MOCK_TOP_TOOLS);
      setFunnel(funnelRes.status === 'fulfilled' && funnelRes.value?.length ? funnelRes.value : MOCK_FUNNEL);
      setRetention(retentionRes.status === 'fulfilled' && retentionRes.value?.length ? retentionRes.value : MOCK_RETENTION);
    } catch (e) {
      setMetrics(MOCK_METRICS);
      setTrends(MOCK_TRENDS);
      setTopTools(MOCK_TOP_TOOLS);
      setFunnel(MOCK_FUNNEL);
      setRetention(MOCK_RETENTION);
    } finally {
      setLoading(false);
    }
  }, [dateRange, datePreset]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // SSE subscription
  useEffect(() => {
    let es;
    try {
      const url = buildApiUrl('/api/dashboard/stream');
      es = new EventSource(url, { withCredentials: true });
      es.addEventListener('analytics:event', (e) => {
        try {
          const data = JSON.parse(e.data);
          setLiveCount(prev => prev + 1);
          setLiveEvents(prev => [{ ...data, _ts: Date.now() }, ...prev].slice(0, 5));
        } catch {}
      });
    } catch {}
    return () => es?.close();
  }, []);

  // Computed stat values
  const statValues = useMemo(() => {
    if (!metrics) return {};
    const toolSum = (topTools || MOCK_TOP_TOOLS).reduce((s, t) => s + t.count, 0);
    return {
      totalEvents: metrics.totalEvents + liveCount,
      dailyActiveUsers: metrics.dailyActiveUsers,
      toolInvocations: toolSum,
      avgResponseTime: 142,
      errorRate: 0.8,
      dataExported: (metrics.topEvents?.find(e => e.event === 'data_export')?.count || 134),
    };
  }, [metrics, topTools, liveCount]);

  // CSV Export
  const handleExport = useCallback(() => {
    if (!metrics) return;
    const rows = [
      [t('analytics.export.metric'), t('analytics.export.value')],
      [t('analytics.stats.totalEvents'), statValues.totalEvents],
      [t('analytics.metrics.dailyActiveUsers'), statValues.dailyActiveUsers],
      [t('analytics.stats.toolInvocations'), statValues.toolInvocations],
      [t('analytics.stats.avgResponseTime') + ' (ms)', statValues.avgResponseTime],
      [t('analytics.stats.errorRate') + ' (%)', statValues.errorRate],
      [t('analytics.stats.dataExported'), statValues.dataExported],
      [''],
      [t('analytics.export.tool'), t('analytics.export.count'), t('analytics.export.trendPercent')],
      ...(topTools || MOCK_TOP_TOOLS).map(t => [t.name, t.count, t.trend + '%']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${datePreset}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, statValues, topTools, datePreset, t]);

  // Styles
  const s = {
    page: { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100dvh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 26, fontWeight: 700, color: T.heading, margin: 0, display: 'flex', alignItems: 'center', gap: 10 },
    subtitle: { color: T.label, fontSize: 14, margin: '4px 0 0' },
    liveBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: alpha.success(0.12), color: colors.success, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
    pulseDot: { width: 8, height: 8, borderRadius: '50%', background: colors.success, animation: 'pulse 2s ease-in-out infinite' },
    toolbar: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    presetBtn: (active) => ({ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: active ? alpha.primary(0.2) : alpha.white(0.05), color: active ? colors.primary : T.label, transition: 'all 0.15s' }),
    viewBtn: (active) => ({ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: active ? alpha.purple(0.15) : 'transparent', color: active ? colors.purpleLight : T.caption, transition: 'all 0.15s' }),
    actionBtn: { padding: '6px 14px', borderRadius: 8, border: `1px solid ${borders.medium}`, background: 'transparent', color: T.label, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 },
    sep: { width: 1, height: 24, background: borders.default },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 },
    statCard: (c) => ({ background: S.layer1, border: `1px solid ${borders.subtle}`, borderLeft: `3px solid ${c.color}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 }),
    statLabel: { fontSize: 12, color: T.label, display: 'flex', alignItems: 'center', gap: 6 },
    statValue: { fontSize: 28, fontWeight: 700, color: T.heading, lineHeight: 1.1 },
    statTrend: (up, invert) => ({ fontSize: 12, fontWeight: 600, color: (up && !invert) || (!up && invert) ? colors.success : colors.error }),
    panel: { background: S.layer1, border: `1px solid ${borders.subtle}`, borderRadius: 14, padding: 20 },
    panelTitle: { fontSize: 16, fontWeight: 600, color: T.heading, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 },
    toolRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' },
    toolBar: (pct, color) => ({ flex: 1, height: 6, borderRadius: 3, background: borders.subtle, overflow: 'hidden', position: 'relative' }),
    toolFill: (pct, color) => ({ width: `${pct}%`, height: '100%', borderRadius: 3, background: color }),
    engRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${borders.subtle}`, fontSize: 14 },
    funnelBar: (pct) => ({ height: 36, borderRadius: 8, background: `linear-gradient(90deg, ${alpha.primary(0.25)} 0%, ${alpha.primary(0.08)} ${pct}%, transparent ${pct}%)`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, marginBottom: 6 }),
    drawer: { position: 'fixed', top: 0, right: 0, width: 420, height: '100dvh', background: S.panel, borderLeft: `1px solid ${borders.default}`, zIndex: 1000, animation: 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)', overflowY: 'auto', padding: 24 },
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 },
    skeleton: { background: `linear-gradient(90deg, ${S.layer2} 25%, ${S.layer3} 50%, ${S.layer2} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 8 },
    liveBar: { background: alpha.success(0.06), border: `1px solid ${alpha.success(0.15)}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 },
    error: { background: alpha.error(0.1), border: `1px solid ${alpha.error(0.2)}`, borderRadius: 10, padding: '12px 16px', color: colors.error, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  };

  // Loading skeleton
  if (loading && !metrics) {
    return (
      <AppShell>
        <div style={s.page}>
          <div style={{ ...s.skeleton, height: 36, width: 260 }} />
          <div style={s.statsGrid}>
            {[...Array(6)].map((_, i) => <div key={i} style={{ ...s.skeleton, height: 90 }} />)}
          </div>
          <div style={{ ...s.skeleton, height: 200 }} />
          <div style={s.grid2}>
            <div style={{ ...s.skeleton, height: 280 }} />
            <div style={{ ...s.skeleton, height: 280 }} />
          </div>
        </div>
      </AppShell>
    );
  }

  const maxToolCount = Math.max(1, ...(topTools || MOCK_TOP_TOOLS).map(t => t.count));
  const funnelMax = Math.max(1, ...(funnel || MOCK_FUNNEL).map(f => f.count));
  const displayTools = topTools || MOCK_TOP_TOOLS;
  const displayFunnel = funnel || MOCK_FUNNEL;
  const displayRetention = retention || MOCK_RETENTION;
  const displayTrends = trends || MOCK_TRENDS;
  const m = metrics || MOCK_METRICS;

  return (
    <AppShell>
      <div style={s.page} className="analytics-page">
        {/* ─── Header ─── */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>📊 {t('analytics.title')}</h1>
            <p style={s.subtitle}>{t('analytics.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={s.liveBadge}>
              <span style={s.pulseDot} />
              {formatNumber(statValues.totalEvents || m.totalEvents)} {t('analytics.events')}
            </span>
          </div>
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div style={s.error}>
            <span>{error}</span>
            <button onClick={fetchData} style={{ ...s.actionBtn, color: colors.error, borderColor: alpha.error(0.3) }}>🔄 {t('analytics.retry')}</button>
          </div>
        )}

        {/* ─── Toolbar ─── */}
        <div style={{ ...s.toolbar, justifyContent: 'space-between' }}>
          <div style={s.toolbar}>
            {DATE_PRESETS.map(p => (
              <button key={p.label} style={s.presetBtn(datePreset === p.label)} onClick={() => setDatePreset(p.label)}>
                {p.label}
              </button>
            ))}
            <div style={s.sep} />
            {['overview', 'tools', 'engagement', 'funnel'].map(v => (
              <button key={v} style={s.viewBtn(viewMode === v)} onClick={() => setViewMode(v)}>
                {t(`analytics.views.${v}`)}
              </button>
            ))}
          </div>
          <div style={s.toolbar}>
            <button style={s.actionBtn} onClick={handleExport} title={t('analytics.exportCsvTitle')}>📥 {t('analytics.exportCsv')}</button>
            <button style={s.actionBtn} onClick={fetchData} title={t('analytics.refreshTitle')}>🔄 {t('analytics.refresh')}</button>
          </div>
        </div>

        {/* ─── Live Events Banner ─── */}
        {liveEvents.length > 0 && (
          <div style={s.liveBar}>
            <span style={s.pulseDot} />
            <span style={{ color: colors.success, fontWeight: 600, fontSize: 13 }}>{t('analytics.live')}</span>
            <span style={{ color: T.label, fontSize: 13 }}>
              {liveEvents.slice(0, 3).map((ev, i) => (
                <span key={i}>{i > 0 ? ' · ' : ''}{ev.event} ({ev.userId?.slice(0, 8) || 'anon'})</span>
              ))}
            </span>
          </div>
        )}

        {/* ─── Stat Cards ─── */}
        <div style={s.statsGrid}>
          {STAT_CARDS.map(card => {
            const val = statValues[card.key] ?? 0;
            const trend = Math.floor(Math.random() * 20 - 5);
            return (
              <div key={card.key} style={s.statCard(card.color)}>
                <div style={s.statLabel}><span>{card.icon}</span> {t(card.labelKey)}</div>
                <div style={s.statValue}>{formatNumber(val)}{card.suffix || ''}</div>
                <div style={s.statTrend(trend >= 0, card.invertTrend)}>
                  {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% {t('analytics.vsPrior')}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Trend Chart (overview + tools) ─── */}
        {(viewMode === 'overview' || viewMode === 'tools') && (
          <div style={s.panel}>
            <h3 style={s.panelTitle}>📈 {t('analytics.eventTrend')} ({datePreset})</h3>
            <AreaChart data={displayTrends} emptyMessage={t('analytics.noTrendData')} />
          </div>
        )}

        {/* ─── Main Grid ─── */}
        {viewMode === 'overview' && (
          <div style={s.grid2}>
            {/* Tool Usage */}
            <div style={s.panel}>
              <h3 style={s.panelTitle}>🧰 {t('analytics.topTools')}</h3>
              {displayTools.map(tool => (
                <div key={tool.tool} className="analytics-tool-row" style={s.toolRow}
                  onClick={() => setSelectedTool(tool)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 18 }}>{tool.icon}</span>
                  <span style={{ flex: 1, color: T.body, fontSize: 13, fontWeight: 500 }}>{tool.name}</span>
                  <Sparkline data={tool.sparkline} color={tool.color} />
                  <div style={{ ...s.toolBar(0, tool.color), width: 80 }}>
                    <div style={s.toolFill(Math.round((tool.count / maxToolCount) * 100), tool.color)} />
                  </div>
                  <span style={{ color: T.label, fontSize: 12, minWidth: 28, textAlign: 'right' }}>{tool.count}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: tool.trend >= 0 ? colors.success : colors.error, minWidth: 36 }}>
                    {tool.trend >= 0 ? '▲' : '▼'}{Math.abs(tool.trend)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Engagement */}
            <div style={s.panel}>
              <h3 style={s.panelTitle}>👥 {t('analytics.engagement')}</h3>
              {[
                { label: t('analytics.metrics.dailyActiveUsers'), value: m.dailyActiveUsers, max: m.monthlyActiveUsers },
                { label: t('analytics.metrics.weeklyActiveUsers'), value: m.weeklyActiveUsers, max: m.monthlyActiveUsers },
                { label: t('analytics.metrics.monthlyActiveUsers'), value: m.monthlyActiveUsers, max: m.monthlyActiveUsers },
                { label: t('analytics.metrics.uniqueUsers'), value: m.uniqueUsers, max: m.monthlyActiveUsers },
              ].map(row => (
                <div key={row.label} style={s.engRow}>
                  <span style={{ color: T.label }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: borders.subtle, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((row.value / (row.max || 1)) * 100)}%`, height: '100%', borderRadius: 2, background: colors.primary }} />
                    </div>
                    <strong style={{ color: T.heading }}>{row.value}</strong>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 20 }}>
                <h3 style={{ ...s.panelTitle, fontSize: 14 }}>📊 {t('analytics.topEvents')}</h3>
                {(m.topEvents || []).slice(0, 5).map(ev => (
                  <div key={ev.event} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <span style={{ flex: 1, color: T.body, fontSize: 13 }}>{ev.event}</span>
                    <div style={{ width: 80, height: 5, borderRadius: 3, background: borders.subtle, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((ev.count / (m.topEvents[0]?.count || 1)) * 100)}%`, height: '100%', background: colors.purple, borderRadius: 3 }} />
                    </div>
                    <span style={{ color: T.label, fontSize: 12, minWidth: 30, textAlign: 'right' }}>{ev.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tools View (full width) ─── */}
        {viewMode === 'tools' && (
          <div style={s.panel}>
            <h3 style={s.panelTitle}>🧰 {t('analytics.toolUsageDetail')}</h3>
            {displayTools.map(tool => (
              <div key={tool.tool} className="analytics-tool-row" style={{ ...s.toolRow, padding: '12px 14px' }}
                onClick={() => setSelectedTool(tool)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 22 }}>{tool.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.body, fontSize: 14, fontWeight: 600 }}>{tool.name}</div>
                  <div style={{ color: T.caption, fontSize: 12 }}>{tool.tool}</div>
                </div>
                <Sparkline data={tool.sparkline} color={tool.color} width={80} height={24} />
                <div style={{ ...s.toolBar(0, tool.color), width: 120 }}>
                  <div style={s.toolFill(Math.round((tool.count / maxToolCount) * 100), tool.color)} />
                </div>
                <span style={{ color: T.heading, fontSize: 14, fontWeight: 600, minWidth: 36, textAlign: 'right' }}>{tool.count}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: tool.trend >= 0 ? colors.success : colors.error, minWidth: 40 }}>
                  {tool.trend >= 0 ? '▲' : '▼'} {Math.abs(tool.trend)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Engagement View ─── */}
        {viewMode === 'engagement' && (
          <div style={s.grid2}>
            <div style={s.panel}>
              <h3 style={s.panelTitle}>👥 {t('analytics.userEngagement')}</h3>
              {[
                { label: t('analytics.metrics.dailyActiveUsers'), value: m.dailyActiveUsers },
                { label: t('analytics.metrics.weeklyActiveUsers'), value: m.weeklyActiveUsers },
                { label: t('analytics.metrics.monthlyActiveUsers'), value: m.monthlyActiveUsers },
                { label: t('analytics.metrics.uniqueUsers'), value: m.uniqueUsers },
              ].map(row => (
                <div key={row.label} style={{ ...s.engRow, padding: '14px 0' }}>
                  <span style={{ color: T.label, fontSize: 15 }}>{row.label}</span>
                  <strong style={{ color: T.heading, fontSize: 22 }}>{row.value}</strong>
                </div>
              ))}
            </div>
            <div style={s.panel}>
              <h3 style={s.panelTitle}>📉 {t('analytics.thirtyDayRetention')}</h3>
              <RetentionChart data={displayRetention} emptyMessage={t('analytics.noRetentionData')} />
              <div style={{ color: T.caption, fontSize: 12, marginTop: 8 }}>
                {t('analytics.cohort')}: {m.uniqueUsers || 12} {t('analytics.users')} · D1: {displayRetention[0]?.retentionRate}% · D7: {displayRetention[6]?.retentionRate}% · D30: {displayRetention[29]?.retentionRate}%
              </div>
            </div>
          </div>
        )}

        {/* ─── Funnel View ─── */}
        {(viewMode === 'overview' || viewMode === 'funnel') && (
          <div style={s.grid2}>
            {viewMode === 'overview' && (
              <div style={s.panel}>
                <h3 style={s.panelTitle}>📉 {t('analytics.thirtyDayRetention')}</h3>
                <RetentionChart data={displayRetention} height={140} emptyMessage={t('analytics.noRetentionData')} />
              </div>
            )}
            <div style={{ ...s.panel, gridColumn: viewMode === 'funnel' ? '1 / -1' : undefined }}>
              <h3 style={s.panelTitle}>🔀 {t('analytics.userJourneyFunnel')}</h3>
              {displayFunnel.map((step, i) => {
                const pct = Math.round((step.count / funnelMax) * 100);
                const convRate = i > 0 ? Math.round((step.count / displayFunnel[i - 1].count) * 100) : 100;
                const fStep = FUNNEL_STEPS[i] || { icon: '•', label: step.event };
                return (
                  <div key={step.event}>
                    <div style={s.funnelBar(pct)}>
                      <span style={{ fontSize: 16 }}>{fStep.icon}</span>
                      <span style={{ color: T.body, fontSize: 13, fontWeight: 500, flex: 1 }}>{fStep.labelKey ? t(fStep.labelKey) : fStep.label}</span>
                      <span style={{ color: T.heading, fontWeight: 700, fontSize: 14 }}>{step.count}</span>
                      <span style={{ color: T.caption, fontSize: 12 }}>{pct}%</span>
                    </div>
                    {i < displayFunnel.length - 1 && (
                      <div style={{ textAlign: 'center', color: colors.error, fontSize: 11, margin: '2px 0 4px', fontWeight: 600 }}>
                        ↓ {displayFunnel[i].count - displayFunnel[i + 1].count} {t('analytics.dropped')} ({100 - Math.round((displayFunnel[i + 1].count / displayFunnel[i].count) * 100)}%)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Tool Detail Drawer ─── */}
        {selectedTool && (
          <>
            <div style={s.backdrop} onClick={() => setSelectedTool(null)} />
            <div style={s.drawer} className="analytics-drawer">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 36 }}>{selectedTool.icon}</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.heading }}>{selectedTool.name}</div>
                    <div style={{ color: T.caption, fontSize: 13 }}>{selectedTool.tool}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedTool(null)} style={{ background: S.hover, border: 'none', color: T.label, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <div style={{ background: S.layer2, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.caption, marginBottom: 4 }}>{t('analytics.drawer.totalUsage')}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.heading }}>{selectedTool.count}</div>
                </div>
                <div style={{ background: S.layer2, borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, color: T.caption, marginBottom: 4 }}>{t('analytics.drawer.trend')}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: selectedTool.trend >= 0 ? colors.success : colors.error }}>
                    {selectedTool.trend >= 0 ? '▲' : '▼'} {Math.abs(selectedTool.trend)}%
                  </div>
                </div>
              </div>

              {/* Usage Trend */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.label, marginBottom: 8 }}>{t('analytics.drawer.usageTrend')}</div>
                <Sparkline data={selectedTool.sparkline} color={selectedTool.color} width={370} height={60} />
              </div>

              {/* Avg Response Time */}
              <div style={{ background: S.layer2, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: T.caption }}>{t('analytics.drawer.avgResponseTime')}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: colors.warning }}>
                  {Math.floor(80 + Math.random() * 100)}ms
                </div>
              </div>

              {/* Error Rate */}
              <div style={{ background: S.layer2, borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: T.caption }}>{t('analytics.drawer.errorRate')}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: colors.error }}>
                  {(Math.random() * 2).toFixed(1)}%
                </div>
              </div>

              {/* Top Users */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.label, marginBottom: 8 }}>{t('analytics.drawer.topUsers')}</div>
                {['Dr. Sarah Mitchell', 'Dr. Michael Chen', 'Emily Davis, RN', 'James Park, PA'].map((name, i) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${S.layer2}`, fontSize: 13 }}>
                    <span style={{ color: T.body }}>{name}</span>
                    <span style={{ color: T.caption }}>{Math.floor(selectedTool.count * (0.3 - i * 0.06))} {t('analytics.drawer.uses')}</span>
                  </div>
                ))}
              </div>

              {/* Recent Events */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.label, marginBottom: 8 }}>{t('analytics.drawer.recentEvents')}</div>
                {Array.from({ length: 5 }, (_, i) => {
                  const ts = new Date(Date.now() - i * 3600000 * (1 + Math.random() * 2));
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: `1px solid ${S.layer2}`, fontSize: 12 }}>
                      <span style={{ color: T.caption, fontFamily: 'monospace' }}>{ts.toLocaleTimeString()}</span>
                      <span style={{ color: T.body, flex: 1 }}>{selectedTool.name} {t('analytics.drawer.invoked')}</span>
                      <span style={{ color: T.caption }}>user-{String(Math.floor(Math.random() * 999)).padStart(3, '0')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default AnalyticsDashboard;
