/**
 * HeartModel
 * Procedural 3D heart representation using a parametric mesh.
 * Falls back to a placeholder sphere when no GLTF asset is available.
 * Supports interactive hover highlighting and rotation animation.
 *
 * Must be rendered inside a <Canvas> / HolographicCanvas context.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Sphere } from '@react-three/drei';
import { use3DModel } from '../../../hooks/use3DModel';
import { getModelURL } from '../utils/modelLoader';
import HolographicText from '../HolographicText';

const MODEL_URL = getModelURL('heart.glb');

/**
 * Procedural placeholder heart — two overlapping spheres give a rough heart silhouette.
 */
function HeartPlaceholder({ color, hovered }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Heartbeat pulse
    const beat = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.04;
    groupRef.current.scale.setScalar(beat);
  });

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial
          color={hovered ? '#ff6b6b' : color}
          emissive={hovered ? '#ff0000' : '#8b0000'}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      {/* Left lobe */}
      <mesh position={[-0.35, 0.25, 0.1]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial
          color={hovered ? '#ff6b6b' : color}
          emissive={hovered ? '#ff0000' : '#8b0000'}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      {/* Right lobe */}
      <mesh position={[0.35, 0.25, 0.1]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial
          color={hovered ? '#ff6b6b' : color}
          emissive={hovered ? '#ff0000' : '#8b0000'}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

/**
 * HeartModel component
 *
 * @param {object}  props
 * @param {boolean} [props.interactive=false]   - Enable hover effects
 * @param {boolean} [props.rotateOnHover=false] - Rotate on hover
 * @param {boolean} [props.showLabel=true]      - Show 'Heart' text label
 * @param {string}  [props.color='#e53e3e']     - Base colour
 * @param {[number,number,number]} [props.position=[0,0,0]]
 */
export default function HeartModel({
  interactive = false,
  rotateOnHover = false,
  showLabel = true,
  color = '#e53e3e',
  position = [0, 0, 0],
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const { loaded } = use3DModel(null); // placeholder — no remote asset yet

  useFrame(() => {
    if (!groupRef.current) return;
    if (rotateOnHover && hovered) {
      groupRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={interactive ? () => setHovered(true) : undefined}
      onPointerOut={interactive ? () => setHovered(false) : undefined}
    >
      <HeartPlaceholder color={color} hovered={hovered && interactive} />
      {showLabel && (
        <HolographicText position={[0, -1, 0]} fontSize={0.22} color={hovered ? '#ff6b6b' : '#00e5ff'}>
          Heart
        </HolographicText>
      )}
    </group>
  );
}
