/**
 * CareDroid AI — Centralized Design Token System
 * ═══════════════════════════════════════════════════
 *
 * Single source of truth for ALL colors, gradients, shadows, and borders
 * used across the application. Every page component imports from here.
 *
 * Usage:
 *   import { colors, gradients, alpha, surfaces, borders } from '../config/theme';
 *
 * NOTE: These tokens mirror the CSS custom properties in index.css.
 * If you change a value here, update index.css to match (and vice versa).
 */

/* ═══════════════════════════════════════════════════
   CORE PALETTE — raw color values
   ═══════════════════════════════════════════════════ */

const palette = {
  // ── Blues ──
  blue50:   '#EFF6FF',
  blue100:  '#DBEAFE',
  blue200:  '#BFDBFE',
  blue300:  '#93C5FD',
  blue400:  '#60A5FA',
  blue500:  '#3B82F6',
  blue600:  '#2563EB',
  blue700:  '#1D4ED8',

  // ── Greens ──
  emerald50:  '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald200: '#A7F3D0',
  emerald300: '#6EE7B7',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',

  // ── Reds ──
  red50:   '#FEF2F2',
  red100:  '#FEE2E2',
  red200:  '#FECACA',
  red300:  '#FCA5A5',
  red400:  '#F87171',
  red500:  '#EF4444',
  red600:  '#DC2626',
  red700:  '#B91C1C',

  // ── Ambers ──
  amber50:  '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',

  // ── Purples ──
  purple50:  '#F5F3FF',
  purple100: '#EDE9FE',
  purple200: '#DDD6FE',
  purple300: '#C4B5FD',
  purple400: '#A78BFA',
  purple500: '#8B5CF6',
  purple600: '#7C3AED',
  purple700: '#6D28D9',

  // ── Cyans ──
  cyan50:  '#ECFEFF',
  cyan100: '#CFFAFE',
  cyan200: '#A5F3FC',
  cyan400: '#22D3EE',
  cyan500: '#06B6D4',
  cyan600: '#0891B2',

  // ── Rose ──
  rose400: '#FB7185',
  rose500: '#F43F5E',
  rose600: '#E11D48',

  // ── Oranges ──
  orange500: '#F97316',
  orange600: '#EA580C',

  // ── Neutrals (dark mode backgrounds) ──
  navy:       '#0b1220',
  navyLight:  '#0f1724',
  slate900:   '#0f172a',
  slate800:   '#1e293b',
  slate700:   '#334155',
  slate600:   '#475569',
  slate500:   '#64748B',
  slate400:   '#94A3B8',
  slate300:   '#CBD5E1',
  slate200:   '#E2E8F0',
  slate100:   '#F1F5F9',
  slate50:    '#F8FAFC',
  white:      '#ffffff',

  // ── Neon accents (dark-mode sparkle) ──
  neonGreen: '#00ff88',
  neonCyan:  '#00ffff',
};


/* ═══════════════════════════════════════════════════
   SEMANTIC COLORS — purpose-driven tokens
   ═══════════════════════════════════════════════════ */

export const colors = {
  // ── Brand / Primary ──
  primary:        palette.blue500,     // #3B82F6
  primaryLight:   palette.blue400,     // #60A5FA — hover text, links
  primaryDark:    palette.blue600,     // #2563EB — pressed state
  primaryFaint:   palette.blue700,     // #1D4ED8

  // ── Semantic status ──
  success:        palette.emerald500,  // #10B981
  successDark:    palette.emerald600,  // #059669
  successLight:   palette.emerald400,  // #34D399
  warning:        palette.amber500,    // #F59E0B
  warningDark:    palette.amber600,    // #D97706
  error:          palette.red500,      // #EF4444
  errorDark:      palette.red600,      // #DC2626
  errorLight:     palette.red400,      // #F87171
  info:           palette.blue500,     // #3B82F6 (same as primary)

  // ── Accent ──
  purple:         palette.purple500,   // #8B5CF6
  purpleDark:     palette.purple600,   // #7C3AED
  purpleLight:    palette.purple400,   // #A78BFA
  purpleFaint:    palette.purple300,   // #C4B5FD
  cyan:           palette.cyan500,     // #06B6D4
  rose:           palette.rose500,     // #F43F5E
  orange:         palette.orange600,   // #EA580C

  // ── Neon accents (dark mode accent pops) ──
  neonGreen:      palette.neonGreen,   // #00ff88
  neonCyan:       palette.neonCyan,    // #00ffff

  // ── Emergency triage ──
  emergencyCritical: palette.red600,   // #DC2626
  emergencyUrgent:   palette.orange600, // #EA580C
  emergencyModerate: palette.amber600, // #D97706
};


/* ═══════════════════════════════════════════════════
   ALPHA — semi-transparent overlays per color
   ═══════════════════════════════════════════════════
   Usage: alpha.primary(0.15) → 'rgba(59,130,246,0.15)'
*/

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

const makeAlpha = (hex) => (opacity) => `rgba(${hexToRgb(hex)},${opacity})`;

export const alpha = {
  primary:   makeAlpha(palette.blue500),    // alpha.primary(0.12)
  success:   makeAlpha(palette.emerald500), // alpha.success(0.15)
  warning:   makeAlpha(palette.amber500),   // alpha.warning(0.12)
  error:     makeAlpha(palette.red500),     // alpha.error(0.12)
  purple:    makeAlpha(palette.purple500),  // alpha.purple(0.12)
  cyan:      makeAlpha(palette.cyan500),    // alpha.cyan(0.12)
  rose:      makeAlpha(palette.rose500),    // alpha.rose(0.12)
  neonGreen: makeAlpha(palette.neonGreen),  // alpha.neonGreen(0.2)
  neonCyan:  makeAlpha(palette.neonCyan),   // alpha.neonCyan(0.1)
  white:     (opacity) => `rgba(255,255,255,${opacity})`,
  black:     (opacity) => `rgba(0,0,0,${opacity})`,
};


/* ═══════════════════════════════════════════════════
   TEXT COLORS — theme-aware via CSS custom properties
   ═══════════════════════════════════════════════════
   These getters read live CSS vars so they respond to .theme-light / .theme-dark.
   Falls back to dark-mode values if no CSS var is set.
*/

/* helper – reads a CSS custom property from <html> */
function cssVar(prop, fallback) {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return v || fallback;
}

export const text = {
  get primary()   { return cssVar('--text-primary', '#fff'); },
  get secondary() { return cssVar('--text-secondary', 'rgba(255,255,255,0.7)'); },
  get tertiary()  { return cssVar('--text-tertiary', 'rgba(255,255,255,0.5)'); },
  get muted()     { return cssVar('--text-muted', 'rgba(255,255,255,0.35)'); },
  get ghost()     { return cssVar('--text-color', 'rgba(255,255,255,0.2)'); },

  // ── Tailwind Slate hex equivalents (fixed chart/SVG contexts)
  heading:   '#F1F5F9',
  body:      '#E2E8F0',
  label:     '#94A3B8',
  caption:   '#64748B',
  dim:       '#6B7280',
};


/* ═══════════════════════════════════════════════════
   SURFACES — theme-aware backgrounds
   ═══════════════════════════════════════════════════ */

export const surfaces = {
  get app()       { return cssVar('--navy-bg', '#0b1220'); },
  get panel()     { return cssVar('--surface-primary', '#0f1724'); },
  get elevated()  { return cssVar('--surface-quaternary', '#1a2540'); },
  get overlay()   { return 'rgba(11,18,32,0.85)'; },

  get layer0()    { return cssVar('--panel-bg', 'rgba(255,255,255,0.02)'); },
  get layer1()    { return cssVar('--surface-1', 'rgba(255,255,255,0.03)'); },
  get layer2()    { return cssVar('--surface-2', 'rgba(255,255,255,0.05)'); },
  get layer3()    { return 'rgba(255,255,255,0.08)'; },
  get hover()     { return 'rgba(255,255,255,0.06)'; },
  get pressed()   { return 'rgba(255,255,255,0.10)'; },
  /* alias used by pages */
  get card()      { return this.panel; },
};


/* ═══════════════════════════════════════════════════
   BORDERS — theme-aware
   ═══════════════════════════════════════════════════ */

export const borders = {
  get subtle()  { return cssVar('--border-subtle', 'rgba(255,255,255,0.06)'); },
  get default() { return cssVar('--border-color-default', 'rgba(255,255,255,0.08)'); },
  get medium()  { return cssVar('--panel-border', 'rgba(255,255,255,0.10)'); },
  get strong()  { return 'rgba(255,255,255,0.15)'; },
};


/* ═══════════════════════════════════════════════════
   GRADIENTS
   ═══════════════════════════════════════════════════ */

export const gradients = {
  // ── Brand gradients ──
  accent:      `linear-gradient(135deg, ${palette.neonGreen}, ${palette.neonCyan})`,
  primary:     `linear-gradient(135deg, ${palette.blue500}, ${palette.blue600})`,
  primaryPurple: `linear-gradient(135deg, ${palette.blue500}, ${palette.purple500})`,

  // ── Role-based gradients ──
  physician:   `linear-gradient(135deg, ${palette.blue500}, ${palette.blue600})`,
  nurse:       `linear-gradient(135deg, ${palette.emerald500}, ${palette.emerald600})`,
  student:     `linear-gradient(135deg, ${palette.purple500}, ${palette.purple600})`,
  admin:       `linear-gradient(135deg, ${palette.amber500}, ${palette.amber600})`,

  // ── Decorative ──
  storage:     `linear-gradient(90deg, ${palette.blue500}, ${palette.purple500}, ${palette.amber500})`,
  heroGlow:    `linear-gradient(135deg, ${palette.blue500}20, ${palette.purple500}20)`,
};


/* ═══════════════════════════════════════════════════
   SHADOWS
   ═══════════════════════════════════════════════════ */

export const shadows = {
  sm:   '0 1px 3px rgba(0,0,0,0.3)',
  md:   '0 4px 12px rgba(0,0,0,0.3)',
  lg:   '0 8px 24px rgba(0,0,0,0.35)',
  xl:   '0 12px 40px rgba(0,0,0,0.4)',
  glow: (color, opacity = 0.3) => `0 4px 20px rgba(${hexToRgb(color)},${opacity})`,
};


/* ═══════════════════════════════════════════════════
   STATUS BADGE HELPER
   ═══════════════════════════════════════════════════
   Returns { bg, text, border } for a given status name.
*/

export const statusStyle = (status) => {
  const map = {
    online:   { bg: alpha.success(0.12), text: colors.success,  border: alpha.success(0.25) },
    offline:  { bg: alpha.error(0.12),   text: colors.error,    border: alpha.error(0.25) },
    away:     { bg: alpha.warning(0.12), text: colors.warning,  border: alpha.warning(0.25) },
    busy:     { bg: alpha.error(0.12),   text: colors.errorLight, border: alpha.error(0.25) },
    active:   { bg: alpha.success(0.12), text: colors.success,  border: alpha.success(0.25) },
    inactive: { bg: alpha.white(0.06),   text: text.tertiary,   border: borders.default },
    pending:  { bg: alpha.warning(0.12), text: colors.warning,  border: alpha.warning(0.25) },
    critical: { bg: alpha.error(0.15),   text: colors.error,    border: alpha.error(0.3) },
    warning:  { bg: alpha.warning(0.12), text: colors.warning,  border: alpha.warning(0.25) },
    success:  { bg: alpha.success(0.12), text: colors.success,  border: alpha.success(0.25) },
    info:     { bg: alpha.primary(0.12), text: colors.primaryLight, border: alpha.primary(0.25) },
    purple:   { bg: alpha.purple(0.12),  text: colors.purpleLight, border: alpha.purple(0.25) },
  };
  return map[status] || map.inactive;
};


/* ═══════════════════════════════════════════════════
   CHART PALETTE — consistent data-viz colors
   ═══════════════════════════════════════════════════ */

export const chartColors = [
  palette.blue500,     // #3B82F6
  palette.emerald500,  // #10B981
  palette.purple500,   // #8B5CF6
  palette.amber500,    // #F59E0B
  palette.cyan500,     // #06B6D4
  palette.rose500,     // #F43F5E
  palette.red500,      // #EF4444
  palette.orange500,   // #F97316
];


/* ═══════════════════════════════════════════════════
   EXPORT ALL AS DEFAULT
   ═══════════════════════════════════════════════════ */

const theme = {
  colors,
  alpha,
  text,
  surfaces,
  borders,
  gradients,
  shadows,
  statusStyle,
  chartColors,
  palette,
};

export default theme;


/* ═══════════════════════════════════════════════════
   ACCENT ACCESSOR — reads the live accent from CSS vars
   ═══════════════════════════════════════════════════
   Usage:   import { getAccent } from '../config/theme';
            const a = getAccent();
            style={{ background: a.main, boxShadow: `0 4px 20px ${a.alpha(0.3)}` }}
*/

export function getAccent() {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  const get = (prop, fallback) => root?.style.getPropertyValue(prop)?.trim() || fallback;

  const main  = get('--accent',       '#3B82F6');
  const light = get('--accent-light', '#60A5FA');
  const dark  = get('--accent-dark',  '#2563EB');
  const rgb   = get('--accent-rgb',   '59,130,246');

  return {
    main,
    light,
    dark,
    rgb,
    alpha: (opacity) => `rgba(${rgb},${opacity})`,
    gradient: `linear-gradient(135deg, ${main}, ${dark})`,
  };
}
