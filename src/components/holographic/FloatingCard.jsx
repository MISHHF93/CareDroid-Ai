import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { alpha, colors } from '../../config/theme';

export default function FloatingCard({ position = [0, 0, 0], title, rows = [], depth = 0.5 }) {
  const bg = useMemo(() => `linear-gradient(140deg, ${alpha.cyan(0.24)}, ${alpha.purple(0.24)})`, []);

  return (
    <group position={position}>
      <mesh position={[0, 0, -depth]}>
        <planeGeometry args={[2.5, 1.55]} />
        <meshStandardMaterial color={colors.purple} transparent opacity={0.1} />
      </mesh>
      <Html transform distanceFactor={5}>
        <article
          className="holo-floating-card"
          style={{
            width: 260,
            padding: '12px 14px',
            background: bg,
            transform: `translateZ(${depth * 6}px)`,
          }}
          role="region"
          aria-label={title || 'Holographic data panel'}
        >
          {title ? <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>{title}</h4> : null}
          <div style={{ display: 'grid', gap: 6 }}>
            {rows.map((row, index) => (
              <div key={`${row.label}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{row.label}</span>
                <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>{row.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </Html>
    </group>
  );
}
