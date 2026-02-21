/**
 * GestureControls
 * Orbit / zoom / pan camera controls component for use inside a Canvas.
 * Wraps @react-three/drei OrbitControls with sensible medical-viewer defaults
 * and keyboard/touch support.
 *
 * Must be rendered inside a <Canvas> (or HolographicCanvas) context.
 */

import React from 'react';
import { OrbitControls } from '@react-three/drei';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';

/**
 * @param {object} props
 * @param {boolean} [props.autoRotate=false]     - Auto-rotate the scene
 * @param {number}  [props.autoRotateSpeed=0.5]  - Auto-rotate speed
 * @param {number}  [props.minDistance=1]
 * @param {number}  [props.maxDistance=50]
 * @param {boolean} [props.enablePan=true]
 * @param {boolean} [props.enableZoom=true]
 */
export default function GestureControls({
  autoRotate = false,
  autoRotateSpeed = 0.5,
  minDistance = 1,
  maxDistance = 50,
  enablePan = true,
  enableZoom = true,
}) {
  const { reducedMotion } = useWebGLSupport();

  return (
    <OrbitControls
      enablePan={enablePan}
      enableZoom={enableZoom}
      enableRotate={!reducedMotion}
      enableDamping
      dampingFactor={0.07}
      autoRotate={autoRotate && !reducedMotion}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={minDistance}
      maxDistance={maxDistance}
      // Keyboard controls: arrow keys + +/-
      keys={{
        LEFT: 'ArrowLeft',
        UP: 'ArrowUp',
        RIGHT: 'ArrowRight',
        BOTTOM: 'ArrowDown',
      }}
      // Touch: one-finger rotate, two-finger pan/zoom
      touches={{
        ONE: 2, // TOUCH.ROTATE = 0; but we allow it
        TWO: 4, // TOUCH.DOLLY_PAN
      }}
    />
  );
}
