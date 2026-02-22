import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

function mmFromWorldDistance(distanceWorld) {
  return distanceWorld * 1000;
}

export default function SurgicalPlanningMode({
  enabled = false,
  targetRootRef,
  onTrajectoryChange,
}) {
  const { camera, pointer, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  const [clipOffset, setClipOffset] = useState(0);
  const [measureA, setMeasureA] = useState(null);
  const [measureB, setMeasureB] = useState(null);
  const [needleEntry, setNeedleEntry] = useState(null);
  const [needleTarget, setNeedleTarget] = useState(null);
  const [activeTool, setActiveTool] = useState('slice');
  const previewTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (!enabled || !targetRootRef?.current) return undefined;

    const renderer = scene?.userData?.glRenderer;
    if (renderer) {
      renderer.localClippingEnabled = true;
    }

    const affected = [];
    targetRootRef.current.traverse((node) => {
      if (!node?.isMesh || !node.material) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((mat) => {
        mat.clippingPlanes = [clipPlane];
        mat.clipShadows = true;
        mat.needsUpdate = true;
        affected.push(mat);
      });
    });

    return () => {
      affected.forEach((mat) => {
        mat.clippingPlanes = null;
        mat.needsUpdate = true;
      });
    };
  }, [clipPlane, enabled, scene?.userData?.glRenderer, targetRootRef]);

  useEffect(() => {
    const onKey = (event) => {
      if (!enabled) return;
      if (event.key === 's') setActiveTool('slice');
      if (event.key === 'm') setActiveTool('measure');
      if (event.key === 't') setActiveTool('trajectory');
      if (event.key === 'Escape') {
        setMeasureA(null);
        setMeasureB(null);
        setNeedleEntry(null);
        setNeedleTarget(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  useFrame(() => {
    if (!enabled) return;
    clipPlane.constant = clipOffset;

    raycaster.setFromCamera(pointer, camera);
    const root = targetRootRef?.current;
    if (!root) return;

    const intersects = raycaster.intersectObject(root, true);
    if (intersects.length > 0) {
      previewTargetRef.current.copy(intersects[0].point);
    }
  });

  const placeAtPointer = () => {
    const point = previewTargetRef.current.clone();

    if (activeTool === 'measure') {
      if (!measureA) setMeasureA(point);
      else setMeasureB(point);
      return;
    }

    if (activeTool === 'trajectory') {
      if (!needleEntry) setNeedleEntry(point);
      else {
        setNeedleTarget(point);
        onTrajectoryChange?.({
          entry: needleEntry?.toArray?.() || [0, 0, 0],
          target: point.toArray(),
        });
      }
    }
  };

  if (!enabled) return null;

  const distMm = measureA && measureB ? mmFromWorldDistance(measureA.distanceTo(measureB)) : null;
  const trajectoryDistance = needleEntry && needleTarget ? mmFromWorldDistance(needleEntry.distanceTo(needleTarget)) : null;

  return (
    <group onDoubleClick={placeAtPointer}>
      <Html position={[-2.4, 1.8, 0]} transform occlude="blending">
        <div style={{ background: 'rgba(2,6,23,0.86)', border: '1px solid #38bdf8aa', borderRadius: 8, padding: '8px 10px', color: '#dbeafe', fontSize: 11, minWidth: 250 }}>
          <div><strong>Surgical Planning</strong></div>
          <div>Tools: S slice · M measure · T trajectory · dbl-click place</div>
          <div style={{ marginTop: 6 }}>
            <label>Cut plane depth</label>
            <input type="range" min={-0.9} max={0.9} step={0.01} value={clipOffset} onChange={(e) => setClipOffset(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          {distMm != null && <div>Landmark distance: {distMm.toFixed(3)} mm</div>}
          {trajectoryDistance != null && <div>Trajectory length: {trajectoryDistance.toFixed(3)} mm</div>}
        </div>
      </Html>

      <mesh position={[0, -clipOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.95, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {measureA && (
        <mesh position={measureA.toArray()}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
      {measureB && (
        <mesh position={measureB.toArray()}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}

      {measureA && measureB && (
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array([...measureA.toArray(), ...measureB.toArray()]), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#f59e0b" />
        </line>
      )}

      {needleEntry && (
        <mesh position={needleEntry.toArray()}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}
      {needleTarget && (
        <mesh position={needleTarget.toArray()}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {needleEntry && needleTarget && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([...needleEntry.toArray(), ...needleTarget.toArray()]), 3]} />
            </bufferGeometry>
            <lineDashedMaterial color="#ef4444" dashSize={0.04} gapSize={0.02} />
          </line>
          <Text position={needleTarget.clone().add(new THREE.Vector3(0, 0.08, 0)).toArray()} fontSize={0.05} color="#fecaca">
            Projected biopsy/catheter path
          </Text>
        </>
      )}
    </group>
  );
}
