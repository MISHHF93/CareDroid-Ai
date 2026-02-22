import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';

const HolographicMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: new THREE.Color('#00e5ff'),
    uGlowColor: new THREE.Color('#a855f7'),
    uSeverity: 0,
    uCritical: 0,
    uScanIntensity: 1,
    uIridescence: 1,
    uOpacity: 0.92,
  },
  /* glsl */ `
    varying vec3 vNormalWorld;
    varying vec3 vViewDir;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    uniform float uTime;
    uniform float uScanIntensity;

    void main() {
      vUv = uv;
      vec3 displaced = position;
      float scanWave = sin((position.y * 18.0) + (uTime * 5.0));
      displaced += normal * scanWave * 0.012 * uScanIntensity;

      vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
      vWorldPos = worldPos.xyz;
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPos.xyz);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  /* glsl */ `
    varying vec3 vNormalWorld;
    varying vec3 vViewDir;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uGlowColor;
    uniform float uSeverity;
    uniform float uCritical;
    uniform float uIridescence;
    uniform float uOpacity;

    vec3 hsl2rgb(vec3 c) {
      vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      rgb = rgb * rgb * (3.0 - 2.0 * rgb);
      return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
    }

    void main() {
      vec3 n = normalize(vNormalWorld);
      vec3 v = normalize(vViewDir);

      float ndv = clamp(dot(n, v), 0.0, 1.0);
      float fresnel = pow(1.0 - ndv, 2.4);

      float scan = sin((vWorldPos.y * 45.0) - (uTime * 10.0));
      float scanMask = smoothstep(0.25, 1.0, scan * 0.5 + 0.5);

      float centerDistance = distance(vUv, vec2(0.5));
      vec3 chromatic = vec3(
        centerDistance * 0.18,
        centerDistance * 0.05,
        centerDistance * 0.22
      ) * (0.45 + fresnel);

      float hue = fract(0.54 + (1.0 - ndv) * 0.35 + sin(uTime * 0.55 + vWorldPos.y * 0.6) * 0.04);
      vec3 iridescent = hsl2rgb(vec3(hue, 0.8, 0.56));

      float glowFalloff = exp(-length(vWorldPos) * 0.22);
      float volumetricGlow = glowFalloff * (0.65 + fresnel * 1.9);

      vec3 base = mix(uBaseColor, uGlowColor, fresnel * 0.75);
      base += chromatic;
      base = mix(base, iridescent, fresnel * uIridescence * 0.85);
      base += uGlowColor * volumetricGlow * 0.7;
      base *= (0.85 + scanMask * 0.35);

      float severityBoost = clamp(uSeverity / 4.0, 0.0, 1.0);
      base = mix(base, vec3(1.0, 0.15, 0.12), uCritical * (0.22 + severityBoost * 0.55));

      float alpha = clamp(uOpacity + fresnel * 0.25 + scanMask * 0.08, 0.0, 1.0);
      gl_FragColor = vec4(base, alpha);
    }
  `
);

extend({ HolographicMaterial });

export function toSeverityFloat(score = 0) {
  return Math.max(0, Math.min(4, Number.isFinite(score) ? score : 0));
}

export function AnimatedHolographicMaterial({
  color = '#00e5ff',
  glowColor = '#a855f7',
  severity = 0,
  scanIntensity = 1,
  iridescence = 1,
  opacity = 0.92,
  critical = false,
}) {
  const materialRef = useRef();
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const rimGlow = useMemo(() => new THREE.Color(glowColor), [glowColor]);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uTime = clock.getElapsedTime();
  });

  return React.createElement('holographicMaterial', {
    ref: materialRef,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uBaseColor: baseColor,
    uGlowColor: rimGlow,
    uSeverity: toSeverityFloat(severity),
    uCritical: critical ? 1 : 0,
    uScanIntensity: scanIntensity,
    uIridescence: iridescence,
    uOpacity: opacity,
  });
}

export { HolographicMaterial };
