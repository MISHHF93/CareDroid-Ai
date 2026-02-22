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
import { useWebGLSupport } from '../../../hooks/useWebGLSupport';
import MedicalMarchingLODOrgan from '../advanced/MedicalMarchingLODOrgan';
import { MultiFluidPBDSystem, NeuralPathwayImpulses } from '../advanced/PhysiologyParticleSystems';
import ThermalOverlay from '../advanced/ThermalOverlay';
import PressurePointOverlay from '../advanced/PressurePointOverlay';
import { useSensoryFeedback } from '../sensory/MultiSensoryEngine';

/**
 * @param {object}  props
 * @param {boolean} [props.interactive=false]
 * @param {boolean} [props.rotateOnHover=false]
 * @param {boolean} [props.showLabel=true]
 * @param {string}  [props.color='#a855f7']
 * @param {number}  [props.severity=0]
 * @param {number}  [props.heartbeat=72]
 * @param {[number,number,number]} [props.position=[0,0,0]]
 */
export default function BrainModel({
  interactive = false,
  rotateOnHover = false,
  showLabel = true,
  color = '#a855f7',
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
      groupRef.current.rotation.y += 0.012;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={interactive ? () => {
        setHovered(true);
        setFocusedOrgan('brain');
      } : undefined}
      onPointerOut={interactive ? () => setHovered(false) : undefined}
      onPointerDown={interactive ? () => triggerOrganFeedback('brain', severity) : undefined}
    >
      <MedicalMarchingLODOrgan
        organType="brain"
        color={hovered ? '#c084fc' : color}
        severity={severity}
        heartbeat={heartbeat}
        tier={tier}
        mode={2}
      />
      <NeuralPathwayImpulses tier={tier} />
      <MultiFluidPBDSystem tier={tier} heartbeat={heartbeat} />
      <ThermalOverlay severity={severity} hotspots={temperatureHotspots} />
      <PressurePointOverlay points={painPoints} severity={severity} />

      {showLabel && (
        <HolographicText position={[0, -1.1, 0]} fontSize={0.22} color={hovered ? '#c084fc' : '#00e5ff'}>
          Brain
        </HolographicText>
      )}
    </group>
  );
}
