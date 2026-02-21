import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { colors } from '../../config/theme';

const severityColor = {
  critical: colors.error,
  urgent: colors.warning,
  moderate: colors.cyan,
};

export default function ARStyleMarkers({ markers = [] }) {
  return (
    <group>
      {markers.map((marker, index) => (
        <PulseMarker
          key={`${marker.id || marker.label || 'marker'}-${index}`}
          marker={marker}
          color={severityColor[marker.severity] || colors.cyan}
        />
      ))}
    </group>
  );
}

function PulseMarker({ marker, color }) {
  const ref = useRef(null);
  const ringRef = useRef(null);
  const baseScale = useMemo(() => marker.scale || 0.16, [marker.scale]);

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 3.8) * 0.24;
    if (ref.current) ref.current.scale.setScalar(baseScale * pulse);
    if (ringRef.current) ringRef.current.scale.setScalar(pulse * 1.35);
  });

  return (
    <group position={marker.position || [0, 0, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.34, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}
