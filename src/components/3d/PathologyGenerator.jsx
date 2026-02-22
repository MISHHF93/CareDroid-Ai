import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial, Text } from '@react-three/drei';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { getPerformanceWorkerService } from '../../services/realtime/PerformanceWorkerService';

const TissuePathologyMaterial = shaderMaterial(
  {
    uTime: 0,
    uSeverity: 0.2,
    uNecrosis: 0,
    uHealing: 0,
    uOpacity: 0.8,
    uHealthyColor: new THREE.Color('#dbeafe'),
    uDiseasedColor: new THREE.Color('#991b1b'),
  },
  `
    varying vec3 vPos;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uSeverity;

    void main() {
      vPos = position;
      vNormal = normalize(normalMatrix * normal);
      float warp = sin(position.y * 7.0 + uTime * 1.2) * 0.06 * uSeverity;
      vec3 displaced = position + normal * warp;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  `
    varying vec3 vPos;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uSeverity;
    uniform float uNecrosis;
    uniform float uHealing;
    uniform float uOpacity;
    uniform vec3 uHealthyColor;
    uniform vec3 uDiseasedColor;

    float hash(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 33.719))) * 43758.5453);
    }

    void main() {
      float lesion = smoothstep(0.25, 0.9, hash(vPos * 8.0 + uTime * 0.2));
      float tissueDamage = lesion * uSeverity;
      float necrosisMask = smoothstep(0.35, 1.0, hash(vPos * 14.0 + 9.1)) * uNecrosis;

      vec3 diseased = mix(uDiseasedColor, vec3(0.04, 0.04, 0.04), necrosisMask);
      vec3 color = mix(uHealthyColor, diseased, clamp(tissueDamage, 0.0, 1.0));
      color = mix(color, uHealthyColor, clamp(uHealing, 0.0, 1.0));

      float fresnel = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.0);
      color += fresnel * vec3(0.18, 0.06, 0.06) * uSeverity;

      float dissolve = smoothstep(0.0, 1.0, hash(vPos * 20.0 + uTime * 0.1));
      float alpha = uOpacity * (1.0 - necrosisMask * dissolve * 0.8);

      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ TissuePathologyMaterial });

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultDiagnosis() {
  return {
    tumor: { enabled: true, size: 0.45, stage: 2, invasiveness: 0.55 },
    atherosclerosis: { enabled: true, severity: 0.5 },
    infection: { enabled: true, severity: 0.6, spread: 0.5 },
    fracture: { enabled: true, severity: 0.45 },
    inflammation: { enabled: true, severity: 0.7 },
    tissueDamage: { enabled: true, severity: 0.52, necrosis: 0.35, healing: 0.2 },
    mutation: { enabled: true, severity: 0.5, mutationSites: [4, 11, 19, 27] },
  };
}

function createTumorMarcher() {
  const material = new THREE.MeshStandardMaterial({
    color: '#7f1d1d',
    roughness: 0.45,
    metalness: 0.08,
    transparent: true,
    opacity: 0.86,
    emissive: new THREE.Color('#450a0a'),
    emissiveIntensity: 0.7,
  });

  const marcher = new MarchingCubes(36, material, true, true, 20000);
  marcher.enableUvs = true;
  marcher.enableColors = false;
  marcher.isolation = 78;
  return marcher;
}

function TumorMetaballGrowth({ config, noise }) {
  const marcher = useMemo(() => createTumorMarcher(), []);

  useEffect(() => () => {
    marcher.geometry?.dispose?.();
    marcher.material?.dispose?.();
  }, [marcher]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const stage = clamp(config.stage ?? 2, 1, 4);
    const invasiveness = clamp(config.invasiveness ?? 0.5, 0, 1);
    const size = clamp(config.size ?? 0.4, 0.15, 1.2);

    marcher.reset();

    const blobs = 3 + Math.round(stage * 2 + invasiveness * 3);
    for (let index = 0; index < blobs; index += 1) {
      const angle = (index / blobs) * Math.PI * 2 + t * 0.15;
      const radius = 0.1 + invasiveness * 0.28;
      const nx = noise.noise(index * 1.1, t * 0.2, 1.9) * 0.12;
      const ny = noise.noise(index * 2.2, t * 0.22, 3.7) * 0.12;
      const nz = noise.noise(index * 3.1, t * 0.18, 5.4) * 0.12;
      const px = 0.5 + Math.cos(angle) * radius + nx;
      const py = 0.5 + Math.sin(angle * 1.4) * radius * 0.75 + ny;
      const pz = 0.5 + Math.sin(angle) * radius + nz;
      const strength = 0.45 + size * 0.6 + stage * 0.05;
      const subtract = 0.22 + (1 - invasiveness) * 0.16;

      marcher.addBall(px, py, pz, strength, subtract);
    }

    marcher.scale.setScalar(0.55 + size * 0.9);
    marcher.position.set(0.25 + invasiveness * 0.2, 0.15, 0.3);
  });

  return <primitive object={marcher} />;
}

function PlaqueDeposits({ severity = 0.5, noise }) {
  const count = Math.round(40 + severity * 120);
  const meshRef = useRef();

  const transforms = useMemo(() => {
    const matrix = new THREE.Matrix4();
    const data = [];

    for (let i = 0; i < count; i += 1) {
      const t = i / Math.max(1, count - 1);
      const angle = t * Math.PI * 5.5;
      const center = new THREE.Vector3(
        Math.cos(angle) * (0.62 + noise.noise(t * 9, 1.2, 0.4) * 0.08),
        (t - 0.5) * 1.5,
        Math.sin(angle) * (0.33 + noise.noise(t * 7, 3.7, 2.6) * 0.08)
      );

      const scale = 0.02 + Math.abs(noise.noise(t * 13, 2.2, 8.1)) * 0.05 * severity;
      const rot = new THREE.Euler(
        noise.noise(t * 2.1, 5.1, 9.1) * Math.PI,
        noise.noise(t * 2.2, 4.1, 7.1) * Math.PI,
        noise.noise(t * 2.3, 3.1, 5.1) * Math.PI
      );

      matrix.compose(center, new THREE.Quaternion().setFromEuler(rot), new THREE.Vector3(scale, scale * 0.75, scale));
      data.push(matrix.clone());
    }

    return data;
  }, [count, noise, severity]);

  useEffect(() => {
    if (!meshRef.current) return;
    transforms.forEach((matrix, idx) => meshRef.current.setMatrixAt(idx, matrix));
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#d6d3d1" roughness={0.3} metalness={0.28} />
    </instancedMesh>
  );
}

function InfectionSpread({ severity = 0.6, spread = 0.5 }) {
  const tendrilRef = useRef();
  const cloudRef = useRef();

  const tendrilPoints = useMemo(() => {
    const points = [];
    const branches = 14;

    for (let branch = 0; branch < branches; branch += 1) {
      const branchOffset = (branch / branches) * Math.PI * 2;
      for (let i = 0; i < 22; i += 1) {
        const t = i / 21;
        const radius = (0.2 + t * (0.8 + spread * 0.6)) * (0.7 + Math.sin(branchOffset + t * 5.4) * 0.1);
        points.push(
          Math.cos(branchOffset + t * 2.4) * radius,
          (t - 0.5) * (1.5 + spread),
          Math.sin(branchOffset + t * 2.1) * radius
        );
      }
    }

    return new Float32Array(points);
  }, [spread]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (tendrilRef.current) {
      tendrilRef.current.material.opacity = 0.22 + severity * 0.38 + Math.sin(t * 2.3) * 0.08;
      tendrilRef.current.rotation.y = t * 0.12;
    }
    if (cloudRef.current) {
      cloudRef.current.material.opacity = 0.12 + severity * 0.24 + Math.sin(t * 1.6) * 0.05;
      cloudRef.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.07 * spread);
    }
  });

  return (
    <group>
      <lineSegments ref={tendrilRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[tendrilPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#1f2937" transparent opacity={0.45} />
      </lineSegments>
      <mesh ref={cloudRef}>
        <sphereGeometry args={[0.95 + spread * 0.4, 28, 28]} />
        <meshBasicMaterial color="#111827" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

function createBoidData(count, radius = 1.4) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const phi = Math.random() * Math.PI * 2;
    const costheta = Math.random() * 2 - 1;
    const u = Math.random();
    const r = radius * Math.cbrt(u);
    const theta = Math.acos(costheta);

    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    positions[i * 3 + 2] = r * Math.cos(theta);

    velocities[i * 3] = (Math.random() - 0.5) * 0.004;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
  }

  return { positions, velocities };
}

function PathogenSwarm({ enabled, count = 2000, infectionSeverity = 0.65 }) {
  const pointsRef = useRef();
  const boidRef = useRef(createBoidData(count, 1.4 + infectionSeverity * 0.8));
  const workerRef = useRef(null);
  const pendingRef = useRef(false);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    workerRef.current = getPerformanceWorkerService();
    return () => {
      pendingRef.current = false;
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!enabled || !pointsRef.current) return;
    const t = clock.getElapsedTime();

    const { positions, velocities } = boidRef.current;
    const n = count;
    const dtScale = clamp(delta / 0.016, 0.3, 2.4);

    accumulatorRef.current += delta;

    if (workerRef.current && n >= 1600 && !pendingRef.current && accumulatorRef.current >= 0.033) {
      pendingRef.current = true;
      accumulatorRef.current = 0;

      const posCopy = new Float32Array(positions);
      const velCopy = new Float32Array(velocities);
      workerRef.current.simulateBoids({
        positions: posCopy,
        velocities: velCopy,
        count: n,
        infectionSeverity,
        delta,
      }).then((result) => {
        if (!result) return;
        boidRef.current.positions = new Float32Array(result.positions);
        boidRef.current.velocities = new Float32Array(result.velocities);
        if (pointsRef.current?.geometry?.attributes?.position) {
          pointsRef.current.geometry.attributes.position.array = boidRef.current.positions;
          pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }).catch(() => {
        // fallback stays on main thread
      }).finally(() => {
        pendingRef.current = false;
      });
    } else if (!pendingRef.current) {
      for (let i = 0; i < n; i += 1) {
        const base = i * 3;
        positions[base] += velocities[base] * dtScale;
        positions[base + 1] += velocities[base + 1] * dtScale;
        positions[base + 2] += velocities[base + 2] * dtScale;

        const radial = Math.sqrt(
          positions[base] * positions[base] +
          positions[base + 1] * positions[base + 1] +
          positions[base + 2] * positions[base + 2]
        );
        const boundary = 1.8 + infectionSeverity * 0.8;
        if (radial > boundary) {
          positions[base] *= 0.97;
          positions[base + 1] *= 0.97;
          positions[base + 2] *= 0.97;
          velocities[base] *= -0.4;
          velocities[base + 1] *= -0.4;
          velocities[base + 2] *= -0.4;
        }
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.08;
  });

  if (!enabled) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[boidRef.current.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#86efac"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function FractureVoronoi({ severity = 0.5, noise }) {
  const count = Math.round(18 + severity * 45);
  const instRef = useRef();
  const cracksRef = useRef();

  const shardMatrices = useMemo(() => {
    const matrices = [];
    for (let i = 0; i < count; i += 1) {
      const seed = i * 0.67;
      const x = noise.noise(seed, 2.1, 0.4) * 0.65;
      const y = noise.noise(seed, 5.2, 1.7) * 0.65;
      const z = noise.noise(seed, 8.8, 3.3) * 0.2;
      const spread = 0.08 + severity * 0.26;
      const pos = new THREE.Vector3(x * spread * 7, y * spread * 7, z * spread * 3);
      const rot = new THREE.Euler(
        noise.noise(seed, 1.1, 4.2) * Math.PI,
        noise.noise(seed, 3.1, 6.2) * Math.PI,
        noise.noise(seed, 7.1, 8.2) * Math.PI
      );
      const scl = 0.02 + Math.abs(noise.noise(seed, 4.4, 7.5)) * 0.09;

      const m = new THREE.Matrix4();
      m.compose(pos, new THREE.Quaternion().setFromEuler(rot), new THREE.Vector3(scl, scl, scl));
      matrices.push(m);
    }
    return matrices;
  }, [count, noise, severity]);

  const crackPositions = useMemo(() => {
    const lines = [];
    const branches = Math.round(8 + severity * 16);
    for (let b = 0; b < branches; b += 1) {
      let x = 0;
      let y = 0;
      let z = 0;
      for (let s = 0; s < 16; s += 1) {
        const nx = noise.noise(b * 0.7, s * 0.13, 1.4) * 0.1;
        const ny = noise.noise(b * 0.9, s * 0.17, 2.1) * 0.1;
        const nz = noise.noise(b * 1.1, s * 0.19, 3.5) * 0.04;
        const next = [x + nx, y + ny, z + nz];
        lines.push(x, y, z, next[0], next[1], next[2]);
        [x, y, z] = next;
      }
    }
    return new Float32Array(lines);
  }, [noise, severity]);

  useEffect(() => {
    if (!instRef.current) return;
    shardMatrices.forEach((m, idx) => instRef.current.setMatrixAt(idx, m));
    instRef.current.instanceMatrix.needsUpdate = true;
  }, [shardMatrices]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (cracksRef.current) {
      const propagation = clamp((Math.sin(t * 0.7) * 0.5 + 0.5) * severity + 0.2, 0, 1);
      cracksRef.current.material.opacity = 0.2 + propagation * 0.7;
      cracksRef.current.scale.setScalar(0.75 + propagation * 0.5);
    }
  });

  return (
    <group>
      <instancedMesh ref={instRef} args={[null, null, count]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.8} metalness={0.05} transparent opacity={0.68} />
      </instancedMesh>
      <lineSegments ref={cracksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[crackPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#111827" transparent opacity={0.55} />
      </lineSegments>
    </group>
  );
}

function InflammationClouds({ severity = 0.6 }) {
  const refs = useRef([]);
  const nodes = useMemo(() => {
    const count = Math.round(8 + severity * 12);
    const arr = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      arr.push({
        position: [Math.cos(angle) * (0.5 + severity * 0.2), Math.sin(angle * 1.3) * 0.65, Math.sin(angle) * 0.4],
        scale: 0.2 + Math.random() * 0.38,
      });
    }
    return arr;
  }, [severity]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((node, i) => {
      if (!node) return;
      const pulse = 1 + Math.sin(t * 1.8 + i * 0.8) * 0.25;
      node.scale.setScalar(nodes[i].scale * pulse);
      node.material.opacity = 0.12 + severity * 0.38 + Math.sin(t * 1.7 + i) * 0.05;
    });
  });

  return (
    <group>
      {nodes.map((item, index) => (
        <mesh
          key={index}
          ref={(n) => {
            refs.current[index] = n;
          }}
          position={item.position}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function TissueDamageShell({ config }) {
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uTime = clock.getElapsedTime();
    matRef.current.uSeverity = clamp(config.severity ?? 0.5, 0, 1);
    matRef.current.uNecrosis = clamp(config.necrosis ?? 0.3, 0, 1);
    matRef.current.uHealing = clamp(config.healing ?? 0.2, 0, 1);
    matRef.current.uOpacity = 0.22 + (1 - matRef.current.uHealing) * 0.52;
  });

  return (
    <mesh>
      <sphereGeometry args={[1.05, 80, 80]} />
      <tissuePathologyMaterial ref={matRef} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function GeneticMutationViz({ severity = 0.5, mutationSites = [5, 12, 17, 23] }) {
  const helixRef = useRef();
  const proteinRef = useRef();

  const helixPointsA = useMemo(() => {
    const pts = [];
    const steps = 64;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const angle = t * Math.PI * 10;
      pts.push(new THREE.Vector3(Math.cos(angle) * 0.25, (t - 0.5) * 2.2, Math.sin(angle) * 0.25));
    }
    return pts;
  }, []);

  const helixPointsB = useMemo(
    () => helixPointsA.map((p, i) => {
      const t = i / Math.max(1, helixPointsA.length - 1);
      const angle = t * Math.PI * 10 + Math.PI;
      return new THREE.Vector3(Math.cos(angle) * 0.25, p.y, Math.sin(angle) * 0.25);
    }),
    [helixPointsA]
  );

  const mutationMarkers = useMemo(() => {
    return mutationSites.map((index) => {
      const clamped = clamp(index, 0, helixPointsA.length - 1);
      const a = helixPointsA[clamped];
      const b = helixPointsB[clamped];
      return new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    });
  }, [helixPointsA, helixPointsB, mutationSites]);

  const proteinPositions = useMemo(() => {
    const points = [];
    const steps = 120;
    for (let i = 0; i < steps; i += 1) {
      const t = i / (steps - 1);
      points.push(new THREE.Vector3(
        Math.sin(t * Math.PI * 4) * 0.45,
        (t - 0.5) * 1.8,
        Math.cos(t * Math.PI * 3) * 0.28
      ));
    }
    return new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (helixRef.current) {
      helixRef.current.rotation.y = t * 0.35;
      helixRef.current.position.x = 1.35;
      helixRef.current.position.y = 0.35;
    }
    if (proteinRef.current) {
      proteinRef.current.rotation.x = Math.sin(t * 0.6) * 0.4;
      proteinRef.current.rotation.y = t * 0.22;
      proteinRef.current.scale.setScalar(0.8 + severity * 0.35 + Math.sin(t * 1.4) * 0.04);
    }
  });

  return (
    <group>
      <group ref={helixRef}>
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(helixPointsA.flatMap((p) => [p.x, p.y, p.z])), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#60a5fa" />
        </line>
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(helixPointsB.flatMap((p) => [p.x, p.y, p.z])), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#34d399" />
        </line>

        {mutationMarkers.map((marker, idx) => (
          <mesh key={idx} position={marker.toArray()}>
            <sphereGeometry args={[0.03 + severity * 0.02, 16, 16]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
        ))}

        <Text position={[0, 1.25, 0]} fontSize={0.08} color="#fca5a5">
          Mutation Sites
        </Text>
      </group>

      <group ref={proteinRef} position={[2.1, -0.4, 0]}>
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[proteinPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#c4b5fd" />
        </line>
        <Text position={[0, 1.1, 0]} fontSize={0.07} color="#ddd6fe">
          Protein Folding Impact
        </Text>
      </group>
    </group>
  );
}

export default function PathologyGenerator({
  organType = 'heart',
  diagnosis,
  timeline = 0.2,
  pathogenCount = 2200,
  position = [0, 0, 0],
  scale = 1,
}) {
  const pathology = diagnosis || defaultDiagnosis();
  const noise = useMemo(() => new ImprovedNoise(), []);

  const tissueConfig = useMemo(() => {
    const cfg = pathology.tissueDamage || {};
    return {
      severity: clamp(cfg.severity ?? 0.5, 0, 1),
      necrosis: clamp(cfg.necrosis ?? 0.3, 0, 1),
      healing: clamp(cfg.healing ?? timeline, 0, 1),
    };
  }, [pathology.tissueDamage, timeline]);

  return (
    <group position={position} scale={scale} name={`pathology-${organType}`}>
      {pathology.tissueDamage?.enabled !== false && <TissueDamageShell config={tissueConfig} />}

      {pathology.tumor?.enabled && <TumorMetaballGrowth config={pathology.tumor} noise={noise} />}

      {pathology.atherosclerosis?.enabled && (
        <PlaqueDeposits severity={clamp(pathology.atherosclerosis.severity ?? 0.5, 0, 1)} noise={noise} />
      )}

      {pathology.infection?.enabled && (
        <>
          <InfectionSpread
            severity={clamp(pathology.infection.severity ?? 0.6, 0, 1)}
            spread={clamp(pathology.infection.spread ?? 0.5, 0, 1)}
          />
          <PathogenSwarm
            enabled
            count={Math.max(1200, pathogenCount)}
            infectionSeverity={clamp(pathology.infection.severity ?? 0.6, 0, 1)}
          />
        </>
      )}

      {pathology.fracture?.enabled && (
        <FractureVoronoi severity={clamp(pathology.fracture.severity ?? 0.45, 0, 1)} noise={noise} />
      )}

      {pathology.inflammation?.enabled && (
        <InflammationClouds severity={clamp(pathology.inflammation.severity ?? 0.6, 0, 1)} />
      )}

      {pathology.mutation?.enabled && (
        <GeneticMutationViz
          severity={clamp(pathology.mutation.severity ?? 0.5, 0, 1)}
          mutationSites={pathology.mutation.mutationSites || [4, 11, 19, 27]}
        />
      )}
    </group>
  );
}
