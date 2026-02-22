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
import { useWebGLSupport } from '../../../hooks/useWebGLSupport';
import MedicalMarchingLODOrgan from '../advanced/MedicalMarchingLODOrgan';
import { MultiFluidPBDSystem, VascularFlowParticles } from '../advanced/PhysiologyParticleSystems';
import ThermalOverlay from '../advanced/ThermalOverlay';
import PressurePointOverlay from '../advanced/PressurePointOverlay';
import { useSensoryFeedback } from '../sensory/MultiSensoryEngine';

/**
 * @param {object}  props
 * @param {boolean} [props.interactive=false]
 * @param {boolean} [props.rotateOnHover=false]
 * @param {boolean} [props.showLabel=true]
 * @param {string}  [props.color='#38bdf8']
 * @param {number}  [props.severity=0]
 * @param {number}  [props.heartbeat=72]
 * @param {[number,number,number]} [props.position=[0,0,0]]
 */
export default function LungsModel({
  interactive = false,
  rotateOnHover = false,
  showLabel = true,
  color = '#38bdf8',
  severity = 0,
  heartbeat = 72,
  temperatureHotspots = [],
  painPoints = [],
  position = [0, 0, 0],
}) {
  const [hovered, setHovered] = useState(false);
  const leftRef = useRef();
  const rightRef = useRef();
  const groupRef = useRef();
  const { tier } = useWebGLSupport();
  const { triggerOrganFeedback, setFocusedOrgan } = useSensoryFeedback();

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

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={interactive ? () => {
        setHovered(true);
        setFocusedOrgan('lungs');
      } : undefined}
      onPointerOut={interactive ? () => setHovered(false) : undefined}
      onPointerDown={interactive ? () => triggerOrganFeedback('lungs', severity) : undefined}
    >
      {/* Left lung */}
      <group ref={leftRef} position={[-0.5, 0, 0]}>
        <MedicalMarchingLODOrgan
          organType="lungs"
          color={hovered ? '#7dd3fc' : color}
          severity={severity}
          heartbeat={heartbeat}
          tier={tier}
          mode={0}
        />
      </group>

      {/* Right lung */}
      <group ref={rightRef} position={[0.5, 0, 0]}>
        <MedicalMarchingLODOrgan
          organType="lungs"
          color={hovered ? '#7dd3fc' : color}
          severity={severity}
          heartbeat={heartbeat}
          tier={tier}
          mode={0}
        />
      </group>

      <VascularFlowParticles tier={tier} heartbeat={heartbeat} />
      <MultiFluidPBDSystem tier={tier} heartbeat={heartbeat} />
      <ThermalOverlay severity={severity} hotspots={temperatureHotspots} />
      <PressurePointOverlay points={painPoints} severity={severity} />

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
