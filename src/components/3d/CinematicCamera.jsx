import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

const ORGAN_ANCHORS = {
  heart: new THREE.Vector3(0, -1.6, 0),
  brain: new THREE.Vector3(0, 1.6, 0),
  lungs: new THREE.Vector3(0, 0, 0),
  liver: new THREE.Vector3(0.7, -0.45, 0),
  kidney: new THREE.Vector3(-0.85, -0.7, 0),
  default: new THREE.Vector3(0, 0, 0),
};

const EASING = {
  linear: (t) => t,
  easeInOut: (t) => t * t * (3 - 2 * t),
  soft: (t) => 1 - Math.pow(1 - t, 2.2),
};

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function hermiteVec3(p0, p1, m0, m1, t) {
  const tt = t * t;
  const ttt = tt * t;

  const h00 = 2 * ttt - 3 * tt + 1;
  const h10 = ttt - 2 * tt + t;
  const h01 = -2 * ttt + 3 * tt;
  const h11 = ttt - tt;

  return new THREE.Vector3()
    .addScaledVector(p0, h00)
    .addScaledVector(m0, h10)
    .addScaledVector(p1, h01)
    .addScaledVector(m1, h11);
}

function pickOrganFromText(text = '') {
  const lower = String(text).toLowerCase();
  if (/(myocard|cardiac|coronary|heart)/.test(lower)) return 'heart';
  if (/(brain|neuro|axons?|cerebr)/.test(lower)) return 'brain';
  if (/(lungs?|respirat|airway|alveol)/.test(lower)) return 'lungs';
  if (/(liver|hepatic)/.test(lower)) return 'liver';
  if (/(kidney|renal)/.test(lower)) return 'kidney';
  return 'default';
}

function urgencyFromText(text = '', explicitUrgency = 'medium') {
  const lower = String(text).toLowerCase();
  if (/(trauma|code blue|critical emergency|hemorrhage)/.test(lower)) return 'trauma';
  if (/(critical|urgent|emergency|severe|concerning)/.test(lower)) return 'high';
  if (/(monitor|watch|follow-up|moderate)/.test(lower)) return 'medium';
  return explicitUrgency || 'low';
}

function microscopicMode(text = '') {
  return /(cellular|microscopic|histology|pathology|axon|mitochondri|micro)/i.test(String(text));
}

function panoramicMode(text = '') {
  return /(systemic|overview|organ system|panoramic|full body|multiorgan)/i.test(String(text));
}

function goldenSpiralOffset(t, radius = 0.7) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const angle = t * Math.PI * 2 / phi;
  const r = radius * (0.5 + t * 0.5);
  return new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r * 0.72, 0);
}

function safeGetWebGazer() {
  if (typeof window === 'undefined') return null;
  return window.webgazer || null;
}

export default function CinematicCamera({
  aiText = '',
  organ = null,
  urgency = 'medium',
  severity = 0,
  focusMarkers = [],
  easing = 'easeInOut',
  enabled = true,
  gazeTracking = true,
  onFocusDistanceChange,
}) {
  const { camera, scene, size } = useThree();

  const raycasterRef = useRef(new THREE.Raycaster());
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  const motionRef = useRef({
    p0: camera.position.clone(),
    p1: camera.position.clone(),
    m0: new THREE.Vector3(),
    m1: new THREE.Vector3(),
    t: 1,
    duration: 1.4,
    orbitPhase: 0,
    dollyStrength: 0,
    baseFov: camera.fov,
  });

  const gazeRef = useRef({ x: 0.5, y: 0.5, active: false });

  const mode = useMemo(() => ({
    organ: organ || pickOrganFromText(aiText),
    urgency: urgencyFromText(aiText, urgency),
    microscopic: microscopicMode(aiText),
    panoramic: panoramicMode(aiText),
    emergency: /alert|critical|emergency|code|trauma/i.test(aiText),
    inspect: /inspect|zoom|detail|closer|focus/i.test(aiText),
    directionBias: /left|right|up|down|anterior|posterior/i.test(aiText),
  }), [aiText, organ, urgency]);

  useEffect(() => {
    if (!enabled) return undefined;

    const center = ORGAN_ANCHORS[mode.organ] || ORGAN_ANCHORS.default;
    const marker = Array.isArray(focusMarkers) && focusMarkers[0]?.position
      ? new THREE.Vector3(...focusMarkers[0].position)
      : null;

    const primaryTarget = marker || center;

    // Rule-of-thirds + headroom/leading-space + golden-ratio hero framing
    const thirds = new THREE.Vector3(0.28, 0.18, 0);
    const headroom = new THREE.Vector3(0, mode.panoramic ? 0.35 : 0.22, 0);
    const leading = mode.directionBias ? new THREE.Vector3(0.25, 0, 0.1) : new THREE.Vector3(0.1, 0, 0);
    const spiral = mode.urgency === 'high' || mode.urgency === 'trauma'
      ? goldenSpiralOffset(0.62, 0.85)
      : new THREE.Vector3();

    const composed = primaryTarget.clone()
      .add(thirds)
      .add(headroom)
      .add(leading)
      .add(spiral);

    targetLookAtRef.current.copy(composed);

    const distance = mode.microscopic ? 1.55 : mode.panoramic ? 7.8 : mode.inspect ? 3.2 : 4.6;
    const height = mode.panoramic ? 1.65 : mode.microscopic ? 0.5 : 0.95;

    const nextPos = composed.clone().add(new THREE.Vector3(0.4, height, distance));

    const m = motionRef.current;
    m.p0.copy(camera.position);
    m.p1.copy(nextPos);

    const tangent = nextPos.clone().sub(camera.position).multiplyScalar(0.55);
    m.m0.copy(tangent.clone().add(new THREE.Vector3(0.45, 0.22, -0.32)));
    m.m1.copy(tangent.clone().multiplyScalar(0.8).add(new THREE.Vector3(-0.25, 0.14, 0.2)));

    const urgencyDuration = mode.urgency === 'trauma' ? 0.6 : mode.urgency === 'high' ? 0.9 : mode.urgency === 'medium' ? 1.3 : 1.6;
    m.duration = mode.microscopic ? 1.75 : urgencyDuration;
    m.t = 0;

    m.dollyStrength = mode.emergency ? 0.65 : 0;
  }, [camera.position, enabled, focusMarkers, mode]);

  useEffect(() => {
    if (!enabled || !gazeTracking || typeof window === 'undefined') return undefined;

    let disposed = false;

    const setListener = (wg) => {
      if (!wg?.setGazeListener) return;
      wg.setGazeListener((data) => {
        if (!data || disposed) return;
        gazeRef.current = {
          x: clamp01(data.x / Math.max(1, size.width)),
          y: clamp01(data.y / Math.max(1, size.height)),
          active: true,
        };
      }).begin();
    };

    const existing = safeGetWebGazer();
    if (existing) {
      setListener(existing);
      return () => {
        disposed = true;
        try {
          existing.pause?.();
        } catch {
          // noop
        }
      };
    }

    const scriptId = 'webgazer-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
      script.async = true;
      document.head.appendChild(script);
    }

    const onLoad = () => {
      if (disposed) return;
      const wg = safeGetWebGazer();
      setListener(wg);
    };

    script.addEventListener('load', onLoad);

    return () => {
      disposed = true;
      script?.removeEventListener('load', onLoad);
      try {
        safeGetWebGazer()?.pause?.();
      } catch {
        // noop
      }
    };
  }, [enabled, gazeTracking, size.height, size.width]);

  useFrame((state, delta) => {
    if (!enabled) return;

    const m = motionRef.current;
    const easeFn = EASING[easing] || EASING.easeInOut;

    m.t = Math.min(1, m.t + delta / Math.max(0.001, m.duration));
    const eased = easeFn(m.t);

    const desiredPos = hermiteVec3(m.p0, m.p1, m.m0, m.m1, eased);

    // Orbit-around inspection with urgency-scaled angular speed
    if (mode.inspect || mode.microscopic) {
      const speed = mode.urgency === 'trauma' ? 2.8 : mode.urgency === 'high' ? 1.95 : 1.2;
      m.orbitPhase += delta * speed;
      desiredPos.x += Math.cos(m.orbitPhase) * (mode.microscopic ? 0.3 : 0.65);
      desiredPos.z += Math.sin(m.orbitPhase) * (mode.microscopic ? 0.3 : 0.65);
    }

    // Gaze-tracking assisted attention shift to attended organ
    if (gazeRef.current.active) {
      const gazeX = (gazeRef.current.x - 0.5) * 1.6;
      const gazeY = (0.5 - gazeRef.current.y) * 1.2;
      targetLookAtRef.current.lerp(
        new THREE.Vector3(gazeX, gazeY, 0).add(targetLookAtRef.current.clone().multiplyScalar(0.75)),
        0.035
      );
    }

    // Collision detection + smooth repulsion to avoid clipping through anatomy
    const target = targetLookAtRef.current;
    const rayDir = desiredPos.clone().sub(target).normalize();
    const maxDist = desiredPos.distanceTo(target);

    raycasterRef.current.set(target, rayDir);
    raycasterRef.current.far = maxDist;

    const hits = raycasterRef.current
      .intersectObjects(scene.children, true)
      .filter((hit) => hit.object?.isMesh && !hit.object?.userData?.ignoreCameraCollision);

    if (hits.length > 0) {
      const nearest = hits[0];
      const safeDist = Math.max(0.38, nearest.distance - 0.22);
      desiredPos.copy(target).addScaledVector(rayDir, safeDist);
    }

    // Emergency shake profile
    if (mode.emergency) {
      const trauma = mode.urgency === 'trauma' ? 1 : mode.urgency === 'high' ? 0.55 : 0.28;
      const shake = trauma * (0.012 + (severity / 4) * 0.018);
      const t = state.clock.getElapsedTime();
      desiredPos.x += (Math.sin(t * 39.0) + Math.sin(t * 27.0)) * shake;
      desiredPos.y += (Math.sin(t * 33.0) + Math.cos(t * 21.0)) * shake;
    }

    camera.position.lerp(desiredPos, 1 - Math.exp(-delta * 7.5));
    currentLookAtRef.current.lerp(targetLookAtRef.current, 1 - Math.exp(-delta * 8.0));
    camera.lookAt(currentLookAtRef.current);

    // Adaptive FOV with dolly-zoom Hitchcock effect for concerning findings
    const baseFov = mode.panoramic ? 66 : mode.microscopic ? 36 : mode.inspect ? 44 : 52;
    const dollyWave = m.dollyStrength > 0 ? Math.sin(state.clock.getElapsedTime() * 2.2) * m.dollyStrength * 5.5 : 0;
    const nextFov = THREE.MathUtils.clamp(baseFov + dollyWave, 28, 78);
    camera.fov = THREE.MathUtils.lerp(camera.fov, nextFov, 1 - Math.exp(-delta * 5.5));
    camera.updateProjectionMatrix();

    // Focus-pull DOF transition to diagnostic target
    if (onFocusDistanceChange) {
      const focusDist = camera.position.distanceTo(currentLookAtRef.current);
      const normalized = THREE.MathUtils.clamp(0.005 + focusDist / 140, 0.005, 0.09);
      onFocusDistanceChange(normalized);
    }
  });

  return null;
}
