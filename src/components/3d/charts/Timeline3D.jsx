/**
 * Timeline3D
 * 3D patient timeline visualisation — renders events as floating nodes
 * along a horizontal axis, with connecting lines and labels.
 *
 * Must be rendered inside a <Canvas> / HolographicCanvas context.
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import HolographicText from '../HolographicText';

const TYPE_COLORS = {
  lab: '#00e5ff',
  medication: '#a855f7',
  vital: '#10b981',
  alert: '#ef4444',
  note: '#f59e0b',
  default: '#94a3b8',
};

function TimelineNode({ position, event, index }) {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.6 + index * 0.8;
  });

  const color = TYPE_COLORS[event.type] || TYPE_COLORS.default;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Date label below */}
      <HolographicText position={[0, -0.35, 0]} fontSize={0.1} color="#64748b">
        {event.date || ''}
      </HolographicText>
      {/* Event label above */}
      <HolographicText position={[0, 0.32, 0]} fontSize={0.12} color={color}>
        {event.label || ''}
      </HolographicText>
    </group>
  );
}

/**
 * @param {object} props
 * @param {Array<{ id: string|number, label: string, date?: string, type?: string }>} props.events
 * @param {string} [props.title]
 */
export default function Timeline3D({ events = [], title }) {
  if (!events.length) return null;

  const spacing = 1.4;
  const totalWidth = (events.length - 1) * spacing;

  return (
    <group>
      {/* Axis line */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[totalWidth + 1, 0.025, 0.025]} />
        <meshBasicMaterial color="#334155" />
      </mesh>

      {events.map((event, i) => (
        <TimelineNode
          key={event.id ?? i}
          event={event}
          index={i}
          position={[i * spacing - totalWidth / 2, 0, 0]}
        />
      ))}

      {title && (
        <HolographicText position={[0, 1.2, 0]} fontSize={0.22}>
          {title}
        </HolographicText>
      )}
    </group>
  );
}
