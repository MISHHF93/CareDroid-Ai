/**
 * i18n — Translation loader and registry
 * ════════════════════════════════════════
 *
 * Statically imports all language JSON files.
 * Each key matches the language code used in Settings.jsx LANGUAGES array.
 */

import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import de from './de.json';
import pt from './pt.json';
import zh from './zh.json';
import ja from './ja.json';
import ar from './ar.json';
import he from './he.json';

const translations = { en, es, fr, de, pt, zh, ja, ar, he };

/** RTL language codes */
export const RTL_LANGUAGES = ['ar', 'he'];

/** Check if a language code is RTL */
export const isRTL = (lang) => RTL_LANGUAGES.includes(lang);

export default translations;
