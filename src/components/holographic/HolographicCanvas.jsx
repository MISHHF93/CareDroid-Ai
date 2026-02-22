import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, Stars } from '@react-three/drei';
import { colors, surfaces } from '../../config/theme';
import HolographicLoader from './HolographicLoader';
import GestureControls from './GestureControls';
import './Holographic.css';

const supportsWebGL = () => {
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
};

const isLowPerformanceDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  return mem <= 3 || cores <= 4;
};

function FrameRateController({ targetFps = 60, disabled = false }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (disabled) return undefined;

    const step = Math.max(16, Math.round(1000 / targetFps));
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      invalidate();
    };
    const timer = setInterval(tick, step);
    return () => clearInterval(timer);
  }, [disabled, invalidate, targetFps]);

  return null;
}

const Fallback2D = ({ ariaLabel }) => (
  <div className="holo-fallback" role="img" aria-label={ariaLabel}>
    3D view is reduced for accessibility/performance. Clinical data remains available in 2D.
  </div>
);

export default function HolographicCanvas({
  children,
  ariaLabel = 'Holographic clinical visualization',
  camera = { position: [0, 1.7, 6], fov: 52, near: 0.1, far: 100 },
  enableControls = true,
  reducedMotion = false,
  fallback = null,
  style,
  targetFps = 60,
}) {
  const [mounted, setMounted] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    setMounted(true);
    setWebglAvailable(supportsWebGL());
  }, []);

  const lowPerf = useMemo(() => isLowPerformanceDevice(), []);
  const dpr = useMemo(() => (lowPerf ? [1, 1.25] : [1, 1.75]), [lowPerf]);
  const effectiveFps = useMemo(() => {
    const clamped = Math.max(24, Math.min(60, targetFps));
    return lowPerf ? Math.min(clamped, 36) : clamped;
  }, [lowPerf, targetFps]);

  if (!mounted || reducedMotion || !webglAvailable) {
    return (
      <div className="holo-shell" style={style}>
        {fallback || <Fallback2D ariaLabel={ariaLabel} />}
      </div>
    );
  }

  return (
    <div className="holo-shell" style={style}>
      <Canvas
        aria-label={ariaLabel}
        dpr={dpr}
        camera={camera}
        frameloop="demand"
        gl={{ antialias: !lowPerf, alpha: true, powerPreference: lowPerf ? 'low-power' : 'high-performance' }}
      >
        <color attach="background" args={[surfaces.app || '#0b1220']} />
        <fog attach="fog" args={[surfaces.app || '#0b1220', 9, 24]} />

        <ambientLight intensity={0.45} color={colors.cyan} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} color={colors.purple} />
        <pointLight position={[-4, 2, 3]} intensity={1.4} color={colors.success} />
        <pointLight position={[2, -2, 2]} intensity={0.9} color={colors.cyan} />

        <Stars radius={35} depth={20} count={lowPerf ? 420 : 1200} factor={2} saturation={0} fade speed={0.4} />

        <Suspense fallback={<HolographicLoader compact />}>
          {children}
        </Suspense>

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <FrameRateController targetFps={effectiveFps} />
        {enableControls ? <GestureControls reducedMotion={reducedMotion || lowPerf} /> : null}
      </Canvas>
      <div className="holo-overlay" />
    </div>
  );
}
