import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const out = new THREE.Vector3();
  out.addScaledVector(p0, uuu);
  out.addScaledVector(p1, 3 * uu * t);
  out.addScaledVector(p2, 3 * u * tt);
  out.addScaledVector(p3, ttt);
  return out;
}

const BLOOD_PATHS = [
  [new THREE.Vector3(-0.9, 0.2, 0.2), new THREE.Vector3(-0.45, 0.75, 0.15), new THREE.Vector3(0.4, 0.85, -0.1), new THREE.Vector3(0.9, 0.1, -0.2)],
  [new THREE.Vector3(-0.8, -0.3, -0.2), new THREE.Vector3(-0.2, 0.2, 0.25), new THREE.Vector3(0.2, 0.1, -0.25), new THREE.Vector3(0.85, -0.35, 0.15)],
  [new THREE.Vector3(-0.5, 0.9, 0.05), new THREE.Vector3(-0.2, 0.35, 0.25), new THREE.Vector3(0.25, -0.15, 0.1), new THREE.Vector3(0.55, -0.82, -0.1)],
];

const CSF_PATHS = [
  [new THREE.Vector3(-0.55, 0.7, 0.2), new THREE.Vector3(-0.2, 0.5, 0.5), new THREE.Vector3(0.2, 0.2, 0.4), new THREE.Vector3(0.45, -0.1, 0.25)],
  [new THREE.Vector3(0.5, 0.65, -0.2), new THREE.Vector3(0.15, 0.42, -0.42), new THREE.Vector3(-0.2, 0.05, -0.35), new THREE.Vector3(-0.45, -0.2, -0.15)],
];

function tierCounts(tier) {
  if (tier === 'high') {
    return { blood: 18000, fluid: 9500, lymph: 7000, air: 11000 };
  }
  if (tier === 'low') {
    return { blood: 1800, fluid: 900, lymph: 800, air: 1200 };
  }
  return { blood: 6200, fluid: 2800, lymph: 2100, air: 3600 };
}

export function VascularFlowParticles({ tier = 'medium', heartbeat = 72 }) {
  const meshRef = useRef();
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(0.006, 0.006, 0.006), []);

  const count = tierCounts(tier).blood;

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        phase: Math.random(),
        speed: 0.03 + Math.random() * 0.055,
        pathIndex: index % BLOOD_PATHS.length,
        jitter: (Math.random() - 0.5) * 0.03,
      })),
    [count]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const t = clock.getElapsedTime();
    const beatWave = 1 + Math.sin(t * (heartbeat / 60) * Math.PI * 2) * 0.18;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const path = BLOOD_PATHS[particle.pathIndex];
      const sample = (particle.phase + t * particle.speed * beatWave) % 1;
      const pos = cubicBezier(path[0], path[1], path[2], path[3], sample);
      pos.y += particle.jitter;
      matrix.compose(pos, quaternion, scale);
      meshRef.current.setMatrixAt(i, matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ff4d4f" toneMapped={false} transparent opacity={0.8} />
    </instancedMesh>
  );
}

function usePBDParticles(count, paths, baseSpeed = 0.06) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, idx) => ({
        pathIndex: idx % paths.length,
        phase: Math.random(),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.003),
        damping: 0.94 + Math.random() * 0.04,
        speed: baseSpeed + Math.random() * baseSpeed,
      })),
    [count, paths, baseSpeed]
  );
}

export function MultiFluidPBDSystem({ tier = 'medium', heartbeat = 72 }) {
  const csfRef = useRef();
  const lymphRef = useRef();
  const airRef = useRef();

  const counts = tierCounts(tier);

  const csf = usePBDParticles(counts.fluid, CSF_PATHS, 0.04);
  const lymph = usePBDParticles(counts.lymph, BLOOD_PATHS, 0.02);
  const air = usePBDParticles(counts.air, BLOOD_PATHS, 0.08);

  const updatePoints = (geometry, particles, time, amplitude = 0.01) => {
    const arr = geometry.attributes.position.array;

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      const path = (p.pathIndex % 2 === 0 ? BLOOD_PATHS : CSF_PATHS)[p.pathIndex % 2];
      const beat = 1 + Math.sin(time * (heartbeat / 60) * Math.PI * 2) * 0.08;
      p.phase = (p.phase + p.speed * 0.0025 * beat) % 1;
      const target = cubicBezier(path[0], path[1], path[2], path[3], p.phase);

      // Position Based Dynamics approximation: predict + satisfy positional constraint toward curve
      p.velocity.x += (target.x - (arr[i * 3] || 0)) * 0.02;
      p.velocity.y += (target.y - (arr[i * 3 + 1] || 0)) * 0.02;
      p.velocity.z += (target.z - (arr[i * 3 + 2] || 0)) * 0.02;

      p.velocity.multiplyScalar(p.damping);

      arr[i * 3] = (arr[i * 3] || target.x) + p.velocity.x + Math.sin(time + i * 0.01) * amplitude;
      arr[i * 3 + 1] = (arr[i * 3 + 1] || target.y) + p.velocity.y;
      arr[i * 3 + 2] = (arr[i * 3 + 2] || target.z) + p.velocity.z;
    }

    geometry.attributes.position.needsUpdate = true;
  };

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (csfRef.current?.geometry) updatePoints(csfRef.current.geometry, csf, t, 0.004);
    if (lymphRef.current?.geometry) updatePoints(lymphRef.current.geometry, lymph, t, 0.002);
    if (airRef.current?.geometry) updatePoints(airRef.current.geometry, air, t, 0.007);
  });

  return (
    <group>
      <points ref={csfRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(counts.fluid * 3), 3]} />
        </bufferGeometry>
        <pointsMaterial color="#85c9ff" size={0.01} transparent opacity={0.7} depthWrite={false} />
      </points>

      <points ref={lymphRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(counts.lymph * 3), 3]} />
        </bufferGeometry>
        <pointsMaterial color="#9effa5" size={0.008} transparent opacity={0.55} depthWrite={false} />
      </points>

      <points ref={airRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(counts.air * 3), 3]} />
        </bufferGeometry>
        <pointsMaterial color="#d6f5ff" size={0.012} transparent opacity={0.35} depthWrite={false} />
      </points>
    </group>
  );
}

export function NeuralPathwayImpulses({ tier = 'medium' }) {
  const count = tier === 'high' ? 72 : tier === 'low' ? 18 : 36;
  const lineRef = useRef();

  const curves = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i += 1) {
      const z = (i / Math.max(1, count - 1) - 0.5) * 0.8;
      list.push([
        new THREE.Vector3(-0.52, 0.56 - z * 0.3, z),
        new THREE.Vector3(-0.12, 0.38 + z * 0.35, z * 0.4),
        new THREE.Vector3(0.12, 0.35 - z * 0.2, -z * 0.35),
        new THREE.Vector3(0.52, 0.56 + z * 0.3, -z),
      ]);
    }
    return list;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 2 * 3), [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    for (let i = 0; i < curves.length; i += 1) {
      const c = curves[i];
      const head = (Math.sin(t * 1.6 + i * 0.35) * 0.5 + 0.5) * 0.9;
      const tail = Math.max(0, head - 0.08);
      const a = cubicBezier(c[0], c[1], c[2], c[3], tail);
      const b = cubicBezier(c[0], c[1], c[2], c[3], head);

      const offset = i * 6;
      positions[offset] = a.x;
      positions[offset + 1] = a.y;
      positions[offset + 2] = a.z;
      positions[offset + 3] = b.x;
      positions[offset + 4] = b.y;
      positions[offset + 5] = b.z;
    }

    if (lineRef.current?.geometry?.attributes?.position) {
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#3ef4ff" transparent opacity={0.9} toneMapped={false} />
    </lineSegments>
  );
}
