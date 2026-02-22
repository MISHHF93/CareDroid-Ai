import React, { useEffect, useMemo, useState } from 'react';
import { Html, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getFhirVitalsStreamService } from '../../services/realtime/FhirVitalsStreamService';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toSeverity(vitals) {
  const hr = Number(vitals?.heartRate?.value ?? 72);
  const spo2 = Number(vitals?.oxygenSat?.value ?? 97);
  const rr = Number(vitals?.respiratoryRate?.value ?? 16);
  const temp = Number(vitals?.temperature?.value ?? 98.6);

  let severity = 0;
  if (hr > 110 || hr < 50) severity += 1;
  if (spo2 < 92) severity += 2;
  if (rr > 24 || rr < 10) severity += 1;
  if (temp > 101 || temp < 96) severity += 1;
  return clamp(severity, 0, 4);
}

function statusColor(metric, value) {
  if (metric === 'hr') {
    if (value < 50 || value > 125) return '#ef4444';
    if (value < 60 || value > 105) return '#f59e0b';
    return '#22c55e';
  }
  if (metric === 'spo2') {
    if (value < 90) return '#ef4444';
    if (value < 94) return '#f59e0b';
    return '#22c55e';
  }
  if (metric === 'rr') {
    if (value < 9 || value > 30) return '#ef4444';
    if (value < 12 || value > 24) return '#f59e0b';
    return '#22c55e';
  }
  if (metric === 'temp') {
    if (value < 96 || value > 102) return '#ef4444';
    if (value < 97 || value > 100.4) return '#f59e0b';
    return '#22c55e';
  }
  return '#22c55e';
}

function Sparkline({ data = [], color = '#00e5ff', width = 140, height = 34 }) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function Panel({ title, value, unit, color, trend = [], onScrub, scrubIndex }) {
  return (
    <div style={{
      minWidth: 160,
      background: 'rgba(5, 12, 24, 0.88)',
      border: `1px solid ${color}88`,
      borderRadius: 10,
      padding: '8px 10px',
      color: '#dbeafe',
      boxShadow: `0 0 14px ${color}33`,
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.08em', color }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>
        {value} <span style={{ fontSize: 12, color: '#93c5fd' }}>{unit}</span>
      </div>
      <Sparkline data={trend} color={color} />
      <input
        type="range"
        min={0}
        max={Math.max(0, trend.length - 1)}
        value={scrubIndex}
        onChange={(e) => onScrub?.(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function ECGWrap({ heartRate = 72 }) {
  const segments = 220;
  const points = useMemo(() => {
    const arr = [];
    for (let i = 0; i < segments; i += 1) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      const beat = Math.sin(t * Math.PI * 18) * 0.03;
      const qrs = Math.exp(-Math.pow((t * 6 % 1) - 0.22, 2) / 0.0009) * 0.26;
      const radius = 0.9 + beat + qrs;
      arr.push(new THREE.Vector3(Math.cos(angle) * radius, -1.6 + Math.sin(t * Math.PI * 4) * 0.06, Math.sin(angle) * radius));
    }
    return arr;
  }, [heartRate]);

  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#22d3ee" transparent opacity={0.85} />
    </lineLoop>
  );
}

function AlertFog({ position, severity }) {
  const color = severity >= 3 ? '#ef4444' : severity >= 2 ? '#f59e0b' : '#10b981';
  return (
    <mesh position={position}>
      <sphereGeometry args={[1.35, 24, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.08 + severity * 0.05} depthWrite={false} />
    </mesh>
  );
}

function ForecastGhost({ organ, confidence = 0.7, value = 0 }) {
  const position = organ === 'brain' ? [0.2, 1.95, 0.4] : organ === 'lungs' ? [0.25, 0.35, 0.45] : [0.22, -1.2, 0.5];
  const scale = 0.28 + (1 - confidence) * 0.32;
  return (
    <group position={position}>
      <mesh scale={[scale, scale, scale]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.2 + confidence * 0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.45 + (1 - confidence) * 0.18, 48]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, -0.42, 0]} fontSize={0.07} color="#a5f3fc">
        {`Forecast ${value}`}
      </Text>
    </group>
  );
}

function MedicationWave({ concentration = 0.4, organ = 'heart', phase = 0 }) {
  const center = organ === 'brain' ? [0, 1.6, 0] : organ === 'lungs' ? [0, 0, 0] : [0, -1.6, 0];
  const radius = 0.6 + concentration * 0.9;
  return (
    <mesh position={center} rotation={[Math.PI / 2, 0, phase]}>
      <torusGeometry args={[radius, 0.035, 12, 48]} />
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.18 + concentration * 0.35} />
    </mesh>
  );
}

export default function LiveVitalsOverlay({
  patientId = 'default-patient',
  token,
  enabled = true,
  initialVitals = {},
  onVitalsUpdate,
}) {
  const [packet, setPacket] = useState(() => ({
    timestamp: new Date().toISOString(),
    vitals: {
      heartRate: { value: Number(initialVitals?.heartRate?.value || initialVitals?.heartRate || initialVitals?.HR || 72), unit: 'bpm' },
      bloodPressure: { systolic: Number(initialVitals?.bloodPressure?.systolic || initialVitals?.BP_sys || 122), diastolic: Number(initialVitals?.bloodPressure?.diastolic || initialVitals?.BP_dia || 78), unit: 'mmHg' },
      oxygenSat: { value: Number(initialVitals?.oxygenSat?.value || initialVitals?.SpO2 || initialVitals?.oxygenSat || 97), unit: '%' },
      respiratoryRate: { value: Number(initialVitals?.respiratoryRate?.value || initialVitals?.RR || 16), unit: 'rpm' },
      temperature: { value: Number(initialVitals?.temperature?.value || initialVitals?.temp || initialVitals?.temperature || 98.6), unit: '°F' },
    },
    medications: [],
    forecast: null,
  }));

  const [trend, setTrend] = useState(() => ({ hr: [], spo2: [], rr: [], temp: [], sys: [], dia: [] }));
  const [scrubIndex, setScrubIndex] = useState(0);
  const [medPhase, setMedPhase] = useState(0);

  const severity = toSeverity(packet.vitals);

  useEffect(() => {
    if (!enabled) return undefined;

    const service = getFhirVitalsStreamService();
    let disposed = false;

    service.initialize({
      token: token || (typeof localStorage !== 'undefined' ? localStorage.getItem('caredroid_access_token') : undefined),
      patientId,
    }).catch(() => {
      // fallback simulation handled inside service
    });

    const off = service.onVitalsUpdate((next) => {
      if (disposed) return;
      setPacket(next);
      onVitalsUpdate?.(next.vitals);

      setTrend((prev) => {
        const nextTrend = {
          hr: [...prev.hr, Number(next.vitals.heartRate.value)].slice(-96),
          spo2: [...prev.spo2, Number(next.vitals.oxygenSat.value)].slice(-96),
          rr: [...prev.rr, Number(next.vitals.respiratoryRate.value)].slice(-96),
          temp: [...prev.temp, Number(next.vitals.temperature.value)].slice(-96),
          sys: [...prev.sys, Number(next.vitals.bloodPressure.systolic)].slice(-96),
          dia: [...prev.dia, Number(next.vitals.bloodPressure.diastolic)].slice(-96),
        };
        setScrubIndex(nextTrend.hr.length - 1);
        return nextTrend;
      });
    });

    return () => {
      disposed = true;
      off?.();
      service.disconnect();
    };
  }, [enabled, onVitalsUpdate, patientId, token]);

  useFrame((_, delta) => {
    setMedPhase((phase) => (phase + delta * 0.55) % (Math.PI * 2));
  });

  const hrSeries = trend.hr;
  const spo2Series = trend.spo2;
  const rrSeries = trend.rr;
  const tempSeries = trend.temp;

  const idx = clamp(scrubIndex, 0, Math.max(0, hrSeries.length - 1));

  const scrubVitals = {
    hr: hrSeries[idx] ?? packet.vitals.heartRate.value,
    spo2: spo2Series[idx] ?? packet.vitals.oxygenSat.value,
    rr: rrSeries[idx] ?? packet.vitals.respiratoryRate.value,
    temp: tempSeries[idx] ?? packet.vitals.temperature.value,
    sys: trend.sys[idx] ?? packet.vitals.bloodPressure.systolic,
    dia: trend.dia[idx] ?? packet.vitals.bloodPressure.diastolic,
  };

  const hrColor = statusColor('hr', scrubVitals.hr);
  const spo2Color = statusColor('spo2', scrubVitals.spo2);
  const rrColor = statusColor('rr', scrubVitals.rr);
  const tempColor = statusColor('temp', scrubVitals.temp);

  const oxygenNorm = clamp((scrubVitals.spo2 - 80) / 20, 0, 1);
  const lungsColor = new THREE.Color().lerpColors(new THREE.Color('#2563eb'), new THREE.Color('#f9a8d4'), oxygenNorm);

  return (
    <group>
      <ECGWrap heartRate={scrubVitals.hr} />

      {/* Blood pressure mercury bars near heart */}
      <group position={[1.35, -1.35, 0]}>
        <mesh position={[0, clamp((scrubVitals.sys - 80) / 120, 0.02, 1.05) * 0.5 - 0.25, 0]}>
          <boxGeometry args={[0.1, clamp((scrubVitals.sys - 80) / 120, 0.02, 1.05), 0.1]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.75} />
        </mesh>
        <mesh position={[0.18, clamp((scrubVitals.dia - 40) / 100, 0.02, 1.05) * 0.5 - 0.25, 0]}>
          <boxGeometry args={[0.1, clamp((scrubVitals.dia - 40) / 100, 0.02, 1.05), 0.1]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.7} />
        </mesh>
      </group>

      {/* SpO2 oxygen tint around lungs */}
      <mesh position={[0, 0, 0]} scale={[1.4, 1.1, 0.9]}>
        <sphereGeometry args={[1, 28, 28]} />
        <meshBasicMaterial color={lungsColor} transparent opacity={0.14 + (1 - oxygenNorm) * 0.18} depthWrite={false} />
      </mesh>

      {/* Respiratory sync visual */}
      <group scale={[1 + Math.sin(Date.now() * 0.003) * (scrubVitals.rr / 400), 1 + Math.sin(Date.now() * 0.003) * (scrubVitals.rr / 400), 1]}>
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[1.18, 1.25, 64]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Temperature full-body thermal map */}
      <mesh position={[0, 0, 0]} scale={[2.5, 4.2, 1.3]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color={tempColor} transparent opacity={0.08 + severity * 0.03} depthWrite={false} />
      </mesh>

      {/* Alert threshold fog zones */}
      <AlertFog position={[0, -1.6, 0]} severity={severity} />
      <AlertFog position={[0, 0, 0]} severity={severity} />
      <AlertFog position={[0, 1.6, 0]} severity={severity} />

      {/* Predictive ghost organs and confidence ribbons */}
      {packet.forecast && (
        <>
          <ForecastGhost organ="heart" value={packet.forecast.heartRate} confidence={packet.forecast.confidence} />
          <ForecastGhost organ="lungs" value={packet.forecast.oxygenSat} confidence={packet.forecast.confidence} />
          <ForecastGhost organ="brain" value={packet.forecast.respiratoryRate} confidence={packet.forecast.confidence} />
        </>
      )}

      {/* Medication effect timelines */}
      {(packet.medications || []).slice(0, 3).map((med, index) => (
        <MedicationWave
          key={`${med.name}-${index}`}
          concentration={Number(med.concentration ?? 0.3)}
          organ={index % 3 === 0 ? 'heart' : index % 3 === 1 ? 'lungs' : 'brain'}
          phase={medPhase + index * 0.7}
        />
      ))}

      {/* Floating holographic vitals panels */}
      <Html position={[1.9, -1.2, 0]} transform occlude="blending">
        <Panel
          title="HEART RATE"
          value={Math.round(scrubVitals.hr)}
          unit="BPM"
          color={hrColor}
          trend={hrSeries}
          scrubIndex={idx}
          onScrub={setScrubIndex}
        />
      </Html>

      <Html position={[1.95, 0.25, 0]} transform occlude="blending">
        <Panel
          title="SPO2"
          value={scrubVitals.spo2.toFixed(1)}
          unit="%"
          color={spo2Color}
          trend={spo2Series}
          scrubIndex={idx}
          onScrub={setScrubIndex}
        />
      </Html>

      <Html position={[1.85, 1.85, 0]} transform occlude="blending">
        <Panel
          title="RESP RATE"
          value={Math.round(scrubVitals.rr)}
          unit="RPM"
          color={rrColor}
          trend={rrSeries}
          scrubIndex={idx}
          onScrub={setScrubIndex}
        />
      </Html>

      <Html position={[-2.2, 0.8, 0]} transform occlude="blending">
        <Panel
          title="TEMP"
          value={scrubVitals.temp.toFixed(1)}
          unit="°F"
          color={tempColor}
          trend={tempSeries}
          scrubIndex={idx}
          onScrub={setScrubIndex}
        />
      </Html>

      <Html position={[-2.2, -0.95, 0]} transform occlude="blending">
        <div style={{
          minWidth: 170,
          background: 'rgba(5,12,24,0.88)',
          border: '1px solid #38bdf8aa',
          borderRadius: 10,
          padding: '8px 10px',
          color: '#dbeafe',
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#38bdf8' }}>BLOOD PRESSURE</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.05 }}>
            {Math.round(scrubVitals.sys)}/{Math.round(scrubVitals.dia)}
            <span style={{ fontSize: 12, marginLeft: 4, color: '#93c5fd' }}>mmHg</span>
          </div>
          <div style={{ fontSize: 10, color: '#7dd3fc' }}>{new Date(packet.timestamp).toLocaleTimeString()}</div>
        </div>
      </Html>
    </group>
  );
}
