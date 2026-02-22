import React, { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';

function toMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export default function PerformanceTelemetryOverlay({ enabled = false, gpuStats = null, qualityLevel = 'high' }) {
  const { gl } = useThree();
  const [fps, setFps] = useState(60);
  const [calls, setCalls] = useState(0);
  const [triangles, setTriangles] = useState(0);
  const [programs, setPrograms] = useState(0);
  const [shaderCompileMs, setShaderCompileMs] = useState(0);
  const frameCounter = useRef(0);
  const elapsedRef = useRef(0);
  const compileTimer = useRef({ lastPrograms: 0, startedAt: performance.now() });

  const style = useMemo(() => ({
    background: 'rgba(2,6,23,0.85)',
    border: '1px solid rgba(56,189,248,0.65)',
    borderRadius: 8,
    color: '#dbeafe',
    padding: '8px 10px',
    minWidth: 220,
    fontSize: 11,
    lineHeight: 1.35,
  }), []);

  useFrame((_, delta) => {
    if (!enabled) return;

    elapsedRef.current += delta;
    frameCounter.current += 1;

    if (elapsedRef.current >= 0.5) {
      const nextFps = frameCounter.current / elapsedRef.current;
      setFps(nextFps);
      frameCounter.current = 0;
      elapsedRef.current = 0;

      const info = gl.info;
      setCalls(info.render.calls || 0);
      setTriangles(info.render.triangles || 0);
      const nextPrograms = info.programs?.length || 0;
      if (nextPrograms > compileTimer.current.lastPrograms) {
        const duration = performance.now() - compileTimer.current.startedAt;
        setShaderCompileMs(duration);
        compileTimer.current.lastPrograms = nextPrograms;
      }
      setPrograms(nextPrograms);
    }
  });

  if (!enabled) return null;

  return (
    <Html position={[-2.2, -2.15, 0]} transform occlude="blending">
      <div style={style}>
        <div><strong>Perf Telemetry</strong> · {qualityLevel}</div>
        <div>FPS: {fps.toFixed(1)}</div>
        <div>Draw Calls: {calls}</div>
        <div>Triangles: {triangles}</div>
        <div>Shader Programs: {programs}</div>
        <div>Shader Compile: {shaderCompileMs.toFixed(1)}ms</div>
        <div>GPU Est. Memory: {toMb(gpuStats?.bytes || 0)} MB</div>
        <div>Textures: {gpuStats?.textures || 0} · Geometries: {gpuStats?.geometries || 0}</div>
      </div>
    </Html>
  );
}
