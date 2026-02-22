/**
 * HolographicCanvas
 * Root Three.js canvas wrapper with camera, lighting, and orbit controls.
 * Provides a reusable container for all 3D medical visualisations.
 *
 * Usage:
 *   <HolographicCanvas>
 *     <Suspense fallback={<HolographicLoader />}>
 *       <HeartModel />
 *     </Suspense>
 *   </HolographicCanvas>
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, AdaptiveDpr, AdaptiveEvents, Html, Lightformer } from '@react-three/drei';
import HolographicLoader from './HolographicLoader';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';
import { isMobileDevice } from './utils/webglDetect';
import HolographicEffects from './postprocessing/HolographicEffects';
import CinematicCamera from './CinematicCamera';
import { MultiSensoryProvider } from './sensory/MultiSensoryEngine';
import LiveVitalsOverlay from './LiveVitalsOverlay';
import CollaborativeSessionLayer from './collab/CollaborativeSessionLayer';
import MediaPipeGestureLayer from './collab/MediaPipeGestureLayer';
import { useUser } from '../../contexts/UserContext';
import WebXRSpatialLayer from './xr/WebXRSpatialLayer';
import VoiceCommandController from './xr/VoiceCommandController';
import AdaptiveQualityController from './perf/AdaptiveQualityController';
import PerformanceTelemetryOverlay from './perf/PerformanceTelemetryOverlay';
import SurgicalPlanningMode from './clinical/SurgicalPlanningMode';
import RadiationDoseOverlay from './clinical/RadiationDoseOverlay';
import FlyThroughNavigator from './clinical/FlyThroughNavigator';
import DicomVolumeRenderer from './clinical/DicomVolumeRenderer';
import { getStlExportService } from '../../services/realtime/StlExportService';

function SceneCommandApplier({ rootGroupRef, globalOpacity, organVisibility }) {
  const { invalidate } = useThree();

  useEffect(() => {
    const root = rootGroupRef?.current;
    if (!root) return;

    root.traverse((node) => {
      if (!node?.isMesh || !node.material) return;

      const name = `${node.name || ''}`.toLowerCase();
      const parentName = `${node.parent?.name || ''}`.toLowerCase();
      const text = `${name} ${parentName}`;

      const targets = [
        { key: 'heart', match: /heart|cardiac/ },
        { key: 'brain', match: /brain|neuro/ },
        { key: 'lungs', match: /lung|pulmo/ },
      ];

      let visible = true;
      targets.forEach((target) => {
        if (target.match.test(text) && organVisibility[target.key] === false) {
          visible = false;
        }
      });

      node.visible = visible;

      const materialList = Array.isArray(node.material) ? node.material : [node.material];
      materialList.forEach((material) => {
        if (typeof material.opacity === 'number') {
          material.transparent = globalOpacity < 0.99 ? true : material.transparent;
          material.opacity = globalOpacity;
          material.needsUpdate = true;
        }
      });
    });

    invalidate();
    return undefined;
  }, [globalOpacity, invalidate, organVisibility, rootGroupRef]);

  return null;
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(4, n));
}

function getSeverityMetrics(scores = {}) {
  const values = Object.values(scores).map(clampScore);
  if (!values.length) {
    return { average: 0, max: 0, critical: false };
  }
  const total = values.reduce((sum, score) => sum + score, 0);
  const max = values.reduce((m, score) => Math.max(m, score), 0);
  return {
    average: total / values.length,
    max,
    critical: max >= 4,
  };
}

// Default holographic lighting rig
function HolographicLights({ severityScores }) {
  const { average, max, critical } = getSeverityMetrics(severityScores);
  const severityBlend = average / 4;

  const keyColor = critical ? '#ff6666' : '#00e5ff';
  const fillColor = critical ? '#ff4d6d' : '#a855f7';
  const rimColor = max >= 3 ? '#ff8a65' : '#10b981';

  return (
    <>
      {/* Soft overall fill */}
      <ambientLight intensity={0.28 + severityBlend * 0.15} color={critical ? '#391515' : '#1a2a4a'} />
      {/* Key light — cyan hue */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8 + severityBlend * 0.35}
        color={keyColor}
        castShadow
      />
      {/* Fill light — purple hue */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.45 + severityBlend * 0.2}
        color={fillColor}
      />
      {/* Rim / accent point light */}
      <pointLight position={[0, -5, 0]} intensity={0.6 + severityBlend * 0.25} color={rimColor} />
      <pointLight position={[0, 2.6, 1.5]} intensity={0.75 + max * 0.18} color={critical ? '#ff5151' : '#8cf6ff'} />
    </>
  );
}

function DynamicSeverityEnvironment({ severityScores }) {
  const { average, max, critical } = getSeverityMetrics(severityScores);
  const severityBlend = average / 4;

  const topColor = critical ? '#ff5f6d' : '#00e5ff';
  const bottomColor = critical ? '#ff2f4f' : '#7c3aed';
  const accentColor = max >= 3 ? '#ff7a45' : '#6ee7ff';

  return (
    <Environment resolution={256} frames={1}>
      <Lightformer
        intensity={2.6 + severityBlend * 1.4}
        color={topColor}
        position={[0, 6, -10]}
        scale={[12, 8, 1]}
      />
      <Lightformer
        intensity={2.2 + severityBlend * 1.2}
        color={bottomColor}
        position={[0, -5, -8]}
        scale={[10, 8, 1]}
      />
      <Lightformer
        intensity={1.6 + max * 0.4}
        color={accentColor}
        position={[0, 1, 8]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        intensity={critical ? 2.6 : 1.2}
        color={critical ? '#ff4545' : '#4f46e5'}
        position={[-6, 1, 2]}
        scale={[4, 4, 1]}
      />
    </Environment>
  );
}

/**
 * HolographicCanvas component
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children   - 3D scene content
 * @param {number}  [props.fov=60]           - Camera field of view
 * @param {number}  [props.near=0.1]         - Camera near clipping plane
 * @param {number}  [props.far=1000]         - Camera far clipping plane
 * @param {[number,number,number]} [props.cameraPosition=[0,0,5]] - Initial camera position
 * @param {boolean} [props.controls=true]    - Enable orbit controls
 * @param {boolean} [props.shadows=false]    - Enable shadow maps
 * @param {string}  [props.className]        - CSS class for the outer div
 * @param {object}  [props.style]            - Inline styles for the outer div
 * @param {React.ReactNode} [props.fallback] - Fallback while loading
 */
export default function HolographicCanvas({
  children,
  fov = 60,
  near = 0.1,
  far = 1000,
  cameraPosition = [0, 0, 5],
  controls = true,
  shadows = false,
  className = '',
  style = {},
  fallback,
  postProcessing = true,
  severityScores = {},
  focusDistance = 0.02,
  outlineThickness = 1.4,
  outlineGlow = 1.15,
  outlineEnabled = true,
  cinematic = false,
  cinematicContext = {},
  vitals = {},
  liveVitals = false,
  patientId = 'default-patient',
  onLiveVitalsUpdate,
  collaborationEnabled = false,
  collaborationSessionId,
  collaborationSelectedOrgan = 'general',
  gestureControlEnabled = false,
  xrEnabled = false,
  voiceCommandsEnabled = false,
  adaptiveQuality = true,
  telemetryEnabled = true,
  clinicalWorkflowEnabled = false,
  radiationEnabled = false,
  flyThroughEnabled = false,
  dicomEnabled = false,
  flyThroughMode = 'vascular',
}) {
  const { supported, tier, reducedMotion } = useWebGLSupport();
  const { user } = useUser();
  const mobile = isMobileDevice();
  const { average } = getSeverityMetrics(severityScores);
  const [dynamicFocusDistance, setDynamicFocusDistance] = useState(focusDistance);
  const [gestureRay, setGestureRay] = useState(null);
  const [collabPermissions, setCollabPermissions] = useState(null);
  const [globalOpacity, setGlobalOpacity] = useState(1);
  const [organVisibility, setOrganVisibility] = useState({ heart: true, brain: true, lungs: true });
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [adaptiveDprScale, setAdaptiveDprScale] = useState(1);
  const [qualityLevel, setQualityLevel] = useState(tier === 'low' ? 'low' : 'high');
  const [gpuStats, setGpuStats] = useState({ bytes: 0, textures: 0, geometries: 0 });
  const [trajectoryPlan, setTrajectoryPlan] = useState(null);
  const [dicomLoaded, setDicomLoaded] = useState(false);
  const controlsRef = useRef(null);
  const rootGroupRef = useRef(null);
  const resistance = 1 + average * 0.35;

  const fallbackRole = useMemo(() => {
    if (!user?.role) return 'resident';
    if (user.role === 'physician' || user.role === 'admin') return 'attending';
    if (user.role === 'nurse') return 'fellow';
    if (user.role === 'student') return 'resident';
    return user.role;
  }, [user?.role]);

  const canManipulate = collabPermissions?.canManipulate ?? (fallbackRole !== 'resident');
  const canAnnotate = collabPermissions?.canAnnotate ?? (fallbackRole !== 'resident');
  const canWhiteboard = collabPermissions?.canWhiteboard ?? (fallbackRole !== 'resident');
  const canExportReplay = collabPermissions?.canExportReplay ?? (fallbackRole === 'attending');

  const applyVoiceActions = useCallback((actions) => {
    if (!Array.isArray(actions) || actions.length === 0) return;

    actions.forEach((action) => {
      if (action.type === 'ORGAN_VISIBILITY') {
        setOrganVisibility((prev) => ({ ...prev, [action.organ]: action.visible }));
      }

      if (action.type === 'OPACITY') {
        setGlobalOpacity((prev) => {
          const delta = action.direction === 'up' ? action.amount : -action.amount;
          return Math.max(0.2, Math.min(1, prev + delta));
        });
      }

      if (action.type === 'CAMERA_ZOOM' && controlsRef.current) {
        if (action.direction === 'in') {
          controlsRef.current.dollyIn(1 + action.amount);
        } else {
          controlsRef.current.dollyOut(1 + action.amount);
        }
        controlsRef.current.update();
      }

      if (action.type === 'CAMERA_ROTATE' && controlsRef.current) {
        const delta = action.direction === 'left' ? action.amount : -action.amount;
        controlsRef.current.rotateLeft(delta);
        controlsRef.current.update();
      }
    });
  }, []);

  // Graceful degradation: if WebGL is unavailable render fallback
  if (!supported) {
    return (
      <div
        role="img"
        aria-label="3D visualization unavailable — WebGL not supported"
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(11,18,32,0.8)',
          borderRadius: 12,
          color: '#00e5ff',
          fontSize: 14,
          padding: 24,
          ...style,
        }}
      >
        3D visualization requires WebGL support.
      </div>
    );
  }

  // Pixel ratio scaled dynamically for sustained FPS.
  const baseDpr = mobile ? 1.2 : 1.5;
  const dpr = Math.max(0.55, Math.min(baseDpr * adaptiveDprScale, 2));

  // Frame loop: 'never' respects reduced-motion preference
  const frameloop = reducedMotion ? 'demand' : 'always';

  return (
    <div
      className={`holographic-canvas-wrapper ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      <VoiceCommandController
        enabled={voiceCommandsEnabled}
        onActions={applyVoiceActions}
        onTranscript={setVoiceTranscript}
      />
      <Canvas
        camera={{ fov, near, far, position: cameraPosition }}
        shadows={shadows && tier === 'high'}
        dpr={dpr}
        frameloop={frameloop}
        gl={{ antialias: tier !== 'low', alpha: true, powerPreference: tier === 'low' ? 'low-power' : 'high-performance' }}
        aria-label="Interactive 3D medical visualization"
      >
        {/* Adaptive quality helpers */}
        {!adaptiveQuality && <AdaptiveDpr pixelated />}
        <AdaptiveEvents />

        {/* Lighting */}
        <HolographicLights severityScores={severityScores} />

        {/* Dynamic environment mapping reacts to organ severity */}
        {tier === 'high' ? (
          <DynamicSeverityEnvironment severityScores={severityScores} />
        ) : (
          <Environment preset="night" />
        )}

        {/* Scene content + multisensory engine */}
        <MultiSensoryProvider severityScore={average} vitals={vitals}>
          <Suspense fallback={(
            <Html center>
              {fallback || <HolographicLoader size={34} label="" />}
            </Html>
          )}>
            <group ref={rootGroupRef}>
              {children}
            </group>
            <SceneCommandApplier
              rootGroupRef={rootGroupRef}
              globalOpacity={globalOpacity}
              organVisibility={organVisibility}
            />
            {liveVitals && (
              <LiveVitalsOverlay
                enabled={liveVitals}
                patientId={patientId}
                initialVitals={vitals}
                onVitalsUpdate={onLiveVitalsUpdate}
              />
            )}
            {collaborationEnabled && (
              <>
                <CollaborativeSessionLayer
                  enabled={collaborationEnabled}
                  sessionId={collaborationSessionId || String(patientId || '3d-collab-session')}
                  user={user}
                  selectedOrgan={collaborationSelectedOrgan}
                  canManipulate={canManipulate}
                  canAnnotate={canAnnotate}
                  canWhiteboard={canWhiteboard}
                  canExportReplay={canExportReplay}
                  onPermissions={setCollabPermissions}
                  gestureRay={gestureRay}
                />
                <MediaPipeGestureLayer
                  enabled={gestureControlEnabled && collaborationEnabled}
                  controlsRef={controlsRef}
                  canInteract={canManipulate}
                  onPointSelect={setGestureRay}
                />
              </>
            )}
            {xrEnabled && (
              <WebXRSpatialLayer
                enabled={xrEnabled}
                sessionId={collaborationSessionId || String(patientId || 'xr-session')}
                rootGroupRef={rootGroupRef}
                controlsRef={controlsRef}
              />
            )}

            {(voiceCommandsEnabled || voiceTranscript) && (
              <Html position={[2.2, 2.2, 0]} transform occlude="blending">
                <div style={{
                  background: 'rgba(2,6,23,0.85)',
                  border: '1px solid rgba(34,197,94,0.55)',
                  borderRadius: 8,
                  color: '#dcfce7',
                  padding: '6px 8px',
                  minWidth: 220,
                  fontSize: 11,
                }}>
                  <div><strong>Voice Control</strong> {voiceCommandsEnabled ? 'active' : 'inactive'}</div>
                  <div style={{ opacity: 0.85 }}>{voiceTranscript || 'Awaiting command…'}</div>
                </div>
              </Html>
            )}

            {adaptiveQuality && (
              <AdaptiveQualityController
                enabled={adaptiveQuality}
                rootGroupRef={rootGroupRef}
                controlsRef={controlsRef}
                tier={tier}
                onDprChange={setAdaptiveDprScale}
                onQualityLevelChange={setQualityLevel}
                onGpuStats={setGpuStats}
              />
            )}

            <PerformanceTelemetryOverlay
              enabled={telemetryEnabled}
              gpuStats={gpuStats}
              qualityLevel={qualityLevel}
            />

            {clinicalWorkflowEnabled && (
              <SurgicalPlanningMode
                enabled={clinicalWorkflowEnabled}
                targetRootRef={rootGroupRef}
                onTrajectoryChange={setTrajectoryPlan}
              />
            )}

            {radiationEnabled && (
              <RadiationDoseOverlay
                enabled={radiationEnabled}
                tumorCenter={trajectoryPlan?.target || [0.25, 0.15, 0.3]}
                doseLevel={average > 0 ? Math.min(1, average / 4 + 0.35) : 0.65}
              />
            )}

            {flyThroughEnabled && (
              <FlyThroughNavigator
                enabled={flyThroughEnabled}
                mode={flyThroughMode}
              />
            )}

            {dicomEnabled && (
              <DicomVolumeRenderer
                enabled={dicomEnabled}
                onLoaded={() => setDicomLoaded(true)}
              />
            )}

            {clinicalWorkflowEnabled && (
              <Html position={[-2.4, 2.4, 0]} transform occlude="blending">
                <div style={{ background: 'rgba(2,6,23,0.86)', border: '1px solid #22d3ee99', borderRadius: 8, padding: '7px 9px', color: '#dbeafe', fontSize: 11, minWidth: 220 }}>
                  <div><strong>Clinical Workflow</strong></div>
                  {trajectoryPlan && <div>Trajectory planned ✓</div>}
                  {dicomLoaded && <div>DICOM volume loaded ✓</div>}
                  <button
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      try {
                        getStlExportService().exportSceneObject(rootGroupRef.current, 'caredroid-patient-anatomy.stl');
                      } catch {
                        // noop
                      }
                    }}
                  >
                    Export STL for 3D Printing
                  </button>
                </div>
              </Html>
            )}
          </Suspense>
        </MultiSensoryProvider>

        {cinematic && tier !== 'low' && (
          <CinematicCamera
            enabled={cinematic}
            aiText={cinematicContext.aiText}
            organ={cinematicContext.organ}
            urgency={cinematicContext.urgency}
            severity={average}
            focusMarkers={cinematicContext.focusMarkers}
            easing={cinematicContext.easing || 'easeInOut'}
            gazeTracking={cinematicContext.gazeTracking !== false}
            onFocusDistanceChange={setDynamicFocusDistance}
          />
        )}

        {postProcessing && tier !== 'low' && !reducedMotion && (
          <HolographicEffects
            severityScore={average}
            focusDistance={cinematic ? dynamicFocusDistance : focusDistance}
            outlineThickness={outlineThickness}
            outlineGlow={outlineGlow}
            outlineEnabled={outlineEnabled}
            temporalUpscaleStrength={adaptiveDprScale < 0.95 ? 0.42 : 0.28}
            lowQuality={qualityLevel === 'low'}
          />
        )}

        {/* Camera controls */}
        {controls && (
          <OrbitControls
            ref={controlsRef}
            enablePan
            enableZoom
            enableRotate={!reducedMotion && canManipulate}
            enableDamping
            dampingFactor={Math.min(0.22, 0.05 * resistance)}
            rotateSpeed={canManipulate ? 1 / resistance : 0}
            zoomSpeed={canManipulate ? 0.9 / resistance : 0}
            panSpeed={canManipulate ? 0.8 / resistance : 0}
            minDistance={1}
            maxDistance={50}
            // Keyboard controls
            keys={{
              LEFT: 'ArrowLeft',
              UP: 'ArrowUp',
              RIGHT: 'ArrowRight',
              BOTTOM: 'ArrowDown',
            }}
          />
        )}
      </Canvas>
    </div>
  );
}
