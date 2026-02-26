/**
 * ClinicalLibrary — Holographic 3D Clinical Atlas
 * Revamped: detailed anatomical organ models, back navigation, clean layout.
 */

import React, { useState, Suspense, useMemo, useRef, useEffect } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
import HolographicCanvas from '../components/holographic/HolographicCanvas';
import './ClinicalLibrary.css';

/* ─────────────────────────────────────────
   Clinical Data Atlas
───────────────────────────────────────── */
const ORGANS = [
  {
    id: 'heart', label: 'Heart', icon: '❤️', system: 'cardiovascular',
    color: '#ef4444', accentHex: 'rgba(239,68,68,0.13)', model: 'heart',
    description: 'Four-chambered muscular pump maintaining systemic and pulmonary circulation via coordinated electromechanical contraction.',
    anatomy: ['Left ventricle', 'Right ventricle', 'Left atrium', 'Right atrium', 'Aortic valve', 'Mitral valve', 'SA node', 'Coronary arteries'],
    physiology: 'CO = HR × SV. Normal CO 4–8 L/min. Frank-Starling: Preload↑ → SV↑. Afterload↑ → SV↓.',
    referenceValues: [
      { label: 'Heart Rate',            range: '60–100 bpm',     critical: '<40 or >150',          softCrit: true  },
      { label: 'Systolic BP',           range: '100–139 mmHg',   critical: '<90 or >180',          softCrit: false },
      { label: 'Diastolic BP',          range: '60–89 mmHg',     critical: '<60 or >120',          softCrit: false },
      { label: 'EF (Ejection Fraction)',range: '55–70 %',        critical: '<35 %',                softCrit: true  },
      { label: 'Troponin I',            range: '<0.04 ng/mL',    critical: '>0.4',                 softCrit: false },
      { label: 'BNP',                   range: '<100 pg/mL',     critical: '>500 pg/mL',           softCrit: true  },
    ],
    pathologies: [
      { name: 'STEMI',              severity: 4, description: 'ST-elevation MI — PCI target <90 min. Heparin + P2Y12 inhibitor.' },
      { name: 'NSTEMI / UA',        severity: 3, description: 'Non-ST ACS — anticoagulation, early invasive strategy within 24–72 h.' },
      { name: 'Cardiogenic Shock',  severity: 4, description: 'CO failure → inotropes, IABP/Impella, ECMO in refractory cases.' },
      { name: 'Atrial Fibrillation',severity: 2, description: 'Irregular rhythm — rate/rhythm control, anticoagulate for stroke prevention.' },
      { name: 'HFrEF',              severity: 3, description: 'EF <40% — GDMT: ACEi/ARNi + β-blocker + MRA + SGLT2i.' },
    ],
    sofaLabel: 'Cardiovascular SOFA',
    sofa: [
      { score: 1, criterion: 'MAP < 70 mmHg' },
      { score: 2, criterion: 'Dopamine ≤5 or Dobutamine (any dose)' },
      { score: 3, criterion: 'Dopamine >5 or Norepinephrine ≤0.1 μg/kg/min' },
      { score: 4, criterion: 'Dopamine >15 or Norepinephrine >0.1 μg/kg/min' },
    ],
  },
  {
    id: 'brain', label: 'Brain', icon: '🧠', system: 'neurological',
    color: '#a855f7', accentHex: 'rgba(168,85,247,0.13)', model: 'brain',
    description: 'Central command system. ~86 billion neurons governing consciousness, cognition, motor control, and autonomic regulation via 100 trillion synaptic connections.',
    anatomy: ['Frontal lobe', 'Parietal lobe', 'Temporal lobe', 'Occipital lobe', 'Cerebellum', 'Brainstem', 'Limbic system', 'Basal ganglia'],
    physiology: 'CPP = MAP − ICP. Target CPP 60–70 mmHg in TBI. Cerebral autoregulation operates 50–150 mmHg MAP. CMRO₂ ≈ 3.5 mL O₂/100 g/min.',
    referenceValues: [
      { label: 'GCS',          range: '15',           critical: '≤8 → intubation', softCrit: true  },
      { label: 'ICP',          range: '<15 mmHg',     critical: '>22 mmHg',        softCrit: false },
      { label: 'CPP',          range: '60–70 mmHg',   critical: '<50 mmHg',        softCrit: true  },
      { label: 'NIHSS',        range: '0 (normal)',   critical: '>25 = severe',    softCrit: true  },
      { label: 'Jugular SvO₂', range: '55–75%',       critical: '<50 or >75%',     softCrit: false },
    ],
    pathologies: [
      { name: 'Hemorrhagic Stroke',    severity: 4, description: 'ICH/SAH — BP control, ICP management, early neurosurgical consult.' },
      { name: 'Ischemic Stroke',       severity: 4, description: 'tPA window <4.5 h. Thrombectomy up to 24 h (DAWN/DEFUSE criteria).' },
      { name: 'Status Epilepticus',    severity: 4, description: 'Benzos first-line → Phenytoin/Valproate → Propofol/Ketamine.' },
      { name: 'Bacterial Meningitis',  severity: 4, description: 'LP → ceftriaxone + vancomycin + dexamethasone immediately.' },
      { name: 'Severe TBI',            severity: 3, description: 'ICP monitor if GCS <8. CPP 60–70 mmHg. Secondary insult prevention.' },
    ],
    sofaLabel: 'CNS SOFA (GCS)',
    sofa: [
      { score: 1, criterion: 'GCS 13–14' },
      { score: 2, criterion: 'GCS 10–12' },
      { score: 3, criterion: 'GCS 6–9'   },
      { score: 4, criterion: 'GCS <6'    },
    ],
  },
  {
    id: 'lungs', label: 'Lungs', icon: '🫁', system: 'respiratory',
    color: '#38bdf8', accentHex: 'rgba(56,189,248,0.13)', model: 'lungs',
    description: 'Paired gas-exchange organs. ~300 million alveoli provide ~70 m² surface area for O₂/CO₂ diffusion across a 0.2 μm blood-air barrier.',
    anatomy: ['RUL', 'RML', 'RLL', 'LUL (+ Lingula)', 'LLL', 'Alveoli', 'Terminal bronchioles', 'Pleura'],
    physiology: 'A-a gradient = PAO₂ − PaO₂ (normal <15 mmHg). P/F = PaO₂/FiO₂ defines ARDS severity. Static compliance = ΔV/ΔP (normal 70–100 mL/cmH₂O).',
    referenceValues: [
      { label: 'SpO₂',             range: '95–100%',      critical: '<90%',               softCrit: false },
      { label: 'PaO₂',             range: '75–100 mmHg',  critical: '<60 mmHg',           softCrit: false },
      { label: 'PaCO₂',            range: '35–45 mmHg',   critical: '<25 or >60',         softCrit: true  },
      { label: 'P/F Ratio',        range: '>300',         critical: '<100 = severe ARDS', softCrit: false },
      { label: 'Respiratory Rate', range: '12–20 /min',   critical: '>30 /min',           softCrit: true  },
      { label: 'Plateau Pressure', range: '<28 cmH₂O',    critical: '>30',                softCrit: false },
    ],
    pathologies: [
      { name: 'ARDS',                 severity: 4, description: 'P/F <300. Lung-protective vent: Vt 6 mL/kg IBW, PEEP titration, prone >16 h/day.' },
      { name: 'Massive PE',           severity: 4, description: 'Hemo-instability → systemic thrombolytics or EKOS catheter. Anticoagulate.' },
      { name: 'Tension Pneumothorax', severity: 4, description: 'Needle decompression 2nd ICS MCL immediately, then chest tube.' },
      { name: 'Severe CAP',           severity: 3, description: 'CURB-65 ≥3 → ICU. Culture-guided antibiotics + corticosteroids.' },
      { name: 'COPD Exacerbation',    severity: 2, description: 'Bronchodilators, systemic steroids, O₂ titration SaO₂ 88–92%, NIV.' },
    ],
    sofaLabel: 'Respiratory SOFA (P/F ratio)',
    sofa: [
      { score: 1, criterion: 'P/F 300–400'           },
      { score: 2, criterion: 'P/F 200–300'           },
      { score: 3, criterion: 'P/F 100–200 + ventilated' },
      { score: 4, criterion: 'P/F <100 + ventilated'  },
    ],
  },
  {
    id: 'system', label: 'Full System', icon: '🫀', system: 'multisystem',
    color: '#10b981', accentHex: 'rgba(16,185,129,0.13)', model: 'system',
    description: 'Integrated SOFA-driven organ system view for real-time critical care multi-organ failure assessment.',
    anatomy: ['Heart', 'Brain', 'Lungs', 'Kidneys', 'Liver', 'GI tract', 'Bone marrow', 'Skin/barrier'],
    physiology: 'SOFA (Sequential Organ Failure Assessment) predicts ICU mortality. 6 domains × 0–4 = 24 max. ΔSOFA >2 = organ dysfunction (Sepsis-3). APACHE-II correlates mortality at >25%.',
    referenceValues: [
      { label: 'SOFA Total',         range: '0–5 = low risk',   critical: '>11 = >80% mortality', softCrit: false },
      { label: 'Lactate',            range: '<2 mmol/L',        critical: '>4 = septic shock',    softCrit: false },
      { label: 'Creatinine (Renal)', range: '<1.2 mg/dL',       critical: '>5.0',                 softCrit: false },
      { label: 'Bilirubin (Hepatic)',range: '<1.2 mg/dL',       critical: '>12',                  softCrit: false },
      { label: 'Platelets (Coag)',   range: '>150 ×10³/μL',     critical: '<20',                  softCrit: false },
    ],
    pathologies: [
      { name: 'Septic Shock',  severity: 4, description: 'Sepsis + vasopressors + Lactate >2. Hour-1 bundle: cultures, abx, IVF, pressors.' },
      { name: 'MODS',          severity: 4, description: 'Multi-organ dysfunction — SOFA >11. Simultaneous organ support and source control.' },
      { name: 'DIC',           severity: 4, description: 'Fibrinogen↓ + D-dimer↑ + PT↑. Treat trigger, replace factors with FFP/cryoprecipitate.' },
      { name: 'Severe Sepsis', severity: 3, description: 'qSOFA ≥2 + suspected infection. Early antibiotics within 1 hour.' },
    ],
    sofaLabel: 'Composite SOFA Score',
    sofa: [
      { score: '0–5',  criterion: 'Low risk (<10% mortality)'  },
      { score: '6–9',  criterion: 'Moderate risk (~20%)'       },
      { score: '10–12',criterion: 'High risk (~40%)'           },
      { score: '>12',  criterion: 'Critical (>80% mortality)'  },
    ],
  },
];

const SYSTEMS = [
  { id: 'all',            label: 'All',           icon: '⚕️' },
  { id: 'cardiovascular', label: 'Cardiovascular', icon: '❤️' },
  { id: 'neurological',   label: 'Neurological',  icon: '🧠' },
  { id: 'respiratory',    label: 'Respiratory',   icon: '🫁' },
  { id: 'multisystem',    label: 'Multisystem',   icon: '🫀' },
];

const SEV_COLOR = { 0:'#10b981', 1:'#f59e0b', 2:'#f97316', 3:'#ef4444', 4:'#dc2626' };
const SEV_LABEL = { 0:'Normal',  1:'Mild',    2:'Moderate', 3:'Severe', 4:'Critical' };

/* ─────────────────────────────────────────
   Shared material helper
───────────────────────────────────────── */
function M({ color, emissive, ei = 0.55, rough = 0.38, metal = 0.18, alpha = 1 }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive || color}
      emissiveIntensity={ei}
      roughness={rough}
      metalness={metal}
      transparent={alpha < 1}
      opacity={alpha}
    />
  );
}

/* ─────────────────────────────────────────
   Particle halo
───────────────────────────────────────── */
function Halo({ color, r = 2.4, count = 80 }) {
  const ref = useRef();
  const pos = useMemo(() => {
    const a = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const p = Math.random() * Math.PI;
      const d = r + (Math.random() - 0.5) * 1.0;
      a.push(d * Math.sin(p) * Math.cos(t), d * Math.cos(p), d * Math.sin(p) * Math.sin(t));
    }
    return new Float32Array(a);
  }, [count, r]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.16;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.045} transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

/* ─────────────────────────────────────────
   ❤️  HEART MESH — Anatomically detailed
   LV dominant, RV anterior crescent, 4 chambers,
   aortic arch, pulmonary trunk, coronary arteries
───────────────────────────────────────── */
function HeartMesh({ color, severity, heartbeat = 72 }) {
  const root = useRef();
  const bpHz = heartbeat / 60;

  const ladPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push(new THREE.Vector3(-0.06 + t * -0.05, 0.28 - t * 1.1, 0.26 - t * 0.04));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const cp = curve.getPoints(20);
    const arr = new Float32Array(cp.length * 3);
    cp.forEach((p, i) => { arr[i*3]=p.x; arr[i*3+1]=p.y; arr[i*3+2]=p.z; });
    return arr;
  }, []);

  const rcaPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const a = t * Math.PI * 1.15;
      pts.push(new THREE.Vector3(0.56 * Math.cos(a - 0.3), -0.1 - t * 0.52, 0.26 * Math.sin(a)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const cp = curve.getPoints(20);
    const arr = new Float32Array(cp.length * 3);
    cp.forEach((p, i) => { arr[i*3]=p.x; arr[i*3+1]=p.y; arr[i*3+2]=p.z; });
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!root.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * bpHz * Math.PI * 2) * (0.055 + severity * 0.018);
    root.current.scale.setScalar(pulse);
  });

  return (
    <group ref={root} rotation={[0, 0, 0.18]}>
      {/* Pericardium (translucent outer shell) */}
      <mesh scale={[1.20, 1.24, 1.14]}>
        <sphereGeometry args={[0.72, 20, 20]} />
        <M color={color} ei={0.06} rough={0.95} alpha={0.07} />
      </mesh>

      {/* Left ventricle (dominant, elongated, apex-forming) */}
      <mesh position={[-0.14, -0.06, -0.04]} scale={[0.96, 1.46, 0.94]} rotation={[0.12, 0, -0.14]}>
        <sphereGeometry args={[0.52, 40, 40]} />
        <M color={color} />
      </mesh>

      {/* LV apex (pointed cone, down-left) */}
      <mesh position={[-0.3, -0.78, 0.0]} rotation={[0.18, 0, -0.34]}>
        <coneGeometry args={[0.27, 0.54, 30]} />
        <M color={color} />
      </mesh>

      {/* Right ventricle (crescent, anterior-right, thinner wall) */}
      <mesh position={[0.34, 0.0, 0.16]} scale={[0.76, 1.1, 0.6]}>
        <sphereGeometry args={[0.47, 36, 36]} />
        <M color={color} ei={0.42} />
      </mesh>

      {/* Left atrium (posterior-superior) */}
      <mesh position={[-0.18, 0.58, -0.22]} scale={[0.9, 0.72, 1.06]}>
        <sphereGeometry args={[0.28, 28, 28]} />
        <M color={color} ei={0.38} />
      </mesh>

      {/* Right atrium (right-superior, slightly anterior) */}
      <mesh position={[0.44, 0.44, 0.0]} scale={[0.84, 0.7, 0.78]}>
        <sphereGeometry args={[0.32, 28, 28]} />
        <M color={color} ei={0.38} />
      </mesh>

      {/* Ascending aorta */}
      <mesh position={[0.06, 0.84, -0.05]} rotation={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.115, 0.135, 0.52, 20]} />
        <M color={color} rough={0.22} metal={0.42} ei={0.64} />
      </mesh>
      {/* Aortic arch segment 1 */}
      <mesh position={[0.18, 1.06, -0.02]} rotation={[0, 0, 0.7]}>
        <cylinderGeometry args={[0.10, 0.115, 0.36, 18]} />
        <M color={color} rough={0.22} metal={0.42} ei={0.64} />
      </mesh>
      {/* Aortic arch top */}
      <mesh position={[0.38, 1.13, 0.0]} rotation={[0, 0, 1.32]}>
        <cylinderGeometry args={[0.095, 0.10, 0.28, 16]} />
        <M color={color} rough={0.22} metal={0.42} ei={0.64} />
      </mesh>
      {/* Brachiocephalic trunk */}
      <mesh position={[0.22, 1.14, 0.0]} rotation={[0.1, 0, -0.52]}>
        <cylinderGeometry args={[0.044, 0.055, 0.22, 12]} />
        <M color={color} rough={0.26} metal={0.36} ei={0.52} />
      </mesh>

      {/* Pulmonary trunk */}
      <mesh position={[0.24, 0.76, 0.16]} rotation={[-0.2, 0.1, 0.36]}>
        <cylinderGeometry args={[0.09, 0.11, 0.46, 18]} />
        <M color={color} rough={0.22} metal={0.38} ei={0.58} />
      </mesh>
      {/* Left pulmonary artery */}
      <mesh position={[0.08, 0.93, 0.18]} rotation={[0, 0.5, 0.82]}>
        <cylinderGeometry args={[0.054, 0.068, 0.28, 14]} />
        <M color={color} rough={0.22} metal={0.36} ei={0.55} />
      </mesh>
      {/* Right pulmonary artery */}
      <mesh position={[0.42, 0.89, 0.14]} rotation={[0, -0.4, -0.56]}>
        <cylinderGeometry args={[0.054, 0.068, 0.28, 14]} />
        <M color={color} rough={0.22} metal={0.36} ei={0.55} />
      </mesh>

      {/* Superior vena cava */}
      <mesh position={[0.5, 0.84, 0.0]} rotation={[0, 0, -0.12]}>
        <cylinderGeometry args={[0.07, 0.08, 0.4, 14]} />
        <M color={color} rough={0.28} metal={0.3} ei={0.46} />
      </mesh>
      {/* Inferior vena cava */}
      <mesh position={[0.46, -0.42, 0.0]} rotation={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.065, 0.075, 0.3, 12]} />
        <M color={color} rough={0.28} metal={0.3} ei={0.46} />
      </mesh>

      {/* LAD coronary artery (line) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ladPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.72} transparent />
      </line>
      {/* RCA coronary artery (line) */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rcaPoints, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.62} transparent />
      </line>

      {/* Pulmonary veins (4 entering LA from posterior) */}
      {[[-0.36, 0.52, -0.32], [-0.08, 0.54, -0.36], [-0.28, 0.67, -0.32], [-0.06, 0.69, -0.38]].map((p, i) => (
        <mesh key={i} position={p} rotation={[0.42, i % 2 === 0 ? 0.32 : -0.32, 0]}>
          <cylinderGeometry args={[0.03, 0.037, 0.18, 10]} />
          <M color={color} rough={0.3} metal={0.28} ei={0.42} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────
   🧠  BRAIN MESH — Lobe-based with gyri
   Gyri simulated using half-arc torus rings
   Cerebellum with folia, 3-segment brainstem
───────────────────────────────────────── */
function BrainMesh({ color, severity }) {
  const root = useRef();

  const gyriL = useMemo(() => {
    const rings = [];
    const rows = [
      { y: 0.54, r: 0.46, n: 5, tilt: 0.0  },
      { y: 0.28, r: 0.64, n: 6, tilt: 0.08 },
      { y: 0.04, r: 0.71, n: 7, tilt: 0.12 },
      { y:-0.22, r: 0.64, n: 6, tilt: 0.17 },
      { y:-0.46, r: 0.52, n: 5, tilt: 0.22 },
    ];
    rows.forEach(({ y, r, n, tilt }) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n - 0.5) * Math.PI * 0.84;
        rings.push({
          x: -0.44 + r * Math.sin(a) * 0.88,
          y,
          z: r * Math.cos(a) * 0.68,
          ry: a + tilt,
          piece: i,
        });
      }
    });
    return rings;
  }, []);

  const gyriR = useMemo(() => gyriL.map(g => ({ ...g, x: -(g.x - 0.44) + 0.44 })), [gyriL]);

  useFrame(({ clock }) => {
    if (root.current) root.current.rotation.y = clock.getElapsedTime() * 0.2;
  });

  return (
    <group ref={root}>
      {/* Left hemisphere */}
      <mesh position={[-0.44, 0.04, 0]} scale={[0.88, 0.82, 0.96]}>
        <sphereGeometry args={[0.78, 36, 36]} />
        <M color={color} rough={0.84} metal={0.04} ei={0.3} />
      </mesh>
      {/* Right hemisphere */}
      <mesh position={[0.44, 0.04, 0]} scale={[0.84, 0.79, 0.93]}>
        <sphereGeometry args={[0.78, 36, 36]} />
        <M color={color} rough={0.84} metal={0.04} ei={0.3} />
      </mesh>
      {/* Longitudinal fissure (dark gap) */}
      <mesh position={[0, 0.3, 0]} scale={[0.09, 0.88, 0.72]}>
        <sphereGeometry args={[0.78, 12, 12]} />
        <meshStandardMaterial color="#05080e" roughness={1} />
      </mesh>

      {/* Left gyri */}
      {gyriL.map((g, i) => (
        <mesh key={`gl-${i}`} position={[g.x, g.y, g.z]}
          rotation={[0.1 + g.piece * 0.03, g.ry, Math.PI * 0.5]}>
          <torusGeometry args={[0.07, 0.027, 8, 14, Math.PI * 0.9]} />
          <M color={color} rough={0.76} metal={0.03} ei={0.52} />
        </mesh>
      ))}
      {/* Right gyri */}
      {gyriR.map((g, i) => (
        <mesh key={`gr-${i}`} position={[g.x, g.y, g.z]}
          rotation={[0.1 + g.piece * 0.03, g.ry + Math.PI, Math.PI * 0.5]}>
          <torusGeometry args={[0.07, 0.027, 8, 14, Math.PI * 0.9]} />
          <M color={color} rough={0.76} metal={0.03} ei={0.52} />
        </mesh>
      ))}

      {/* Temporal lobe left */}
      <mesh position={[-0.86, -0.28, 0.2]} scale={[0.52, 0.62, 0.58]} rotation={[0.1, 0.3, 0.18]}>
        <sphereGeometry args={[0.62, 26, 26]} />
        <M color={color} rough={0.83} metal={0.04} ei={0.32} />
      </mesh>
      {/* Temporal lobe right */}
      <mesh position={[0.86, -0.28, 0.2]} scale={[0.52, 0.62, 0.58]} rotation={[0.1, -0.3, -0.18]}>
        <sphereGeometry args={[0.62, 26, 26]} />
        <M color={color} rough={0.83} metal={0.04} ei={0.32} />
      </mesh>

      {/* Occipital lobe protrusion (posterior) */}
      <mesh position={[0, -0.15, -0.72]} scale={[0.72, 0.6, 0.5]}>
        <sphereGeometry args={[0.62, 24, 24]} />
        <M color={color} rough={0.82} metal={0.04} ei={0.3} />
      </mesh>

      {/* Cerebellum left lobe */}
      <mesh position={[-0.22, -0.84, -0.32]} scale={[0.7, 0.44, 0.62]}>
        <sphereGeometry args={[0.56, 28, 28]} />
        <M color={color} rough={0.9} metal={0.04} ei={0.27} />
      </mesh>
      {/* Cerebellum right lobe */}
      <mesh position={[0.22, -0.84, -0.32]} scale={[0.7, 0.44, 0.62]}>
        <sphereGeometry args={[0.56, 28, 28]} />
        <M color={color} rough={0.9} metal={0.04} ei={0.27} />
      </mesh>
      {/* Cerebellar folia rings */}
      {[-0.73, -0.82, -0.9, -0.97].map((y, i) => (
        <mesh key={`cf-${i}`} position={[0, y, -0.28]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.3 - i * 0.02, 0.022, 6, 20]} />
          <M color={color} rough={0.86} metal={0.03} ei={0.38} />
        </mesh>
      ))}

      {/* Brainstem: midbrain */}
      <mesh position={[0, -1.08, -0.12]} rotation={[0.28, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.14, 0.3, 16]} />
        <M color={color} rough={0.72} metal={0.04} ei={0.35} />
      </mesh>
      {/* Pons (wider) */}
      <mesh position={[0, -1.26, -0.07]} rotation={[0.22, 0, 0]} scale={[1, 0.76, 0.9]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <M color={color} rough={0.74} metal={0.04} ei={0.35} />
      </mesh>
      {/* Medulla oblongata */}
      <mesh position={[0, -1.44, -0.04]} rotation={[0.18, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.10, 0.28, 14]} />
        <M color={color} rough={0.72} metal={0.04} ei={0.32} />
      </mesh>

      {/* Corpus callosum (bridge, mid-sagittal) */}
      <mesh position={[0, 0.38, 0]} scale={[0.24, 0.34, 0.78]}>
        <sphereGeometry args={[0.72, 12, 12]} />
        <M color={color} rough={0.7} metal={0.04} ei={0.28} alpha={0.82} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────
   🫁  LUNGS MESH — Right 3-lobe, Left 2-lobe
   Bronchial tree, fissures, tracheal rings
   Cardiac notch on left lung
───────────────────────────────────────── */
function LungsMesh({ color, severity }) {
  const leftRef  = useRef();
  const rightRef = useRef();

  useFrame(({ clock }) => {
    const breathe = 1 + Math.sin(clock.getElapsedTime() * 0.88 * Math.PI) * (0.065 + severity * 0.012);
    if (leftRef.current)  leftRef.current.scale.setScalar(breathe);
    if (rightRef.current) rightRef.current.scale.setScalar(breathe);
  });

  return (
    <group>
      {/* ══ RIGHT LUNG (3 lobes) ══ */}
      <group ref={rightRef} position={[0.68, 0.04, 0]}>
        {/* RUL — right upper lobe */}
        <mesh position={[0.06, 0.82, 0.02]} scale={[0.58, 0.78, 0.5]} rotation={[0, 0, 0.12]}>
          <sphereGeometry args={[0.58, 28, 28]} />
          <M color={color} alpha={0.93} />
        </mesh>
        <mesh position={[0.05, 1.32, 0.0]} scale={[0.38, 0.44, 0.34]}>
          <sphereGeometry args={[0.48, 20, 20]} />
          <M color={color} alpha={0.88} />
        </mesh>
        {/* RML — right middle lobe (small, anterior) */}
        <mesh position={[-0.04, 0.22, 0.16]} scale={[0.6, 0.52, 0.44]}>
          <sphereGeometry args={[0.48, 24, 24]} />
          <M color={color} alpha={0.9} ei={0.48} />
        </mesh>
        {/* RLL — right lower lobe (large posterior) */}
        <mesh position={[0.02, -0.52, -0.12]} scale={[0.68, 0.94, 0.62]}>
          <sphereGeometry args={[0.62, 30, 30]} />
          <M color={color} alpha={0.92} ei={0.5} />
        </mesh>
        <mesh position={[0.0, -0.96, -0.1]} scale={[0.55, 0.58, 0.5]}>
          <sphereGeometry args={[0.52, 22, 22]} />
          <M color={color} alpha={0.88} />
        </mesh>
        {/* Horizontal fissure (RUL/RML boundary) */}
        <mesh position={[0, 0.5, 0.12]} scale={[0.5, 0.03, 0.4]}>
          <boxGeometry />
          <meshStandardMaterial color="#061018" roughness={1} transparent opacity={0.7} />
        </mesh>
        {/* Oblique fissure (RML+RUL / RLL boundary) */}
        <mesh position={[0, -0.08, 0.02]} scale={[0.52, 0.03, 0.52]} rotation={[0.56, 0, 0]}>
          <boxGeometry />
          <meshStandardMaterial color="#061018" roughness={1} transparent opacity={0.65} />
        </mesh>
        {/* Pleura outer (pale translucent) */}
        <mesh scale={[0.72, 1.35, 0.66]}>
          <sphereGeometry args={[0.78, 16, 16]} />
          <M color={color} rough={0.9} alpha={0.06} ei={0.1} />
        </mesh>
        {/* Hilum (medial) */}
        <mesh position={[-0.38, 0.22, 0.0]} scale={[0.12, 0.3, 0.2]}>
          <sphereGeometry args={[0.54, 14, 14]} />
          <M color={color} ei={0.78} rough={0.38} metal={0.32} />
        </mesh>
        {/* R main bronchus */}
        <mesh position={[-0.26, 0.36, 0.0]} rotation={[0, 0, 0.44]}>
          <cylinderGeometry args={[0.052, 0.06, 0.32, 12]} />
          <M color={color} rough={0.3} metal={0.26} ei={0.62} />
        </mesh>
      </group>

      {/* ══ LEFT LUNG (2 lobes + cardiac notch) ══ */}
      <group ref={leftRef} position={[-0.68, 0.04, 0]}>
        {/* LUL (includes lingula inferiorly) */}
        <mesh position={[-0.04, 0.52, 0.04]} scale={[0.6, 1.06, 0.5]}>
          <sphereGeometry args={[0.62, 30, 30]} />
          <M color={color} alpha={0.93} />
        </mesh>
        <mesh position={[-0.06, 1.28, 0.0]} scale={[0.4, 0.46, 0.36]}>
          <sphereGeometry args={[0.48, 20, 20]} />
          <M color={color} alpha={0.88} />
        </mesh>
        {/* Lingula (inferior tongue of LUL) */}
        <mesh position={[0.14, -0.08, 0.14]} scale={[0.38, 0.52, 0.36]} rotation={[0.1, 0, -0.18]}>
          <sphereGeometry args={[0.46, 22, 22]} />
          <M color={color} alpha={0.88} ei={0.45} />
        </mesh>
        {/* LLL */}
        <mesh position={[-0.02, -0.56, -0.12]} scale={[0.64, 0.9, 0.6]}>
          <sphereGeometry args={[0.6, 28, 28]} />
          <M color={color} alpha={0.92} ei={0.5} />
        </mesh>
        <mesh position={[0.0, -0.98, -0.1]} scale={[0.52, 0.56, 0.48]}>
          <sphereGeometry args={[0.5, 20, 20]} />
          <M color={color} alpha={0.87} />
        </mesh>
        {/* Cardiac notch (concavity right/medial) */}
        <mesh position={[0.42, 0.04, 0.1]} scale={[0.22, 0.38, 0.28]}>
          <sphereGeometry args={[0.58, 14, 14]} />
          <meshStandardMaterial color="#061018" roughness={1} transparent opacity={0.78} />
        </mesh>
        {/* Oblique fissure */}
        <mesh position={[0, -0.04, 0.06]} scale={[0.54, 0.03, 0.52]} rotation={[0.48, 0, 0]}>
          <boxGeometry />
          <meshStandardMaterial color="#061018" roughness={1} transparent opacity={0.62} />
        </mesh>
        {/* Pleura */}
        <mesh scale={[0.68, 1.3, 0.62]}>
          <sphereGeometry args={[0.78, 16, 16]} />
          <M color={color} rough={0.9} alpha={0.06} ei={0.1} />
        </mesh>
        {/* Hilum */}
        <mesh position={[0.36, 0.22, 0.0]} scale={[0.12, 0.28, 0.18]}>
          <sphereGeometry args={[0.54, 14, 14]} />
          <M color={color} ei={0.78} rough={0.38} metal={0.32} />
        </mesh>
        {/* L main bronchus */}
        <mesh position={[0.24, 0.38, 0.0]} rotation={[0, 0, -0.42]}>
          <cylinderGeometry args={[0.046, 0.056, 0.36, 12]} />
          <M color={color} rough={0.3} metal={0.26} ei={0.62} />
        </mesh>
      </group>

      {/* ══ TRACHEA & BIFURCATION ══ */}
      <mesh position={[0, 1.2, -0.06]}>
        <cylinderGeometry args={[0.076, 0.086, 0.6, 16]} />
        <M color={color} rough={0.28} metal={0.3} ei={0.66} />
      </mesh>
      {[1.08, 1.18, 1.28, 1.38, 1.46].map((y, i) => (
        <mesh key={`tr-${i}`} position={[0, y, -0.06]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.083, 0.018, 6, 14]} />
          <M color={color} rough={0.32} metal={0.25} ei={0.55} />
        </mesh>
      ))}
      {/* Carina */}
      <mesh position={[0, 0.93, -0.04]} scale={[0.85, 0.55, 0.7]}>
        <sphereGeometry args={[0.14, 14, 14]} />
        <M color={color} rough={0.28} metal={0.3} ei={0.62} />
      </mesh>
      {/* R main bronchus */}
      <mesh position={[0.3, 0.76, -0.02]} rotation={[0, 0, 0.52]}>
        <cylinderGeometry args={[0.056, 0.066, 0.38, 14]} />
        <M color={color} rough={0.3} metal={0.28} ei={0.62} />
      </mesh>
      {/* L main bronchus (longer) */}
      <mesh position={[-0.32, 0.74, -0.02]} rotation={[0, 0, -0.52]}>
        <cylinderGeometry args={[0.048, 0.058, 0.44, 14]} />
        <M color={color} rough={0.3} metal={0.28} ei={0.62} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────
   🫀  FULL SYSTEM — all organs + kidney + liver
───────────────────────────────────────── */
function SystemMesh({ severity }) {
  const bpHz   = (60 + severity * 12) / 60;
  const heartR = useRef();
  const leftL  = useRef();
  const rightL = useRef();
  const brainR = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse  = 1 + Math.sin(t * bpHz * Math.PI * 2) * 0.052;
    const breath = 1 + Math.sin(t * 0.88 * Math.PI) * 0.062;
    if (heartR.current)  heartR.current.scale.setScalar(pulse);
    if (leftL.current)   leftL.current.scale.setScalar(breath);
    if (rightL.current)  rightL.current.scale.setScalar(breath);
    if (brainR.current)  brainR.current.rotation.y = t * 0.14;
  });

  const hc  = SEV_COLOR[severity];
  const bc  = '#a855f7';
  const lc  = '#38bdf8';
  const kc  = '#f97316';
  const livc = '#84cc16';

  return (
    <group scale={0.66}>
      {/* Brain */}
      <group ref={brainR} position={[0, 2.35, 0]}>
        <mesh position={[-0.44, 0.04, 0]} scale={[0.88, 0.8, 0.95]}>
          <sphereGeometry args={[0.78, 30, 30]} />
          <M color={bc} rough={0.83} ei={0.34} />
        </mesh>
        <mesh position={[0.44, 0.04, 0]} scale={[0.84, 0.77, 0.93]}>
          <sphereGeometry args={[0.78, 30, 30]} />
          <M color={bc} rough={0.83} ei={0.34} />
        </mesh>
        {/* Mini gyri on system view */}
        {[-0.44, 0.44].map((x, si) =>
          [-0.1, 0.2, 0.46].map((y, ri) => (
            <mesh key={`sg-${si}-${ri}`}
              position={[x + (si === 0 ? 0.1 : -0.1), y, 0.68]}
              rotation={[0.15, si === 0 ? 0.32 : -0.32, Math.PI * 0.5]}>
              <torusGeometry args={[0.065, 0.022, 6, 12, Math.PI * 0.88]} />
              <M color={bc} rough={0.76} ei={0.44} />
            </mesh>
          ))
        )}
        <mesh position={[0, -0.83, -0.3]} scale={[0.9, 0.44, 0.56]}>
          <sphereGeometry args={[0.52, 22, 22]} />
          <M color={bc} rough={0.9} ei={0.27} />
        </mesh>
        <mesh position={[0, -1.05, -0.1]} rotation={[0.28, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.11, 0.28, 14]} />
          <M color={bc} rough={0.72} ei={0.3} />
        </mesh>
      </group>

      {/* Lungs */}
      <group ref={rightL} position={[0.7, 0.16, 0]}>
        <mesh scale={[0.6, 0.96, 0.48]}><sphereGeometry args={[0.62, 22, 22]} /><M color={lc} alpha={0.9} /></mesh>
        <mesh position={[0, -0.72, 0]} scale={[0.56, 0.7, 0.44]}><sphereGeometry args={[0.58, 18, 18]} /><M color={lc} alpha={0.86} /></mesh>
      </group>
      <group ref={leftL} position={[-0.7, 0.16, 0]}>
        <mesh scale={[0.58, 0.9, 0.46]}><sphereGeometry args={[0.62, 22, 22]} /><M color={lc} alpha={0.9} /></mesh>
        <mesh position={[0, -0.67, 0]} scale={[0.52, 0.68, 0.42]}><sphereGeometry args={[0.58, 18, 18]} /><M color={lc} alpha={0.86} /></mesh>
      </group>
      <mesh position={[0, 1.08, -0.04]}>
        <cylinderGeometry args={[0.073, 0.083, 0.52, 14]} />
        <M color={lc} rough={0.3} metal={0.26} ei={0.62} />
      </mesh>

      {/* Heart */}
      <group ref={heartR} position={[0, -1.82, 0]} rotation={[0, 0, 0.18]}>
        <mesh position={[-0.14, -0.06, -0.04]} scale={[0.96, 1.44, 0.94]}>
          <sphereGeometry args={[0.52, 30, 30]} />
          <M color={hc} />
        </mesh>
        <mesh position={[0.34, 0.0, 0.16]} scale={[0.76, 1.1, 0.6]}>
          <sphereGeometry args={[0.46, 26, 26]} />
          <M color={hc} ei={0.42} />
        </mesh>
        <mesh position={[-0.3, -0.78, 0.0]} rotation={[0.18, 0, -0.34]}>
          <coneGeometry args={[0.27, 0.54, 24]} />
          <M color={hc} />
        </mesh>
        <mesh position={[0.06, 0.84, -0.05]}>
          <cylinderGeometry args={[0.11, 0.13, 0.5, 16]} />
          <M color={hc} rough={0.22} metal={0.42} ei={0.64} />
        </mesh>
        <mesh position={[0.18, 1.06, -0.02]} rotation={[0, 0, 0.7]}>
          <cylinderGeometry args={[0.1, 0.115, 0.34, 16]} />
          <M color={hc} rough={0.22} metal={0.42} ei={0.64} />
        </mesh>
      </group>

      {/* Liver */}
      <mesh position={[0.62, -0.72, -0.08]} scale={[0.72, 0.44, 0.52]} rotation={[0, 0.15, -0.08]}>
        <sphereGeometry args={[0.62, 22, 22]} />
        <M color={livc} alpha={0.82} rough={0.7} ei={0.3} />
      </mesh>

      {/* Kidneys */}
      <mesh position={[0.42, -2.65, -0.18]} scale={[0.36, 0.52, 0.3]} rotation={[0, 0.1, 0.08]}>
        <sphereGeometry args={[0.52, 20, 20]} />
        <M color={kc} alpha={0.88} rough={0.65} ei={0.35} />
      </mesh>
      <mesh position={[-0.42, -2.7, -0.18]} scale={[0.36, 0.52, 0.3]} rotation={[0, -0.1, -0.08]}>
        <sphereGeometry args={[0.52, 20, 20]} />
        <M color={kc} alpha={0.88} rough={0.65} ei={0.35} />
      </mesh>

      {/* Spine */}
      <mesh position={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.055, 0.055, 5.6, 12]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.35} transparent opacity={0.38} />
      </mesh>
      {[-2.2, -1.6, -1.0, -0.4, 0.2, 0.8, 1.4, 2.0].map((y, i) => (
        <mesh key={`vd-${i}`} position={[0, y, -0.4]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.082, 0.027, 6, 12]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.24} transparent opacity={0.48} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────
   Scene wrapper
───────────────────────────────────────── */
function OrganScene({ organ, severity, autoRotate, showStars }) {
  const col = SEV_COLOR[severity] || organ.color;
  const hb  = 60 + severity * 12;

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[4.5, 4, 5]}     intensity={1.5}  color={organ.color} />
      <pointLight position={[-4, 2.5, -3.5]} intensity={1.0}  color="#00d4ff" />
      <pointLight position={[0, -4.5, 3.5]}  intensity={0.75} color="#818cf8" />
      <pointLight position={[0, 0, 6]}       intensity={0.4}  color="#fff" />

      {showStars && <Stars radius={40} depth={14} count={1000} factor={3.2} fade speed={0.3} />}
      <Halo color={organ.color} r={organ.model === 'system' ? 3.2 : 2.3} count={100} />

      <Suspense fallback={null}>
        {organ.model === 'heart'  && <HeartMesh  color={col} severity={severity} heartbeat={hb} />}
        {organ.model === 'brain'  && <BrainMesh  color={col} severity={severity} />}
        {organ.model === 'lungs'  && <LungsMesh  color={col} severity={severity} />}
        {organ.model === 'system' && <SystemMesh severity={severity} />}
      </Suspense>

      <OrbitControls
        enablePan={false} enableZoom enableRotate
        autoRotate={autoRotate} autoRotateSpeed={0.55}
        minDistance={organ.model === 'system' ? 4.5 : 2.5}
        maxDistance={organ.model === 'system' ? 18  : 11}
      />
    </>
  );
}

/* ─────────────────────────────────────────
   Severity badge
───────────────────────────────────────── */
function SevBadge({ level }) {
  return (
    <span className="cl-sev-badge"
      style={{ background: SEV_COLOR[level] + '22', color: SEV_COLOR[level], border: `1px solid ${SEV_COLOR[level]}55` }}>
      <span className="cl-sev-dot" style={{ background: SEV_COLOR[level] }} />
      {SEV_LABEL[level]}
    </span>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function ClinicalLibrary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search,     setSearch]     = useState('');
  const [sysFilter,  setSysFilter]  = useState('all');
  const [selected,   setSelected]   = useState(() => {
    const p = searchParams.get('organ');
    return ORGANS.find(o => o.id === p || o.model === p) || ORGANS[0];
  });
  const [severity,   setSeverity]   = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showStars,  setShowStars]  = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');

  useEffect(() => {
    const p = searchParams.get('organ');
    if (p) {
      const m = ORGANS.find(o => o.id === p || o.model === p);
      if (m) { setSelected(m); setSeverity(0); setActiveTab('overview'); }
    }
  }, [searchParams]);

  const filtered = useMemo(() =>
    ORGANS.filter(o =>
      (sysFilter === 'all' || o.system === sysFilter) &&
      o.label.toLowerCase().includes(search.toLowerCase())
    ), [sysFilter, search]);

  const switchOrgan = (o) => { setSelected(o); setSeverity(0); setActiveTab('overview'); };
  const idx    = ORGANS.findIndex(o => o.id === selected.id);
  const goPrev = () => switchOrgan(ORGANS[(idx - 1 + ORGANS.length) % ORGANS.length]);
  const goNext = () => switchOrgan(ORGANS[(idx + 1) % ORGANS.length]);

  return (
    <div className="cl-page">

      {/* ════════════════════════════════
          TOP BAR
      ════════════════════════════════ */}
      <header className="cl-topbar">
        {/* Left: back + brand */}
        <div className="cl-topbar-left">
          <button className="cl-back-btn" onClick={() => navigate(-1)} title="Go back">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
              <path d="M13 4L7 10L13 16" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="cl-brand">
            <span className="cl-brand-icon">⚕️</span>
            <span className="cl-brand-name">Clinical Library</span>
            <span className="cl-brand-tag">3D ATLAS</span>
          </div>
        </div>

        {/* Center: system filter tabs */}
        <nav className="cl-sys-tabs" aria-label="System filter">
          {SYSTEMS.map(s => (
            <button key={s.id}
              className={`cl-sys-tab${sysFilter === s.id ? ' active' : ''}`}
              onClick={() => setSysFilter(s.id)}>
              <span className="cl-sys-icon">{s.icon}</span>
              <span className="cl-sys-lbl">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* Right: search + controls */}
        <div className="cl-topbar-right">
          <div className="cl-search-wrap">
            <svg className="cl-search-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
              <circle cx="9" cy="9" r="6"/><path d="M15 15L20 20" strokeLinecap="round"/>
            </svg>
            <input className="cl-search" placeholder="Search organs…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={`cl-ctrl-btn${autoRotate ? ' on' : ''}`}
            onClick={() => setAutoRotate(r => !r)} title="Auto-rotate">↻</button>
          <button className={`cl-ctrl-btn${showStars ? ' on' : ''}`}
            onClick={() => setShowStars(s => !s)} title="Toggle stars">✦</button>
        </div>
      </header>

      {/* ════════════════════════════════
          BODY
      ════════════════════════════════ */}
      <div className="cl-body">

        {/* ──── LEFT: Organ Catalog ──── */}
        <aside className="cl-catalog">
          <div className="cl-catalog-hdr">
            <span>ATLAS</span>
            <span className="cl-catalog-count">{filtered.length}</span>
          </div>
          {filtered.length === 0
            ? <p className="cl-catalog-empty">No results</p>
            : filtered.map(organ => (
              <button key={organ.id}
                className={`cl-cat-item${selected.id === organ.id ? ' active' : ''}`}
                style={selected.id === organ.id ? { borderLeftColor: organ.color, background: organ.accentHex } : {}}
                onClick={() => switchOrgan(organ)}>
                <div className="cl-cat-icon" style={{ color: organ.color }}>{organ.icon}</div>
                <div className="cl-cat-meta">
                  <span className="cl-cat-name">{organ.label}</span>
                  <span className="cl-cat-sys">{organ.system}</span>
                </div>
                {selected.id === organ.id &&
                  <span className="cl-cat-active-dot" style={{ background: organ.color }} />}
              </button>
            ))
          }
        </aside>

        {/* ──── CENTER: 3D Viewer ──── */}
        <section className="cl-viewer">

          {/* Viewer header row */}
          <div className="cl-vhdr">
            <div className="cl-vhdr-id">
              <span className="cl-vhdr-name" style={{ color: selected.color }}>
                {selected.icon}&nbsp;{selected.label}
              </span>
              <span className="cl-vhdr-sys">{selected.system}</span>
            </div>

            {/* Severity row — always LTR */}
            <div className="cl-sev-row">
              <span className="cl-sev-label">SEVERITY</span>
              <div className="cl-sev-steps">
                {[0,1,2,3,4].map(s => (
                  <button key={s}
                    className={`cl-sev-step${severity === s ? ' active' : ''}`}
                    style={severity === s ? { background: SEV_COLOR[s], borderColor: SEV_COLOR[s], color:'#fff' } : {}}
                    onClick={() => setSeverity(s)} title={SEV_LABEL[s]}
                  >{s}</button>
                ))}
              </div>
              <SevBadge level={severity} />
            </div>
          </div>

          {/* Canvas area */}
          <div className="cl-canvas-wrap">
            <HolographicCanvas
              key={selected.model}
              ariaLabel={`3D ${selected.label}`}
              camera={selected.model === 'system'
                ? { position:[0,0,10], fov:52, near:0.1, far:90 }
                : { position:[0,0,5.2], fov:46, near:0.1, far:65 }}
              targetFps={60}
              style={{ width:'100%', height:'100%' }}
            >
              <OrganScene organ={selected} severity={severity}
                autoRotate={autoRotate} showStars={showStars} />
            </HolographicCanvas>

            {/* HUD chips */}
            <div className="cl-hud">
              <span className="cl-hud-chip"
                style={{ color: selected.color, borderColor: selected.color + '55' }}>
                ● Live 3D
              </span>
              {severity > 0 && (
                <span className="cl-hud-chip cl-hud-sev"
                  style={{ color: SEV_COLOR[severity], borderColor: SEV_COLOR[severity] + '55' }}>
                  ⚠ {SEV_LABEL[severity]}
                </span>
              )}
            </div>

            {/* Organ prev/next arrows */}
            <button className="cl-arrow cl-arrow-prev" onClick={goPrev} title="Previous">‹</button>
            <button className="cl-arrow cl-arrow-next" onClick={goNext} title="Next">›</button>

            {/* Pill switcher */}
            <div className="cl-pills">
              {ORGANS.map(organ => (
                <button key={organ.id}
                  className={`cl-pill${selected.id === organ.id ? ' active' : ''}`}
                  style={selected.id === organ.id
                    ? { background: organ.color + '2a', borderColor: organ.color, color: organ.color }
                    : {}}
                  onClick={() => switchOrgan(organ)}
                  title={organ.label}
                >
                  <span className="cl-pill-icon">{organ.icon}</span>
                  <span className="cl-pill-lbl">{organ.label}</span>
                  {selected.id === organ.id &&
                    <span className="cl-pill-dot" style={{ background: organ.color }} />}
                </button>
              ))}
            </div>

            <div className="cl-canvas-hint">Drag · Scroll · ‹ › switch organ</div>
          </div>
        </section>

        {/* ──── RIGHT: Info Panel ──── */}
        <aside className="cl-info">

          <div className="cl-info-hdr" style={{ background: selected.accentHex, borderBottomColor: selected.color + '44' }}>
            <span className="cl-info-icon">{selected.icon}</span>
            <div className="cl-info-hdr-text">
              <h2 className="cl-info-title" style={{ color: selected.color }}>{selected.label}</h2>
              <span className="cl-info-sys">{selected.system}</span>
            </div>
          </div>

          <div className="cl-tabs">
            {[['overview','Overview'],['refs','References'],['pathologies','Pathologies'],['sofa','SOFA']].map(([id, lbl]) => (
              <button key={id}
                className={`cl-tab${activeTab === id ? ' active' : ''}`}
                style={activeTab === id ? { borderBottomColor: selected.color, color: selected.color } : {}}
                onClick={() => setActiveTab(id)}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="cl-info-content">

            {activeTab === 'overview' && (
              <div className="cl-fade-in">
                <p className="cl-desc">{selected.description}</p>
                <div className="cl-sec-hdr">⚙️ Physiology</div>
                <p className="cl-phys">{selected.physiology}</p>
                <div className="cl-sec-hdr">🔬 Key Structures</div>
                <div className="cl-chips">
                  {selected.anatomy.map(a =>
                    <span key={a} className="cl-chip" style={{ borderColor: selected.color + '55' }}>{a}</span>)}
                </div>
              </div>
            )}

            {activeTab === 'refs' && (
              <div className="cl-fade-in">
                <p className="cl-hint">Normal ranges &amp; critical thresholds.</p>
                {selected.referenceValues.map(rv => (
                  <div key={rv.label} className="cl-ref-card">
                    <div className="cl-ref-name">{rv.label}</div>
                    <div className="cl-ref-row"><span className="cl-dot green" />Normal: {rv.range}</div>
                    <div className="cl-ref-row cl-ref-crit"><span className="cl-dot red" />Critical: {rv.critical}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pathologies' && (
              <div className="cl-fade-in">
                <p className="cl-hint">Click a condition to visualize severity on the 3D model.</p>
                {selected.pathologies.map(p => (
                  <div key={p.name}
                    className={`cl-path${severity === p.severity ? ' active' : ''}`}
                    style={severity === p.severity
                      ? { borderColor: SEV_COLOR[p.severity], background: SEV_COLOR[p.severity] + '12' }
                      : {}}
                    onClick={() => setSeverity(p.severity)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSeverity(p.severity)}>
                    <div className="cl-path-top">
                      <span className="cl-path-name">{p.name}</span>
                      <SevBadge level={p.severity} />
                    </div>
                    <p className="cl-path-desc">{p.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sofa' && (
              <div className="cl-fade-in">
                <div className="cl-sofa-title">{selected.sofaLabel}</div>
                <p className="cl-hint">SOFA sub-score criteria</p>
                <div className="cl-sofa-tbl">
                  <div className="cl-sofa-row cl-sofa-head">
                    <span>Score</span><span>Criterion</span>
                  </div>
                  {selected.sofa.map((row, i) => (
                    <div key={i}
                      className={`cl-sofa-row${severity === row.score ? ' active' : ''}`}
                      style={{ background: severity === row.score
                        ? (SEV_COLOR[row.score] || SEV_COLOR[2]) + '1c' : 'transparent' }}>
                      <span className="cl-sofa-score"
                        style={{ color: SEV_COLOR[row.score] || SEV_COLOR[2] }}>{row.score}</span>
                      <span className="cl-sofa-crit">{row.criterion}</span>
                    </div>
                  ))}
                </div>
                <p className="cl-sofa-note">{selected.physiology}</p>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
