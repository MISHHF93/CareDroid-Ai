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
import HolographicText from '../HolographicText';
import { useWebGLSupport } from '../../../hooks/useWebGLSupport';
import MedicalMarchingLODOrgan from '../advanced/MedicalMarchingLODOrgan';
import { VascularFlowParticles } from '../advanced/PhysiologyParticleSystems';
import ThermalOverlay from '../advanced/ThermalOverlay';
import PressurePointOverlay from '../advanced/PressurePointOverlay';
import { useSensoryFeedback } from '../sensory/MultiSensoryEngine';

/**
 * Procedural placeholder heart — two overlapping spheres give a rough heart silhouette.
 */
function HeartPlaceholder({ color, hovered, severity = 0, tier = 'medium', heartbeat = 72 }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Heartbeat pulse
    const beat = 1 + Math.sin(clock.getElapsedTime() * (heartbeat / 60) * Math.PI * 2) * 0.035;
    groupRef.current.scale.setScalar(beat);
  });

  return (
    <group ref={groupRef}>
      <MedicalMarchingLODOrgan
        organType="heart"
        color={hovered ? '#ff6b6b' : color}
        severity={severity}
        heartbeat={heartbeat}
        tier={tier}
        mode={0}
      />
      <VascularFlowParticles tier={tier} heartbeat={heartbeat} />
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
 * @param {number}  [props.severity=0]          - Severity score for shader state
 * @param {number}  [props.heartbeat=72]        - Heart rate BPM for pulse/flow sync
 * @param {[number,number,number]} [props.position=[0,0,0]]
 */
export default function HeartModel({
  interactive = false,
  rotateOnHover = false,
  showLabel = true,
  color = '#e53e3e',
  severity = 0,
  heartbeat = 72,
  temperatureHotspots = [],
  painPoints = [],
  position = [0, 0, 0],
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();
  const { tier } = useWebGLSupport();
  const { triggerOrganFeedback, setFocusedOrgan } = useSensoryFeedback();

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
      onPointerOver={interactive ? () => {
        setHovered(true);
        setFocusedOrgan('heart');
      } : undefined}
      onPointerOut={interactive ? () => setHovered(false) : undefined}
      onPointerDown={interactive ? () => triggerOrganFeedback('heart', severity) : undefined}
    >
      <HeartPlaceholder
        color={color}
        hovered={hovered && interactive}
        severity={severity}
        tier={tier}
        heartbeat={heartbeat}
      />
      <ThermalOverlay severity={severity} hotspots={temperatureHotspots} />
      <PressurePointOverlay points={painPoints} severity={severity} />
      {showLabel && (
        <HolographicText position={[0, -1, 0]} fontSize={0.22} color={hovered ? '#ff6b6b' : '#00e5ff'}>
          Heart
        </HolographicText>
      )}
    </group>
  );
}
