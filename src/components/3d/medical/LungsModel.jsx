/**
 * LungsModel
 * Procedural 3D lungs placeholder with two symmetric lobe groups.
 * Supports breathing animation, hover highlighting, and rotation.
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
 * @param {string}  [props.color='#38bdf8']
 * @param {[number,number,number]} [props.position=[0,0,0]]
 */
export default function LungsModel({
  interactive = false,
  rotateOnHover = false,
  showLabel = true,
  color = '#38bdf8',
  position = [0, 0, 0],
}) {
  const [hovered, setHovered] = useState(false);
  const leftRef = useRef();
  const rightRef = useRef();
  const groupRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Breathing animation
    const breathe = 1 + Math.sin(t * 1.5) * 0.06;
    if (leftRef.current) leftRef.current.scale.setScalar(breathe);
    if (rightRef.current) rightRef.current.scale.setScalar(breathe);
    if (groupRef.current && rotateOnHover && hovered) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  const matProps = {
    color: hovered ? '#7dd3fc' : color,
    emissive: hovered ? '#38bdf8' : '#0c4a6e',
    emissiveIntensity: hovered ? 0.4 : 0.15,
    roughness: 0.65,
    metalness: 0.08,
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={interactive ? () => setHovered(true) : undefined}
      onPointerOut={interactive ? () => setHovered(false) : undefined}
    >
      {/* Left lung */}
      <group ref={leftRef} position={[-0.5, 0, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>

      {/* Right lung */}
      <group ref={rightRef} position={[0.5, 0, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>

      {/* Trachea */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.4, 12]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {showLabel && (
        <HolographicText position={[0, -1.1, 0]} fontSize={0.22} color={hovered ? '#7dd3fc' : '#00e5ff'}>
          Lungs
        </HolographicText>
      )}
    </group>
  );
}
