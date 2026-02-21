/**
 * HolographicLoader
 * Animated loading indicator rendered as a CSS/SVG DNA-helix spinner.
 * Used as the Suspense fallback inside HolographicCanvas.
 *
 * Does NOT depend on Three.js — safe to use outside a Canvas.
 */

import React from 'react';

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    minHeight: 120,
    gap: 12,
  },
  label: {
    color: '#00e5ff',
    fontSize: 13,
    letterSpacing: '0.08em',
    opacity: 0.8,
    fontFamily: 'monospace',
  },
};

/**
 * A small CSS-animated helix SVG used as a 3D-scene loading spinner.
 *
 * @param {object}  props
 * @param {string}  [props.label='Loading 3D visualization…']
 * @param {number}  [props.size=56]
 */
export default function HolographicLoader({
  label = 'Loading 3D visualization…',
  size = 56,
}) {
  return (
    <div style={styles.wrapper} role="status" aria-label={label}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer ring */}
        <circle
          cx="28"
          cy="28"
          r="24"
          stroke="#00e5ff"
          strokeWidth="2"
          strokeDasharray="30 120"
          strokeLinecap="round"
          style={{ transformOrigin: '28px 28px', animation: 'holo-spin 1.4s linear infinite' }}
        />
        {/* Inner ring */}
        <circle
          cx="28"
          cy="28"
          r="15"
          stroke="#a855f7"
          strokeWidth="2"
          strokeDasharray="20 75"
          strokeLinecap="round"
          style={{
            transformOrigin: '28px 28px',
            animation: 'holo-spin 1.0s linear infinite reverse',
          }}
        />
        {/* Centre dot */}
        <circle cx="28" cy="28" r="4" fill="#10b981" opacity="0.9" />

        <style>{`
          @keyframes holo-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .holo-spin { animation: none !important; }
          }
        `}</style>
      </svg>

      {label && <span style={styles.label}>{label}</span>}
    </div>
  );
}
