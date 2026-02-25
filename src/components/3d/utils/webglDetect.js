/**
 * WebGL Detection Utility
 * Detects WebGL support and capabilities for graceful degradation
 */

/**
 * Check if WebGL is available in the current browser/device
 * @returns {boolean} True if WebGL is supported
 */
export function isWebGLSupported() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Check if WebGL2 is available
 * @returns {boolean} True if WebGL2 is supported
 */
export function isWebGL2Supported() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

/**
 * Detect if the user has reduced motion preferences
 * @returns {boolean} True if reduced motion is preferred
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect if device is mobile/low-performance
 * @returns {boolean} True if likely a mobile device
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function detectWebGLTier() {
  if (typeof window === 'undefined') return 'none';
  try {
    const canvas = document.createElement('canvas');
    const webgl2 = canvas.getContext('webgl2');
    // Validate that the context is actually functional (getContextAttributes
    // returns null when the context was lost or is unsupported at driver level)
    if (webgl2 && webgl2.getContextAttributes() !== null) {
      return isMobileDevice() ? 'medium' : 'high';
    }
    const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (webgl && webgl.getContextAttributes() !== null) {
      return 'medium';
    }
    return 'none';
  } catch {
    return 'none';
  }
}

/**
 * Get recommended rendering tier based on device capabilities
 * @returns {'high'|'medium'|'low'} Rendering quality tier
 */
export function getRenderingTier() {
  const tier = detectWebGLTier();
  if (tier === 'none') return 'none';
  if (prefersReducedMotion()) return 'low';
  if (tier === 'high') return 'high';
  return isMobileDevice() ? 'low' : 'medium';
}
