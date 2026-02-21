/**
 * useWebGLSupport Hook
 * Provides reactive WebGL support detection for components
 */

import { useState, useEffect } from 'react';
import {
  isWebGLSupported,
  prefersReducedMotion,
  isMobileDevice,
  getRenderingTier,
} from '../components/3d/utils/webglDetect';

/**
 * Hook to detect WebGL support and device capabilities
 * @returns {{ supported: boolean, tier: string, mobile: boolean, reducedMotion: boolean }}
 */
export function useWebGLSupport() {
  const [state, setState] = useState(() => ({
    supported: isWebGLSupported(),
    tier: getRenderingTier(),
    mobile: isMobileDevice(),
    reducedMotion: prefersReducedMotion(),
  }));

  useEffect(() => {
    // Listen for reduced motion preference changes
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => {
      setState((prev) => ({
        ...prev,
        reducedMotion: mediaQuery.matches,
        tier: getRenderingTier(),
      }));
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return state;
}
