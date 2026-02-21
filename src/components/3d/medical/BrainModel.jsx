/**
 * BrainModel
 * Procedural 3D brain placeholder with two-hemisphere mesh.
 * Supports hover highlighting and rotation animation.
 *
 * Must be rendered inside a <Canvas> / HolographicCanvas context.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import HolographicText from '../HolographicText';

/**
 * @param {object}  props
 * @param {boolean} [props.interactive=false]
 * @param {boolean} [props.rotateOnHover=false]
 * @param {boolean} [props.showLabel=true]
 * @param {string}  [props.color='#a855f7']
 * @param {[number,number,number]} [props.position=[0,0,0]]
 */
export default function BrainModel({
  interactive = false,
  rotateOnHover = false,
  showLabel = true,
  color = '#a855f7',
  position = [0, 0, 0],
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    if (rotateOnHover && hovered) {
      groupRef.current.rotation.y += 0.012;
    }
  });

  const matProps = {
    color: hovered ? '#c084fc' : color,
    emissive: hovered ? '#a855f7' : '#4c1d95',
    emissiveIntensity: hovered ? 0.4 : 0.15,
    roughness: 0.7,
    metalness: 0.05,
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={interactive ? () => setHovered(true) : undefined}
      onPointerOut={interactive ? () => setHovered(false) : undefined}
    >
      {/* Left hemisphere */}
      <mesh position={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.48, 32, 32, 0, Math.PI]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Right hemisphere */}
      <mesh position={[0.3, 0, 0]}>
        <sphereGeometry args={[0.48, 32, 32, Math.PI, Math.PI]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Brain stem */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.12, 0.08, 0.45, 16]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {showLabel && (
        <HolographicText position={[0, -1.1, 0]} fontSize={0.22} color={hovered ? '#c084fc' : '#00e5ff'}>
          Brain
        </HolographicText>
      )}
    </group>
  );
}
