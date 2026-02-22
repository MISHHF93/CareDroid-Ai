/**
 * i18n — Translation loader and registry
 * ════════════════════════════════════════
 *
 * Keeps English eager-loaded and loads other locale JSON files on demand.
 */

import en from './en.json';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'he'];

const translationCache = { en };

export async function loadTranslation(lang) {
	if (!SUPPORTED_LANGUAGES.includes(lang)) return translationCache.en;
	if (translationCache[lang]) return translationCache[lang];

	let module;
	switch (lang) {
		case 'es':
			module = await import('./es.json');
			break;
		case 'fr':
			module = await import('./fr.json');
			break;
		case 'de':
			module = await import('./de.json');
			break;
		case 'pt':
			module = await import('./pt.json');
			break;
		case 'zh':
			module = await import('./zh.json');
			break;
		case 'ja':
			module = await import('./ja.json');
			break;
		case 'ar':
			module = await import('./ar.json');
			break;
		case 'he':
			module = await import('./he.json');
			break;
		default:
			return translationCache.en;
	}

	translationCache[lang] = module.default;
	return translationCache[lang];
}

const translations = translationCache;

/** RTL language codes */
export const RTL_LANGUAGES = ['ar', 'he'];

/** Check if a language code is RTL */
export const isRTL = (lang) => RTL_LANGUAGES.includes(lang);

export default translations;
