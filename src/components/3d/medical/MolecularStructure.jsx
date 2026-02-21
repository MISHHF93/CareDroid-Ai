/**
 * MolecularStructure
 * Procedural 3D molecular visualization for drug interaction display.
 * Renders atoms (spheres) connected by bonds (cylinders) in 3D space.
 *
 * Must be rendered inside a <Canvas> / HolographicCanvas context.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh } from 'three';
import HolographicText from '../HolographicText';

// Atom colour by element symbol
const ELEMENT_COLORS = {
  C: '#94a3b8',  // carbon — grey
  H: '#f8fafc',  // hydrogen — white
  O: '#ef4444',  // oxygen — red
  N: '#3b82f6',  // nitrogen — blue
  S: '#f59e0b',  // sulphur — yellow
  P: '#f97316',  // phosphorus — orange
  Cl: '#22c55e', // chlorine — green
  default: '#a855f7',
};

/**
 * Renders a single atom sphere.
 */
function Atom({ position, element = 'C', radius = 0.12 }) {
  const color = ELEMENT_COLORS[element] || ELEMENT_COLORS.default;
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

/**
 * Renders a cylindrical bond between two atom positions.
 */
function Bond({ start, end, color = '#64748b' }) {
  const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return (
    <mesh position={mid}>
      <cylinderGeometry args={[0.04, 0.04, length, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}

/**
 * Default caffeine-like molecule layout when no data is provided.
 */
const DEFAULT_ATOMS = [
  { id: 0, element: 'C', position: [0, 0, 0] },
  { id: 1, element: 'N', position: [0.7, 0.6, 0] },
  { id: 2, element: 'C', position: [1.4, 0, 0] },
  { id: 3, element: 'O', position: [2.0, 0.6, 0.3] },
  { id: 4, element: 'N', position: [0.7, -0.7, 0] },
  { id: 5, element: 'C', position: [1.4, -0.8, 0.5] },
  { id: 6, element: 'H', position: [-0.5, 0.4, 0.3] },
  { id: 7, element: 'H', position: [-0.5, -0.4, 0.3] },
];

const DEFAULT_BONDS = [
  [0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [0, 4], [0, 6], [0, 7],
];

/**
 * @param {object}  props
 * @param {Array}   [props.atoms]   - Array of { id, element, position: [x,y,z] }
 * @param {Array}   [props.bonds]   - Array of [atomIdA, atomIdB]
 * @param {boolean} [props.rotate=true]
 * @param {string}  [props.label]
 */
export default function MolecularStructure({
  atoms = DEFAULT_ATOMS,
  bonds = DEFAULT_BONDS,
  rotate = true,
  label,
}) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current && rotate) {
      groupRef.current.rotation.y += 0.008;
      groupRef.current.rotation.x += 0.003;
    }
  });

  // Centre atoms at origin
  const centred = useMemo(() => {
    if (!atoms.length) return [];
    const cx = atoms.reduce((s, a) => s + a.position[0], 0) / atoms.length;
    const cy = atoms.reduce((s, a) => s + a.position[1], 0) / atoms.length;
    const cz = atoms.reduce((s, a) => s + a.position[2], 0) / atoms.length;
    return atoms.map((a) => ({
      ...a,
      position: [a.position[0] - cx, a.position[1] - cy, a.position[2] - cz],
    }));
  }, [atoms]);

  const atomById = useMemo(() => {
    const map = {};
    centred.forEach((a) => { map[a.id] = a; });
    return map;
  }, [centred]);

  return (
    <group ref={groupRef}>
      {centred.map((atom) => (
        <Atom key={atom.id} position={atom.position} element={atom.element} />
      ))}
      {bonds.map(([idA, idB], i) => {
        const a = atomById[idA];
        const b = atomById[idB];
        if (!a || !b) return null;
        return <Bond key={i} start={a.position} end={b.position} />;
      })}
      {label && (
        <HolographicText position={[0, -1.5, 0]} fontSize={0.2}>
          {label}
        </HolographicText>
      )}
    </group>
  );
}
