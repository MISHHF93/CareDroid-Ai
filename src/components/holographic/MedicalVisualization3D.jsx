import React, { useMemo, useRef } from 'react';
import { Detailed, Line, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { alpha, colors } from '../../config/theme';
import FloatingCard from './FloatingCard';
import ARStyleMarkers from './ARStyleMarkers';

const organColor = {
  heart: colors.error,
  brain: colors.purple,
  lungs: colors.cyan,
  liver: colors.warning,
  kidney: colors.success,
  general: colors.cyan,
};

const makePanelRows = (vitals = {}) => {
  return Object.entries(vitals).slice(0, 5).map(([label, value]) => ({ label, value: String(value) }));
};

function RotatingGroup({ children, speed = 0.4 }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * speed;
    }
  });

  return <group ref={ref}>{children}</group>;
}

function GenericAnatomyMesh({ organType = 'general' }) {
  const color = organColor[organType] || organColor.general;

  return (
    <Detailed distances={[0, 8, 16]}>
      <mesh>
        <icosahedronGeometry args={[1.1, 4]} />
        <meshPhysicalMaterial color={color} roughness={0.18} metalness={0.25} transmission={0.25} transparent opacity={0.82} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.08, 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[1.06, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} />
      </mesh>
    </Detailed>
  );
}

function LoadedGLTFModel({ modelUrl }) {
  const gltf = useGLTF(modelUrl);
  return <primitive object={gltf.scene} scale={1.25} />;
}

export function AnatomyModel3D({ modelUrl, organType = 'general', vitals = {}, markers = [] }) {
  return (
    <group>
      <RotatingGroup speed={0.35}>
        {modelUrl ? <LoadedGLTFModel modelUrl={modelUrl} /> : <GenericAnatomyMesh organType={organType} />}
      </RotatingGroup>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
        <ringGeometry args={[1.4, 1.6, 48]} />
        <meshBasicMaterial color={colors.cyan} transparent opacity={0.48} />
      </mesh>
      <FloatingCard position={[2.25, 0.8, 0]} title="Vitals" rows={makePanelRows(vitals)} depth={0.65} />
      <ARStyleMarkers markers={markers} />
    </group>
  );
}

function NodeSphere({ position, color, size = 0.15 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 18, 18]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  );
}

export function DrugInteractionNetwork3D({ nodes = [], links = [] }) {
  const fallbackNodes = useMemo(() => {
    if (nodes.length > 0) return nodes;
    return [
      { id: 'A', label: 'Drug A', severity: 'major', position: [-1.1, 0.5, 0.1] },
      { id: 'B', label: 'Drug B', severity: 'moderate', position: [0.9, 0.4, -0.2] },
      { id: 'C', label: 'Drug C', severity: 'minor', position: [0.2, -0.9, 0.3] },
    ];
  }, [nodes]);

  const fallbackLinks = useMemo(() => {
    if (links.length > 0) return links;
    return [
      { source: 'A', target: 'B', weight: 0.95 },
      { source: 'A', target: 'C', weight: 0.55 },
      { source: 'B', target: 'C', weight: 0.42 },
    ];
  }, [links]);

  const nodeMap = useMemo(() => new Map(fallbackNodes.map((n) => [n.id, n])), [fallbackNodes]);
  const severityToColor = { major: colors.error, moderate: colors.warning, minor: colors.success };

  return (
    <group>
      {fallbackLinks.map((link, index) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return null;
        return (
          <Line
            key={`edge-${index}`}
            points={[source.position, target.position]}
            color={link.weight > 0.8 ? colors.error : colors.cyan}
            transparent
            opacity={Math.min(1, Math.max(0.3, link.weight || 0.5))}
            lineWidth={1.5}
          />
        );
      })}
      {fallbackNodes.map((node, index) => (
        <NodeSphere
          key={`${node.id}-${index}`}
          position={node.position || [0, 0, 0]}
          color={severityToColor[node.severity] || colors.cyan}
          size={0.16}
        />
      ))}
      <FloatingCard
        position={[2, 1.2, 0]}
        title="Interaction Risk"
        rows={fallbackNodes.slice(0, 4).map((node) => ({ label: node.label || node.id, value: String(node.severity || 'review') }))}
      />
    </group>
  );
}

export function VolumetricLabChart3D({ items = [] }) {
  const values = items.length > 0 ? items : [
    { label: 'WBC', value: 7.2, max: 15 },
    { label: 'Creatinine', value: 1.9, max: 4 },
    { label: 'Lactate', value: 3.4, max: 6 },
    { label: 'CRP', value: 65, max: 100 },
  ];

  const barWidth = 0.34;
  const spacing = 0.62;

  return (
    <group>
      {values.map((item, index) => {
        const normalized = Math.min(1, item.value / (item.max || item.value || 1));
        const height = Math.max(0.15, normalized * 2.4);
        const x = index * spacing - ((values.length - 1) * spacing) / 2;
        const severityColor = normalized > 0.8 ? colors.error : normalized > 0.55 ? colors.warning : colors.success;

        return (
          <group key={`${item.label}-${index}`} position={[x, 0, 0]}>
            <mesh position={[0, height / 2 - 0.9, 0]}>
              <boxGeometry args={[barWidth, height, barWidth]} />
              <meshPhysicalMaterial color={severityColor} emissive={severityColor} emissiveIntensity={0.35} transparent opacity={0.82} transmission={0.14} />
            </mesh>
            <mesh position={[0, -0.98, 0]}>
              <boxGeometry args={[barWidth + 0.04, 0.04, barWidth + 0.04]} />
              <meshStandardMaterial color={colors.cyan} transparent opacity={0.5} />
            </mesh>
          </group>
        );
      })}
      <FloatingCard
        position={[2.1, 1.05, 0]}
        title="Lab Trend"
        rows={values.slice(0, 4).map((item) => ({ label: item.label, value: `${item.value}` }))}
      />
    </group>
  );
}

export function Timeline3D({ events = [] }) {
  const points = useMemo(() => {
    if (events.length === 0) {
      return [
        { id: 'e1', x: -1.8, y: 0.2, z: 0, severity: 'moderate', label: 'Lab Ordered' },
        { id: 'e2', x: -0.5, y: 0.8, z: 0, severity: 'critical', label: 'Alert Triggered' },
        { id: 'e3', x: 0.8, y: -0.25, z: 0, severity: 'urgent', label: 'Medication' },
        { id: 'e4', x: 1.8, y: 0.45, z: 0, severity: 'moderate', label: 'Resulted' },
      ];
    }

    return events.slice(0, 12).map((event, index) => ({
      id: event.id || `evt-${index}`,
      x: -2 + index * 0.38,
      y: event.critical ? 0.7 : event.status === 'pending' ? -0.25 : 0.2,
      z: 0,
      severity: event.critical ? 'critical' : event.status === 'pending' ? 'urgent' : 'moderate',
      label: event.test || event.title || 'Event',
    }));
  }, [events]);

  const severityColor = { critical: colors.error, urgent: colors.warning, moderate: colors.cyan };

  return (
    <group>
      <Line points={points.map((p) => [p.x, p.y, p.z])} color={colors.cyan} lineWidth={2.2} transparent opacity={0.7} />
      {points.map((point) => (
        <mesh key={point.id} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.1, 20, 20]} />
          <meshStandardMaterial color={severityColor[point.severity]} emissive={severityColor[point.severity]} emissiveIntensity={0.6} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
        <planeGeometry args={[5.4, 2.3]} />
        <meshStandardMaterial color={colors.cyan} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

export function MolecularStructure3D({ atoms = [] }) {
  const points = atoms.length > 0 ? atoms : [
    { id: 'a1', element: 'C', position: [-0.7, 0.1, 0], color: '#60A5FA' },
    { id: 'a2', element: 'N', position: [0, 0.45, 0.25], color: '#22D3EE' },
    { id: 'a3', element: 'O', position: [0.82, 0.02, 0], color: '#F87171' },
    { id: 'a4', element: 'H', position: [0.2, -0.62, -0.32], color: '#F8FAFC' },
  ];

  const bonds = points.map((atom, index) => {
    if (index === points.length - 1) return null;
    return [atom.position, points[index + 1].position];
  }).filter(Boolean);

  return (
    <group>
      {bonds.map((bond, index) => (
        <Line key={`bond-${index}`} points={bond} color={colors.cyan} lineWidth={1.8} transparent opacity={0.8} />
      ))}

      {points.map((atom) => (
        <mesh key={atom.id} position={atom.position}>
          <sphereGeometry args={[0.18, 22, 22]} />
          <meshStandardMaterial color={atom.color} emissive={atom.color} emissiveIntensity={0.5} />
        </mesh>
      ))}

      <FloatingCard
        position={[2.2, 1.1, 0]}
        title="Molecule"
        rows={points.map((atom) => ({ label: atom.element, value: atom.id }))}
      />
    </group>
  );
}
