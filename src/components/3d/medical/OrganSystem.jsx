/**
 * OrganSystem
 * Renders a set of labelled organ models arranged in anatomical positions.
 * Supports per-organ colour coding for severity (e.g. SOFA score).
 *
 * Must be rendered inside a <Canvas> / HolographicCanvas context.
 */

import React from 'react';
import HeartModel from './HeartModel';
import BrainModel from './BrainModel';
import LungsModel from './LungsModel';

/**
 * Severity → colour mapping (mirrors SOFA score colouring)
 */
const SEVERITY_COLORS = {
  normal: '#10b981',    // green
  mild: '#f59e0b',      // amber
  moderate: '#f97316',  // orange
  severe: '#ef4444',    // red
  critical: '#dc2626',  // deep red
};

function severityColor(score) {
  if (score === 0) return SEVERITY_COLORS.normal;
  if (score <= 1) return SEVERITY_COLORS.mild;
  if (score <= 2) return SEVERITY_COLORS.moderate;
  if (score <= 3) return SEVERITY_COLORS.severe;
  return SEVERITY_COLORS.critical;
}

/**
 * @param {object}  props
 * @param {object}  [props.scores]                - Organ-level SOFA sub-scores
 * @param {number}  [props.scores.heart=0]
 * @param {number}  [props.scores.brain=0]
 * @param {number}  [props.scores.lungs=0]
 * @param {object}  [props.vitals]                - Live vitals for physiological animation sync
 * @param {boolean} [props.interactive=true]
 * @param {boolean} [props.rotateOnHover=false]
 * @param {boolean} [props.showLabel=true]
 */
export default function OrganSystem({
  scores = {},
  vitals = {},
  interactive = true,
  rotateOnHover = false,
  showLabel = true,
}) {
  const { heart = 0, brain = 0, lungs = 0 } = scores;
  const heartbeat = Number(
    vitals.heartRate?.value
      || vitals.heartRate
      || vitals.HR
      || 72
  );

  return (
    <group>
      <BrainModel
        position={[0, 1.6, 0]}
        color={severityColor(brain)}
        severity={brain}
        heartbeat={heartbeat}
        interactive={interactive}
        rotateOnHover={rotateOnHover}
        showLabel={showLabel}
      />
      <LungsModel
        position={[0, 0, 0]}
        color={severityColor(lungs)}
        severity={lungs}
        heartbeat={heartbeat}
        interactive={interactive}
        rotateOnHover={rotateOnHover}
        showLabel={showLabel}
      />
      <HeartModel
        position={[0, -1.6, 0]}
        color={severityColor(heart)}
        severity={heart}
        heartbeat={heartbeat}
        interactive={interactive}
        rotateOnHover={rotateOnHover}
        showLabel={showLabel}
      />
    </group>
  );
}
