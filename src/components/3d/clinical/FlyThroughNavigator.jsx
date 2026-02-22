import React, { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function makePath(kind = 'vascular') {
  const points = [];
  const steps = 120;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * Math.PI * (kind === 'vascular' ? 6 : 9);
    const radius = kind === 'vascular' ? 0.85 : 0.55;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      (t - 0.5) * (kind === 'vascular' ? 2.4 : 2.0),
      Math.sin(angle) * radius * 0.7
    ));
  }
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
}

export default function FlyThroughNavigator({
  enabled = false,
  mode = 'vascular',
  commentary = [],
}) {
  const { camera } = useThree();
  const curve = useMemo(() => makePath(mode), [mode]);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState('Ready for automated fly-through.');
  const progressRef = useRef(0);
  const lineIndexRef = useRef(0);

  const narrative = commentary.length > 0
    ? commentary
    : [
        'Entering proximal pathway, reviewing luminal narrowing and vessel wall integrity.',
        'Crossing bifurcation region, note altered perfusion geometry near branch point.',
        'Approaching distal segment, highlighting clinically relevant stenotic contour.',
      ];

  useFrame((_, delta) => {
    if (!enabled || !playing) return;

    progressRef.current += delta * 0.08;
    const t = Math.min(progressRef.current, 1);

    const p = curve.getPointAt(t);
    const look = curve.getPointAt(Math.min(1, t + 0.02));
    camera.position.lerp(p.clone().add(new THREE.Vector3(0, 0.05, 0.18)), 0.2);
    camera.lookAt(look);

    const idx = Math.min(narrative.length - 1, Math.floor(t * narrative.length));
    if (idx !== lineIndexRef.current) {
      lineIndexRef.current = idx;
      setLine(narrative[idx]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(narrative[idx]);
        utterance.rate = 1.0;
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      }
    }

    if (t >= 1) {
      setPlaying(false);
      progressRef.current = 0;
      setLine('Fly-through complete.');
    }
  });

  if (!enabled) return null;

  return (
    <Html position={[2.2, -2.0, 0]} transform occlude="blending">
      <div style={{ background: 'rgba(2,6,23,0.85)', border: '1px solid #22d3ee99', borderRadius: 8, color: '#dbeafe', padding: '8px 10px', minWidth: 280, fontSize: 11 }}>
        <div><strong>Automated Fly-through</strong> · {mode}</div>
        <div style={{ margin: '6px 0', opacity: 0.88 }}>{line}</div>
        <button
          onClick={() => {
            setPlaying(true);
            progressRef.current = 0;
            lineIndexRef.current = 0;
            setLine(narrative[0]);
          }}
        >
          Start Review
        </button>
      </div>
    </Html>
  );
}
