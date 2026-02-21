/**
 * HolographicCanvas
 * Root Three.js canvas wrapper with camera, lighting, and orbit controls.
 * Provides a reusable container for all 3D medical visualisations.
 *
 * Usage:
 *   <HolographicCanvas>
 *     <Suspense fallback={<HolographicLoader />}>
 *       <HeartModel />
 *     </Suspense>
 *   </HolographicCanvas>
 */

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import HolographicLoader from './HolographicLoader';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';
import { isMobileDevice } from './utils/webglDetect';

// Default holographic lighting rig
function HolographicLights() {
  return (
    <>
      {/* Soft overall fill */}
      <ambientLight intensity={0.3} color="#1a2a4a" />
      {/* Key light — cyan hue */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        color="#00e5ff"
        castShadow
      />
      {/* Fill light — purple hue */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.4}
        color="#a855f7"
      />
      {/* Rim / accent point light */}
      <pointLight position={[0, -5, 0]} intensity={0.6} color="#10b981" />
    </>
  );
}

/**
 * HolographicCanvas component
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children   - 3D scene content
 * @param {number}  [props.fov=60]           - Camera field of view
 * @param {number}  [props.near=0.1]         - Camera near clipping plane
 * @param {number}  [props.far=1000]         - Camera far clipping plane
 * @param {[number,number,number]} [props.cameraPosition=[0,0,5]] - Initial camera position
 * @param {boolean} [props.controls=true]    - Enable orbit controls
 * @param {boolean} [props.shadows=false]    - Enable shadow maps
 * @param {string}  [props.className]        - CSS class for the outer div
 * @param {object}  [props.style]            - Inline styles for the outer div
 * @param {React.ReactNode} [props.fallback] - Fallback while loading
 */
export default function HolographicCanvas({
  children,
  fov = 60,
  near = 0.1,
  far = 1000,
  cameraPosition = [0, 0, 5],
  controls = true,
  shadows = false,
  className = '',
  style = {},
  fallback,
}) {
  const { supported, tier, reducedMotion } = useWebGLSupport();
  const mobile = isMobileDevice();

  // Graceful degradation: if WebGL is unavailable render fallback
  if (!supported) {
    return (
      <div
        role="img"
        aria-label="3D visualization unavailable — WebGL not supported"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(11,18,32,0.8)',
          borderRadius: 12,
          color: '#00e5ff',
          fontSize: 14,
          padding: 24,
          ...style,
        }}
      >
        3D visualization requires WebGL support.
      </div>
    );
  }

  // Pixel ratio: cap at 2 for performance; lower on mobile
  const dpr = mobile ? [1, 1.5] : [1, 2];

  // Frame loop: 'never' respects reduced-motion preference
  const frameloop = reducedMotion ? 'demand' : 'always';

  return (
    <div
      className={`holographic-canvas-wrapper ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      <Canvas
        camera={{ fov, near, far, position: cameraPosition }}
        shadows={shadows && tier === 'high'}
        dpr={dpr}
        frameloop={frameloop}
        gl={{ antialias: tier !== 'low', alpha: true, powerPreference: tier === 'low' ? 'low-power' : 'high-performance' }}
        aria-label="Interactive 3D medical visualization"
      >
        {/* Adaptive quality helpers */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {/* Lighting */}
        <HolographicLights />

        {/* HDR environment for realistic reflections on high-tier devices */}
        {tier === 'high' && (
          <Environment preset="night" />
        )}

        {/* Scene content */}
        <Suspense fallback={fallback || null}>
          {children}
        </Suspense>

        {/* Camera controls */}
        {controls && (
          <OrbitControls
            enablePan
            enableZoom
            enableRotate={!reducedMotion}
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={50}
            // Keyboard controls
            keys={{
              LEFT: 'ArrowLeft',
              UP: 'ArrowUp',
              RIGHT: 'ArrowRight',
              BOTTOM: 'ArrowDown',
            }}
          />
        )}
      </Canvas>
    </div>
  );
}
