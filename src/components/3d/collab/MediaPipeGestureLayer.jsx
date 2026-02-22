import { useEffect, useRef } from 'react';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
}

function distance(a, b) {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export default function MediaPipeGestureLayer({ enabled, controlsRef, canInteract = true, onPointSelect }) {
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const lastGestureRef = useRef({ pinch: false, spread: false });

  useEffect(() => {
    if (!enabled || !canInteract || typeof window === 'undefined') return undefined;

    let mounted = true;
    const video = document.createElement('video');
    video.style.display = 'none';
    video.setAttribute('playsinline', 'true');
    document.body.appendChild(video);

    const setup = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

        if (!mounted || !window.Hands || !window.Camera) return;

        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.6,
        });

        hands.onResults((results) => {
          const landmarks = results?.multiHandLandmarks?.[0];
          if (!landmarks || !controlsRef?.current) return;

          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const pinchDistance = distance(thumbTip, indexTip);
          const spreadDistance = distance(indexTip, middleTip);

          const pinch = pinchDistance < 0.05;
          const spread = spreadDistance > 0.11;

          const controls = controlsRef.current;

          if (pinch && !lastGestureRef.current.pinch) {
            controls.rotateLeft(0.15);
            controls.rotateUp(0.1);
            controls.update();
          }

          if (spread && !lastGestureRef.current.spread) {
            controls.dollyOut(1.12);
            controls.update();
          }

          const pointing = indexTip?.y < landmarks[6]?.y && landmarks[12]?.y > landmarks[10]?.y;
          if (pointing && onPointSelect) {
            const ray = {
              x: (indexTip.x - 0.5) * 2,
              y: (0.5 - indexTip.y) * 2,
            };
            onPointSelect(ray);
          }

          lastGestureRef.current = { pinch, spread };
        });

        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false });
        video.srcObject = streamRef.current;
        await video.play();

        const camera = new window.Camera(video, {
          onFrame: async () => {
            await hands.send({ image: video });
          },
          width: 640,
          height: 360,
        });
        camera.start();

        const frame = () => {
          if (!mounted) return;
          rafRef.current = requestAnimationFrame(frame);
        };
        frame();
      } catch {
        // Gesture layer is optional; fail silently.
      }
    };

    setup();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (video.parentNode) video.parentNode.removeChild(video);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled, canInteract, controlsRef, onPointSelect]);

  return null;
}
