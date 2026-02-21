import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { colors } from '../../config/theme';

function DNAHelix() {
  const groupRef = useRef(null);
  const spheres = useMemo(() => Array.from({ length: 18 }, (_, index) => index), []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.75;
    }
  });

  return (
    <group ref={groupRef}>
      {spheres.map((index) => {
        const t = index / 18;
        const angle = t * Math.PI * 5;
        const y = (t - 0.5) * 3;
        const xA = Math.cos(angle) * 0.6;
        const zA = Math.sin(angle) * 0.6;
        const xB = Math.cos(angle + Math.PI) * 0.6;
        const zB = Math.sin(angle + Math.PI) * 0.6;
        return (
          <group key={index}>
            <mesh position={[xA, y, zA]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color={colors.cyan} emissive={colors.cyan} emissiveIntensity={0.7} />
            </mesh>
            <mesh position={[xB, y, zB]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color={colors.purple} emissive={colors.purple} emissiveIntensity={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function HolographicLoader({ compact = false }) {
  if (compact) {
    return <DNAHelix />;
  }

  return (
    <group>
      <DNAHelix />
      <mesh position={[0, -1.8, 0]}>
        <torusGeometry args={[1.4, 0.03, 16, 120]} />
        <meshStandardMaterial color={colors.success} emissive={colors.success} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
