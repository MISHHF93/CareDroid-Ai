import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export default function RadiationDoseOverlay({
  enabled = false,
  tumorCenter = [0.2, 0.15, 0.3],
  doseLevel = 0.72,
}) {
  const cloudRefs = useRef([]);

  const layers = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }).map((_, i) => ({
      radius: 0.25 + i * 0.14,
      opacity: Math.max(0.06, (1 - i / count) * 0.28 * doseLevel),
      color: i < 2 ? '#ef4444' : i < 4 ? '#f59e0b' : '#22d3ee',
    }));
  }, [doseLevel]);

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.getElapsedTime();
    cloudRefs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const pulse = 1 + Math.sin(t * 1.2 + idx * 0.7) * 0.06;
      mesh.scale.setScalar(pulse);
      mesh.material.opacity = layers[idx].opacity + Math.sin(t * 1.5 + idx) * 0.015;
    });
  });

  if (!enabled) return null;

  return (
    <group position={tumorCenter}>
      {layers.map((layer, idx) => (
        <mesh
          key={idx}
          ref={(n) => {
            cloudRefs.current[idx] = n;
          }}
        >
          <sphereGeometry args={[layer.radius, 24, 24]} />
          <meshBasicMaterial color={layer.color} transparent opacity={layer.opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
