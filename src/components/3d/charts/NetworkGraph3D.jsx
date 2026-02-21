/**
 * NetworkGraph3D
 * Force-directed 3D network graph for drug interaction visualisation.
 * Nodes represent drugs/compounds; edges represent interactions.
 *
 * Must be rendered inside a <Canvas> / HolographicCanvas context.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import HolographicText from '../HolographicText';

const SEVERITY_COLORS = {
  major: '#ef4444',
  moderate: '#f59e0b',
  minor: '#10b981',
  default: '#00e5ff',
};

/**
 * Simple spring-based force simulation (runs in JS, not GPU).
 */
function useForceSim(nodes, edges) {
  const [positions, setPositions] = useState(() =>
    nodes.map((_, i) => {
      const theta = (i / nodes.length) * Math.PI * 2;
      const r = 1.5 + Math.random() * 0.5;
      return [r * Math.cos(theta), (Math.random() - 0.5) * 1.5, r * Math.sin(theta)];
    })
  );
  const vel = useRef(nodes.map(() => [0, 0, 0]));

  useEffect(() => {
    let running = true;
    let tick = 0;

    function step() {
      if (!running || tick++ > 200) return; // stop after convergence

      setPositions((prev) => {
        const next = prev.map((p) => [...p]);
        const v = vel.current;

        // Repulsion between all node pairs
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = next[j][0] - next[i][0];
            const dy = next[j][1] - next[i][1];
            const dz = next[j][2] - next[i][2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
            const force = 0.6 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            const fz = (dz / dist) * force;
            v[i][0] -= fx; v[i][1] -= fy; v[i][2] -= fz;
            v[j][0] += fx; v[j][1] += fy; v[j][2] += fz;
          }
        }

        // Attraction along edges
        edges.forEach(([si, ti]) => {
          const a = nodes.findIndex((n) => n.id === si);
          const b = nodes.findIndex((n) => n.id === ti);
          if (a < 0 || b < 0) return;
          const dx = next[b][0] - next[a][0];
          const dy = next[b][1] - next[a][1];
          const dz = next[b][2] - next[a][2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
          const force = (dist - 1.5) * 0.05;
          v[a][0] += (dx / dist) * force;
          v[a][1] += (dy / dist) * force;
          v[a][2] += (dz / dist) * force;
          v[b][0] -= (dx / dist) * force;
          v[b][1] -= (dy / dist) * force;
          v[b][2] -= (dz / dist) * force;
        });

        // Integrate + dampen
        for (let i = 0; i < nodes.length; i++) {
          v[i] = v[i].map((x) => x * 0.85);
          next[i] = next[i].map((x, k) => x + v[i][k] * 0.016);
        }

        return next;
      });

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
    return () => { running = false; };
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps -- vel.current is a ref (stable) and we intentionally restart only when graph topology changes

  return positions;
}

/**
 * @param {object} props
 * @param {Array<{ id: string|number, label: string }>}                   props.nodes
 * @param {Array<[string|number, string|number, { severity?: string }?]>} props.edges
 * @param {string} [props.title]
 */
export default function NetworkGraph3D({ nodes = [], edges = [], title }) {
  const positions = useForceSim(nodes, edges);
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.003;
  });

  const nodeIndex = useMemo(() => {
    const m = {};
    nodes.forEach((n, i) => { m[n.id] = i; });
    return m;
  }, [nodes]);

  return (
    <group ref={groupRef}>
      {/* Edges (lines via thin cylinders) */}
      {edges.map(([sid, tid, meta], i) => {
        const ai = nodeIndex[sid];
        const bi = nodeIndex[tid];
        if (ai == null || bi == null || !positions[ai] || !positions[bi]) return null;
        const a = positions[ai];
        const b = positions[bi];
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        const dx = b[0] - a[0]; const dy = b[1] - a[1]; const dz = b[2] - a[2];
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const severity = meta?.severity || 'default';
        const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.default;

        return (
          <mesh key={i} position={mid}>
            <cylinderGeometry args={[0.025, 0.025, length, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const pos = positions[i] || [0, 0, 0];
        return (
          <group key={node.id} position={pos}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color="#00e5ff"
                emissive="#00e5ff"
                emissiveIntensity={0.3}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
            <HolographicText position={[0, 0.28, 0]} fontSize={0.13} billboard>
              {node.label}
            </HolographicText>
          </group>
        );
      })}

      {title && (
        <HolographicText position={[0, 3, 0]} fontSize={0.22}>
          {title}
        </HolographicText>
      )}
    </group>
  );
}
