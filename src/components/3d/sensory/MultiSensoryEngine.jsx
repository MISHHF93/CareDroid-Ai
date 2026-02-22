import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const SensoryContext = createContext({
  triggerOrganFeedback: () => {},
  setFocusedOrgan: () => {},
});

const ORGAN_POSITIONS = {
  heart: new THREE.Vector3(0, -1.6, 0),
  lungs: new THREE.Vector3(0, 0, 0),
  brain: new THREE.Vector3(0, 1.6, 0),
  default: new THREE.Vector3(0, 0, 0),
};

const HAPTIC_SIGNATURES = {
  heart: [55, 70, 55],
  lungs: [120, 45, 35, 45, 35],
  brain: [20, 35, 20, 140, 30, 35],
  default: [40, 40, 40],
};

function scalePattern(pattern, severity = 0) {
  const amp = 1 + Math.max(0, Math.min(4, severity)) * 0.25;
  return pattern.map((v, idx) => Math.max(10, Math.round(idx % 2 === 0 ? v * amp : v)));
}

function isTouchCapable() {
  if (typeof navigator === 'undefined') return false;
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}

function createAudioState() {
  if (typeof window === 'undefined') return null;

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  const context = new AC();

  const master = context.createGain();
  master.gain.value = 0.75;
  master.connect(context.destination);

  const heartPanner = context.createPanner();
  heartPanner.panningModel = 'HRTF';
  heartPanner.distanceModel = 'inverse';
  heartPanner.refDistance = 0.8;
  heartPanner.rolloffFactor = 1.2;

  const lungPanner = context.createPanner();
  lungPanner.panningModel = 'HRTF';
  lungPanner.distanceModel = 'inverse';
  lungPanner.refDistance = 1.1;
  lungPanner.rolloffFactor = 1.0;

  const alertPanner = context.createPanner();
  alertPanner.panningModel = 'HRTF';
  alertPanner.distanceModel = 'inverse';
  alertPanner.refDistance = 1.5;

  const heartGain = context.createGain();
  heartGain.gain.value = 0;
  heartPanner.connect(heartGain).connect(master);

  const breathGain = context.createGain();
  breathGain.gain.value = 0.0;
  lungPanner.connect(breathGain).connect(master);

  const alertGain = context.createGain();
  alertGain.gain.value = 0.0;
  alertPanner.connect(alertGain).connect(master);

  const heartOsc = context.createOscillator();
  heartOsc.type = 'triangle';
  heartOsc.frequency.value = 48;
  heartOsc.connect(heartPanner);
  heartOsc.start();

  const alertOsc = context.createOscillator();
  alertOsc.type = 'sine';
  alertOsc.frequency.value = 880;
  alertOsc.connect(alertPanner);
  alertOsc.start();

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const noiseSource = context.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const breathFilter = context.createBiquadFilter();
  breathFilter.type = 'bandpass';
  breathFilter.frequency.value = 380;
  breathFilter.Q.value = 0.7;

  noiseSource.connect(breathFilter).connect(lungPanner);
  noiseSource.start();

  return {
    context,
    master,
    heartPanner,
    lungPanner,
    alertPanner,
    heartGain,
    breathGain,
    alertGain,
    heartOsc,
    alertOsc,
    noiseSource,
  };
}

export function MultiSensoryProvider({ children, severityScore = 0, vitals = {} }) {
  const { camera } = useThree();
  const audioRef = useRef(null);
  const heartbeatAccumulatorRef = useRef(0);
  const breathAccumulatorRef = useRef(0);
  const alertAccumulatorRef = useRef(0);
  const focusedOrganRef = useRef('default');

  const heartbeat = Number(vitals?.heartRate?.value || vitals?.heartRate || vitals?.HR || 72);
  const respiratoryRate = Number(vitals?.RR || vitals?.respRate || 16);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const ensureAudio = async () => {
      if (!audioRef.current) {
        audioRef.current = createAudioState();
      }
      if (audioRef.current?.context?.state === 'suspended') {
        await audioRef.current.context.resume();
      }
    };

    const onStart = () => {
      ensureAudio().catch(() => {
        // no-op
      });
    };

    window.addEventListener('pointerdown', onStart, { passive: true });
    window.addEventListener('touchstart', onStart, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onStart);
      window.removeEventListener('touchstart', onStart);
    };
  }, []);

  const api = useMemo(() => ({
    triggerOrganFeedback: (organ = 'default', organSeverity = 0) => {
      if (typeof navigator !== 'undefined' && navigator.vibrate && isTouchCapable()) {
        const base = HAPTIC_SIGNATURES[organ] || HAPTIC_SIGNATURES.default;
        navigator.vibrate(scalePattern(base, organSeverity));
      }

      if (audioRef.current?.context) {
        const state = audioRef.current;
        const now = state.context.currentTime;
        state.alertGain.gain.cancelScheduledValues(now);
        state.alertGain.gain.setValueAtTime(0, now);
        state.alertGain.gain.linearRampToValueAtTime(0.16 + Math.min(0.3, organSeverity * 0.05), now + 0.02);
        state.alertGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      }

      focusedOrganRef.current = organ;
    },
    setFocusedOrgan: (organ = 'default') => {
      focusedOrganRef.current = organ;
    },
  }), []);

  useFrame((state, delta) => {
    const audio = audioRef.current;
    if (!audio?.context) return;

    const listener = audio.context.listener;
    const cp = camera.position;
    if (listener.positionX) {
      listener.positionX.value = cp.x;
      listener.positionY.value = cp.y;
      listener.positionZ.value = cp.z;
    } else {
      listener.setPosition(cp.x, cp.y, cp.z);
    }

    const heartPos = ORGAN_POSITIONS.heart;
    const lungsPos = ORGAN_POSITIONS.lungs;
    const focusPos = ORGAN_POSITIONS[focusedOrganRef.current] || ORGAN_POSITIONS.default;

    audio.heartPanner.positionX.value = heartPos.x;
    audio.heartPanner.positionY.value = heartPos.y;
    audio.heartPanner.positionZ.value = heartPos.z;

    audio.lungPanner.positionX.value = lungsPos.x;
    audio.lungPanner.positionY.value = lungsPos.y;
    audio.lungPanner.positionZ.value = lungsPos.z;

    audio.alertPanner.positionX.value = focusPos.x;
    audio.alertPanner.positionY.value = focusPos.y;
    audio.alertPanner.positionZ.value = focusPos.z;

    // Heart valve pulse sounds positioned in 3D
    const beatInterval = 60 / Math.max(40, heartbeat);
    heartbeatAccumulatorRef.current += delta;
    if (heartbeatAccumulatorRef.current >= beatInterval) {
      heartbeatAccumulatorRef.current = 0;
      const now = audio.context.currentTime;
      audio.heartGain.gain.cancelScheduledValues(now);
      audio.heartGain.gain.setValueAtTime(0.0001, now);
      audio.heartGain.gain.linearRampToValueAtTime(0.18 + severityScore * 0.05, now + 0.015);
      audio.heartGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    }

    // Breath sounds with stereo panning and attenuation
    const breathInterval = 60 / Math.max(6, respiratoryRate);
    breathAccumulatorRef.current += delta;
    if (breathAccumulatorRef.current >= breathInterval) {
      breathAccumulatorRef.current = 0;
      const now = audio.context.currentTime;
      audio.breathGain.gain.cancelScheduledValues(now);
      audio.breathGain.gain.setValueAtTime(0.0001, now);
      audio.breathGain.gain.linearRampToValueAtTime(0.06, now + 0.3);
      audio.breathGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    }

    // Alert tones increase with severity
    alertAccumulatorRef.current += delta;
    if (severityScore >= 3 && alertAccumulatorRef.current > 1.6) {
      alertAccumulatorRef.current = 0;
      const now = audio.context.currentTime;
      audio.alertOsc.frequency.value = severityScore >= 4 ? 1040 : 900;
      audio.alertGain.gain.cancelScheduledValues(now);
      audio.alertGain.gain.setValueAtTime(0.0001, now);
      audio.alertGain.gain.linearRampToValueAtTime(0.24 + severityScore * 0.06, now + 0.03);
      audio.alertGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    }
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.vibrate || !isTouchCapable()) return undefined;

    const beatMs = Math.round((60 / Math.max(40, heartbeat)) * 1000);
    const intensity = 8 + Math.round(Math.min(25, severityScore * 5));

    const id = window.setInterval(() => {
      navigator.vibrate([intensity, Math.max(20, beatMs - intensity)]);
    }, Math.max(420, beatMs));

    return () => window.clearInterval(id);
  }, [heartbeat, severityScore]);

  return (
    <SensoryContext.Provider value={api}>
      {children}
    </SensoryContext.Provider>
  );
}

export function useSensoryFeedback() {
  return useContext(SensoryContext);
}
