/**
 * ClinicalLibrary
 * Holographic 3D clinical reference atlas.
 * Organ catalog → full 3D viewer with live overlays → clinical info panel.
 */

import React, { useState, Suspense, useMemo } from 'react';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import HolographicCanvas from '../components/holographic/HolographicCanvas';
import HeartModel from '../components/3d/medical/HeartModel';
import BrainModel from '../components/3d/medical/BrainModel';
import LungsModel from '../components/3d/medical/LungsModel';
import OrganSystem from '../components/3d/medical/OrganSystem';
import './ClinicalLibrary.css';

/* ─── Clinical Data Atlas ─── */
const ORGANS = [
  {
    id: 'heart',
    label: 'Heart',
    icon: '❤️',
    system: 'cardiovascular',
    color: '#ef4444',
    accentHex: 'rgba(239,68,68,0.18)',
    description: 'Four-chambered muscular pump maintaining systemic and pulmonary circulation via coordinated electromechanical contraction.',
    model: 'heart',
    anatomy: ['Right atrium', 'Left ventricle', 'Aortic valve', 'Mitral valve', 'SA node', 'Coronary arteries', 'Interventricular septum'],
    physiology: 'Cardiac output (CO) = Heart Rate × Stroke Volume. Normal CO 4–8 L/min. Preload ↑ → SV ↑ (Frank–Starling). Afterload ↑ → SV ↓.',
    referenceValues: [
      { label: 'Heart Rate', range: '60–100 bpm', critical: '<40 or >150', softCrit: true },
      { label: 'Systolic BP', range: '100–139 mmHg', critical: '<90 or >180', softCrit: false },
      { label: 'Diastolic BP', range: '60–89 mmHg', critical: '<60 or >120', softCrit: false },
      { label: 'EF (Ejection Fraction)', range: '55–70 %', critical: '<35 %', softCrit: true },
      { label: 'Troponin I', range: '<0.04 ng/mL', critical: '>0.4', softCrit: false },
      { label: 'BNP', range: '<100 pg/mL', critical: '>500 pg/mL', softCrit: true },
    ],
    pathologies: [
      { name: 'STEMI', severity: 4, description: 'ST-elevation MI — immediate PCI target <90 min. Heparin + P2Y12.' },
      { name: 'NSTEMI / UA', severity: 3, description: 'Non-ST elevation ACS — anticoagulation, early invasive strategy.' },
      { name: 'Cardiogenic Shock', severity: 4, description: 'CO failure → inotropes, IABP/Impella, ECMO in refractory cases.' },
      { name: 'Atrial Fibrillation', severity: 2, description: 'Irregular rhythm — rate/rhythm control, anticoagulate for stroke.' },
      { name: 'Heart Failure (HFrEF)', severity: 3, description: 'EF <40% — ACEi/ARNi, beta-blocker, MRA, SGLT2i (GDMT).' },
    ],
    sofaLabel: 'Cardiovascular SOFA',
    sofa: [
      { score: 1, criterion: 'MAP < 70 mmHg' },
      { score: 2, criterion: 'Dopamine ≤5 or Dobutamine (any dose)' },
      { score: 3, criterion: 'Dopamine >5 or Nor/Epi ≤0.1 μg/kg/min' },
      { score: 4, criterion: 'Dopamine >15 or Nor/Epi >0.1 μg/kg/min' },
    ],
  },
  {
    id: 'brain',
    label: 'Brain',
    icon: '🧠',
    system: 'neurological',
    color: '#a855f7',
    accentHex: 'rgba(168,85,247,0.18)',
    description: 'Central command system. 86 billion neurons governing consciousness, cognition, motor control, and autonomic regulation.',
    model: 'brain',
    anatomy: ['Frontal lobe', 'Parietal lobe', 'Temporal lobe', 'Occipital lobe', 'Cerebellum', 'Brainstem', 'Limbic system', 'Basal ganglia'],
    physiology: 'Cerebral perfusion pressure (CPP) = MAP − ICP. Target CPP 60–70 mmHg in TBI. Cerebral autoregulation maintains CBF 50–150 mmHg MAP range.',
    referenceValues: [
      { label: 'GCS', range: '15', critical: '≤8 → intubation', softCrit: true },
      { label: 'ICP', range: '<15 mmHg', critical: '>22 mmHg', softCrit: false },
      { label: 'CPP', range: '60–70 mmHg', critical: '<50 mmHg', softCrit: true },
      { label: 'NIHSS', range: '0 (normal)', critical: '>25 = severe', softCrit: true },
      { label: 'Jugular SvO2', range: '55–75%', critical: '<50 or >75%', softCrit: false },
    ],
    pathologies: [
      { name: 'Hemorrhagic Stroke', severity: 4, description: 'ICH/SAH — BP control, ICP management, surgical consult.' },
      { name: 'Ischemic Stroke', severity: 4, description: 'tPA window <4.5 h. Thrombectomy up to 24 h (DAWN/DEFUSE).' },
      { name: 'Status Epilepticus', severity: 4, description: 'Benzos → Phenytoin/Valproate → Propofol/Ketamine.' },
      { name: 'Bacterial Meningitis', severity: 4, description: 'LP → ceftriaxone + vancomycin + dexamethasone immediately.' },
      { name: 'Severe TBI', severity: 3, description: 'ICP monitor if GCS <8. CPP target 60–70. Avoid secondary insults.' },
    ],
    sofaLabel: 'CNS SOFA (GCS)',
    sofa: [
      { score: 1, criterion: 'GCS 13–14' },
      { score: 2, criterion: 'GCS 10–12' },
      { score: 3, criterion: 'GCS 6–9' },
      { score: 4, criterion: 'GCS <6' },
    ],
  },
  {
    id: 'lungs',
    label: 'Lungs',
    icon: '🫁',
    system: 'respiratory',
    color: '#38bdf8',
    accentHex: 'rgba(56,189,248,0.18)',
    description: 'Paired gas exchange organs. 300 million alveoli provide ~70 m² surface area for O₂/CO₂ diffusion at the blood–air barrier.',
    model: 'lungs',
    anatomy: ['Right upper lobe', 'Right middle lobe', 'Right lower lobe', 'Left upper lobe', 'Left lower lobe', 'Alveoli', 'Bronchioles', 'Pleura'],
    physiology: 'A-a gradient = PAO₂ − PaO₂. Normal <15 mmHg (age-adjusted: age/4 + 4). P/F ratio = PaO₂ / FiO₂ defines ARDS severity. Compliance = ΔV / ΔP.',
    referenceValues: [
      { label: 'SpO₂', range: '95–100%', critical: '<90%', softCrit: false },
      { label: 'PaO₂', range: '75–100 mmHg', critical: '<60 mmHg', softCrit: false },
      { label: 'PaCO₂', range: '35–45 mmHg', critical: '<25 or >60', softCrit: true },
      { label: 'P/F Ratio', range: '>300', critical: '<100 = severe ARDS', softCrit: false },
      { label: 'Respiratory Rate', range: '12–20 /min', critical: '>30 /min', softCrit: true },
      { label: 'Plateau Pressure', range: '<28 cmH₂O', critical: '>30', softCrit: false },
    ],
    pathologies: [
      { name: 'ARDS', severity: 4, description: 'P/F <300. Lung-protective vent: Vt 6 mL/kg IBW, PEEP titration, prone >16 h/day.' },
      { name: 'Massive PE', severity: 4, description: 'Hemo-instability → systemic thrombolytics or EKOS. Anticoagulation.' },
      { name: 'Tension Pneumothorax', severity: 4, description: 'Immediate needle decompression 2nd ICS MCL, then chest tube.' },
      { name: 'CAP (Severe)', severity: 3, description: 'CURB-65 ≥3 → ICU. Culture-guided antibiotics + steroids in severe.' },
      { name: 'COPD Exacerbation', severity: 2, description: 'Bronchodilators, systemic steroids, O₂ titration, NIV.' },
    ],
    sofaLabel: 'Respiratory SOFA (P/F)',
    sofa: [
      { score: 1, criterion: 'P/F 300–400' },
      { score: 2, criterion: 'P/F 200–300' },
      { score: 3, criterion: 'P/F 100–200 + ventilated' },
      { score: 4, criterion: 'P/F <100 + ventilated' },
    ],
  },
  {
    id: 'system',
    label: 'Full System',
    icon: '🫀',
    system: 'multisystem',
    color: '#10b981',
    accentHex: 'rgba(16,185,129,0.18)',
    description: 'Integrated organ system view. SOFA-driven severity mapping across all organ domains for real-time critical care assessment.',
    model: 'system',
    anatomy: ['Heart', 'Brain', 'Lungs', 'Kidneys (×2)', 'Liver', 'GI tract', 'Bone marrow', 'Skin/barrier'],
    physiology: 'SOFA (Sequential Organ Failure Assessment) predicts ICU mortality. Each of 6 organ systems scored 0–4. Total 24-point max. ΔSOFA >2 = organ dysfunction (Sepsis-3 definition).',
    referenceValues: [
      { label: 'SOFA Total', range: '0–5 = low risk', critical: '>11 = >80% mortality', softCrit: false },
      { label: 'Lactate', range: '<2 mmol/L', critical: '>4 = septic shock', softCrit: false },
      { label: 'Creatinine (Renal)', range: '<1.2 mg/dL', critical: '>5.0', softCrit: false },
      { label: 'Bilirubin (Hepatic)', range: '<1.2 mg/dL', critical: '>12', softCrit: false },
      { label: 'Platelets (Coag)', range: '>150 ×10³/μL', critical: '<20', softCrit: false },
    ],
    pathologies: [
      { name: 'Septic Shock', severity: 4, description: 'Sepsis + vasopressors + Lactate >2. Start Hour-1 bundle: cultures, abx, IVF, pressors.' },
      { name: 'MODS', severity: 4, description: 'Multi-organ dysfunction — SOFA >11. Simultaneous organ support, source control.' },
      { name: 'DIC', severity: 4, description: 'Fibrinogen ↓ + D-dimer ↑ + PT ↑. Treat trigger, replace factors, FFP/cryo.' },
      { name: 'Severe Sepsis', severity: 3, description: 'qSOFA ≥2 + suspected infection. Early antibiotics within 1 hour.' },
    ],
    sofaLabel: 'Composite SOFA',
    sofa: [
      { score: '0–5', criterion: 'Low risk (<10% mortality)' },
      { score: '6–9', criterion: 'Moderate risk (~20%)' },
      { score: '10–12', criterion: 'High risk (~40%)' },
      { score: '>12', criterion: 'Critical (>80% mortality)' },
    ],
  },
];

const SYSTEMS = [
  { id: 'all',            label: 'All Systems',    icon: '⚕️' },
  { id: 'cardiovascular', label: 'Cardiovascular', icon: '❤️' },
  { id: 'neurological',   label: 'Neurological',   icon: '🧠' },
  { id: 'respiratory',    label: 'Respiratory',    icon: '🫁' },
  { id: 'multisystem',    label: 'Multisystem',    icon: '🫀' },
];

const SEVERITY_COLORS = { 0: '#10b981', 1: '#f59e0b', 2: '#f97316', 3: '#ef4444', 4: '#dc2626' };
const SEVERITY_LABELS = { 0: 'Normal', 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Critical' };

/* ─── 3D Scene inside Canvas ─── */
function OrganScene({ organ, severity, autoRotate, showStars }) {
  const severityColor = SEVERITY_COLORS[severity] || organ.color;
  const commonProps = {
    interactive: true,
    rotateOnHover: false,
    showLabel: false,
    severity,
    heartbeat: 60 + severity * 12,
    color: severityColor,
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]}   intensity={1.2} color={organ.color} />
      <pointLight position={[-5, 2, -3]} intensity={0.8} color="#00d4aa" />
      <pointLight position={[0, -5, 3]}  intensity={0.6} color="#6366f1" />

      {showStars && <Stars radius={30} depth={10} count={800} factor={3} fade speed={0.4} />}

      <Suspense fallback={null}>
        {organ.model === 'heart'  && <HeartModel  {...commonProps} />}
        {organ.model === 'brain'  && <BrainModel  {...commonProps} />}
        {organ.model === 'lungs'  && <LungsModel  {...commonProps} />}
        {organ.model === 'system' && (
          <OrganSystem
            scores={{ heart: severity, brain: severity, lungs: severity }}
            vitals={{ heartRate: { value: 60 + severity * 12 } }}
            interactive
          />
        )}
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        minDistance={2}
        maxDistance={12}
      />
    </>
  );
}

/* ─── Severity bar ─── */
function SeverityBadge({ level }) {
  return (
    <span
      className="cl-severity-badge"
      style={{ background: SEVERITY_COLORS[level] + '22', color: SEVERITY_COLORS[level], border: `1px solid ${SEVERITY_COLORS[level]}55` }}
    >
      <span className="cl-severity-dot" style={{ background: SEVERITY_COLORS[level] }} />
      {SEVERITY_LABELS[level]}
    </span>
  );
}

/* ─── Main Page ─── */
export default function ClinicalLibrary() {
  const [search, setSearch]         = useState('');
  const [activeSystem, setSystem]   = useState('all');
  const [selected, setSelected]     = useState(ORGANS[0]);
  const [severity, setSeverity]     = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showStars, setShowStars]   = useState(true);
  const [activeTab, setActiveTab]   = useState('overview'); // overview | refs | pathologies | sofa

  const filteredOrgans = useMemo(() => ORGANS.filter(o =>
    (activeSystem === 'all' || o.system === activeSystem) &&
    o.label.toLowerCase().includes(search.toLowerCase())
  ), [activeSystem, search]);

  return (
    <div className="cl-page">

      {/* ── Top bar ── */}
      <div className="cl-topbar">
        <h1 className="cl-title">
          <span className="cl-title-icon">⚕️</span>
          Clinical Library
          <span className="cl-title-badge">3D ATLAS</span>
        </h1>

        <div className="cl-system-tabs">
          {SYSTEMS.map(s => (
            <button
              key={s.id}
              className={`cl-system-tab${activeSystem === s.id ? ' active' : ''}`}
              onClick={() => setSystem(s.id)}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="cl-topbar-controls">
          <input
            className="cl-search"
            placeholder="Search organ or system…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className={`cl-toggle-btn${autoRotate ? ' on' : ''}`}
            onClick={() => setAutoRotate(r => !r)}
            title="Auto-rotate"
          >↻ Rotate</button>
          <button
            className={`cl-toggle-btn${showStars ? ' on' : ''}`}
            onClick={() => setShowStars(s => !s)}
            title="Background stars"
          >✦ Space</button>
        </div>
      </div>

      {/* ── Three-panel layout ── */}
      <div className="cl-body">

        {/* LEFT — Organ catalog */}
        <aside className="cl-catalog">
          <p className="cl-catalog-label">ORGANS / SYSTEMS</p>
          {filteredOrgans.length === 0 && (
            <div className="cl-catalog-empty">No results for "{search}"</div>
          )}
          {filteredOrgans.map(organ => (
            <button
              key={organ.id}
              className={`cl-catalog-item${selected.id === organ.id ? ' active' : ''}`}
              style={selected.id === organ.id ? { borderColor: organ.color, background: organ.accentHex } : {}}
              onClick={() => { setSelected(organ); setSeverity(0); setActiveTab('overview'); }}
            >
              <span className="cl-catalog-icon" style={{ color: organ.color }}>{organ.icon}</span>
              <div className="cl-catalog-info">
                <span className="cl-catalog-name">{organ.label}</span>
                <span className="cl-catalog-system">{organ.system}</span>
              </div>
              {selected.id === organ.id && (
                <span className="cl-catalog-active-dot" style={{ background: organ.color }} />
              )}
            </button>
          ))}
        </aside>

        {/* CENTER — 3D Holographic viewer */}
        <div className="cl-viewer">
          {/* Viewer top bar */}
          <div className="cl-viewer-topbar">
            <span className="cl-viewer-organ-label" style={{ color: selected.color }}>
              {selected.icon} {selected.label}
            </span>
            <div className="cl-severity-row">
              <span className="cl-severity-label">Severity</span>
              <div className="cl-severity-steps">
                {[0,1,2,3,4].map(s => (
                  <button
                    key={s}
                    className={`cl-severity-step${severity === s ? ' active' : ''}`}
                    style={severity === s ? { background: SEVERITY_COLORS[s], borderColor: SEVERITY_COLORS[s] } : {}}
                    onClick={() => setSeverity(s)}
                    title={SEVERITY_LABELS[s]}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <SeverityBadge level={severity} />
            </div>
          </div>

          {/* Canvas */}
          <div className="cl-canvas-wrap">
            <HolographicCanvas
              ariaLabel={`3D holographic ${selected.label} model`}
              camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 60 }}
              targetFps={60}
              style={{ width: '100%', height: '100%' }}
            >
              <OrganScene
                organ={selected}
                severity={severity}
                autoRotate={autoRotate}
                showStars={showStars}
              />
            </HolographicCanvas>

            {/* Overlay HUD */}
            <div className="cl-hud-overlay">
              <div className="cl-hud-chip" style={{ color: selected.color, borderColor: selected.color + '55' }}>
                ● Live 3D
              </div>
              {severity > 0 && (
                <div className="cl-hud-chip cl-hud-severity" style={{ color: SEVERITY_COLORS[severity] }}>
                  ⚠ {SEVERITY_LABELS[severity]} state
                </div>
              )}
            </div>

            <div className="cl-canvas-hint">Drag to rotate · Scroll to zoom</div>
          </div>
        </div>

        {/* RIGHT — Info panel */}
        <aside className="cl-info-panel">
          {/* Organ header */}
          <div className="cl-info-header" style={{ borderColor: selected.color + '44', background: selected.accentHex }}>
            <span className="cl-info-icon">{selected.icon}</span>
            <div>
              <h2 className="cl-info-title" style={{ color: selected.color }}>{selected.label}</h2>
              <span className="cl-info-system-tag">{selected.system}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="cl-info-tabs">
            {[
              { id: 'overview',    label: 'Overview' },
              { id: 'refs',        label: 'References' },
              { id: 'pathologies', label: 'Pathologies' },
              { id: 'sofa',        label: 'SOFA' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`cl-info-tab${activeTab === tab.id ? ' active' : ''}`}
                style={activeTab === tab.id ? { borderBottomColor: selected.color, color: selected.color } : {}}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="cl-info-content">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="cl-tab-overview">
                <p className="cl-description">{selected.description}</p>

                <div className="cl-section-label">⚙️ Physiology</div>
                <p className="cl-physiology-text">{selected.physiology}</p>

                <div className="cl-section-label">🔬 Key Structures</div>
                <div className="cl-anatomy-grid">
                  {selected.anatomy.map(a => (
                    <span key={a} className="cl-anatomy-chip" style={{ borderColor: selected.color + '44' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* REFERENCE VALUES */}
            {activeTab === 'refs' && (
              <div className="cl-tab-refs">
                <p className="cl-tab-intro">Normal ranges and critical thresholds.</p>
                <div className="cl-ref-list">
                  {selected.referenceValues.map(rv => (
                    <div key={rv.label} className="cl-ref-row">
                      <div className="cl-ref-label">{rv.label}</div>
                      <div className="cl-ref-normal">
                        <span className="cl-ref-normal-dot" />
                        {rv.range}
                      </div>
                      <div className="cl-ref-critical">
                        <span className="cl-ref-crit-dot" />
                        {rv.critical}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PATHOLOGIES */}
            {activeTab === 'pathologies' && (
              <div className="cl-tab-path">
                <p className="cl-tab-intro">Select a condition to visualize severity on the 3D model.</p>
                {selected.pathologies.map(p => (
                  <div
                    key={p.name}
                    className={`cl-path-card${severity === p.severity ? ' active' : ''}`}
                    style={severity === p.severity ? { borderColor: SEVERITY_COLORS[p.severity], background: SEVERITY_COLORS[p.severity] + '11' } : {}}
                    onClick={() => setSeverity(p.severity)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSeverity(p.severity)}
                  >
                    <div className="cl-path-header">
                      <span className="cl-path-name">{p.name}</span>
                      <SeverityBadge level={p.severity} />
                    </div>
                    <p className="cl-path-desc">{p.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* SOFA SCORING */}
            {activeTab === 'sofa' && (
              <div className="cl-tab-sofa">
                <div className="cl-sofa-title">{selected.sofaLabel}</div>
                <p className="cl-tab-intro">SOFA sub-score criteria</p>
                <div className="cl-sofa-table">
                  <div className="cl-sofa-row cl-sofa-header">
                    <span>Score</span>
                    <span>Criterion</span>
                  </div>
                  {selected.sofa.map(row => (
                    <div
                      key={row.score}
                      className={`cl-sofa-row${severity === row.score ? ' active' : ''}`}
                      style={{ background: severity === row.score ? SEVERITY_COLORS[row.score] + '18' : undefined }}
                    >
                      <span
                        className="cl-sofa-score"
                        style={{ color: SEVERITY_COLORS[row.score] || SEVERITY_COLORS[2] }}
                      >
                        {row.score}
                      </span>
                      <span className="cl-sofa-criterion">{row.criterion}</span>
                    </div>
                  ))}
                </div>
                <div className="cl-sofa-note">
                  {selected.physiology}
                </div>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
