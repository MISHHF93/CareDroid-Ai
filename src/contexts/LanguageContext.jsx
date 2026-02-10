/**
 * LanguageContext — Global i18n provider
 * ═══════════════════════════════════════
 *
 * Reads the current language from localStorage (caredroid-settings → language),
 * loads the matching translation bundle, and provides a `t(key)` helper that
 * resolves dot-separated paths (e.g. `t('nav.dashboard')` → 'Dashboard').
 *
 * Also manages:
 *   - `dir` attribute on <html> (ltr / rtl) for Arabic & Hebrew
 *   - `lang` attribute on <html>
 *
 * Usage:
 *   import { useLanguage } from '../contexts/LanguageContext';
 *   const { t, language, setLanguage } = useLanguage();
 *   <span>{t('nav.dashboard')}</span>
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import translations, { isRTL } from '../i18n/index.js';

const LanguageContext = createContext(null);

/* ─── Resolve dot-path in nested object: 'a.b.c' → obj.a.b.c ─── */
function resolve(obj, path) {
  if (!obj || !path) return path;
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
}

/* ─── Read initial language from stored settings ─── */
function getStoredLanguage() {
  try {
    const raw = localStorage.getItem('caredroid-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.language && translations[parsed.language]) return parsed.language;
    }
  } catch { /* ignore */ }
  return 'en';
}

/* ─── Apply <html> lang + dir attributes ─── */
function applyHtmlAttrs(lang) {
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', isRTL(lang) ? 'rtl' : 'ltr');
}

/* ─── Provider ─── */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);

  // Current translation bundle (fall back to `en` for missing keys)
  const bundle = useMemo(() => translations[language] || translations.en, [language]);
  const fallback = useMemo(() => translations.en, []);

  // Apply HTML attrs on mount + language change
  useEffect(() => { applyHtmlAttrs(language); }, [language]);

  // Public setter — also persists into localStorage settings object
  const setLanguage = useCallback((lang) => {
    if (!translations[lang]) return;
    setLanguageState(lang);
    applyHtmlAttrs(lang);
    try {
      const raw = localStorage.getItem('caredroid-settings');
      const settings = raw ? JSON.parse(raw) : {};
      settings.language = lang;
      localStorage.setItem('caredroid-settings', JSON.stringify(settings));
    } catch { /* ignore */ }
  }, []);

  // Translation function — falls back to English, then to the raw key
  const t = useCallback((key) => {
    const val = resolve(bundle, key);
    if (val !== null) return val;
    const fb = resolve(fallback, key);
    if (fb !== null) return fb;
    return key; // last resort: return the key itself
  }, [bundle, fallback]);

  // Listen for external localStorage changes (e.g. Settings.jsx updateSetting)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'caredroid-settings') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.language && translations[parsed.language]) {
            setLanguageState(parsed.language);
          }
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Custom event listener so same-tab Settings changes sync immediately
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.language && translations[e.detail.language]) {
        setLanguageState(e.detail.language);
      }
    };
    window.addEventListener('caredroid-language-change', handler);
    return () => window.removeEventListener('caredroid-language-change', handler);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, t, isRTL: isRTL(language) }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/* ─── Hook ─── */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for components rendered outside provider (e.g. tests)
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key) => {
        const val = resolve(translations.en, key);
        return val !== null ? val : key;
      },
      isRTL: false,
    };
  }
  return ctx;
}

export default LanguageContext;
