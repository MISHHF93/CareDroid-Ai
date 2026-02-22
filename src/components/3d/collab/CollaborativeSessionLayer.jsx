import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getCollaborative3DSessionService } from '../../../services/realtime/Collaborative3DSessionService';

const ORGAN_ANCHORS = {
  heart: [0.15, -1.1, 0.25],
  lungs: [0.1, 0.2, 0.25],
  brain: [0.1, 1.8, 0.25],
  general: [0, 0, 0.4],
};

function vec3(value, fallback = [0, 0, 0]) {
  const source = Array.isArray(value) && value.length === 3 ? value : fallback;
  return new THREE.Vector3(source[0], source[1], source[2]);
}

function Avatar({ presence }) {
  const pos = presence?.cursor || [0, 0, 0.6];
  const gaze = presence?.gaze || [0, 0, -1];
  const color = presence?.color || '#22d3ee';

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, gaze[0] * 0.35, gaze[1] * 0.35, gaze[2] * 0.35]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} />
      </line>
      <Text position={[0, 0.14, 0]} fontSize={0.06} color={color} anchorX="center">
        {`${presence.displayName || 'Clinician'} • ${presence.selectedOrgan || 'viewing'}`}
      </Text>
    </group>
  );
}

function AnnotationArrow({ annotation }) {
  const from = vec3(annotation.from, ORGAN_ANCHORS[annotation.organ] || ORGAN_ANCHORS.general);
  const to = vec3(annotation.to, [from.x + 0.3, from.y + 0.3, from.z]);
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const length = from.distanceTo(to);
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  return (
    <group position={midpoint.toArray()} quaternion={quaternion}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, length * 0.82, 10]} />
        <meshBasicMaterial color={annotation.color || '#f59e0b'} />
      </mesh>
      <mesh position={[0, (length * 0.82) / 2 + 0.04, 0]}>
        <coneGeometry args={[0.02, 0.08, 10]} />
        <meshBasicMaterial color={annotation.color || '#f59e0b'} />
      </mesh>
    </group>
  );
}

function AnnotationNote({ annotation }) {
  const point = annotation.anchor || ORGAN_ANCHORS[annotation.organ] || ORGAN_ANCHORS.general;
  return (
    <Html position={point} transform occlude="blending">
      <div style={{
        minWidth: 150,
        maxWidth: 220,
        background: 'rgba(3,7,18,0.86)',
        border: `1px solid ${(annotation.color || '#38bdf8')}99`,
        borderRadius: 8,
        color: '#dbeafe',
        padding: '8px 10px',
        fontSize: 12,
      }}>
        {annotation.text || 'Clinical note'}
      </div>
    </Html>
  );
}

function AnnotationROI({ annotation }) {
  const point = annotation.anchor || ORGAN_ANCHORS[annotation.organ] || ORGAN_ANCHORS.general;
  return (
    <mesh position={point}>
      <sphereGeometry args={[annotation.radius || 0.28, 24, 24]} />
      <meshBasicMaterial color={annotation.color || '#ec4899'} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}

function SpatialVoice({ stream, position }) {
  const { camera } = useThree();
  const groupRef = useRef();
  const listenerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!stream || !groupRef.current) return undefined;

    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;

    const positional = new THREE.PositionalAudio(listener);
    positional.setRefDistance(0.5);
    positional.setRolloffFactor(1.2);
    positional.setDistanceModel('inverse');
    positional.setDirectionalCone(120, 230, 0.15);
    positional.setMediaStreamSource(stream);
    positional.setVolume(1);

    groupRef.current.add(positional);
    audioRef.current = positional;

    return () => {
      if (audioRef.current) {
        groupRef.current?.remove(audioRef.current);
      }
      if (listenerRef.current) {
        camera.remove(listenerRef.current);
      }
      audioRef.current = null;
      listenerRef.current = null;
    };
  }, [camera, stream]);

  return <group ref={groupRef} position={position || [0, 0, 0]} />;
}

function WhiteboardSurface({ whiteboard }) {
  const canvasRef = useRef(null);
  const textureRef = useRef(null);

  const anchor = whiteboard?.anchor || ORGAN_ANCHORS[whiteboard?.organ] || ORGAN_ANCHORS.general;

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.fillRect(0, 0, 512, 512);

    (whiteboard?.strokes || []).forEach((stroke) => {
      const points = stroke.points || [];
      if (points.length < 2) return;
      ctx.strokeStyle = stroke.color || '#22d3ee';
      ctx.lineWidth = stroke.width || 3;
      ctx.beginPath();
      ctx.moveTo(points[0][0] * 512, points[0][1] * 512);
      for (let index = 1; index < points.length; index += 1) {
        ctx.lineTo(points[index][0] * 512, points[index][1] * 512);
      }
      ctx.stroke();
    });

    canvasRef.current = canvas;
    if (textureRef.current) {
      textureRef.current.dispose();
    }
    textureRef.current = new THREE.CanvasTexture(canvas);

    return () => {
      if (textureRef.current) textureRef.current.dispose();
    };
  }, [whiteboard]);

  if (!textureRef.current) return null;

  return (
    <mesh position={anchor} rotation={[0, Math.PI * 0.2, 0]}>
      <planeGeometry args={[0.95, 0.95]} />
      <meshBasicMaterial map={textureRef.current} transparent opacity={0.86} />
    </mesh>
  );
}

export default function CollaborativeSessionLayer({
  enabled = false,
  sessionId = '3d-default-session',
  user,
  selectedOrgan = 'general',
  canManipulate = true,
  canAnnotate = false,
  canWhiteboard = false,
  canExportReplay = false,
  onPermissions,
  gestureRay,
}) {
  const { camera, pointer } = useThree();
  const [remotePresence, setRemotePresence] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [whiteboard, setWhiteboard] = useState({ strokes: [], anchor: [0, 0, 0], organ: 'general' });
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [activeTool, setActiveTool] = useState('none');

  const service = useMemo(() => getCollaborative3DSessionService(), []);
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    let mounted = true;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('caredroid_access_token') : '';

    service.initialize({ token, sessionId, user }).catch(() => {
      // Optional feature; fail silently if signaling unavailable.
    });

    const offPresence = service.onPresence((list) => {
      if (!mounted) return;
      setRemotePresence(list.filter((item) => item.peerId !== service.localPeerId));
    });
    const offAnn = service.onAnnotations((list) => mounted && setAnnotations(list));
    const offBoard = service.onWhiteboard((state) => mounted && setWhiteboard(state));
    const offStreams = service.onRemoteStreams((list) => mounted && setRemoteStreams(list));
    const offPermissions = service.onPermissions((perms) => {
      onPermissions?.(perms);
    });

    return () => {
      mounted = false;
      offPresence?.();
      offAnn?.();
      offBoard?.();
      offStreams?.();
      offPermissions?.();
      service.disconnect();
    };
  }, [enabled, onPermissions, service, sessionId, user]);

  useEffect(() => {
    const onKey = (event) => {
      if (!enabled) return;
      if (event.key === '1') setActiveTool('arrow');
      if (event.key === '2') setActiveTool('note');
      if (event.key === '3') setActiveTool('roi');
      if (event.key === '4') setActiveTool('whiteboard');
      if (event.key === '0') setActiveTool('none');
      if (event.key.toLowerCase() === 'v') {
        service.enableVoiceChat().catch(() => {
          // noop
        });
      }

      if (event.key.toLowerCase() === 'e' && canExportReplay) {
        service.exportReplay({
          passphrase: `caredroid-${sessionId}-hipaa`,
          metadata: {
            mode: 'teaching-medico-legal',
            selectedOrgan,
          },
        }).then((blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `caredroid-3d-replay-${sessionId}-${Date.now()}.json`;
          anchor.click();
          URL.revokeObjectURL(url);
        }).catch(() => {
          // noop
        });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canExportReplay, enabled, selectedOrgan, service, sessionId]);

  useFrame(() => {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastBroadcastRef.current < 100) return;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    service.broadcastPresence({
      selectedOrgan,
      cursor: [pointer.x * 1.5, pointer.y * 1.5, 0.5],
      gaze: [direction.x, direction.y, direction.z],
    });

    lastBroadcastRef.current = now;
  });

  useEffect(() => {
    if (!enabled || !gestureRay || !canAnnotate) return;
    const anchor = [gestureRay.x * 1.1, gestureRay.y * 1.1, 0.4];
    service.addAnnotation({
      type: 'note',
      organ: selectedOrgan,
      anchor,
      text: 'Point-selected structure',
      color: '#f97316',
    });
  }, [canAnnotate, enabled, gestureRay, selectedOrgan, service]);

  const handleToolCreate = () => {
    if (!enabled || (!canAnnotate && activeTool !== 'whiteboard')) return;
    const anchor = ORGAN_ANCHORS[selectedOrgan] || ORGAN_ANCHORS.general;

    if (activeTool === 'arrow') {
      service.addAnnotation({
        type: 'arrow',
        organ: selectedOrgan,
        from: [anchor[0] - 0.2, anchor[1] - 0.15, anchor[2]],
        to: [anchor[0] + 0.2, anchor[1] + 0.2, anchor[2]],
        color: '#ef4444',
      });
    }

    if (activeTool === 'note') {
      service.addAnnotation({
        type: 'note',
        organ: selectedOrgan,
        anchor,
        text: `Clinical concern at ${selectedOrgan}`,
        color: '#38bdf8',
      });
    }

    if (activeTool === 'roi') {
      service.addAnnotation({
        type: 'roi',
        organ: selectedOrgan,
        anchor,
        radius: 0.24,
        color: '#a855f7',
      });
    }

    if (activeTool === 'whiteboard' && canWhiteboard) {
      service.setWhiteboard({
        organ: selectedOrgan,
        anchor,
        strokes: [
          {
            color: '#22d3ee',
            width: 4,
            points: [[0.1, 0.2], [0.25, 0.2], [0.35, 0.32], [0.5, 0.31], [0.7, 0.55]],
          },
          {
            color: '#f59e0b',
            width: 3,
            points: [[0.18, 0.75], [0.28, 0.61], [0.42, 0.58], [0.56, 0.62]],
          },
        ],
      });
    }
  };

  if (!enabled) return null;

  const localPermText = canManipulate ? 'Manipulation enabled' : 'View-only role';

  return (
    <group onDoubleClick={handleToolCreate}>
      <Html position={[-2.2, 2.1, 0]} transform occlude="blending">
        <div style={{
          background: 'rgba(2,6,23,0.86)',
          border: '1px solid rgba(34,211,238,0.6)',
          borderRadius: 8,
          color: '#bae6fd',
          fontSize: 11,
          padding: '6px 8px',
          minWidth: 220,
        }}>
          <div><strong>Collab</strong> session {sessionId}</div>
          <div>{localPermText}</div>
          <div>Tools: 1 Arrow · 2 Note · 3 ROI · 4 Whiteboard · V Voice · 0 Clear</div>
          {canExportReplay && <div>Export encrypted replay: press E</div>}
          <div>Action: double-click scene to place selected tool</div>
        </div>
      </Html>

      {remotePresence.map((presence) => (
        <Avatar key={presence.peerId || presence.userId} presence={presence} />
      ))}

      {annotations.map((annotation) => {
        if (annotation.type === 'arrow') {
          return <AnnotationArrow key={annotation.id} annotation={annotation} />;
        }
        if (annotation.type === 'note') {
          return <AnnotationNote key={annotation.id} annotation={annotation} />;
        }
        return <AnnotationROI key={annotation.id} annotation={annotation} />;
      })}

      <WhiteboardSurface whiteboard={whiteboard} />

      {remoteStreams.map((entry) => {
        const presence = remotePresence.find((item) => item.peerId === entry.peerId);
        return (
          <SpatialVoice
            key={entry.peerId}
            stream={entry.stream}
            position={presence?.cursor || [0, 0, 0.6]}
          />
        );
      })}
    </group>
  );
}
