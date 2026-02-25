import React from 'react';
import { Card } from '../ui/molecules/Card';
import { SparklineChart } from './SparklineChart';

/**
 * StatCard — Compact clinical stat tile
 * EMR-density: icon + label + big-number + trend in ~72px
 */
export const StatCard = ({
  label,
  value,
  trend,
  trendDirection,
  color = 'info',
  icon,
  onClick,
  sparklineData   // reserved, not rendered for density
}) => {
  const colorMap = {
    critical: '#EF4444',
    warning: '#F59E0B',
    info: '#63B3ED',
    success: '#22C55E'
  };

  const bgColorMap = {
    critical: 'rgba(239,68,68,0.07)',
    warning: 'rgba(245,158,11,0.07)',
    info: 'rgba(99,179,237,0.07)',
    success: 'rgba(34,197,94,0.07)'
  };

  const getTrendColor = () => {
    if (!trend) return 'var(--text-tertiary)';
    if (color === 'critical') return trendDirection === 'up' ? '#EF4444' : '#22C55E';
    return trendDirection === 'up' ? '#22C55E' : '#EF4444';
  };

  const accent = colorMap[color] ?? colorMap.info;
  const bg = bgColorMap[color] ?? bgColorMap.info;

  return (
    <Card
      padding="none"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        borderLeft: `3px solid ${accent}`,
        background: bg,
        padding: '10px 12px',
        minHeight: '68px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '4px'
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          lineHeight: 1.2,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {label}
        </span>
        {icon && (
          <span style={{ fontSize: '15px', opacity: 0.55, lineHeight: 1, flexShrink: 0 }}>
            {icon}
          </span>
        )}
      </div>

      {/* Value + trend row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.5px'
        }}>
          {value}
        </span>
        {trend && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: getTrendColor(),
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <span>{trendDirection === 'up' ? '↑' : '↓'}</span>
            <span>{trend}</span>
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div style={{ marginTop: 2 }}>
          <SparklineChart
            data={sparklineData}
            width={100}
            height={24}
            color={accent}
          />
        </div>
      )}
    </Card>
  );
};

export default StatCard;
