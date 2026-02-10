/**
 * AppearanceContext — Global appearance/theming provider
 * ═══════════════════════════════════════════════════════
 *
 * Loads appearance settings from localStorage on mount,
 * applies them as CSS custom properties on <html>, and
 * re-applies instantly when any setting changes.
 *
 * Settings.jsx (and any page) can call `updateAppearance(key, value)`
 * for instant live-preview across the entire app.
 *
 * Consumed settings:
 *   theme        — 'system' | 'light' | 'dark'
 *   accentColor  — 'default' | 'green' | 'purple' | 'amber' | 'rose' | 'cyan'
 *   fontSize     — 'small' | 'medium' | 'large'
 *   density      — 'compact' | 'comfortable' | 'spacious'
 *   highContrast — boolean
 *   reducedMotion— boolean
 *   codeFont     — 'standard' | 'mono' | 'dyslexic'
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

/* ─── Accent color palettes ─── */
const ACCENT_MAP = {
  default: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB', rgb: '59,130,246' },
  green:   { main: '#10B981', light: '#34D399', dark: '#059669', rgb: '16,185,129' },
  purple:  { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED', rgb: '139,92,246' },
  amber:   { main: '#F59E0B', light: '#FBBF24', dark: '#D97706', rgb: '245,158,11' },
  rose:    { main: '#F43F5E', light: '#FB7185', dark: '#E11D48', rgb: '244,63,94' },
  cyan:    { main: '#06B6D4', light: '#22D3EE', dark: '#0891B2', rgb: '6,182,212' },
};

/* ─── Font-size scale ─── */
const FONT_SCALE = {
  small:  { base: '12px', scale: 0.85 },
  medium: { base: '14px', scale: 1.0 },
  large:  { base: '16px', scale: 1.15 },
};

/* ─── Density spacing ─── */
const DENSITY_SCALE = {
  compact:     { paddingUnit: '6px',  gapUnit: '6px',  rowHeight: '36px', sectionGap: '12px' },
  comfortable: { paddingUnit: '10px', gapUnit: '10px', rowHeight: '44px', sectionGap: '16px' },
  spacious:    { paddingUnit: '14px', gapUnit: '14px', rowHeight: '52px', sectionGap: '24px' },
};

/* ─── Code font families ─── */
const CODE_FONT_MAP = {
  standard: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono:     "'JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', monospace",
  dyslexic: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
};

const STORAGE_KEY = 'caredroid-settings';

const APPEARANCE_DEFAULTS = {
  theme: 'system',
  accentColor: 'default',
  fontSize: 'medium',
  density: 'comfortable',
  highContrast: false,
  reducedMotion: false,
  codeFont: 'standard',
};

/* ─── Context ─── */
const AppearanceContext = createContext(null);

/* ─── Apply CSS custom properties to <html> ─── */
function applyAppearance(settings) {
  const root = document.documentElement;
  if (!root) return;

  // Accent
  const accent = ACCENT_MAP[settings.accentColor] || ACCENT_MAP.default;
  root.style.setProperty('--accent', accent.main);
  root.style.setProperty('--accent-light', accent.light);
  root.style.setProperty('--accent-dark', accent.dark);
  root.style.setProperty('--accent-rgb', accent.rgb);
  root.style.setProperty('--accent-10', `rgba(${accent.rgb},0.10)`);
  root.style.setProperty('--accent-15', `rgba(${accent.rgb},0.15)`);
  root.style.setProperty('--accent-20', `rgba(${accent.rgb},0.20)`);

  // Legacy accent aliases — many components still reference these
  root.style.setProperty('--accent-1', accent.main);
  root.style.setProperty('--accent-2', accent.light);
  root.style.setProperty('--accent-green', accent.main);
  root.style.setProperty('--accent-cyan', accent.light);
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accent.main}, ${accent.light})`);
  root.style.setProperty('--gradient-accent', `linear-gradient(135deg, ${accent.main}, ${accent.light})`);

  // Font size
  const fs = FONT_SCALE[settings.fontSize] || FONT_SCALE.medium;
  root.style.setProperty('--app-font-base', fs.base);
  root.style.setProperty('--app-font-scale', String(fs.scale));
  root.style.fontSize = fs.base;

  // Density
  const dn = DENSITY_SCALE[settings.density] || DENSITY_SCALE.comfortable;
  root.style.setProperty('--density-padding', dn.paddingUnit);
  root.style.setProperty('--density-gap', dn.gapUnit);
  root.style.setProperty('--density-row', dn.rowHeight);
  root.style.setProperty('--density-section', dn.sectionGap);

  // Code font
  const cf = CODE_FONT_MAP[settings.codeFont] || CODE_FONT_MAP.standard;
  root.style.setProperty('--code-font', cf);

  // High contrast
  root.classList.toggle('high-contrast', !!settings.highContrast);

  // Reduced motion
  root.classList.toggle('reduced-motion', !!settings.reducedMotion);

  // Theme class (light / dark / system)
  root.classList.remove('theme-light', 'theme-dark');
  let resolvedTheme = settings.theme;
  if (settings.theme === 'system') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (resolvedTheme === 'light') {
    root.classList.add('theme-light');
  } else {
    root.classList.add('theme-dark');
  }

  // Data attribute for CSS selectors
  root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-accent', settings.accentColor);
  root.setAttribute('data-density', settings.density);
  root.setAttribute('data-font-size', settings.fontSize);
}

/* ─── Provider ─── */
export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...APPEARANCE_DEFAULTS, ...stored };
    } catch {
      return { ...APPEARANCE_DEFAULTS };
    }
  });

  const prevRef = useRef(appearance);

  // Apply on mount and whenever appearance changes
  useEffect(() => {
    applyAppearance(appearance);
    prevRef.current = appearance;
  }, [appearance]);

  // Listen for changes from other tabs via storage event
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setAppearance((prev) => ({ ...prev, ...parsed }));
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Listen for OS theme changes when set to 'system'
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (appearance.theme === 'system') {
        // Re-apply to pick up OS change
        applyAppearance(appearance);
      }
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [appearance.theme]);

  const updateAppearance = useCallback((key, value) => {
    setAppearance((prev) => {
      const next = { ...prev, [key]: value };
      // Persist to localStorage (Settings.jsx also writes here, but we stay in sync)
      try {
        const full = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        full[key] = value;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const resetAppearance = useCallback(() => {
    setAppearance({ ...APPEARANCE_DEFAULTS });
    try {
      const full = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      for (const key of Object.keys(APPEARANCE_DEFAULTS)) {
        full[key] = APPEARANCE_DEFAULTS[key];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    } catch { /* ignore */ }
  }, []);

  // Sync with external settings changes (e.g., Settings.jsx calling updateSetting)
  const syncFromSettings = useCallback((settingsObj) => {
    setAppearance((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(APPEARANCE_DEFAULTS)) {
        if (settingsObj[key] !== undefined && settingsObj[key] !== prev[key]) {
          next[key] = settingsObj[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // Expose accent palette for JS inline usage
  const accentPalette = useMemo(() => {
    return ACCENT_MAP[appearance.accentColor] || ACCENT_MAP.default;
  }, [appearance.accentColor]);

  const ctx = useMemo(() => ({
    appearance,
    accentPalette,
    updateAppearance,
    resetAppearance,
    syncFromSettings,
    ACCENT_MAP,
    FONT_SCALE,
    DENSITY_SCALE,
  }), [appearance, accentPalette, updateAppearance, resetAppearance, syncFromSettings]);

  return (
    <AppearanceContext.Provider value={ctx}>
      {children}
    </AppearanceContext.Provider>
  );
}

/* ─── Hook ─── */
export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    // Fallback for components outside the provider (tests, storybook, etc.)
    return {
      appearance: APPEARANCE_DEFAULTS,
      accentPalette: ACCENT_MAP.default,
      updateAppearance: () => {},
      resetAppearance: () => {},
      syncFromSettings: () => {},
      ACCENT_MAP,
      FONT_SCALE,
      DENSITY_SCALE,
    };
  }
  return ctx;
}

export default AppearanceContext;
