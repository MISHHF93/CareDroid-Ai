/**
 * FloatingCard
 * A depth-layered UI panel with parallax-style elevation and glassmorphism styling.
 * Renders as a plain HTML/CSS component (no canvas required).
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {number}  [props.elevation=1]    - 1–3, controls shadow depth
 * @param {string}  [props.title]          - Optional card title
 * @param {string}  [props.className]
 * @param {object}  [props.style]
 */

import React from 'react';

const shadowsByElevation = {
  1: '0 4px 24px rgba(0,229,255,0.10), 0 1px 6px rgba(0,0,0,0.4)',
  2: '0 8px 36px rgba(0,229,255,0.18), 0 2px 12px rgba(0,0,0,0.5)',
  3: '0 16px 56px rgba(0,229,255,0.28), 0 4px 24px rgba(0,0,0,0.6)',
};

const baseStyle = {
  background: 'rgba(11,18,32,0.72)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,229,255,0.18)',
  borderRadius: 12,
  padding: 16,
  color: '#e2e8f0',
  transition: 'box-shadow 0.3s ease, transform 0.3s ease',
};

export default function FloatingCard({
  children,
  elevation = 1,
  title,
  className = '',
  style = {},
}) {
  const clampedElevation = Math.min(Math.max(Math.round(elevation), 1), 3);

  return (
    <div
      className={`floating-card floating-card--elevation-${clampedElevation} ${className}`}
      style={{
        ...baseStyle,
        boxShadow: shadowsByElevation[clampedElevation],
        transform: `translateY(${(clampedElevation - 1) * -2}px)`,
        ...style,
      }}
    >
      {title && (
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: '#00e5ff',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
