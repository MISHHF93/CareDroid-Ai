/**
 * useWebGLSupport Hook
 * Provides reactive WebGL support detection for components
 */

import { useState, useEffect } from 'react';
import { detectWebGLTier } from '../components/3d/utils/webglDetect';

/**
 * Hook to detect WebGL support and device capabilities
 * @returns {{ supported: boolean, tier: 'high'|'medium'|'low', reducedMotion: boolean }}
 */
export function useWebGLSupport() {
  const getTierFromConcurrency = () => {
    if (typeof navigator === 'undefined') return 'low';
    const cores = Number(navigator.hardwareConcurrency || 2);
    if (cores >= 8) return 'high';
    if (cores >= 4) return 'medium';
    return 'low';
  };

  const getReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const [state, setState] = useState(() => ({
    supported: detectWebGLTier() !== 'none',
    tier: getTierFromConcurrency(),
    reducedMotion: getReducedMotion(),
  }));

  useEffect(() => {
    // Listen for reduced motion preference changes
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => {
      setState((prev) => ({
        ...prev,
        reducedMotion: mediaQuery.matches,
        tier: getTierFromConcurrency(),
        supported: detectWebGLTier() !== 'none',
      }));
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return state;
}
