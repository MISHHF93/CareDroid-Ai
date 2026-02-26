/**
 * ClinicalLibrary — Holographic 3D Clinical Atlas
 * Revamped: detailed anatomical organ models, back navigation, clean layout.
 */

import React, { useState, Suspense, useMemo, useRef, useEffect } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as THREE from 'three';
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

/* ─────────────────────────────────────────────────────────────
   ❤️  HEART MESH — Blueprint v3  (per HEART_3D_BLUEPRINT.md)
   ─────────────────────────────────────────────────────────────
   Chambers    : LV (body + apex + free-wall + trabeculae +
                 2 papillary muscles) • RV (body + infundibulum)
                 LA (body + LAA) • RA (body + RAA)
   Valves      : mitral • aortic • tricuspid • pulmonary annuli
                 + fibrous skeleton
   Great vessels: full aortic arch (TubeGeometry CatmullRom) +
                 aortic root sinus • brachiocephalic •
                 L carotid • L subclavian •
                 pulmonary trunk + L/R PA •
                 SVC + IVC • 4 pulmonary veins
   Coronaries  : LMCA stub • LAD + D1 + D2 + 3 septal perfs •
                 LCx + OM1 •
                 RCA + RV marginal + SA nodal artery
   Extras      : pericardium shell • epicardial fat grooves
   Animation   : two-phase systole/diastole heartbeat
──────────────────────────────────────────────────────────────── */
function HeartMesh({ color, severity, heartbeat = 72 }) {
  const root = useRef();
  const bpHz = heartbeat / 60;

  /* ════════════════════════════════════════
     VESSEL CURVES  (all CatmullRomCurve3)
  ════════════════════════════════════════ */

  /* ── Aorta: root → ascending → arch → descending stub ── */
  const aortaCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.04,  0.56, -0.02),  // aortic root (above valve)
    new THREE.Vector3( 0.06,  0.80,  0.00),  // ascending mid
    new THREE.Vector3( 0.08,  1.02,  0.02),  // ascending top
    new THREE.Vector3( 0.20,  1.16,  0.02),  // arch begins
    new THREE.Vector3( 0.36,  1.22,  0.01),  // arch apex
    new THREE.Vector3( 0.52,  1.16, -0.02),  // arch descends
    new THREE.Vector3( 0.58,  0.98, -0.06),  // descending start
    new THREE.Vector3( 0.54,  0.74, -0.10),  // descending stub
  ]), []);

  /* ── Pulmonary trunk ── */
  const ptCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.26,  0.62,  0.14),  // pulmonary valve
    new THREE.Vector3( 0.22,  0.82,  0.16),  // trunk mid
    new THREE.Vector3( 0.12,  0.97,  0.18),  // bifurcation
  ]), []);

  /* ── Left / Right pulmonary arteries ── */
  const lPACurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.12,  0.97,  0.18),
    new THREE.Vector3(-0.04,  0.96,  0.18),
    new THREE.Vector3(-0.26,  0.93,  0.15),
  ]), []);
  const rPACurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.12,  0.97,  0.18),
    new THREE.Vector3( 0.30,  0.94,  0.15),
    new THREE.Vector3( 0.52,  0.91,  0.12),
  ]), []);

  /* ── SVC ── */
  const svcCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.52,  0.62,  0.02),
    new THREE.Vector3( 0.54,  0.90,  0.00),
    new THREE.Vector3( 0.52,  1.16, -0.02),
  ]), []);

  /* ══════════════════════════════════
     CORONARY ARTERIES
  ══════════════════════════════════ */

  /* LAD – anterior interventricular groove */
  const ladCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04,  0.52,  0.28),  // LMCA bifurcation
    new THREE.Vector3(-0.06,  0.30,  0.32),  // proximal LAD
    new THREE.Vector3(-0.08,  0.04,  0.30),  // mid LAD
    new THREE.Vector3(-0.10, -0.22,  0.26),  // distal LAD
    new THREE.Vector3(-0.14, -0.50,  0.18),  // LAD wraps apex
    new THREE.Vector3(-0.20, -0.72,  0.08),  // apical
    new THREE.Vector3(-0.28, -0.84, -0.04),  // apex (may wrap)
  ]), []);

  /* LAD – Diagonal 1 */
  const d1Curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06,  0.18,  0.30),
    new THREE.Vector3(-0.20,  0.06,  0.26),
    new THREE.Vector3(-0.34, -0.06,  0.20),
  ]), []);

  /* LAD – Diagonal 2 */
  const d2Curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, -0.04,  0.28),
    new THREE.Vector3(-0.22, -0.16,  0.24),
    new THREE.Vector3(-0.36, -0.24,  0.18),
  ]), []);

  /* LCx – left atrioventricular groove */
  const cxCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04,  0.52,  0.20),  // LMCA bifurcation
    new THREE.Vector3(-0.16,  0.48,  0.10),
    new THREE.Vector3(-0.30,  0.38, -0.04),
    new THREE.Vector3(-0.42,  0.22, -0.16),
    new THREE.Vector3(-0.44,  0.02, -0.22),
  ]), []);

  /* LCx – Obtuse Marginal 1 */
  const om1Curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22,  0.42,  0.06),
    new THREE.Vector3(-0.36,  0.30,  0.00),
    new THREE.Vector3(-0.46,  0.14, -0.08),
  ]), []);

  /* RCA – right atrioventricular groove → PDA */
  const rcaCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.04,  0.52,  0.22),  // right coronary sinus
    new THREE.Vector3( 0.28,  0.44,  0.16),  // proximal RCA
    new THREE.Vector3( 0.46,  0.28,  0.06),  // acute margin
    new THREE.Vector3( 0.52,  0.04, -0.04),  // mid RCA
    new THREE.Vector3( 0.48, -0.22, -0.12),  // distal RCA
    new THREE.Vector3( 0.36, -0.48, -0.14),  // crux / PDA origin
    new THREE.Vector3( 0.18, -0.64, -0.08),  // posterior descending
  ]), []);

  /* RCA – RV marginal branch */
  const rvmCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.46,  0.24,  0.08),
    new THREE.Vector3( 0.52,  0.06,  0.14),
    new THREE.Vector3( 0.50, -0.14,  0.18),
  ]), []);

  /* RCA – SA nodal artery (back toward SVC–RA junction) */
  const sanCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.22,  0.48,  0.14),
    new THREE.Vector3( 0.30,  0.60,  0.06),
    new THREE.Vector3( 0.38,  0.74, -0.02),
  ]), []);

  /* ══════════════════════════════════
     HEARTBEAT — two-phase systole/diastole
  ══════════════════════════════════ */
  useFrame(({ clock }) => {
    if (!root.current) return;
    const phase = (clock.getElapsedTime() * bpHz) % 1;
    /* quick systolic contraction (0–35%), passive diastolic filling (35–100%) */
    const systole = phase < 0.35
      ? Math.sin((phase / 0.35) * Math.PI) * (0.07 + severity * 0.022)
      : 0;
    root.current.scale.setScalar(1 + systole);
  });

  /* ── Material shorthands (per blueprint §9) ── */
  const LV_COL   = '#b83232';   // thick LV myocardium
  const LV_DARK  = '#aa2828';   // papillary / trabecular
  const RV_COL   = '#cc5050';   // thinner RV wall
  const ATR_COL  = '#cc4444';   // atrial walls
  const AORTA_C  = '#ef4444';   // arterial red
  const VEIN_C   = '#7bb8ff';   // venous / pulmonary blue
  const COR_C    = '#ffaa44';   // coronary gold-orange
  const VALVE_C  = '#ffd580';   // valve annuli ivory-gold
  const FAT_C    = '#f5e6a3';   // epicardial fat (pale yellow)

  return (
    <group ref={root} rotation={[0.06, 0, 0.22]}>

      {/* ══════════════════════════════════════════
          PERICARDIUM  (outermost translucent sac)
      ══════════════════════════════════════════ */}
      <mesh scale={[1.22, 1.26, 1.16]}>
        <sphereGeometry args={[0.74, 24, 24]} />
        <meshStandardMaterial
          color={AORTA_C} emissive={AORTA_C} emissiveIntensity={0.04}
          roughness={0.98} metalness={0.0} transparent opacity={0.06} />
      </mesh>

      {/* ══════════════════════════════════════════
          LEFT VENTRICLE  (dominant chamber)
      ══════════════════════════════════════════ */}
      {/* Body – elongated oblate sphere */}
      <mesh position={[-0.12, -0.04, -0.02]} scale={[1.0, 1.52, 0.96]} rotation={[0.10, 0, -0.12]}>
        <sphereGeometry args={[0.50, 56, 56]} />
        <M color={LV_COL} ei={0.62} rough={0.44} metal={0.12} />
      </mesh>
      {/* Apex – pointed cone, angled inferior-left */}
      <mesh position={[-0.28, -0.76, 0.02]} rotation={[0.16, 0, -0.30]}>
        <coneGeometry args={[0.24, 0.48, 36]} />
        <M color={LV_COL} ei={0.58} rough={0.46} metal={0.12} />
      </mesh>
      {/* LV free wall lateral thickening (8–12 mm) */}
      <mesh position={[-0.40, -0.10, 0.12]} scale={[0.46, 0.88, 0.52]}>
        <sphereGeometry args={[0.42, 22, 22]} />
        <M color={'#b03030'} ei={0.48} rough={0.50} metal={0.12} />
      </mesh>
      {/* Interventricular septum (subtle bulge toward RV) */}
      <mesh position={[0.06, -0.18, 0.04]} scale={[0.18, 0.96, 0.68]}>
        <sphereGeometry args={[0.46, 16, 16]} />
        <M color={'#9e2a2a'} ei={0.44} rough={0.52} metal={0.10} alpha={0.90} />
      </mesh>
      {/* Papillary muscle — anterior (posteromedial) */}
      <mesh position={[-0.20, -0.44, 0.18]} rotation={[0.30, 0, -0.20]}>
        <cylinderGeometry args={[0.055, 0.072, 0.26, 14]} />
        <M color={LV_DARK} ei={0.52} rough={0.55} metal={0.12} />
      </mesh>
      {/* Papillary muscle – posterolateral */}
      <mesh position={[-0.28, -0.38, -0.16]} rotation={[-0.30, 0, -0.15]}>
        <cylinderGeometry args={[0.050, 0.066, 0.24, 14]} />
        <M color={LV_DARK} ei={0.52} rough={0.55} metal={0.12} />
      </mesh>
      {/* Trabeculae carnae – three partial torus ridges */}
      {[
        { y: 0.12, rr: 0.16, ry: 0.0 },
        { y: 0.26, rr: 0.14, ry: 0.4 },
        { y: 0.40, rr: 0.12, ry: 0.8 },
      ].map(({ y, rr, ry }, i) => (
        <mesh key={`tc-${i}`} position={[-0.18, -y, 0.24]} rotation={[0.20, ry, i * 0.28]}>
          <torusGeometry args={[rr, 0.018, 5, 11, Math.PI * 0.72]} />
          <M color={'#992424'} ei={0.44} rough={0.60} metal={0.10} />
        </mesh>
      ))}
      {/* Mitral valve annulus (bicuspid, LA→LV) */}
      <mesh position={[-0.12, 0.38, 0.04]} rotation={[0.20, 0, 0.12]}>
        <torusGeometry args={[0.18, 0.024, 9, 26]} />
        <M color={VALVE_C} ei={0.75} rough={0.28} metal={0.22} />
      </mesh>

      {/* ══════════════════════════════════════════
          RIGHT VENTRICLE  (crescent, anterior)
      ══════════════════════════════════════════ */}
      {/* Body – scaled sphere wrapping LV anteriorly */}
      <mesh position={[0.32, 0.04, 0.18]} scale={[0.72, 1.08, 0.58]}>
        <sphereGeometry args={[0.46, 40, 40]} />
        <M color={RV_COL} ei={0.46} rough={0.46} metal={0.10} />
      </mesh>
      {/* Infundibulum (outflow tract) – smooth funnel to pulmonary valve */}
      <mesh position={[0.26, 0.46, 0.22]} rotation={[-0.30, 0.10, 0.28]} scale={[0.72, 1.0, 0.62]}>
        <cylinderGeometry args={[0.12, 0.18, 0.42, 18]} />
        <M color={RV_COL} ei={0.44} rough={0.48} metal={0.10} />
      </mesh>
      {/* RV moderator band (septal end → free wall — distinguishing anatomical landmark) */}
      <mesh position={[0.22, -0.10, 0.20]} rotation={[0.40, 0.30, -0.30]}>
        <cylinderGeometry args={[0.022, 0.028, 0.28, 8]} />
        <M color={'#bb4040'} ei={0.48} rough={0.58} metal={0.10} />
      </mesh>
      {/* Tricuspid valve annulus (RA→RV) */}
      <mesh position={[0.36, 0.36, 0.10]} rotation={[0.10, 0, -0.16]}>
        <torusGeometry args={[0.20, 0.022, 9, 26]} />
        <M color={VALVE_C} ei={0.73} rough={0.28} metal={0.22} />
      </mesh>

      {/* ══════════════════════════════════════════
          LEFT ATRIUM  (most posterior chamber)
      ══════════════════════════════════════════ */}
      <mesh position={[-0.20, 0.60, -0.24]} scale={[0.92, 0.74, 1.08]}>
        <sphereGeometry args={[0.28, 30, 30]} />
        <M color={ATR_COL} ei={0.42} rough={0.48} metal={0.10} />
      </mesh>
      {/* LAA – left atrial appendage (thrombus hotspot in AF) */}
      <mesh position={[-0.44, 0.62, -0.06]} scale={[0.46, 0.36, 0.32]} rotation={[0.20, 0.30, -0.30]}>
        <sphereGeometry args={[0.28, 18, 18]} />
        <M color={ATR_COL} ei={0.40} rough={0.52} metal={0.10} />
      </mesh>
      {/* 4 Pulmonary veins entering LA posteriorly */}
      {/* RSPV, RIPV, LSPV, LIPV */}
      {[
        { p: [-0.34,  0.54, -0.34], ry:  0.28 },
        { p: [-0.10,  0.56, -0.38], ry: -0.28 },
        { p: [-0.30,  0.70, -0.34], ry:  0.28 },
        { p: [-0.08,  0.72, -0.40], ry: -0.28 },
      ].map(({ p, ry }, i) => (
        <mesh key={`pv-${i}`} position={p} rotation={[0.38, ry, 0]}>
          <cylinderGeometry args={[0.032, 0.040, 0.20, 10]} />
          <M color={VEIN_C} rough={0.32} metal={0.30} ei={0.50} />
        </mesh>
      ))}

      {/* ══════════════════════════════════════════
          RIGHT ATRIUM
      ══════════════════════════════════════════ */}
      <mesh position={[0.46, 0.46, 0.02]} scale={[0.86, 0.72, 0.80]}>
        <sphereGeometry args={[0.32, 30, 30]} />
        <M color={ATR_COL} ei={0.42} rough={0.48} metal={0.10} />
      </mesh>
      {/* RAA – right atrial appendage (triangular, right-superior) */}
      <mesh position={[0.64, 0.60, 0.10]} scale={[0.44, 0.36, 0.32]} rotation={[0.15, -0.30, 0.32]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <M color={ATR_COL} ei={0.40} rough={0.52} metal={0.10} />
      </mesh>

      {/* ══════════════════════════════════════════
          FIBROUS SKELETON  (central fibrous body)
          Interconnects all 4 valve annuli
      ══════════════════════════════════════════ */}
      <mesh position={[0.14, 0.46, 0.04]} scale={[0.32, 0.16, 0.24]}>
        <sphereGeometry args={[0.52, 14, 14]} />
        <M color={'#c8a060'} ei={0.40} rough={0.55} metal={0.18} alpha={0.90} />
      </mesh>

      {/* ══════════════════════════════════════════
          VALVE ANNULI  (4 total — torus rings)
      ══════════════════════════════════════════ */}
      {/* Aortic valve (LV outflow, above LV apex) */}
      <mesh position={[0.04, 0.58, -0.02]} rotation={[0.12, 0, 0.08]}>
        <torusGeometry args={[0.105, 0.020, 9, 24]} />
        <M color={VALVE_C} ei={0.75} rough={0.28} metal={0.26} />
      </mesh>
      {/* Pulmonary valve (RV outflow, at infundibulum tip) */}
      <mesh position={[0.24, 0.60, 0.14]} rotation={[0.30, 0.20, 0.30]}>
        <torusGeometry args={[0.095, 0.018, 9, 22]} />
        <M color={VALVE_C} ei={0.72} rough={0.28} metal={0.24} />
      </mesh>

      {/* ══════════════════════════════════════════
          GREAT VESSELS
      ══════════════════════════════════════════ */}

      {/* Aortic root / sinus of Valsalva — slightly wider than ascending */}
      <mesh position={[0.04, 0.64, -0.02]} rotation={[0.06, 0, 0.06]}>
        <cylinderGeometry args={[0.105, 0.092, 0.16, 22]} />
        <M color={AORTA_C} rough={0.20} metal={0.48} ei={0.72} />
      </mesh>

      {/* Full aortic arch — TubeGeometry CatmullRom (8 control points) */}
      <mesh>
        <tubeGeometry args={[aortaCurve, 28, 0.092, 11, false]} />
        <M color={AORTA_C} rough={0.20} metal={0.48} ei={0.72} />
      </mesh>

      {/* Arch branches */}
      {/* Brachiocephalic trunk */}
      <mesh position={[0.22, 1.14, 0.00]} rotation={[0.12, 0, -0.54]}>
        <cylinderGeometry args={[0.042, 0.052, 0.26, 11]} />
        <M color={AORTA_C} rough={0.24} metal={0.44} ei={0.65} />
      </mesh>
      {/* L common carotid */}
      <mesh position={[0.34, 1.20, 0.00]} rotation={[0.06, 0, -0.18]}>
        <cylinderGeometry args={[0.028, 0.034, 0.22, 9]} />
        <M color={AORTA_C} rough={0.24} metal={0.42} ei={0.60} />
      </mesh>
      {/* L subclavian */}
      <mesh position={[0.44, 1.16, 0.00]} rotation={[0.10, 0, 0.52]}>
        <cylinderGeometry args={[0.025, 0.032, 0.20, 8]} />
        <M color={AORTA_C} rough={0.24} metal={0.40} ei={0.58} />
      </mesh>

      {/* Pulmonary trunk */}
      <mesh>
        <tubeGeometry args={[ptCurve, 12, 0.075, 10, false]} />
        <M color={VEIN_C} rough={0.26} metal={0.38} ei={0.62} />
      </mesh>
      {/* Left PA */}
      <mesh>
        <tubeGeometry args={[lPACurve, 10, 0.052, 9, false]} />
        <M color={VEIN_C} rough={0.28} metal={0.36} ei={0.58} />
      </mesh>
      {/* Right PA */}
      <mesh>
        <tubeGeometry args={[rPACurve, 10, 0.054, 9, false]} />
        <M color={VEIN_C} rough={0.28} metal={0.36} ei={0.58} />
      </mesh>

      {/* SVC */}
      <mesh>
        <tubeGeometry args={[svcCurve, 10, 0.062, 9, false]} />
        <M color={VEIN_C} rough={0.30} metal={0.32} ei={0.52} />
      </mesh>
      {/* IVC stub (enters RA from below) */}
      <mesh position={[0.48, -0.44, 0.00]} rotation={[0.06, 0, 0.06]}>
        <cylinderGeometry args={[0.058, 0.070, 0.28, 13]} />
        <M color={VEIN_C} rough={0.30} metal={0.32} ei={0.52} />
      </mesh>

      {/* ══════════════════════════════════════════
          CORONARY ARTERIES
          Colour: bright orange-gold — visible against dark myocardium
      ══════════════════════════════════════════ */}

      {/* LMCA stub (very short, bifurcates into LAD + LCx) */}
      <mesh position={[0.00,  0.50, 0.26]} rotation={[-0.40, 0, 0.10]}>
        <cylinderGeometry args={[0.020, 0.024, 0.10, 8]} />
        <M color={COR_C} rough={0.26} metal={0.32} ei={0.80} />
      </mesh>

      {/* LAD — anterior interventricular groove */}
      <mesh>
        <tubeGeometry args={[ladCurve, 22, 0.028, 7, false]} />
        <M color={COR_C} rough={0.26} metal={0.32} ei={0.80} />
      </mesh>
      {/* D1 — first diagonal */}
      <mesh>
        <tubeGeometry args={[d1Curve, 9, 0.018, 6, false]} />
        <M color={COR_C} rough={0.28} metal={0.30} ei={0.74} />
      </mesh>
      {/* D2 — second diagonal */}
      <mesh>
        <tubeGeometry args={[d2Curve, 8, 0.014, 6, false]} />
        <M color={COR_C} rough={0.28} metal={0.30} ei={0.70} />
      </mesh>
      {/* Septal perforators × 3 (dive perpendicular into septum) */}
      {[
        { p: [-0.06,  0.06, 0.22], r: [0.00, 0, 0.92] },
        { p: [-0.07, -0.12, 0.20], r: [0.04, 0, 0.90] },
        { p: [-0.08, -0.28, 0.17], r: [0.06, 0, 0.88] },
      ].map(({ p, r }, i) => (
        <mesh key={`sp-${i}`} position={p} rotation={r}>
          <cylinderGeometry args={[0.010, 0.012, 0.09, 6]} />
          <M color={COR_C} rough={0.28} metal={0.28} ei={0.65} />
        </mesh>
      ))}

      {/* LCx — left atrioventricular groove */}
      <mesh>
        <tubeGeometry args={[cxCurve, 14, 0.024, 7, false]} />
        <M color={COR_C} rough={0.26} metal={0.32} ei={0.78} />
      </mesh>
      {/* OM1 — obtuse marginal 1 (off LCx) */}
      <mesh>
        <tubeGeometry args={[om1Curve, 9, 0.016, 6, false]} />
        <M color={COR_C} rough={0.28} metal={0.30} ei={0.72} />
      </mesh>

      {/* RCA — right AV groove → posterior descending */}
      <mesh>
        <tubeGeometry args={[rcaCurve, 22, 0.026, 7, false]} />
        <M color={COR_C} rough={0.26} metal={0.32} ei={0.78} />
      </mesh>
      {/* RCA – RV marginal branch */}
      <mesh>
        <tubeGeometry args={[rvmCurve, 9, 0.016, 6, false]} />
        <M color={COR_C} rough={0.28} metal={0.30} ei={0.72} />
      </mesh>
      {/* RCA – SA nodal artery */}
      <mesh>
        <tubeGeometry args={[sanCurve, 8, 0.010, 6, false]} />
        <M color={COR_C} rough={0.28} metal={0.28} ei={0.66} />
      </mesh>

      {/* ══════════════════════════════════════════
          EPICARDIAL FAT GROOVES
          Pale yellow channels along coronary grooves
      ══════════════════════════════════════════ */}
      {/* Anterior interventricular groove (along LAD) */}
      <mesh position={[-0.08, -0.14, 0.30]} rotation={[-0.06, 0, 0.12]} scale={[0.06, 0.76, 0.10]}>
        <sphereGeometry args={[0.52, 10, 10]} />
        <meshStandardMaterial color={FAT_C} roughness={0.90} transparent opacity={0.22} />
      </mesh>
      {/* Left AV groove (along LCx) */}
      <mesh position={[-0.28, 0.36, -0.04]} rotation={[0.14, 0.28, 0.56]} scale={[0.06, 0.58, 0.08]}>
        <sphereGeometry args={[0.52, 10, 10]} />
        <meshStandardMaterial color={FAT_C} roughness={0.90} transparent opacity={0.20} />
      </mesh>
      {/* Right AV groove (along RCA) */}
      <mesh position={[0.40, 0.18, 0.06]} rotation={[0.10, -0.24, -0.48]} scale={[0.06, 0.60, 0.08]}>
        <sphereGeometry args={[0.52, 10, 10]} />
        <meshStandardMaterial color={FAT_C} roughness={0.90} transparent opacity={0.20} />
      </mesh>

    </group>
  );
}

/* ─────────────────────────────────────────
   🧠  BRAIN MESH — Hyper-realistic v2
   Lobe-by-lobe gyral reconstruction:
   frontal/parietal/temporal/occipital lobes
   Central + Sylvian sulci • dense folia
   cerebellum • 3-segment brainstem •
   thalamus • corpus callosum
───────────────────────────────────────── */
function BrainMesh({ color, severity }) {
  const root = useRef();

  /* ── Generate gyri for each lobe region ──
     Each ring is {x, y, z, rx, ry, rz, r, t} */
  const gyriData = useMemo(() => {
    const rings = [];
    const SIDE = [-1, 1]; // left (-1), right (+1)

    SIDE.forEach(s => {
      const xBase = s * 0.46;
      const flip  = s === -1 ? 0 : Math.PI;

      /* FRONTAL lobe (anterior) – roughly coronal arcs */
      const frontalRows = [
        { y: 0.54, z: 0.42, r: 0.40, n: 5, rz: Math.PI * 0.52 },
        { y: 0.44, z: 0.54, r: 0.44, n: 6, rz: Math.PI * 0.52 },
        { y: 0.26, z: 0.62, r: 0.48, n: 6, rz: Math.PI * 0.52 },
        { y: 0.08, z: 0.68, r: 0.47, n: 6, rz: Math.PI * 0.52 },
        { y:-0.08, z: 0.62, r: 0.44, n: 5, rz: Math.PI * 0.52 },
      ];
      frontalRows.forEach(({ y, z, r, n, rz }) => {
        for (let i = 0; i < n; i++) {
          const a = ((i / (n-1)) - 0.5) * Math.PI * 0.72;
          rings.push({
            x: xBase + s * r * Math.sin(a) * 0.55,
            y,
            z: z - Math.abs(Math.sin(a)) * 0.08,
            rx: 0.1 + Math.abs(a) * 0.08,
            ry: flip + s * a * 0.6,
            rz,
            r: 0.068, t: 0.024,
          });
        }
      });

      /* PARIETAL lobe (superior posterior) */
      const parRows = [
        { y: 0.60, z:-0.12, r: 0.46, n: 5 },
        { y: 0.52, z:-0.28, r: 0.50, n: 6 },
        { y: 0.38, z:-0.40, r: 0.52, n: 6 },
        { y: 0.22, z:-0.46, r: 0.50, n: 5 },
      ];
      parRows.forEach(({ y, z, r, n }) => {
        for (let i = 0; i < n; i++) {
          const a = ((i / (n-1)) - 0.5) * Math.PI * 0.62;
          rings.push({
            x: xBase + s * r * Math.sin(a) * 0.52,
            y, z,
            rx: 0.12, ry: flip + s * a * 0.5, rz: Math.PI * 0.54,
            r: 0.064, t: 0.022,
          });
        }
      });

      /* TEMPORAL lobe (lateral inferior) – mostly saggital arcs */
      const tempRows = [
        { y:-0.20, z: 0.40, r: 0.36, n: 5 },
        { y:-0.34, z: 0.36, r: 0.40, n: 5 },
        { y:-0.48, z: 0.28, r: 0.42, n: 5 },
        { y:-0.60, z: 0.16, r: 0.38, n: 4 },
      ];
      tempRows.forEach(({ y, z, r, n }) => {
        for (let i = 0; i < n; i++) {
          const a = ((i / (n-1)) - 0.5) * Math.PI * 0.64;
          rings.push({
            x: xBase + s * (r + 0.10) * Math.sin(a) * 0.44,
            y, z: z + a * 0.04,
            rx: -0.14, ry: flip + s * a * 0.4, rz: Math.PI * 0.48,
            r: 0.060, t: 0.020,
          });
        }
      });

      /* OCCIPITAL (posterior) */
      const occRows = [
        { y: 0.06, z:-0.66, r: 0.38, n: 5 },
        { y:-0.10, z:-0.68, r: 0.38, n: 5 },
        { y:-0.26, z:-0.62, r: 0.40, n: 5 },
      ];
      occRows.forEach(({ y, z, r, n }) => {
        for (let i = 0; i < n; i++) {
          const a = ((i / (n-1)) - 0.5) * Math.PI * 0.58;
          rings.push({
            x: xBase + s * r * Math.sin(a) * 0.48,
            y, z,
            rx: -0.22, ry: flip + s * a * 0.4, rz: Math.PI * 0.54,
            r: 0.056, t: 0.020,
          });
        }
      });
    });
    return rings;
  }, []);

  /* ── Cerebellar folia (very tight horizontal laminar rings) ── */
  const foliaData = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const y = -0.72 - t * 0.36;
      const r = 0.28 + Math.sin(t * Math.PI) * 0.14;
      arr.push({ y, r, x: 0 });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (root.current) root.current.rotation.y = clock.getElapsedTime() * 0.18;
  });

  const sulcusCol = '#04060c';

  return (
    <group ref={root}>

      {/* ══════ HEMISPHERES ══════ */}
      {/* Left hemisphere – frontal-heavy, wider anteriorly */}
      <mesh position={[-0.46, 0.06, 0]} scale={[0.90, 0.84, 0.98]}>
        <sphereGeometry args={[0.78, 48, 48]} />
        <M color={color} rough={0.86} metal={0.02} ei={0.32} />
      </mesh>
      {/* Right hemisphere */}
      <mesh position={[0.46, 0.06, 0]} scale={[0.86, 0.81, 0.95]}>
        <sphereGeometry args={[0.78, 48, 48]} />
        <M color={color} rough={0.86} metal={0.02} ei={0.32} />
      </mesh>

      {/* ── Longitudinal fissure (inter-hemispheric gap) ── */}
      <mesh position={[0, 0.20, 0.02]} scale={[0.055, 0.92, 0.76]}>
        <sphereGeometry args={[0.80, 10, 10]} />
        <meshStandardMaterial color={sulcusCol} roughness={1} />
      </mesh>

      {/* ── Central sulcus (runs coronal, separates frontal/parietal) ── */}
      {[-1, 1].map(s => (
        <mesh key={`cs-${s}`} position={[s * 0.46, 0.24, -0.04]} scale={[0.06, 0.48, 0.40]} rotation={[0, 0, s * 0.08]}>
          <sphereGeometry args={[0.78, 8, 8]} />
          <meshStandardMaterial color={sulcusCol} roughness={1} />
        </mesh>
      ))}

      {/* ── Lateral (Sylvian) fissure ── */}
      {[-1, 1].map(s => (
        <mesh key={`sf-${s}`} position={[s * 0.62, -0.14, 0.24]} scale={[0.06, 0.22, 0.64]} rotation={[0.22, 0, s * 0.12]}>
          <sphereGeometry args={[0.70, 8, 8]} />
          <meshStandardMaterial color={sulcusCol} roughness={1} />
        </mesh>
      ))}

      {/* ══════ GYRI (dense torus arcs across all lobes) ══════ */}
      {gyriData.map((g, i) => (
        <mesh key={`g-${i}`} position={[g.x, g.y, g.z]} rotation={[g.rx, g.ry, g.rz]}>
          <torusGeometry args={[g.r, g.t, 7, 16, Math.PI * 0.88]} />
          <M color={color} rough={0.78} metal={0.02} ei={0.56} />
        </mesh>
      ))}

      {/* ══════ TEMPORAL LOBES (bilateral bulge) ══════ */}
      <mesh position={[-0.88, -0.30, 0.22]} scale={[0.54, 0.64, 0.62]} rotation={[0.12, 0.28, 0.16]}>
        <sphereGeometry args={[0.64, 28, 28]} />
        <M color={color} rough={0.84} metal={0.02} ei={0.34} />
      </mesh>
      <mesh position={[0.88, -0.30, 0.22]} scale={[0.54, 0.64, 0.62]} rotation={[0.12, -0.28, -0.16]}>
        <sphereGeometry args={[0.64, 28, 28]} />
        <M color={color} rough={0.84} metal={0.02} ei={0.34} />
      </mesh>

      {/* ══════ OCCIPITAL LOBE (posterior protrusion) ══════ */}
      <mesh position={[0, -0.16, -0.74]} scale={[0.74, 0.62, 0.52]}>
        <sphereGeometry args={[0.64, 28, 28]} />
        <M color={color} rough={0.82} metal={0.02} ei={0.30} />
      </mesh>

      {/* ══════ INSULA (deep, perisylvian) ══════ */}
      {[-1, 1].map(s => (
        <mesh key={`ins-${s}`} position={[s * 0.50, 0.10, 0.30]} scale={[0.22, 0.48, 0.36]}>
          <sphereGeometry args={[0.62, 16, 16]} />
          <M color={color} rough={0.82} metal={0.02} ei={0.28} alpha={0.88} />
        </mesh>
      ))}

      {/* ══════ THALAMUS (bilateral, deep midline) ══════ */}
      {[-1, 1].map(s => (
        <mesh key={`th-${s}`} position={[s * 0.16, 0.08, -0.08]} scale={[0.40, 0.38, 0.52]}>
          <sphereGeometry args={[0.36, 20, 20]} />
          <M color={'#c084fc'} rough={0.62} metal={0.06} ei={0.44} alpha={0.76} />
        </mesh>
      ))}

      {/* ══════ CORPUS CALLOSUM ══════ */}
      <mesh position={[0, 0.40, -0.06]} scale={[0.22, 0.36, 0.82]}>
        <sphereGeometry args={[0.70, 12, 12]} />
        <M color={color} rough={0.68} metal={0.04} ei={0.26} alpha={0.80} />
      </mesh>
      {/* Genu (front of CC) */}
      <mesh position={[0, 0.42, 0.52]} scale={[0.20, 0.30, 0.26]}>
        <sphereGeometry args={[0.58, 12, 12]} />
        <M color={color} rough={0.68} metal={0.04} ei={0.26} alpha={0.78} />
      </mesh>

      {/* ══════ CEREBELLUM ══════ */}
      {/* Left cerebellar hemisphere */}
      <mesh position={[-0.28, -0.82, -0.34]} scale={[0.72, 0.46, 0.64]}>
        <sphereGeometry args={[0.58, 28, 28]} />
        <M color={color} rough={0.92} metal={0.02} ei={0.26} />
      </mesh>
      {/* Right cerebellar hemisphere */}
      <mesh position={[0.28, -0.82, -0.34]} scale={[0.72, 0.46, 0.64]}>
        <sphereGeometry args={[0.58, 28, 28]} />
        <M color={color} rough={0.92} metal={0.02} ei={0.26} />
      </mesh>
      {/* Vermis (mid) */}
      <mesh position={[0, -0.82, -0.32]} scale={[0.28, 0.42, 0.58]}>
        <sphereGeometry args={[0.52, 20, 20]} />
        <M color={color} rough={0.90} metal={0.02} ei={0.28} />
      </mesh>
      {/* Cerebellar folia – tight horizontal laminar rings */}
      {foliaData.map((f, i) => (
        <mesh key={`fol-${i}`} position={[f.x, f.y, -0.30]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[f.r, 0.015, 5, 22]} />
          <M color={color} rough={0.88} metal={0.02} ei={0.34} />
        </mesh>
      ))}
      {/* Primary fissure (separates anterior/posterior cerebellum) */}
      <mesh position={[0, -0.76, -0.32]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[0.40, 0.028, 6, 24]} />
        <meshStandardMaterial color={sulcusCol} roughness={1} />
      </mesh>

      {/* ══════ BRAINSTEM ══════ */}
      {/* Midbrain (mesencephalon) – widest */}
      <mesh position={[0, -1.10, -0.14]} rotation={[0.30, 0, 0]} scale={[1, 0.86, 0.88]}>
        <cylinderGeometry args={[0.165, 0.148, 0.32, 18]} />
        <M color={color} rough={0.72} metal={0.04} ei={0.36} />
      </mesh>
      {/* Superior colliculi (tectum bumps) */}
      {[[-0.08, -0.98, -0.22], [0.08, -0.98, -0.22]].map((p, i) => (
        <mesh key={`sc-${i}`} position={p} scale={[0.36, 0.28, 0.34]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <M color={color} rough={0.74} metal={0.04} ei={0.34} />
        </mesh>
      ))}
      {/* Pons – bulges anteriorly */}
      <mesh position={[0, -1.30, -0.06]} rotation={[0.22, 0, 0]} scale={[1.0, 0.72, 0.96]}>
        <sphereGeometry args={[0.210, 22, 22]} />
        <M color={color} rough={0.74} metal={0.04} ei={0.36} />
      </mesh>
      {/* Medulla oblongata – tapers */}
      <mesh position={[0, -1.52, -0.02]} rotation={[0.18, 0, 0]}>
        <cylinderGeometry args={[0.118, 0.095, 0.30, 14]} />
        <M color={color} rough={0.72} metal={0.04} ei={0.32} />
      </mesh>
      {/* Pyramidal tracts (ventral medullary ridges) */}
      {[-0.06, 0.06].map((x, i) => (
        <mesh key={`pt-${i}`} position={[x, -1.50, 0.09]} rotation={[0.18, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.022, 0.28, 8]} />
          <M color={color} rough={0.70} metal={0.04} ei={0.30} />
        </mesh>
      ))}

    </group>
  );
}

/* ─────────────────────────────────────────
   🫁  LUNGS MESH — Hyper-realistic v2
   Right 3-lobe, Left 2-lobe + lingula
   Bronchial tree to 3rd order as TubeGeometry
   Pulmonary vessels • tracheal cartilage rings
   fissures • cardiac notch • pleura shells
───────────────────────────────────────── */
function LungsMesh({ color, severity }) {
  const leftRef  = useRef();
  const rightRef = useRef();

  /* ── Right bronchial tree ── */
  const rMainBronchus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.02,  0.86, -0.04),
    new THREE.Vector3( 0.16,  0.72, -0.02),
    new THREE.Vector3( 0.36,  0.62,  0.00),
    new THREE.Vector3( 0.56,  0.57,  0.02),
  ]), []);
  const rUpperBronchus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.56,  0.57,  0.02),
    new THREE.Vector3( 0.62,  0.72,  0.02),
    new THREE.Vector3( 0.64,  0.90,  0.00),
  ]), []);
  const rMiddleBronchus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.56,  0.57,  0.02),
    new THREE.Vector3( 0.66,  0.48,  0.08),
    new THREE.Vector3( 0.70,  0.32,  0.10),
  ]), []);
  const rLowerBronchus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.56,  0.57,  0.02),
    new THREE.Vector3( 0.60,  0.36, -0.04),
    new THREE.Vector3( 0.58,  0.12, -0.08),
    new THREE.Vector3( 0.54, -0.18, -0.06),
  ]), []);

  /* ── Left bronchial tree (longer main bronchus) ── */
  const lMainBronchus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.02,  0.86, -0.04),
    new THREE.Vector3(-0.14,  0.74, -0.02),
    new THREE.Vector3(-0.34,  0.64,  0.00),
    new THREE.Vector3(-0.52,  0.58,  0.02),
    new THREE.Vector3(-0.64,  0.54,  0.02),
  ]), []);
  const lUpperBronchus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.64,  0.54,  0.02),
    new THREE.Vector3(-0.68,  0.70,  0.02),
    new THREE.Vector3(-0.68,  0.88,  0.00),
  ]), []);
  const lLowerBronchus = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.64,  0.54,  0.02),
    new THREE.Vector3(-0.66,  0.34, -0.02),
    new THREE.Vector3(-0.62,  0.08, -0.06),
    new THREE.Vector3(-0.56, -0.18, -0.04),
  ]), []);

  useFrame(({ clock }) => {
    const breathe = 1 + Math.sin(clock.getElapsedTime() * 0.86 * Math.PI) * (0.068 + severity * 0.014);
    if (leftRef.current)  leftRef.current.scale.setScalar(breathe);
    if (rightRef.current) rightRef.current.scale.setScalar(breathe);
  });

  const bColor = color;         // general lung parenchyma
  const fisColor = '#040d16';   // fissure dark
  const vesColor = '#5eaeff';   // pulmonary vessel blue

  return (
    <group>

      {/* ══════════════════════════════
          RIGHT LUNG  (patient's right = scene left)
      ══════════════════════════════ */}
      <group ref={rightRef} position={[0.70, 0.06, 0]}>
        {/* RUL – right upper lobe (apex-superior) */}
        <mesh position={[0.04, 0.96, 0.02]} scale={[0.60, 0.84, 0.52]}>
          <sphereGeometry args={[0.58, 32, 32]} />
          <M color={bColor} alpha={0.94} ei={0.50} rough={0.46} />
        </mesh>
        <mesh position={[0.02, 1.36, 0.00]} scale={[0.38, 0.48, 0.36]}>
          <sphereGeometry args={[0.48, 22, 22]} />
          <M color={bColor} alpha={0.90} ei={0.48} rough={0.48} />
        </mesh>
        {/* RUL apical segment */}
        <mesh position={[0.06, 1.62, -0.04]} scale={[0.28, 0.36, 0.28]}>
          <sphereGeometry args={[0.42, 16, 16]} />
          <M color={bColor} alpha={0.86} ei={0.46} rough={0.50} />
        </mesh>

        {/* RML – right middle lobe (anterior-inferior to RUL) */}
        <mesh position={[-0.06, 0.24, 0.18]} scale={[0.64, 0.54, 0.48]}>
          <sphereGeometry args={[0.50, 26, 26]} />
          <M color={bColor} alpha={0.92} ei={0.52} rough={0.44} />
        </mesh>
        <mesh position={[-0.04, 0.06, 0.22]} scale={[0.54, 0.42, 0.40]}>
          <sphereGeometry args={[0.44, 20, 20]} />
          <M color={bColor} alpha={0.88} rough={0.46} />
        </mesh>

        {/* RLL – right lower lobe (large, inferior-posterior) */}
        <mesh position={[0.04, -0.44, -0.10]} scale={[0.72, 1.02, 0.66]}>
          <sphereGeometry args={[0.64, 32, 32]} />
          <M color={bColor} alpha={0.94} ei={0.52} rough={0.44} />
        </mesh>
        <mesh position={[0.02, -0.92, -0.08]} scale={[0.60, 0.64, 0.56]}>
          <sphereGeometry args={[0.56, 24, 24]} />
          <M color={bColor} alpha={0.90} rough={0.46} />
        </mesh>
        <mesh position={[-0.04, -1.26, -0.06]} scale={[0.50, 0.46, 0.46]}>
          <sphereGeometry args={[0.50, 20, 20]} />
          <M color={bColor} alpha={0.86} rough={0.48} />
        </mesh>

        {/* Horizontal fissure (RUL/RML boundary) */}
        <mesh position={[0, 0.52, 0.14]} scale={[0.56, 0.028, 0.46]} rotation={[0.06, 0, 0]}>
          <boxGeometry />
          <meshStandardMaterial color={fisColor} roughness={1} transparent opacity={0.80} />
        </mesh>
        {/* Oblique fissure (RUL+RML / RLL) */}
        <mesh position={[0, -0.06, 0.02]} scale={[0.58, 0.028, 0.58]} rotation={[0.60, 0, 0]}>
          <boxGeometry />
          <meshStandardMaterial color={fisColor} roughness={1} transparent opacity={0.75} />
        </mesh>

        {/* Pleura shell */}
        <mesh scale={[0.76, 1.42, 0.70]}>
          <sphereGeometry args={[0.80, 18, 18]} />
          <M color={bColor} rough={0.92} alpha={0.055} ei={0.08} />
        </mesh>

        {/* Hilum (pulmonary root) */}
        <mesh position={[-0.40, 0.32, 0.00]} scale={[0.14, 0.36, 0.24]}>
          <sphereGeometry args={[0.58, 14, 14]} />
          <M color={bColor} ei={0.80} rough={0.36} metal={0.34} />
        </mesh>

        {/* Pulmonary vein (surface trace) */}
        {[[0.00, 0.70, 0.22], [0.08, 0.42, 0.26], [-0.04, 0.08, 0.20]].map((p, i) => (
          <mesh key={`rpv-${i}`} position={p} rotation={[i * 0.3 - 0.3, 0.1, 0.2 + i * 0.15]}>
            <cylinderGeometry args={[0.018, 0.024, 0.32, 6]} />
            <M color={vesColor} rough={0.28} metal={0.32} ei={0.60} alpha={0.80} />
          </mesh>
        ))}
      </group>

      {/* ══════════════════════════════
          LEFT LUNG
      ══════════════════════════════ */}
      <group ref={leftRef} position={[-0.70, 0.06, 0]}>
        {/* LUL – left upper lobe */}
        <mesh position={[-0.04, 0.60, 0.04]} scale={[0.62, 1.10, 0.54]}>
          <sphereGeometry args={[0.64, 32, 32]} />
          <M color={bColor} alpha={0.94} ei={0.50} rough={0.46} />
        </mesh>
        <mesh position={[-0.06, 1.30, 0.02]} scale={[0.42, 0.50, 0.38]}>
          <sphereGeometry args={[0.50, 22, 22]} />
          <M color={bColor} alpha={0.90} ei={0.48} rough={0.48} />
        </mesh>
        {/* LUL apical segment */}
        <mesh position={[-0.04, 1.58, -0.02]} scale={[0.30, 0.38, 0.28]}>
          <sphereGeometry args={[0.44, 16, 16]} />
          <M color={bColor} alpha={0.86} ei={0.46} rough={0.50} />
        </mesh>

        {/* Lingula (inferior tongue of LUL) */}
        <mesh position={[0.16, -0.04, 0.18]} scale={[0.40, 0.56, 0.38]} rotation={[0.10, 0, -0.18]}>
          <sphereGeometry args={[0.48, 24, 24]} />
          <M color={bColor} alpha={0.90} ei={0.48} rough={0.46} />
        </mesh>
        <mesh position={[0.18, -0.28, 0.16]} scale={[0.34, 0.46, 0.32]}>
          <sphereGeometry args={[0.44, 20, 20]} />
          <M color={bColor} alpha={0.86} rough={0.48} />
        </mesh>

        {/* LLL – left lower lobe */}
        <mesh position={[-0.02, -0.50, -0.12]} scale={[0.68, 0.98, 0.64]}>
          <sphereGeometry args={[0.62, 30, 30]} />
          <M color={bColor} alpha={0.94} ei={0.52} rough={0.44} />
        </mesh>
        <mesh position={[0.00, -0.94, -0.10]} scale={[0.56, 0.66, 0.54]}>
          <sphereGeometry args={[0.54, 24, 24]} />
          <M color={bColor} alpha={0.90} rough={0.46} />
        </mesh>
        <mesh position={[0.02, -1.26, -0.08]} scale={[0.46, 0.46, 0.44]}>
          <sphereGeometry args={[0.48, 18, 18]} />
          <M color={bColor} alpha={0.86} rough={0.48} />
        </mesh>

        {/* Cardiac notch (concave medial surface) */}
        <mesh position={[0.44, 0.10, 0.12]} scale={[0.24, 0.44, 0.32]}>
          <sphereGeometry args={[0.60, 14, 14]} />
          <meshStandardMaterial color={fisColor} roughness={1} transparent opacity={0.82} />
        </mesh>

        {/* Left oblique fissure */}
        <mesh position={[0, -0.02, 0.06]} scale={[0.58, 0.026, 0.56]} rotation={[0.52, 0, 0]}>
          <boxGeometry />
          <meshStandardMaterial color={fisColor} roughness={1} transparent opacity={0.72} />
        </mesh>

        {/* Pleura */}
        <mesh scale={[0.72, 1.36, 0.66]}>
          <sphereGeometry args={[0.80, 18, 18]} />
          <M color={bColor} rough={0.92} alpha={0.055} ei={0.08} />
        </mesh>

        {/* Hilum */}
        <mesh position={[0.38, 0.30, 0.00]} scale={[0.14, 0.34, 0.22]}>
          <sphereGeometry args={[0.58, 14, 14]} />
          <M color={bColor} ei={0.80} rough={0.36} metal={0.34} />
        </mesh>

        {/* Pulmonary vein surface traces */}
        {[[0.00, 0.68, 0.22], [-0.08, 0.38, 0.24], [0.04, 0.06, 0.18]].map((p, i) => (
          <mesh key={`lpv-${i}`} position={p} rotation={[i * 0.3 - 0.3, -0.1, -0.2 - i * 0.15]}>
            <cylinderGeometry args={[0.018, 0.022, 0.30, 6]} />
            <M color={vesColor} rough={0.28} metal={0.32} ei={0.60} alpha={0.80} />
          </mesh>
        ))}
      </group>

      {/* ══════════════════════════════
          TRACHEA  +  BRONCHIAL TREE
      ══════════════════════════════ */}
      {/* Trachea tube */}
      <mesh position={[0, 1.26, -0.06]}>
        <cylinderGeometry args={[0.074, 0.086, 0.64, 16]} />
        <M color={bColor} rough={0.26} metal={0.32} ei={0.68} />
      </mesh>
      {/* Tracheal cartilage rings (C-shaped) */}
      {[1.10, 1.20, 1.30, 1.40, 1.50, 1.58].map((y, i) => (
        <mesh key={`tr-${i}`} position={[0, y, -0.06]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.082, 0.019, 6, 14, Math.PI * 1.68]} />
          <M color={bColor} rough={0.30} metal={0.28} ei={0.56} />
        </mesh>
      ))}
      {/* Carina */}
      <mesh position={[0, 0.96, -0.04]} scale={[0.90, 0.60, 0.76]}>
        <sphereGeometry args={[0.13, 14, 14]} />
        <M color={bColor} rough={0.26} metal={0.32} ei={0.64} />
      </mesh>

      {/* Bronchial tree – TubeGeometry */}
      <mesh><tubeGeometry args={[rMainBronchus,   14, 0.054, 8, false]} /><M color={bColor} rough={0.28} metal={0.30} ei={0.66} /></mesh>
      <mesh><tubeGeometry args={[rUpperBronchus,   8, 0.038, 7, false]} /><M color={bColor} rough={0.30} metal={0.28} ei={0.60} /></mesh>
      <mesh><tubeGeometry args={[rMiddleBronchus,  8, 0.030, 7, false]} /><M color={bColor} rough={0.30} metal={0.28} ei={0.58} /></mesh>
      <mesh><tubeGeometry args={[rLowerBronchus,  12, 0.042, 7, false]} /><M color={bColor} rough={0.28} metal={0.30} ei={0.62} /></mesh>
      <mesh><tubeGeometry args={[lMainBronchus,   16, 0.050, 8, false]} /><M color={bColor} rough={0.28} metal={0.30} ei={0.66} /></mesh>
      <mesh><tubeGeometry args={[lUpperBronchus,   8, 0.036, 7, false]} /><M color={bColor} rough={0.30} metal={0.28} ei={0.60} /></mesh>
      <mesh><tubeGeometry args={[lLowerBronchus,  12, 0.040, 7, false]} /><M color={bColor} rough={0.28} metal={0.30} ei={0.62} /></mesh>

    </group>
  );
}

/* ─────────────────────────────────────────
   🫀  FULL SYSTEM — Hyper-realistic v2
   Complete torso multi-organ view:
   Brain • Lungs • Heart • Liver • Stomach
   Spleen • Kidneys • Aorta (tube) • IVC •
   Spine with discs • portal/renal vessels
───────────────────────────────────────── */
function SystemMesh({ severity }) {
  const bpHz   = (60 + severity * 12) / 60;
  const heartR = useRef();
  const leftL  = useRef();
  const rightL = useRef();
  const brainG = useRef();

  /* ── Descending aorta ── */
  const aortaCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.30,  0.50, -0.26),  // descending aorta start (after arch)
    new THREE.Vector3( 0.28,  0.14, -0.28),
    new THREE.Vector3( 0.26, -0.30, -0.28),
    new THREE.Vector3( 0.24, -0.78, -0.26),
    new THREE.Vector3( 0.22, -1.20, -0.24),
    new THREE.Vector3( 0.20, -1.60, -0.22),
    new THREE.Vector3( 0.18, -1.95, -0.20),  // aortic bifurcation
  ]), []);

  /* ── IVC ── */
  const ivcCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, -1.95, -0.20),
    new THREE.Vector3(-0.10, -1.30, -0.22),
    new THREE.Vector3(-0.08, -0.70, -0.22),
    new THREE.Vector3(-0.06, -0.08, -0.20),
    new THREE.Vector3(-0.04,  0.32, -0.18),  // enters RA
  ]), []);

  /* ── Portal vein ── */
  const portalCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.38, -0.78, -0.10),  // splenic + superior mesenteric junction
    new THREE.Vector3( 0.42, -0.60, -0.08),
    new THREE.Vector3( 0.46, -0.44, -0.06),  // enters liver
  ]), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const phase   = (t * bpHz) % 1;
    const systole = phase < 0.35
      ? Math.sin((phase / 0.35) * Math.PI) * (0.06 + severity * 0.020)
      : 0;
    const breathe = 1 + Math.sin(t * 0.86 * Math.PI) * 0.058;
    if (heartR.current)  heartR.current.scale.setScalar(1 + systole);
    if (leftL.current)   leftL.current.scale.setScalar(breathe);
    if (rightL.current)  rightL.current.scale.setScalar(breathe);
    if (brainG.current)  brainG.current.rotation.y = t * 0.12;
  });

  const hc  = SEV_COLOR[severity];   // heart (severity-driven)
  const bc  = '#a855f7';             // brain purple
  const lc  = '#38bdf8';             // lung cyan
  const livc = '#84cc16';            // liver lime
  const stC = '#e879a0';             // stomach pink
  const spC = '#c084fc';             // spleen violet
  const kc  = '#fb923c';             // kidney orange
  const aortaC = '#f87171';          // aortic red

  return (
    <group scale={0.64}>

      {/* ══════════════════════════════
          BRAIN  (top)
      ══════════════════════════════ */}
      <group ref={brainG} position={[0, 2.48, 0]}>
        <mesh position={[-0.46, 0.06, 0]} scale={[0.88, 0.82, 0.96]}>
          <sphereGeometry args={[0.76, 32, 32]} />
          <M color={bc} rough={0.85} ei={0.34} />
        </mesh>
        <mesh position={[0.46, 0.06, 0]} scale={[0.84, 0.79, 0.92]}>
          <sphereGeometry args={[0.76, 32, 32]} />
          <M color={bc} rough={0.85} ei={0.34} />
        </mesh>
        {/* Inter-hemispheric fissure */}
        <mesh position={[0, 0.18, 0]} scale={[0.05, 0.86, 0.72]}>
          <sphereGeometry args={[0.78, 8, 8]} />
          <meshStandardMaterial color="#04060c" roughness={1} />
        </mesh>
        {/* Gyri sample rows */}
        {[-1, 1].map(s => [0.48, 0.24, 0.00, -0.22].map((y, ri) => (
          <mesh key={`sg-${s}-${ri}`}
            position={[s * 0.46 + s * 0.06, y, 0.66 - ri * 0.06]}
            rotation={[0.12, s > 0 ? Math.PI + 0.28 : 0.28, Math.PI * 0.52]}>
            <torusGeometry args={[0.066, 0.020, 6, 12, Math.PI * 0.86]} />
            <M color={bc} rough={0.78} ei={0.44} />
          </mesh>
        )))}
        {/* Temporal lobes */}
        {[-0.86, 0.86].map((x, i) => (
          <mesh key={`stl-${i}`} position={[x, -0.26, 0.18]} scale={[0.50, 0.60, 0.56]}>
            <sphereGeometry args={[0.60, 20, 20]} />
            <M color={bc} rough={0.84} ei={0.32} />
          </mesh>
        ))}
        {/* Cerebellum */}
        <mesh position={[0, -0.80, -0.32]} scale={[0.88, 0.44, 0.58]}>
          <sphereGeometry args={[0.56, 24, 24]} />
          <M color={bc} rough={0.90} ei={0.26} />
        </mesh>
        {/* Brainstem stub */}
        <mesh position={[0, -1.06, -0.10]} rotation={[0.28, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.10, 0.32, 12]} />
          <M color={bc} rough={0.72} ei={0.30} />
        </mesh>
      </group>

      {/* ══════════════════════════════
          TRACHEA  (neck/upper chest)
      ══════════════════════════════ */}
      <mesh position={[0, 1.20, -0.06]}>
        <cylinderGeometry args={[0.058, 0.068, 0.50, 12]} />
        <M color={lc} rough={0.28} metal={0.28} ei={0.60} />
      </mesh>
      {[1.08, 1.18, 1.28, 1.38].map((y, i) => (
        <mesh key={`str-${i}`} position={[0, y, -0.06]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.065, 0.015, 5, 12, Math.PI * 1.6]} />
          <M color={lc} rough={0.30} metal={0.24} ei={0.52} />
        </mesh>
      ))}

      {/* ══════════════════════════════
          RIGHT LUNG
      ══════════════════════════════ */}
      <group ref={rightL} position={[0.76, 0.26, 0]}>
        <mesh scale={[0.62, 1.02, 0.52]}>
          <sphereGeometry args={[0.64, 24, 24]} />
          <M color={lc} alpha={0.91} ei={0.48} />
        </mesh>
        <mesh position={[-0.04, 0.26, 0.18]} scale={[0.54, 0.48, 0.42]}>
          <sphereGeometry args={[0.50, 18, 18]} />
          <M color={lc} alpha={0.88} ei={0.50} />
        </mesh>
        <mesh position={[0.04, -0.70, -0.06]} scale={[0.60, 0.72, 0.50]}>
          <sphereGeometry args={[0.56, 20, 20]} />
          <M color={lc} alpha={0.88} ei={0.48} />
        </mesh>
        {/* Pleura */}
        <mesh scale={[0.72, 1.40, 0.62]}>
          <sphereGeometry args={[0.78, 14, 14]} />
          <M color={lc} rough={0.92} alpha={0.05} />
        </mesh>
      </group>

      {/* ══════════════════════════════
          LEFT LUNG
      ══════════════════════════════ */}
      <group ref={leftL} position={[-0.76, 0.26, 0]}>
        <mesh scale={[0.60, 0.98, 0.50]}>
          <sphereGeometry args={[0.64, 24, 24]} />
          <M color={lc} alpha={0.91} ei={0.48} />
        </mesh>
        <mesh position={[0.14, -0.10, 0.16]} scale={[0.42, 0.54, 0.36]}>
          <sphereGeometry args={[0.46, 16, 16]} />
          <M color={lc} alpha={0.88} ei={0.46} />
        </mesh>
        <mesh position={[-0.02, -0.68, -0.06]} scale={[0.58, 0.68, 0.48]}>
          <sphereGeometry args={[0.54, 18, 18]} />
          <M color={lc} alpha={0.88} ei={0.48} />
        </mesh>
        {/* Cardiac notch (left lung medial concavity) */}
        <mesh position={[0.44, 0.18, 0.10]} scale={[0.20, 0.40, 0.28]}>
          <sphereGeometry args={[0.58, 10, 10]} />
          <meshStandardMaterial color="#030a14" roughness={1} transparent opacity={0.85} />
        </mesh>
        <mesh scale={[0.68, 1.32, 0.58]}>
          <sphereGeometry args={[0.78, 14, 14]} />
          <M color={lc} rough={0.92} alpha={0.05} />
        </mesh>
      </group>

      {/* ══════════════════════════════
          HEART  (mediastinal, left-tilted)
      ══════════════════════════════ */}
      <group ref={heartR} position={[0, -0.36, 0.06]} rotation={[0.06, 0, 0.24]}>
        {/* Pericardium */}
        <mesh scale={[1.18, 1.22, 1.12]}>
          <sphereGeometry args={[0.62, 20, 20]} />
          <M color={hc} ei={0.04} rough={0.96} alpha={0.07} />
        </mesh>
        {/* LV */}
        <mesh position={[-0.12, -0.04, -0.02]} scale={[0.96, 1.48, 0.92]}>
          <sphereGeometry args={[0.50, 32, 32]} />
          <M color={'#cc3333'} ei={0.62} rough={0.44} />
        </mesh>
        {/* LV apex */}
        <mesh position={[-0.26, -0.74, 0.02]} rotation={[0.16, 0, -0.30]}>
          <coneGeometry args={[0.22, 0.44, 26]} />
          <M color={'#cc3333'} ei={0.60} rough={0.46} />
        </mesh>
        {/* RV */}
        <mesh position={[0.30, 0.04, 0.16]} scale={[0.72, 1.06, 0.56]}>
          <sphereGeometry args={[0.44, 28, 28]} />
          <M color={'#cc5050'} ei={0.46} rough={0.46} />
        </mesh>
        {/* LA */}
        <mesh position={[-0.18, 0.56, -0.20]} scale={[0.88, 0.70, 1.04]}>
          <sphereGeometry args={[0.27, 22, 22]} />
          <M color={'#cc4444'} ei={0.42} rough={0.48} />
        </mesh>
        {/* RA */}
        <mesh position={[0.44, 0.42, 0.00]} scale={[0.82, 0.68, 0.76]}>
          <sphereGeometry args={[0.30, 22, 22]} />
          <M color={'#cc4444'} ei={0.42} rough={0.48} />
        </mesh>
        {/* Ascending aorta root */}
        <mesh position={[0.06, 0.72, -0.04]}>
          <cylinderGeometry args={[0.088, 0.105, 0.38, 14]} />
          <M color={hc} rough={0.22} metal={0.44} ei={0.70} />
        </mesh>
        {/* Pulmonary trunk */}
        <mesh position={[0.22, 0.64, 0.14]} rotation={[-0.24, 0.1, 0.34]}>
          <cylinderGeometry args={[0.070, 0.085, 0.36, 12]} />
          <M color={'#7bb8ff'} rough={0.26} metal={0.36} ei={0.58} />
        </mesh>
      </group>

      {/* ══════════════════════════════
          AORTA  (descending, tube)
      ══════════════════════════════ */}
      <mesh>
        <tubeGeometry args={[aortaCurve, 22, 0.065, 9, false]} />
        <M color={aortaC} rough={0.22} metal={0.40} ei={0.68} alpha={0.90} />
      </mesh>
      {/* Aortic bifurcation into iliac arteries */}
      {[[-0.14, -2.02, -0.18], [0.50, -2.02, -0.18]].map((p, i) => (
        <mesh key={`ili-${i}`} position={p} rotation={[0, 0, i === 0 ? 0.28 : -0.28]}>
          <cylinderGeometry args={[0.040, 0.050, 0.22, 8]} />
          <M color={aortaC} rough={0.24} metal={0.38} ei={0.62} alpha={0.88} />
        </mesh>
      ))}

      {/* ══════════════════════════════
          IVC
      ══════════════════════════════ */}
      <mesh>
        <tubeGeometry args={[ivcCurve, 18, 0.055, 8, false]} />
        <M color={'#7bb8ff'} rough={0.28} metal={0.32} ei={0.56} alpha={0.85} />
      </mesh>

      {/* ══════════════════════════════
          LIVER  (right upper quadrant)
      ══════════════════════════════ */}
      {/* Right lobe (dominant) */}
      <mesh position={[0.62, -0.82, -0.10]} scale={[0.80, 0.50, 0.62]} rotation={[0, 0.12, -0.08]}>
        <sphereGeometry args={[0.64, 24, 24]} />
        <M color={livc} alpha={0.86} rough={0.68} ei={0.32} />
      </mesh>
      {/* Left lobe (smaller) */}
      <mesh position={[0.14, -0.78, -0.08]} scale={[0.52, 0.40, 0.48]}>
        <sphereGeometry args={[0.52, 18, 18]} />
        <M color={livc} alpha={0.82} rough={0.70} ei={0.30} />
      </mesh>
      {/* Inferior surface / gallbladder fossa bump */}
      <mesh position={[0.56, -0.98, -0.06]} scale={[0.22, 0.16, 0.20]}>
        <sphereGeometry args={[0.40, 12, 12]} />
        <M color={'#a3e635'} alpha={0.80} rough={0.72} ei={0.28} />
      </mesh>
      {/* Portal vein */}
      <mesh>
        <tubeGeometry args={[portalCurve, 8, 0.032, 7, false]} />
        <M color={'#7bb8ff'} rough={0.30} metal={0.28} ei={0.52} alpha={0.82} />
      </mesh>

      {/* ══════════════════════════════
          STOMACH  (left upper quadrant)
      ══════════════════════════════ */}
      <mesh position={[-0.36, -0.90, -0.04]} scale={[0.58, 0.52, 0.44]} rotation={[0.1, 0.2, -0.14]}>
        <sphereGeometry args={[0.52, 22, 22]} />
        <M color={stC} alpha={0.80} rough={0.72} ei={0.30} />
      </mesh>
      {/* Fundus bulge */}
      <mesh position={[-0.54, -0.72, 0.02]} scale={[0.36, 0.32, 0.30]}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <M color={stC} alpha={0.76} rough={0.74} ei={0.28} />
      </mesh>
      {/* Pylorus */}
      <mesh position={[-0.12, -1.00, 0.00]} scale={[0.24, 0.24, 0.22]}>
        <sphereGeometry args={[0.36, 14, 14]} />
        <M color={stC} alpha={0.76} rough={0.74} ei={0.28} />
      </mesh>

      {/* ══════════════════════════════
          SPLEEN  (far left, posterior)
      ══════════════════════════════ */}
      <mesh position={[-0.92, -0.86, -0.16]} scale={[0.42, 0.50, 0.34]} rotation={[0, -0.2, 0.10]}>
        <sphereGeometry args={[0.44, 20, 20]} />
        <M color={spC} alpha={0.84} rough={0.64} ei={0.36} />
      </mesh>

      {/* ══════════════════════════════
          KIDNEYS  (retroperitoneal, bean-shaped)
      ══════════════════════════════ */}
      {/* Right kidney */}
      <mesh position={[0.56, -1.74, -0.22]} scale={[0.38, 0.58, 0.32]} rotation={[0, 0.10, 0.12]}>
        <sphereGeometry args={[0.52, 22, 22]} />
        <M color={kc} alpha={0.90} rough={0.62} ei={0.38} />
      </mesh>
      {/* Right kidney hilum indentation */}
      <mesh position={[0.36, -1.74, -0.20]} scale={[0.12, 0.26, 0.16]}>
        <sphereGeometry args={[0.48, 12, 12]} />
        <meshStandardMaterial color="#030810" roughness={1} transparent opacity={0.80} />
      </mesh>
      {/* Left kidney */}
      <mesh position={[-0.58, -1.70, -0.22]} scale={[0.38, 0.58, 0.32]} rotation={[0, -0.10, -0.12]}>
        <sphereGeometry args={[0.52, 22, 22]} />
        <M color={kc} alpha={0.90} rough={0.62} ei={0.38} />
      </mesh>
      {/* Left kidney hilum */}
      <mesh position={[-0.38, -1.70, -0.20]} scale={[0.12, 0.26, 0.16]}>
        <sphereGeometry args={[0.48, 12, 12]} />
        <meshStandardMaterial color="#030810" roughness={1} transparent opacity={0.80} />
      </mesh>
      {/* Renal arteries */}
      {[[0.38, -1.74, -0.22, 0.10], [-0.38, -1.70, -0.22, -0.10]].map(([x, y, z, rz], i) => (
        <mesh key={`ra-${i}`} position={[x, y, z]} rotation={[0, 0, rz]}>
          <cylinderGeometry args={[0.022, 0.028, 0.22, 8]} />
          <M color={aortaC} rough={0.24} metal={0.34} ei={0.60} alpha={0.85} />
        </mesh>
      ))}

      {/* ══════════════════════════════
          SPINE  (posterior midline)
      ══════════════════════════════ */}
      <mesh position={[0, 0.10, -0.40]}>
        <cylinderGeometry args={[0.052, 0.052, 5.80, 10]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.32} transparent opacity={0.36} />
      </mesh>
      {[-2.10, -1.48, -0.86, -0.24, 0.38, 1.00, 1.62, 2.24].map((y, i) => (
        <mesh key={`vd-${i}`} position={[0, y, -0.40]} rotation={[Math.PI * 0.5, 0, 0]}>
          <torusGeometry args={[0.080, 0.026, 6, 12]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.22} transparent opacity={0.46} />
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
            <Canvas
              key={selected.model}
              aria-label={`3D ${selected.label}`}
              frameloop="always"
              camera={selected.model === 'system'
                ? { position:[0,0,10], fov:52, near:0.1, far:90 }
                : { position:[0,0,5.2], fov:46, near:0.1, far:65 }}
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
              style={{ width:'100%', height:'100%', display:'block' }}
            >
              <color attach="background" args={['#060d18']} />
              <OrganScene organ={selected} severity={severity}
                autoRotate={autoRotate} showStars={showStars} />
            </Canvas>

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
