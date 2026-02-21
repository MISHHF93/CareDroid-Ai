import { useEffect, useState } from 'react';

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const isLowPerformance = () => {
  if (typeof navigator === 'undefined') return false;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  return mem <= 4 || cores <= 4;
};

export function useHolographicMode() {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion());

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(media.matches || document.documentElement.classList.contains('reduced-motion'));
    handler();
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  return {
    reducedMotion,
    lowPerformance: isLowPerformance(),
    enabled: !reducedMotion && !isLowPerformance(),
  };
}
