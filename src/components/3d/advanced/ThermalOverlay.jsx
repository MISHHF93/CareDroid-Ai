import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

const ThermalMaterial = shaderMaterial(
  {
    uTime: 0,
    uSeverity: 0,
    uHotspots: [
      new THREE.Vector3(0.1, 0.1, 0.6),
      new THREE.Vector3(-0.3, 0.2, 0.4),
      new THREE.Vector3(0.2, -0.2, 0.3),
      new THREE.Vector3(0.0, 0.0, 0.0),
    ],
  },
  /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;
    void main() {
      vPos = position;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;

    uniform float uTime;
    uniform float uSeverity;
    uniform vec3 uHotspots[4];

    float gaussian(vec3 p, vec3 center, float sigma) {
      float d2 = dot(p - center, p - center);
      return exp(-d2 / (2.0 * sigma * sigma));
    }

    vec3 thermalGradient(float t) {
      t = clamp(t, 0.0, 1.0);
      vec3 blue = vec3(0.1, 0.25, 0.95);
      vec3 green = vec3(0.1, 0.82, 0.4);
      vec3 yellow = vec3(0.95, 0.88, 0.22);
      vec3 orange = vec3(0.98, 0.55, 0.14);
      vec3 red = vec3(0.96, 0.18, 0.14);

      if (t < 0.25) return mix(blue, green, t / 0.25);
      if (t < 0.5) return mix(green, yellow, (t - 0.25) / 0.25);
      if (t < 0.75) return mix(yellow, orange, (t - 0.5) / 0.25);
      return mix(orange, red, (t - 0.75) / 0.25);
    }

    void main() {
      float heat = 0.0;
      for (int i = 0; i < 4; i++) {
        heat += gaussian(vPos, uHotspots[i].xyz, 0.38) * uHotspots[i].z;
      }

      // Procedural diffusion with a tiny gaussian-blur neighborhood sample
      float diffusion = 0.0;
      vec3 o1 = vec3(0.06, 0.0, 0.0);
      vec3 o2 = vec3(0.0, 0.06, 0.0);
      diffusion += gaussian(vPos + o1, uHotspots[0].xyz, 0.42) * uHotspots[0].z;
      diffusion += gaussian(vPos - o1, uHotspots[1].xyz, 0.42) * uHotspots[1].z;
      diffusion += gaussian(vPos + o2, uHotspots[2].xyz, 0.42) * uHotspots[2].z;
      diffusion += gaussian(vPos - o2, uHotspots[3].xyz, 0.42) * uHotspots[3].z;
      heat = mix(heat, diffusion * 0.25 + heat * 0.75, 0.62);

      float pulse = 0.95 + sin(uTime * 1.8) * 0.05;
      float thermal = clamp(heat * (0.8 + uSeverity * 0.12) * pulse, 0.0, 1.0);

      vec3 color = thermalGradient(thermal);
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
      float alpha = clamp(thermal * 0.45 + fresnel * 0.18, 0.08, 0.7);

      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ ThermalMaterial });

export default function ThermalOverlay({ severity = 0, hotspots = [] }) {
  const ref = useRef();

  const mappedHotspots = useMemo(() => {
    const defaults = [
      new THREE.Vector3(0.12, 0.22, Math.min(1, 0.3 + severity * 0.12)),
      new THREE.Vector3(-0.2, 0.1, Math.min(1, 0.2 + severity * 0.1)),
      new THREE.Vector3(0.18, -0.22, Math.min(1, 0.18 + severity * 0.09)),
      new THREE.Vector3(0.0, 0.0, 0.1),
    ];

    if (!Array.isArray(hotspots) || hotspots.length === 0) return defaults;

    return Array.from({ length: 4 }, (_, i) => {
      const item = hotspots[i] || hotspots[hotspots.length - 1] || { position: [0, 0, 0], temperature: 0.2 };
      const pos = item.position || [0, 0, 0];
      const tempNorm = Math.max(0, Math.min(1, Number(item.temperature ?? item.intensity ?? 0.25)));
      return new THREE.Vector3(pos[0], pos[1], tempNorm);
    });
  }, [hotspots, severity]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.uTime = clock.getElapsedTime();
  });

  return (
    <mesh scale={[1.35, 1.35, 1.35]} renderOrder={6}>
      <sphereGeometry args={[1, 48, 48]} />
      <thermalMaterial
        ref={ref}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uSeverity={severity}
        uHotspots={mappedHotspots}
      />
    </mesh>
  );
}
