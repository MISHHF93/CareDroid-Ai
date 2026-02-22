import React, { Suspense, lazy, useMemo, useState } from 'react';
import HolographicLoader from '../HolographicLoader';

const HolographicCanvas = lazy(() => import('../HolographicCanvas'));
const OrganSystem = lazy(() => import('../medical/OrganSystem'));

export default function ComparativeClinicalView({
  leftLabel = 'Before Treatment',
  rightLabel = 'After Treatment',
  leftVitals = {},
  rightVitals = {},
  leftSeverity = {},
  rightSeverity = {},
  atlasOverlay = false,
}) {
  const [morph, setMorph] = useState(0.5);

  const blendLeft = useMemo(() => Math.max(0.2, 1 - morph * 0.8), [morph]);
  const blendRight = useMemo(() => Math.max(0.2, 0.2 + morph * 0.8), [morph]);

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={{ border: '1px solid rgba(56,189,248,0.5)', borderRadius: 10, overflow: 'hidden', minHeight: 260 }}>
        <div style={{ padding: '6px 10px', fontSize: 12, color: '#bae6fd', background: 'rgba(2,6,23,0.75)' }}>{leftLabel}</div>
        <Suspense fallback={<HolographicLoader size={26} label="" />}>
          <HolographicCanvas cameraPosition={[0, 0, 4]} severityScores={leftSeverity} vitals={leftVitals}>
            <group scale={[blendLeft, blendLeft, blendLeft]}>
              <OrganSystem interactive vitals={leftVitals} scores={leftSeverity} />
            </group>
          </HolographicCanvas>
        </Suspense>
      </div>

      <div style={{ border: '1px solid rgba(56,189,248,0.5)', borderRadius: 10, overflow: 'hidden', minHeight: 260 }}>
        <div style={{ padding: '6px 10px', fontSize: 12, color: '#bae6fd', background: 'rgba(2,6,23,0.75)' }}>
          {rightLabel}{atlasOverlay ? ' · Atlas Overlay' : ''}
        </div>
        <Suspense fallback={<HolographicLoader size={26} label="" />}>
          <HolographicCanvas cameraPosition={[0, 0, 4]} severityScores={rightSeverity} vitals={rightVitals}>
            <group scale={[blendRight, blendRight, blendRight]}>
              <OrganSystem interactive vitals={rightVitals} scores={rightSeverity} />
              {atlasOverlay && (
                <mesh scale={[1.3, 1.3, 1.3]}>
                  <sphereGeometry args={[1.1, 24, 24]} />
                  <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} depthWrite={false} />
                </mesh>
              )}
            </group>
          </HolographicCanvas>
        </Suspense>
      </div>

      <div style={{ gridColumn: '1 / -1', background: 'rgba(2,6,23,0.75)', border: '1px solid rgba(56,189,248,0.45)', borderRadius: 8, padding: '8px 10px', color: '#dbeafe', fontSize: 12 }}>
        <div>Multi-timepoint morph transition</div>
        <input type="range" min={0} max={1} step={0.01} value={morph} onChange={(e) => setMorph(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
