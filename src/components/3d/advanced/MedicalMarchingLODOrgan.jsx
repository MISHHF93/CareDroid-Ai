import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { createMedicalTissueMaterial, updateMedicalTissueUniforms } from '../shaders/medicalTissueMaterial';

const DETAIL_STAGES = [
  { stage: 0, resolution: 16 },
  { stage: 1, resolution: 22 },
  { stage: 2, resolution: 30 },
  { stage: 3, resolution: 38 },
  { stage: 4, resolution: 48 },
];

const DISTANCE_BY_TIER = {
  low: [2.5, 4.2, 5.8, 7.4, 9.5],
  medium: [3.5, 5.5, 8.0, 10.8, 14.5],
  high: [4.4, 7.2, 10.5, 14.8, 19.0],
};

const ORGAN_METABALLS = {
  heart: [
    { pos: [0.5, 0.62, 0.5], strength: 0.78, subtract: 0.34 },
    { pos: [0.38, 0.52, 0.44], strength: 0.5, subtract: 0.3 },
    { pos: [0.62, 0.52, 0.44], strength: 0.5, subtract: 0.3 },
    { pos: [0.5, 0.35, 0.52], strength: 0.62, subtract: 0.3 },
  ],
  lungs: [
    { pos: [0.34, 0.52, 0.5], strength: 0.68, subtract: 0.31 },
    { pos: [0.66, 0.52, 0.5], strength: 0.68, subtract: 0.31 },
    { pos: [0.34, 0.36, 0.52], strength: 0.5, subtract: 0.31 },
    { pos: [0.66, 0.36, 0.52], strength: 0.5, subtract: 0.31 },
  ],
  brain: [
    { pos: [0.42, 0.56, 0.48], strength: 0.58, subtract: 0.3 },
    { pos: [0.58, 0.56, 0.52], strength: 0.58, subtract: 0.3 },
    { pos: [0.5, 0.45, 0.5], strength: 0.42, subtract: 0.3 },
    { pos: [0.5, 0.3, 0.5], strength: 0.24, subtract: 0.3 },
  ],
};

function makeMarcher(resolution, material) {
  const marcher = new MarchingCubes(resolution, material, true, true, 20000);
  marcher.isolation = 82;
  marcher.enableUvs = true;
  marcher.enableColors = false;
  marcher.scale.set(1.2, 1.2, 1.2);
  return marcher;
}

function computeLodWeights(distance, tier) {
  const thresholds = DISTANCE_BY_TIER[tier] || DISTANCE_BY_TIER.medium;
  const weights = [0, 0, 0, 0, 0];

  if (distance <= thresholds[0]) {
    weights[4] = 1;
    return weights;
  }
  if (distance >= thresholds[4]) {
    weights[0] = 1;
    return weights;
  }

  for (let i = 0; i < thresholds.length - 1; i += 1) {
    const a = thresholds[i];
    const b = thresholds[i + 1];
    if (distance >= a && distance < b) {
      const t = THREE.MathUtils.smoothstep((distance - a) / Math.max(0.001, b - a), 0, 1);
      const lowIndex = Math.max(0, 4 - (i + 1));
      const highIndex = Math.max(0, 4 - i);
      weights[highIndex] = 1 - t;
      weights[lowIndex] = t;
      return weights;
    }
  }

  weights[2] = 1;
  return weights;
}

export default function MedicalMarchingLODOrgan({
  organType = 'heart',
  color = '#d86c6b',
  severity = 0,
  heartbeat = 72,
  tier = 'medium',
  mode = 0,
}) {
  const groupRef = useRef();
  const lodRefs = useRef([]);
  const { camera } = useThree();

  const metaballs = ORGAN_METABALLS[organType] || ORGAN_METABALLS.heart;

  const materials = useMemo(() => {
    const tissueSubdermal = organType === 'brain' ? '#9ecbff' : organType === 'lungs' ? '#8fd6ff' : '#ff9f8f';
    return DETAIL_STAGES.map(({ stage }) =>
      createMedicalTissueMaterial({
        baseColor: color,
        subdermalColor: tissueSubdermal,
        severity,
        heartbeat,
        scattering: organType === 'brain' ? 0.62 : 0.86,
        anisotropy: organType === 'heart' ? 0.9 : organType === 'lungs' ? 0.75 : 0.68,
        mode,
      })
    );
  }, [organType, color, severity, heartbeat, mode]);

  const marchers = useMemo(
    () => DETAIL_STAGES.map(({ resolution }, idx) => makeMarcher(resolution, materials[idx])),
    [materials]
  );

  useEffect(() => () => {
    marchers.forEach((marcher) => marcher?.geometry?.dispose?.());
    materials.forEach((material) => material?.dispose?.());
  }, [marchers, materials]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const bpmHz = heartbeat / 60;
    const pulse = 1 + Math.sin(t * bpmHz * Math.PI * 2) * 0.035;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(pulse);
    }

    const distance = groupRef.current
      ? camera.position.distanceTo(groupRef.current.getWorldPosition(new THREE.Vector3()))
      : 8;

    const weights = computeLodWeights(distance, tier);

    marchers.forEach((marcher, idx) => {
      const wobble = Math.sin(t * 0.65 + idx * 0.45) * 0.01;
      marcher.reset();
      metaballs.forEach((b, i) => {
        const shift = Math.sin(t * (0.8 + i * 0.22) + i) * 0.015;
        marcher.addBall(
          b.pos[0] + (i % 2 === 0 ? wobble : -wobble),
          b.pos[1] + shift,
          b.pos[2] + wobble,
          b.strength,
          b.subtract
        );
      });

      const opacity = THREE.MathUtils.clamp(weights[idx], 0, 1);
      marcher.visible = opacity > 0.01;
      marcher.material.transparent = true;
      marcher.material.opacity = opacity;
      updateMedicalTissueUniforms(marcher.material, { time: t, severity, heartbeat });
    });
  });

  return (
    <group ref={groupRef}>
      {marchers.map((marcher, idx) => (
        <primitive
          key={DETAIL_STAGES[idx].stage}
          object={marcher}
          ref={(node) => {
            lodRefs.current[idx] = node;
          }}
        />
      ))}
    </group>
  );
}
