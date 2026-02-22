import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getSpatialAnchorService } from '../../../services/realtime/SpatialAnchorService';
import { getHapticGloveService } from '../../../services/realtime/HapticGloveService';
import { getVolumetricCaptureService } from '../../../services/realtime/VolumetricCaptureService';

function uid(prefix = 'anchor') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function getXRSupport() {
  return typeof navigator !== 'undefined' && Boolean(navigator.xr);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function WebXRSpatialLayer({
  enabled = false,
  sessionId = 'xr-session',
  rootGroupRef,
  controlsRef,
  onSessionState,
  onVoiceState,
}) {
  const { gl, camera, scene } = useThree();
  const [xrMode, setXrMode] = useState('none');
  const [planeAnchor, setPlaneAnchor] = useState([0, 0, 0]);
  const [anchors, setAnchors] = useState([]);
  const [captureActive, setCaptureActive] = useState(false);
  const [foveation, setFoveation] = useState(0.55);
  const hitTestSourceRef = useRef(null);
  const hitSpaceRef = useRef(null);
  const xrRefSpaceRef = useRef(null);

  const anchorService = useMemo(() => getSpatialAnchorService(), []);
  const hapticService = useMemo(() => getHapticGloveService(), []);
  const captureService = useMemo(() => getVolumetricCaptureService(), []);

  useEffect(() => {
    if (!enabled) return undefined;
    const off = anchorService.onChange((all) => {
      setAnchors(all.filter((item) => item.sessionId === sessionId));
    });
    hapticService.initialize();
    return () => off?.();
  }, [anchorService, enabled, hapticService, sessionId]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onSessionStart = () => {
      onSessionState?.({ inSession: true, mode: xrMode });
    };

    const onSessionEnd = () => {
      hitTestSourceRef.current = null;
      hitSpaceRef.current = null;
      xrRefSpaceRef.current = null;
      setXrMode('none');
      onSessionState?.({ inSession: false, mode: 'none' });
    };

    gl.xr.addEventListener('sessionstart', onSessionStart);
    gl.xr.addEventListener('sessionend', onSessionEnd);

    return () => {
      gl.xr.removeEventListener('sessionstart', onSessionStart);
      gl.xr.removeEventListener('sessionend', onSessionEnd);
    };
  }, [enabled, gl.xr, onSessionState, xrMode]);

  const ensureHitTest = async (session) => {
    if (!session || xrMode !== 'ar') return;
    if (hitTestSourceRef.current) return;

    try {
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const referenceSpace = await session.requestReferenceSpace('local-floor');
      xrRefSpaceRef.current = referenceSpace;
      hitSpaceRef.current = viewerSpace;
      hitTestSourceRef.current = await session.requestHitTestSource({ space: viewerSpace });
    } catch {
      // noop
    }
  };

  const startXRSession = async (mode) => {
    if (!getXRSupport()) return;
    const immersiveMode = mode === 'ar' ? 'immersive-ar' : 'immersive-vr';

    try {
      const sessionInit = {
        requiredFeatures: mode === 'ar' ? ['local-floor', 'hit-test'] : ['local-floor'],
        optionalFeatures: ['hand-tracking', 'anchors', 'layers', 'bounded-floor', 'dom-overlay'],
      };

      if (mode === 'ar') {
        sessionInit.domOverlay = { root: document.body };
      }

      const session = await navigator.xr.requestSession(immersiveMode, sessionInit);
      gl.xr.enabled = true;
      await gl.xr.setSession(session);
      setXrMode(mode);

      if (mode === 'ar') {
        await ensureHitTest(session);
      }
    } catch {
      // noop
    }
  };

  const endXRSession = async () => {
    const session = gl.xr.getSession();
    if (session) {
      await session.end();
    }
  };

  const placeSpatialAnchor = () => {
    const position = rootGroupRef?.current?.position || new THREE.Vector3(...planeAnchor);
    const quaternion = rootGroupRef?.current?.quaternion || new THREE.Quaternion();
    anchorService.upsert({
      id: uid('spatial'),
      sessionId,
      position: [position.x, position.y, position.z],
      quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
      label: `Anchor ${anchors.length + 1}`,
      type: 'annotation-anchor',
    });
  };

  const toggleCapture = () => {
    if (captureActive) {
      captureService.stop();
      const blob = captureService.exportJson();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `caredroid-volumetric-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setCaptureActive(false);
    } else {
      captureService.start({ sessionId, mode: xrMode || 'screen' });
      setCaptureActive(true);
    }
  };

  useFrame(() => {
    if (!enabled) return;

    const session = gl.xr.getSession();

    if (session && xrMode === 'ar') {
      ensureHitTest(session);
      const frame = gl.xr.getFrame?.();
      const referenceSpace = xrRefSpaceRef.current || gl.xr.getReferenceSpace();
      if (frame && referenceSpace && hitTestSourceRef.current) {
        const hits = frame.getHitTestResults(hitTestSourceRef.current);
        if (hits.length > 0) {
          const pose = hits[0].getPose(referenceSpace);
          if (pose?.transform?.position) {
            const p = pose.transform.position;
            const next = [p.x, p.y, p.z];
            setPlaneAnchor(next);
            if (rootGroupRef?.current) {
              rootGroupRef.current.position.set(next[0], next[1], next[2]);
            }
          }
        }
      }
    }

    if (session && typeof gl.xr.setFoveation === 'function') {
      gl.xr.setFoveation(clamp(foveation, 0, 1));
    }

    if (captureActive) {
      captureService.captureFrame({ camera, scene });
    }

    if (session && rootGroupRef?.current) {
      const inputSources = session.inputSources || [];
      inputSources.forEach((source) => {
        const hand = source.hand;
        if (!hand) return;

        const pinchJoint = hand.get('index-finger-tip');
        const thumbJoint = hand.get('thumb-tip');
        const frame = gl.xr.getFrame?.();
        const refSpace = gl.xr.getReferenceSpace();
        if (!frame || !refSpace || !pinchJoint || !thumbJoint) return;

        const pinchPose = frame.getJointPose(pinchJoint, refSpace);
        const thumbPose = frame.getJointPose(thumbJoint, refSpace);
        if (!pinchPose || !thumbPose) return;

        const dx = pinchPose.transform.position.x - thumbPose.transform.position.x;
        const dy = pinchPose.transform.position.y - thumbPose.transform.position.y;
        const dz = pinchPose.transform.position.z - thumbPose.transform.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 0.03) {
          const target = pinchPose.transform.position;
          rootGroupRef.current.position.lerp(new THREE.Vector3(target.x, target.y - 0.15, target.z - 0.3), 0.12);
          rootGroupRef.current.quaternion.slerp(camera.quaternion, 0.04);
          hapticService.tissueResistancePulse(0.45);
        }
      });
    }
  });

  if (!enabled) return null;

  return (
    <group>
      <Html position={[-2.4, 2.25, 0]} transform occlude="blending">
        <div style={{
          background: 'rgba(2,6,23,0.85)',
          border: '1px solid rgba(56,189,248,0.65)',
          borderRadius: 8,
          color: '#dbeafe',
          padding: '8px 10px',
          minWidth: 260,
          fontSize: 11,
        }}>
          <div><strong>XR Spatial</strong> · {getXRSupport() ? 'WebXR ready' : 'WebXR unavailable'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <button onClick={() => startXRSession('vr')}>Enter VR</button>
            <button onClick={() => startXRSession('ar')}>Enter AR</button>
            <button onClick={endXRSession}>Exit XR</button>
            <button onClick={placeSpatialAnchor}>Save Anchor</button>
            <button onClick={toggleCapture}>{captureActive ? 'Stop Capture' : 'Start Capture'}</button>
          </div>
          <div style={{ marginTop: 6 }}>Anchors: {anchors.length} · Mode: {xrMode}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span>Foveation</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={foveation}
              onChange={(event) => setFoveation(Number(event.target.value))}
            />
          </div>
          <div style={{ marginTop: 4, opacity: 0.82 }}>
            Hand-tracking grab enabled in XR when supported. Haptic pulses use connected gloves/controllers.
          </div>
        </div>
      </Html>

      {anchors.map((anchor) => (
        <group
          key={anchor.id}
          position={anchor.position || [0, 0, 0]}
          quaternion={anchor.quaternion ? new THREE.Quaternion(...anchor.quaternion) : undefined}
        >
          <mesh>
            <icosahedronGeometry args={[0.04, 1]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {xrMode === 'ar' && (
        <mesh position={planeAnchor} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.12, 24]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
