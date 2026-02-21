/**
 * ARStyleMarkers
 * Pulsing 3D indicators for critical alerts and points of interest.
 * Renders a set of animated rings at specified world-space positions.
 *
 * Must be rendered inside a Canvas context.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * A single pulsing marker at a world-space position.
 *
 * @param {object} props
 * @param {[number,number,number]} [props.position=[0,0,0]]
 * @param {string}  [props.color='#ef4444']   - Ring colour
 * @param {string}  [props.label]             - Optional label rendered via HTML overlay
 * @param {'critical'|'warning'|'info'} [props.severity='info']
 */
function ARMarker({ position = [0, 0, 0], color = '#ef4444', label, severity = 'info' }) {
  const ringRef = useRef();
  const innerRef = useRef();

  const severityColors = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#00e5ff',
  };

  const markerColor = severityColors[severity] || color;

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    // Pulsing scale
    const scale = 1 + Math.sin(t * 3) * 0.15;
    ringRef.current.scale.setScalar(scale);
    ringRef.current.material.opacity = 0.6 + Math.sin(t * 3) * 0.3;
  });

  return (
    <group position={position}>
      {/* Outer pulsing ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.18, 0.025, 8, 32]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.8} />
      </mesh>

      {/* Inner solid dot */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={markerColor} />
      </mesh>

      {/* HTML label overlay */}
      {label && (
        <Html
          distanceFactor={6}
          style={{
            color: markerColor,
            fontSize: 11,
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            textShadow: `0 0 6px ${markerColor}`,
          }}
          aria-label={label}
        >
          {label}
        </Html>
      )}
    </group>
  );
}

/**
 * ARStyleMarkers — renders a list of AR-style markers in 3D space.
 *
 * @param {object} props
 * @param {Array<{
 *   id: string|number,
 *   position: [number,number,number],
 *   label?: string,
 *   severity?: 'critical'|'warning'|'info'
 * }>} props.markers
 */
export default function ARStyleMarkers({ markers = [] }) {
  return (
    <group>
      {markers.map((m) => (
        <ARMarker
          key={m.id}
          position={m.position || [0, 0, 0]}
          label={m.label}
          severity={m.severity || 'info'}
        />
      ))}
    </group>
  );
}
