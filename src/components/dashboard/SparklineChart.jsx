import React, { useState, useRef, useCallback } from 'react';

/**
 * SparklineChart — Tiny inline SVG sparkline for StatCards
 * Renders a 7-point trend line with area fill and hover tooltips
 */
export const SparklineChart = ({
  data = [],
  width = 120,
  height = 32,
  color = '#63B3ED',
  showDots = false,
  labels,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length < 2) return null;

  const values = data.map((d) => (typeof d === 'number' ? d : d.value ?? 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * innerW;
    const y = pad + innerH - ((v - min) / range) * innerH;
    return { x, y, value: v };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Calculate hit zones for each point (wider than dots for easy hovering)
  const hitWidth = innerW / (values.length - 1);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const idx = Math.round(((relX - pad) / innerW) * (values.length - 1));
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    setHoveredIdx(clamped);
  }, [innerW, values.length]);

  const handleMouseLeave = useCallback(() => setHoveredIdx(null), []);

  const defaultLabels = values.map((_, i) => `Day ${i + 1}`);
  const pointLabels = labels || defaultLabels;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        aria-hidden="true"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Area fill */}
        <path d={areaPath} fill={`${color}20`} />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {showDots &&
          points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2} fill={color} />
          ))}
        {/* End dot (always show last point) */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} fill={color} />
        {/* Hover dot */}
        {hoveredIdx !== null && (
          <>
            <line x1={points[hoveredIdx].x} y1={0} x2={points[hoveredIdx].x} y2={height} stroke={`${color}40`} strokeWidth={1} strokeDasharray="2,2" />
            <circle cx={points[hoveredIdx].x} cy={points[hoveredIdx].y} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
          </>
        )}
      </svg>
      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: `${points[hoveredIdx].x}px`,
            top: `${points[hoveredIdx].y - 8}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            padding: '3px 7px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#fff',
            background: 'rgba(15,23,42,0.85)',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {pointLabels[hoveredIdx]}: {values[hoveredIdx]}
        </div>
      )}
    </div>
  );
};

export default SparklineChart;
