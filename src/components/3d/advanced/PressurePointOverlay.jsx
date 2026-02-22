import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

const PressurePointMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 0.5,
    uColor: new THREE.Color('#ff4d4f'),
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uIntensity;

    void main() {
      vUv = uv;
      vNormal = normal;

      vec2 centered = uv - vec2(0.5);
      float radial = exp(-dot(centered, centered) * 16.0);
      float pulse = 0.9 + sin(uTime * 5.5) * 0.1;
      float bump = radial * uIntensity * 0.12 * pulse;

      vec3 displaced = position + normal * bump;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;

    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColor;

    void main() {
      vec2 centered = vUv - vec2(0.5);
      float radial = exp(-dot(centered, centered) * 14.0);
      float ring = smoothstep(0.25, 0.0, abs(length(centered) - 0.28));
      float pulse = 0.75 + sin(uTime * 5.5) * 0.25;
      vec3 glow = uColor * (radial * 0.8 + ring * 0.7) * (0.5 + uIntensity) * pulse;

      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
      float alpha = clamp(radial * (0.4 + uIntensity * 0.4) + fresnel * 0.2, 0.12, 0.88);

      gl_FragColor = vec4(glow, alpha);
    }
  `
);

extend({ PressurePointMaterial });

export default function PressurePointOverlay({ points = [], severity = 0 }) {
  const refs = useRef([]);

  const resolved = useMemo(() => {
    if (!Array.isArray(points) || points.length === 0) {
      return [
        { position: [0.24, 0.2, 0.55], intensity: Math.min(1, 0.35 + severity * 0.1) },
      ];
    }

    return points.map((p) => ({
      position: p.position || [0, 0, 0.4],
      intensity: Math.max(0.1, Math.min(1, Number(p.intensity ?? p.severity ?? 0.4))),
    }));
  }, [points, severity]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mat) => {
      if (mat) mat.uTime = t;
    });
  });

  return (
    <group>
      {resolved.map((point, idx) => (
        <mesh key={`${point.position.join('-')}-${idx}`} position={point.position} scale={[0.22, 0.22, 0.22]} renderOrder={7}>
          <sphereGeometry args={[1, 24, 24]} />
          <pressurePointMaterial
            ref={(node) => {
              refs.current[idx] = node;
            }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uIntensity={point.intensity}
          />
        </mesh>
      ))}
    </group>
  );
}
