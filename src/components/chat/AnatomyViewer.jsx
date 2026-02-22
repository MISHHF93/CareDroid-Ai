import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import HolographicLoader from '../3d/HolographicLoader';

const HolographicCanvas = lazy(() => import('../3d/HolographicCanvas'));
const HeartModel = lazy(() => import('../3d/medical/HeartModel'));
const BrainModel = lazy(() => import('../3d/medical/BrainModel'));
const LungsModel = lazy(() => import('../3d/medical/LungsModel'));
const OrganSystem = lazy(() => import('../3d/medical/OrganSystem'));
const PathologyGenerator = lazy(() => import('../3d/PathologyGenerator'));
const ComparativeClinicalView = lazy(() => import('../3d/clinical/ComparativeClinicalView'));

export default function AnatomyViewer({ organ, vitals, aiText = '', markers = [], patientId = 'chat-session', t }) {
  const STATUS_VISIBILITY_KEY = 'caredroid.anatomy.showStatus';
  const COMPARATIVE_MODE_KEY = 'caredroid.anatomy.comparativeMode';
  const FEATURE_TOGGLES_KEY = 'caredroid.anatomy.featureToggles';
  const VIEWER_PRESET_KEY = 'caredroid.anatomy.viewerPreset';
  const defaultFeatureToggles = {
    cinematic: true,
    liveVitals: true,
    collaboration: true,
    xr: true,
    voice: true,
    pathology: true,
    clinicalWorkflow: true,
    radiation: true,
    flyThrough: true,
    dicom: true,
    adaptiveQuality: true,
    telemetry: true,
  };
  const ModelComponent = {
    heart: HeartModel,
    brain: BrainModel,
    lungs: LungsModel,
  }[organ] || OrganSystem;

  const heartbeat = Number(vitals?.heartRate?.value || vitals?.heartRate || vitals?.HR || 72);
  const severityScores = {
    heart: heartbeat >= 120 ? 4 : heartbeat >= 105 ? 3 : heartbeat >= 95 ? 2 : 1,
    brain: Number(vitals?.GCS ? (15 - Number(vitals.GCS)) / 4 : 0),
    lungs: Number(vitals?.RR || 18) >= 28 ? 4 : Number(vitals?.RR || 18) >= 22 ? 3 : 1,
  };

  const urgency = /(trauma|code blue|hemorrhage)/i.test(aiText)
    ? 'trauma'
    : /(critical|urgent|emergency|severe|concerning)/i.test(aiText)
      ? 'high'
      : /(monitor|follow-up|moderate)/i.test(aiText)
        ? 'medium'
        : 'low';

  const [showComparative, setShowComparative] = useState(() => {
    try {
      return window.localStorage.getItem(COMPARATIVE_MODE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showStatus, setShowStatus] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STATUS_VISIBILITY_KEY);
      return saved == null ? true : saved === '1';
    } catch {
      return true;
    }
  });
  const [features, setFeatures] = useState(() => {
    try {
      const raw = window.localStorage.getItem(FEATURE_TOGGLES_KEY);
      if (!raw) return defaultFeatureToggles;
      const parsed = JSON.parse(raw);
      const normalized = { ...defaultFeatureToggles };
      Object.keys(defaultFeatureToggles).forEach((key) => {
        if (typeof parsed?.[key] === 'boolean') normalized[key] = parsed[key];
      });
      return normalized;
    } catch {
      return defaultFeatureToggles;
    }
  });
  const [viewerNotice, setViewerNotice] = useState('');
  const tv = (key, fallback, params) => {
    if (typeof t !== 'function') return fallback;
    const translated = t(key, params);
    return translated && translated !== key ? translated : fallback;
  };

  const featureDisplayLabels = useMemo(() => ({
    cinematic: tv('chat.anatomyViewer.features.cinematic', 'Cinematic'),
    liveVitals: tv('chat.anatomyViewer.features.liveVitals', 'Live Vitals'),
    collaboration: tv('chat.anatomyViewer.features.collaboration', 'Collaboration'),
    xr: tv('chat.anatomyViewer.features.xr', 'XR'),
    voice: tv('chat.anatomyViewer.features.voice', 'Voice'),
    pathology: tv('chat.anatomyViewer.features.pathology', 'Pathology'),
    clinicalWorkflow: tv('chat.anatomyViewer.features.clinicalWorkflow', 'Clinical Workflow'),
    radiation: tv('chat.anatomyViewer.features.radiation', 'Radiation'),
    flyThrough: tv('chat.anatomyViewer.features.flyThrough', 'Fly-through'),
    dicom: tv('chat.anatomyViewer.features.dicom', 'DICOM'),
    adaptiveQuality: tv('chat.anatomyViewer.features.adaptiveQuality', 'Adaptive Quality'),
    telemetry: tv('chat.anatomyViewer.features.telemetry', 'Telemetry'),
  }), [t]);

  const pathologyDiagnosis = useMemo(() => {
    const severity = Math.max(0.2, Math.min(1, (severityScores?.[organ] || 1) / 4));
    const infectionHint = /(infection|sepsis|viral|bacterial|pneumonia)/i.test(aiText);
    const fractureHint = /(fracture|break|trauma)/i.test(aiText);
    const tumorHint = /(tumor|mass|lesion|neoplasm|cancer)/i.test(aiText);

    return {
      tumor: { enabled: tumorHint || severity > 0.45, size: 0.35 + severity * 0.6, stage: Math.max(1, Math.round(1 + severity * 3)), invasiveness: severity },
      atherosclerosis: { enabled: /(cardiac|coronary|ischemia|plaque)/i.test(aiText) || organ === 'heart', severity },
      infection: { enabled: infectionHint || organ === 'lungs', severity: infectionHint ? Math.max(0.55, severity) : severity * 0.6, spread: severity },
      fracture: { enabled: fractureHint && (organ === 'brain' || organ === 'heart' || organ === 'lungs'), severity: severity * 0.9 },
      inflammation: { enabled: true, severity },
      tissueDamage: { enabled: true, severity, necrosis: severity * 0.55, healing: 0.25 },
      mutation: { enabled: /(genetic|mutation|dna|protein)/i.test(aiText) || organ === 'brain', severity, mutationSites: [4, 11, 19, 27] },
    };
  }, [aiText, organ, severityScores]);

  const integrationStatus = useMemo(() => ([
    { label: tv('chat.anatomyViewer.status.modeSingle', 'mode:single3d'), active: !showComparative },
    { label: tv('chat.anatomyViewer.status.modeComparative', 'mode:comparative'), active: showComparative },
    { label: featureDisplayLabels.cinematic, active: features.cinematic },
    { label: featureDisplayLabels.liveVitals, active: features.liveVitals },
    { label: featureDisplayLabels.collaboration, active: features.collaboration },
    { label: featureDisplayLabels.xr, active: features.xr },
    { label: featureDisplayLabels.voice, active: features.voice },
    { label: featureDisplayLabels.pathology, active: features.pathology && !showComparative },
    { label: featureDisplayLabels.clinicalWorkflow, active: features.clinicalWorkflow && !showComparative },
    { label: featureDisplayLabels.radiation, active: features.radiation && !showComparative },
    { label: featureDisplayLabels.flyThrough, active: features.flyThrough && !showComparative },
    { label: featureDisplayLabels.dicom, active: features.dicom && !showComparative },
    { label: featureDisplayLabels.adaptiveQuality, active: features.adaptiveQuality && !showComparative },
    { label: featureDisplayLabels.telemetry, active: features.telemetry },
  ]), [features, showComparative, featureDisplayLabels]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STATUS_VISIBILITY_KEY, showStatus ? '1' : '0');
    } catch {}
  }, [STATUS_VISIBILITY_KEY, showStatus]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COMPARATIVE_MODE_KEY, showComparative ? '1' : '0');
    } catch {}
  }, [COMPARATIVE_MODE_KEY, showComparative]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FEATURE_TOGGLES_KEY, JSON.stringify(features));
    } catch {}
  }, [FEATURE_TOGGLES_KEY, features]);

  const resetViewerDefaults = () => {
    setShowComparative(false);
    setShowStatus(true);
    setFeatures({ ...defaultFeatureToggles });
    setViewerNotice(tv('chat.anatomyViewer.notice.reset', 'Viewer preferences reset'));
    try {
      window.localStorage.removeItem(COMPARATIVE_MODE_KEY);
      window.localStorage.removeItem(STATUS_VISIBILITY_KEY);
      window.localStorage.removeItem(FEATURE_TOGGLES_KEY);
    } catch {}
  };

  const toggleComparativeMode = () => {
    setShowComparative((value) => {
      const next = !value;
      setViewerNotice(next
        ? tv('chat.anatomyViewer.notice.comparativeEnabled', 'Comparative view enabled')
        : tv('chat.anatomyViewer.notice.singleEnabled', 'Single view enabled'));
      return next;
    });
  };

  const toggleStatusVisibility = () => {
    setShowStatus((value) => {
      const next = !value;
      setViewerNotice(next
        ? tv('chat.anatomyViewer.notice.statusShown', 'Status panel shown')
        : tv('chat.anatomyViewer.notice.statusHidden', 'Status panel hidden'));
      return next;
    });
  };

  const formatFeatureLabel = (key) => {
    return featureDisplayLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const toggleFeature = (key) => {
    setFeatures((prev) => {
      const nextValue = !prev[key];
      setViewerNotice(`${formatFeatureLabel(key)} ${nextValue
        ? tv('chat.anatomyViewer.common.enabled', 'enabled')
        : tv('chat.anatomyViewer.common.disabled', 'disabled')}`);
      return { ...prev, [key]: nextValue };
    });
  };

  const saveViewerPreset = () => {
    const preset = {
      showComparative,
      showStatus,
      features,
      savedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(VIEWER_PRESET_KEY, JSON.stringify(preset));
      setViewerNotice(tv('chat.anatomyViewer.notice.presetSaved', 'Viewer preset saved'));
    } catch {
      setViewerNotice(tv('chat.anatomyViewer.notice.presetSaveFailed', 'Unable to save preset'));
    }
  };

  const loadViewerPreset = () => {
    try {
      const raw = window.localStorage.getItem(VIEWER_PRESET_KEY);
      if (!raw) {
        setViewerNotice(tv('chat.anatomyViewer.notice.noPreset', 'No saved preset found'));
        return;
      }
      const parsed = JSON.parse(raw);
      const normalizedFeatures = { ...defaultFeatureToggles };
      Object.keys(defaultFeatureToggles).forEach((key) => {
        if (typeof parsed?.features?.[key] === 'boolean') normalizedFeatures[key] = parsed.features[key];
      });

      setShowComparative(Boolean(parsed?.showComparative));
      setShowStatus(parsed?.showStatus == null ? true : Boolean(parsed.showStatus));
      setFeatures(normalizedFeatures);
      setViewerNotice(tv('chat.anatomyViewer.notice.presetLoaded', 'Viewer preset loaded'));
    } catch {
      setViewerNotice(tv('chat.anatomyViewer.notice.presetLoadFailed', 'Unable to load preset'));
    }
  };

  useEffect(() => {
    if (!viewerNotice) return undefined;
    const timer = window.setTimeout(() => setViewerNotice(''), 1800);
    return () => window.clearTimeout(timer);
  }, [viewerNotice]);

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        minHeight: 280,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
        border: '1px solid rgba(0,229,255,0.5)',
        background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(8,12,22,0.95))',
      }}
    >
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '8px 10px',
        position: 'sticky',
        top: 0,
        zIndex: 3,
        borderBottom: '1px solid rgba(0,229,255,0.24)',
        background: 'rgba(2,6,23,0.5)',
      }}>
        <button
          type="button"
          onClick={toggleComparativeMode}
          aria-pressed={showComparative}
          aria-label={showComparative
            ? tv('chat.anatomyViewer.aria.switchSingle', 'Switch to single 3D view')
            : tv('chat.anatomyViewer.aria.switchComparative', 'Switch to comparative view')}
          title={showComparative
            ? tv('chat.anatomyViewer.aria.switchSingle', 'Switch to single 3D view')
            : tv('chat.anatomyViewer.aria.switchComparative', 'Switch to comparative view')}
          style={{ fontSize: 11, padding: '4px 8px' }}
        >
          {showComparative
            ? tv('chat.anatomyViewer.actions.singleView', 'Single View')
            : tv('chat.anatomyViewer.actions.comparativeView', 'Comparative View')}
        </button>
        {Object.keys(features).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleFeature(key)}
            aria-pressed={features[key]}
            aria-label={`${formatFeatureLabel(key)} ${features[key]
              ? tv('chat.anatomyViewer.common.enabled', 'enabled')
              : tv('chat.anatomyViewer.common.disabled', 'disabled')}`}
            title={`${formatFeatureLabel(key)} ${features[key]
              ? tv('chat.anatomyViewer.common.enabled', 'enabled')
              : tv('chat.anatomyViewer.common.disabled', 'disabled')}`}
            style={{
              fontSize: 10,
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid rgba(0,229,255,0.45)',
              background: features[key] ? 'rgba(0,229,255,0.18)' : 'rgba(15,23,42,0.45)',
              color: features[key] ? '#67e8f9' : '#93c5fd',
            }}
          >
            {formatFeatureLabel(key)}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleStatusVisibility}
          aria-pressed={showStatus}
          aria-label={showStatus
            ? tv('chat.anatomyViewer.aria.hideStatusPanel', 'Hide integration status panel')
            : tv('chat.anatomyViewer.aria.showStatusPanel', 'Show integration status panel')}
          title={showStatus
            ? tv('chat.anatomyViewer.aria.hideStatusPanel', 'Hide integration status panel')
            : tv('chat.anatomyViewer.aria.showStatusPanel', 'Show integration status panel')}
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            padding: '4px 8px',
            borderRadius: 999,
            border: '1px solid rgba(148,163,184,0.55)',
            background: 'rgba(15,23,42,0.55)',
            color: '#cbd5e1',
          }}
        >
          {showStatus
            ? tv('chat.anatomyViewer.actions.hideStatus', 'Hide Status')
            : tv('chat.anatomyViewer.actions.showStatus', 'Show Status')}
        </button>
        <button
          type="button"
          onClick={resetViewerDefaults}
          aria-label={tv('chat.anatomyViewer.aria.resetDefaults', 'Reset anatomy viewer defaults')}
          title={tv('chat.anatomyViewer.aria.resetDefaults', 'Reset anatomy viewer defaults')}
          style={{
            fontSize: 10,
            padding: '4px 8px',
            borderRadius: 999,
            border: '1px solid rgba(251,146,60,0.55)',
            background: 'rgba(124,45,18,0.45)',
            color: '#fdba74',
          }}
        >
          {tv('chat.anatomyViewer.actions.resetDefaults', 'Reset Defaults')}
        </button>
        <button
          type="button"
          onClick={saveViewerPreset}
          aria-label={tv('chat.anatomyViewer.aria.savePreset', 'Save anatomy viewer preset')}
          title={tv('chat.anatomyViewer.aria.savePreset', 'Save anatomy viewer preset')}
          style={{
            fontSize: 10,
            padding: '4px 8px',
            borderRadius: 999,
            border: '1px solid rgba(59,130,246,0.55)',
            background: 'rgba(30,58,138,0.45)',
            color: '#bfdbfe',
          }}
        >
          {tv('chat.anatomyViewer.actions.savePreset', 'Save Preset')}
        </button>
        <button
          type="button"
          onClick={loadViewerPreset}
          aria-label={tv('chat.anatomyViewer.aria.loadPreset', 'Load anatomy viewer preset')}
          title={tv('chat.anatomyViewer.aria.loadPreset', 'Load anatomy viewer preset')}
          style={{
            fontSize: 10,
            padding: '4px 8px',
            borderRadius: 999,
            border: '1px solid rgba(99,102,241,0.55)',
            background: 'rgba(49,46,129,0.45)',
            color: '#c7d2fe',
          }}
        >
          {tv('chat.anatomyViewer.actions.loadPreset', 'Load Preset')}
        </button>
      </div>

      {showStatus && (
        <div
          role="region"
          aria-label={tv('chat.anatomyViewer.aria.integrationStatus', 'Integration status')}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            padding: '6px 10px',
            position: 'sticky',
            top: 38,
            zIndex: 2,
            borderBottom: '1px solid rgba(0,229,255,0.2)',
            background: 'rgba(2,6,23,0.35)',
          }}>
          {integrationStatus.map((item) => (
            <span
              key={item.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 999,
                border: item.active ? '1px solid rgba(34,197,94,0.6)' : '1px solid rgba(148,163,184,0.45)',
                background: item.active ? 'rgba(22,163,74,0.18)' : 'rgba(30,41,59,0.45)',
                color: item.active ? '#bbf7d0' : '#cbd5e1',
                letterSpacing: 0.2,
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: item.active ? '#22c55e' : '#94a3b8',
                boxShadow: item.active ? '0 0 8px rgba(34,197,94,0.8)' : 'none',
              }} />
              {item.label}
            </span>
          ))}
        </div>
      )}

      {viewerNotice && (
        <div style={{
          position: 'absolute',
          top: 44,
          right: 12,
          zIndex: 6,
          fontSize: 11,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid rgba(34,197,94,0.55)',
          background: 'rgba(20,83,45,0.75)',
          color: '#dcfce7',
          backdropFilter: 'blur(4px)',
        }} role="status" aria-live="polite">
          {viewerNotice}
        </div>
      )}

      <Suspense fallback={<HolographicLoader size={40} label="" />}>
        {showComparative ? (
          <ComparativeClinicalView
            leftLabel={tv('chat.anatomyViewer.labels.beforeBaseline', 'Before / Baseline')}
            rightLabel={tv('chat.anatomyViewer.labels.currentPredicted', 'Current / Predicted')}
            leftVitals={{ ...(vitals || {}), heartRate: Math.max(55, heartbeat - 12), RR: Math.max(10, Number(vitals?.RR || 18) - 3) }}
            rightVitals={vitals || {}}
            leftSeverity={{
              heart: Math.max(1, (severityScores.heart || 1) - 1),
              brain: Math.max(0, (severityScores.brain || 0) - 0.2),
              lungs: Math.max(1, (severityScores.lungs || 1) - 1),
            }}
            rightSeverity={severityScores}
            atlasOverlay
          />
        ) : (
          <HolographicCanvas
            cameraPosition={[0, 0, 4]}
            controls
            severityScores={severityScores}
            vitals={vitals}
            liveVitals={features.liveVitals}
            patientId={String(patientId || 'chat-session')}
            collaborationEnabled={features.collaboration}
            collaborationSessionId={`collab-${String(patientId || 'chat-session')}`}
            collaborationSelectedOrgan={organ || 'general'}
            gestureControlEnabled={features.collaboration}
            xrEnabled={features.xr}
            voiceCommandsEnabled={features.voice}
            clinicalWorkflowEnabled={features.clinicalWorkflow}
            radiationEnabled={features.radiation}
            flyThroughEnabled={features.flyThrough}
            dicomEnabled={features.dicom}
            flyThroughMode={organ === 'brain' ? 'neural' : 'vascular'}
            adaptiveQuality={features.adaptiveQuality}
            telemetryEnabled={features.telemetry}
            cinematic={features.cinematic}
            cinematicContext={{
              aiText,
              organ,
              urgency,
              focusMarkers: markers,
              easing: 'easeInOut',
              gazeTracking: true,
            }}
          >
            <ModelComponent interactive rotateOnHover showLabel heartbeat={heartbeat} vitals={vitals} scores={severityScores} />
            {features.pathology && (
              <PathologyGenerator
                organType={organ || 'heart'}
                diagnosis={pathologyDiagnosis}
                timeline={0.25}
                pathogenCount={2200}
              />
            )}
          </HolographicCanvas>
        )}
      </Suspense>
    </div>
  );
}
