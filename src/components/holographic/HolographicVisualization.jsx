import React from 'react';
import HolographicCanvas from './HolographicCanvas';
import Mobile3DContainer from './Mobile3DContainer';
import {
  AnatomyModel3D,
  DrugInteractionNetwork3D,
  Timeline3D,
  VolumetricLabChart3D,
} from './MedicalVisualization3D';
import { useHolographicMode } from '../../hooks/useHolographicMode';

function fallbackMessage(label) {
  return (
    <div className="holo-fallback" role="img" aria-label={`${label} fallback view`}>
      <div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 13 }}>Using 2D fallback mode for accessibility/performance.</div>
      </div>
    </div>
  );
}

export default function HolographicVisualization({ visualization, height = 260 }) {
  const { reducedMotion } = useHolographicMode();

  if (!visualization?.type) return null;

  const { type, data = {}, metadata = {} } = visualization;
  const style = { minHeight: height };

  if (type === 'anatomy-3d') {
    return (
      <Mobile3DContainer minHeight={height}>
        <HolographicCanvas
          style={style}
          ariaLabel="3D anatomy hologram"
          reducedMotion={reducedMotion}
          fallback={fallbackMessage('Anatomy Overview')}
          camera={metadata.camera || { position: [0, 1.4, 5.2], fov: 50 }}
        >
          <AnatomyModel3D
            modelUrl={data.modelUrl}
            organType={data.organ || 'general'}
            vitals={data.vitals || { HR: '88', SpO2: '97%', RR: '18' }}
            markers={data.markers || []}
          />
        </HolographicCanvas>
      </Mobile3DContainer>
    );
  }

  if (type === 'drug-network-3d') {
    return (
      <Mobile3DContainer minHeight={height}>
        <HolographicCanvas
          style={style}
          ariaLabel="3D drug interaction network"
          reducedMotion={reducedMotion}
          fallback={fallbackMessage('Drug Interaction Network')}
        >
          <DrugInteractionNetwork3D nodes={data.nodes || []} links={data.links || []} />
        </HolographicCanvas>
      </Mobile3DContainer>
    );
  }

  if (type === 'lab-chart-3d') {
    return (
      <Mobile3DContainer minHeight={height}>
        <HolographicCanvas
          style={style}
          ariaLabel="3D volumetric lab chart"
          reducedMotion={reducedMotion}
          fallback={fallbackMessage('Lab Results Overview')}
        >
          <VolumetricLabChart3D items={data.items || []} />
        </HolographicCanvas>
      </Mobile3DContainer>
    );
  }

  if (type === 'timeline-3d') {
    return (
      <Mobile3DContainer minHeight={height}>
        <HolographicCanvas
          style={style}
          ariaLabel="3D patient timeline"
          reducedMotion={reducedMotion}
          fallback={fallbackMessage('Patient Timeline')}
          camera={metadata.camera || { position: [0, 0.8, 6.2], fov: 53 }}
        >
          <Timeline3D events={data.events || []} />
        </HolographicCanvas>
      </Mobile3DContainer>
    );
  }

  return null;
}
