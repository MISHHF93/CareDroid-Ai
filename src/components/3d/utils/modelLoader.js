/**
 * Model Loader Utility
 * Handles lazy loading and caching of 3D GLTF/GLB assets
 */

// Simple cache for loaded models
const modelCache = new Map();

/**
 * Get the base URL for 3D model assets
 * @returns {string} Base URL for models
 */
export function getModelBaseURL() {
  return import.meta.env.VITE_MODELS_URL || '/assets/models';
}

/**
 * Build the full URL for a named model
 * @param {string} modelName - Model filename (e.g., 'heart.glb')
 * @returns {string} Full URL
 */
export function getModelURL(modelName) {
  return `${getModelBaseURL()}/${modelName}`;
}

/**
 * Check if a model is already cached
 * @param {string} url - Model URL
 * @returns {boolean}
 */
export function isModelCached(url) {
  return modelCache.has(url);
}

/**
 * Get a cached model
 * @param {string} url - Model URL
 * @returns {any|null} Cached model or null
 */
export function getCachedModel(url) {
  return modelCache.get(url) || null;
}

/**
 * Store a model in cache
 * @param {string} url - Model URL
 * @param {any} model - Model data
 */
export function cacheModel(url, model) {
  modelCache.set(url, model);
}

/**
 * Clear the model cache
 */
export function clearModelCache() {
  modelCache.clear();
}

/**
 * Determine polygon count based on device tier
 * @param {'high'|'medium'|'low'} tier - Rendering tier
 * @returns {number} Max polygon count
 */
export function getPolygonBudget(tier) {
  const budgets = {
    high: 100000,
    medium: 30000,
    low: 10000,
  };
  return budgets[tier] ?? budgets.low;
}
