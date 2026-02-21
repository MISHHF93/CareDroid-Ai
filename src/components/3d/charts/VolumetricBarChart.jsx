/**
 * VolumetricBarChart
 * 3D bar chart for lab results and clinical data visualisation.
 * Renders animated extruded bars with axis labels.
 *
 * Must be rendered inside a <Canvas> / HolographicCanvas context.
 */

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import HolographicText from '../HolographicText';

/**
 * Individual animated bar.
 */
function Bar({ value, maxValue, index, total, color }) {
  const meshRef = useRef();
  const targetHeight = Math.max(0.05, (value / maxValue) * 3);
  const heightRef = useRef(0);

  useFrame(() => {
    if (!meshRef.current) return;
    // Lerp height towards target
    heightRef.current += (targetHeight - heightRef.current) * 0.08;
    meshRef.current.scale.y = heightRef.current / targetHeight;
    // Position at half the current animated height so the bar grows from the floor
    meshRef.current.position.y = heightRef.current / 2;
  });

  const spacing = 0.9;
  const offset = (index - (total - 1) / 2) * spacing;

  return (
    <mesh ref={meshRef} position={[offset, targetHeight / 2, 0]}>
      <boxGeometry args={[0.6, targetHeight, 0.6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.2}
        roughness={0.3}
        metalness={0.4}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/**
 * @param {object}   props
 * @param {Array<{ label: string, value: number, color?: string }>} props.data
 * @param {string}   [props.title]
 * @param {number}   [props.maxValue]    - Y-axis maximum (auto-calculated if omitted)
 */
export default function VolumetricBarChart({ data = [], title, maxValue }) {
  if (!data.length) return null;

  const max = maxValue || Math.max(...data.map((d) => d.value)) * 1.1 || 1;

  const defaultColors = ['#00e5ff', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <group>
      {/* Floor grid line */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[data.length * 0.9 + 0.5, 0.5]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.5} />
      </mesh>

      {data.map((item, i) => (
        <group key={i}>
          <Bar
            value={item.value}
            maxValue={max}
            index={i}
            total={data.length}
            color={item.color || defaultColors[i % defaultColors.length]}
          />
          {/* X-axis label */}
          <HolographicText
            position={[(i - (data.length - 1) / 2) * 0.9, -0.3, 0]}
            fontSize={0.14}
            color="#94a3b8"
          >
            {item.label}
          </HolographicText>
          {/* Value label above bar */}
          <HolographicText
            position={[
              (i - (data.length - 1) / 2) * 0.9,
              Math.max(0.05, (item.value / max) * 3) + 0.2,
              0,
            ]}
            fontSize={0.13}
            color={item.color || defaultColors[i % defaultColors.length]}
          >
            {String(item.value)}
          </HolographicText>
        </group>
      ))}

      {title && (
        <HolographicText position={[0, 3.8, 0]} fontSize={0.22}>
          {title}
        </HolographicText>
      )}
    </group>
  );
}
