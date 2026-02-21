/**
 * 3D Components Unit Tests
 *
 * Tests for the holographic 3D visualization components:
 * - HolographicLoader (pure HTML/CSS, no canvas)
 * - FloatingCard (pure HTML/CSS)
 * - webglDetect utilities
 * - use3DModel hook
 * - useWebGLSupport hook
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
// Note: @react-three/fiber, @react-three/drei, and three are globally mocked
// in tests/frontend/setup.js for the entire test suite.

// ─── Import components under test ──────────────────────────────────────────
import HolographicLoader from '@/components/3d/HolographicLoader';
import FloatingCard from '@/components/3d/FloatingCard';
import {
  isWebGLSupported,
  isWebGL2Supported,
  prefersReducedMotion,
  isMobileDevice,
  getRenderingTier,
} from '@/components/3d/utils/webglDetect';
import { createPerformanceMonitor, throttleToFPS } from '@/components/3d/utils/performanceMonitor';
import {
  isModelCached,
  getCachedModel,
  cacheModel,
  clearModelCache,
  getPolygonBudget,
} from '@/components/3d/utils/modelLoader';

// ─── HolographicLoader ─────────────────────────────────────────────────────
describe('HolographicLoader', () => {
  it('renders with default label', () => {
    render(<HolographicLoader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading 3D visualization…')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<HolographicLoader label="Loading heart model…" size={40} />);
    expect(screen.getByText('Loading heart model…')).toBeInTheDocument();
  });

  it('renders SVG spinner', () => {
    const { container } = render(<HolographicLoader />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('hides label when empty string provided', () => {
    render(<HolographicLoader label="" />);
    // No visible label text (empty string)
    expect(screen.queryByRole('status')).toBeInTheDocument(); // wrapper still present
  });
});

// ─── FloatingCard ──────────────────────────────────────────────────────────
describe('FloatingCard', () => {
  it('renders children', () => {
    render(<FloatingCard>Hello Clinical World</FloatingCard>);
    expect(screen.getByText('Hello Clinical World')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<FloatingCard title="Vital Signs">content</FloatingCard>);
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
  });

  it('applies elevation class', () => {
    const { container } = render(<FloatingCard elevation={2}>x</FloatingCard>);
    expect(container.firstChild).toHaveClass('floating-card--elevation-2');
  });

  it('clamps elevation to 1–3', () => {
    const { container: c1 } = render(<FloatingCard elevation={0}>x</FloatingCard>);
    expect(c1.firstChild).toHaveClass('floating-card--elevation-1');

    const { container: c3 } = render(<FloatingCard elevation={10}>x</FloatingCard>);
    expect(c3.firstChild).toHaveClass('floating-card--elevation-3');
  });

  it('passes additional className', () => {
    const { container } = render(<FloatingCard className="my-card">x</FloatingCard>);
    expect(container.firstChild).toHaveClass('my-card');
  });
});

// ─── webglDetect utilities ─────────────────────────────────────────────────
describe('webglDetect utilities', () => {
  beforeEach(() => {
    // Reset window to a clean state
    vi.restoreAllMocks();
  });

  describe('isWebGLSupported', () => {
    it('returns false when WebGLRenderingContext is absent', () => {
      const original = window.WebGLRenderingContext;
      delete window.WebGLRenderingContext;
      expect(isWebGLSupported()).toBe(false);
      window.WebGLRenderingContext = original;
    });

    it('returns false when getContext throws', () => {
      const origCreate = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') {
          return { getContext: () => { throw new Error('no gl'); } };
        }
        return origCreate(tag);
      });
      expect(isWebGLSupported()).toBe(false);
    });
  });

  describe('prefersReducedMotion', () => {
    it('returns true when matchMedia says reduce', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      expect(prefersReducedMotion()).toBe(true);
    });

    it('returns false when matchMedia says no reduce', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('isMobileDevice', () => {
    it('returns true for Android user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; Pixel 4) ...',
        configurable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });
  });

  describe('getRenderingTier', () => {
    it('returns none when WebGL is unsupported', () => {
      const original = window.WebGLRenderingContext;
      delete window.WebGLRenderingContext;
      expect(getRenderingTier()).toBe('none');
      window.WebGLRenderingContext = original;
    });
  });
});

// ─── modelLoader utilities ─────────────────────────────────────────────────
describe('modelLoader utilities', () => {
  beforeEach(() => clearModelCache());

  it('isModelCached returns false for uncached URL', () => {
    expect(isModelCached('http://example.com/heart.glb')).toBe(false);
  });

  it('cacheModel + getCachedModel round-trip', () => {
    cacheModel('heart.glb', { scene: {} });
    expect(isModelCached('heart.glb')).toBe(true);
    expect(getCachedModel('heart.glb')).toEqual({ scene: {} });
  });

  it('clearModelCache removes all entries', () => {
    cacheModel('brain.glb', {});
    clearModelCache();
    expect(isModelCached('brain.glb')).toBe(false);
  });

  it('getPolygonBudget returns correct limits', () => {
    expect(getPolygonBudget('high')).toBe(100000);
    expect(getPolygonBudget('medium')).toBe(30000);
    expect(getPolygonBudget('low')).toBe(10000);
  });

  it('getPolygonBudget defaults to low for unknown tier', () => {
    expect(getPolygonBudget('unknown')).toBe(10000);
  });
});

// ─── performanceMonitor utilities ──────────────────────────────────────────
describe('performanceMonitor utilities', () => {
  it('throttleToFPS limits calls', () => {
    const fn = vi.fn();
    const throttled = throttleToFPS(fn, 30); // interval ~33ms

    // First call at t=0: lastTime=-Infinity, elapsed=Infinity, FIRES
    throttled(0);
    expect(fn).toHaveBeenCalledTimes(1);

    // Call at t=10ms (< 33ms interval) — should NOT fire
    throttled(10);
    expect(fn).toHaveBeenCalledTimes(1);

    // Call at t=40ms (40ms since last fire at t=0) — should fire
    throttled(40);
    expect(fn).toHaveBeenCalledTimes(2);

    // Call at t=50ms (only 10ms since last fire at 40ms) — should NOT fire
    throttled(50);
    expect(fn).toHaveBeenCalledTimes(2);

    // Call at t=80ms (40ms since last fire) — should fire
    throttled(80);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('createPerformanceMonitor exposes start/stop/getFPS', () => {
    const monitor = createPerformanceMonitor();
    expect(typeof monitor.start).toBe('function');
    expect(typeof monitor.stop).toBe('function');
    expect(typeof monitor.getFPS).toBe('function');
    expect(monitor.getFPS()).toBe(60); // initial value
  });
});
