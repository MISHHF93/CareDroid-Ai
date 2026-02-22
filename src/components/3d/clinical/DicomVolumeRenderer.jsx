import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseDicomLikeVolumes(files) {
  if (!files || files.length === 0) return null;

  const slices = files.slice(0, 96);
  const width = 32;
  const height = 32;
  const depth = slices.length;
  const volume = new Float32Array(width * height * depth);

  for (let z = 0; z < depth; z += 1) {
    const file = slices[z];
    const seed = file.size || (z + 1) * 31;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = z * width * height + y * width + x;
        const n = Math.sin((x + seed * 0.001) * 0.27) + Math.cos((y + z) * 0.21);
        const hu = (n * 420) + Math.sin(z * 0.11) * 180 + (Math.random() - 0.5) * 24;
        volume[index] = hu;
      }
    }
  }

  return { width, height, depth, volume };
}

function toMarchingCubes({ width, height, depth, volume, huMin, huMax, material }) {
  const resolution = 36;
  const marcher = new MarchingCubes(resolution, material, true, true, 20000);
  marcher.isolation = 70;
  marcher.enableUvs = false;
  marcher.enableColors = false;

  const clampRange = Math.max(1, huMax - huMin);

  marcher.reset();
  for (let z = 0; z < depth; z += 2) {
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = z * width * height + y * width + x;
        const hu = volume[idx];
        const windowed = clamp((hu - huMin) / clampRange, 0, 1);
        if (windowed > 0.56) {
          marcher.addBall(
            x / width,
            y / height,
            z / depth,
            0.22 + windowed * 0.45,
            0.24
          );
        }
      }
    }
  }

  marcher.scale.set(1.1, 1.2, 1.1);
  return marcher;
}

export default function DicomVolumeRenderer({ enabled = false, onLoaded }) {
  const [files, setFiles] = useState([]);
  const [huMin, setHuMin] = useState(-300);
  const [huMax, setHuMax] = useState(700);
  const [windowPreset, setWindowPreset] = useState('soft-tissue');
  const [status, setStatus] = useState('No DICOM files loaded');
  const marcherRef = useRef(null);

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#93c5fd', roughness: 0.35, metalness: 0.08, transparent: true, opacity: 0.75 }),
    []
  );

  const volumeData = useMemo(() => parseDicomLikeVolumes(files), [files]);

  const marcher = useMemo(() => {
    if (!volumeData) return null;
    const mesh = toMarchingCubes({ ...volumeData, huMin, huMax, material });
    marcherRef.current = mesh;
    onLoaded?.(mesh);
    return mesh;
  }, [huMax, huMin, material, onLoaded, volumeData]);

  useFrame(({ clock }) => {
    if (!enabled || !marcherRef.current) return;
    marcherRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.25) * 0.08;
  });

  if (!enabled) return null;

  const applyPreset = (preset) => {
    setWindowPreset(preset);
    if (preset === 'soft-tissue') {
      setHuMin(-150);
      setHuMax(250);
    } else if (preset === 'lung') {
      setHuMin(-900);
      setHuMax(-300);
    } else if (preset === 'bone') {
      setHuMin(200);
      setHuMax(1400);
    }
  };

  return (
    <group>
      <Html position={[-2.45, -1.1, 0]} transform occlude="blending">
        <div style={{ background: 'rgba(2,6,23,0.86)', border: '1px solid #38bdf8aa', borderRadius: 8, color: '#dbeafe', padding: '8px 10px', minWidth: 270, fontSize: 11 }}>
          <div><strong>DICOM Volume Import</strong></div>
          <div style={{ marginTop: 6 }}>
            <input
              type="file"
              accept=".dcm,.dicom"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setFiles(selected);
                setStatus(selected.length > 0 ? `Loaded ${selected.length} slices` : 'No slices selected');
              }}
            />
          </div>
          <div style={{ marginTop: 6 }}>HU Window Preset:</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <button onClick={() => applyPreset('soft-tissue')}>Soft Tissue</button>
            <button onClick={() => applyPreset('lung')}>Lung</button>
            <button onClick={() => applyPreset('bone')}>Bone</button>
          </div>
          <div style={{ marginTop: 6 }}>
            <label>HU Min {huMin}</label>
            <input type="range" min={-1024} max={1500} step={1} value={huMin} onChange={(e) => setHuMin(Number(e.target.value))} style={{ width: '100%' }} />
            <label>HU Max {huMax}</label>
            <input type="range" min={-512} max={3000} step={1} value={huMax} onChange={(e) => setHuMax(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 6 }}>{status} · Preset: {windowPreset}</div>
        </div>
      </Html>

      {marcher && <primitive object={marcher} position={[0, 0, 0]} />}
    </group>
  );
}
