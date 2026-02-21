import React, { useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';

export default function GestureControls({ reducedMotion }) {
  useEffect(() => {
    const handler = (event) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '='].includes(event.key)) return;
      event.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <OrbitControls
      enablePan
      enableZoom
      enableRotate
      autoRotate={!reducedMotion}
      autoRotateSpeed={0.45}
      minDistance={2.2}
      maxDistance={11.5}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI * 0.85}
      makeDefault
      touches={{ ONE: 2, TWO: 1 }}
      keyPanSpeed={6}
      zoomSpeed={0.75}
      rotateSpeed={0.65}
    />
  );
}
