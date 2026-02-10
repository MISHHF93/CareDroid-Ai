import React from 'react';
import { Card } from '../ui/molecules/Card';
import { SparklineChart } from './SparklineChart';

/**
 * StatCard - Dashboard statistics card component
 * Displays key metrics with trend indicators and optional sparkline
 */
export const StatCard = ({
  label,
  value,
  trend,
  trendDirection,
  color = 'info',
  icon,
  onClick,
  sparklineData
}) => {
  const colorMap = {
    critical: '#EF4444',
    warning: '#F59E0B',
    info: '#63B3ED',
    success: '#00FF88'
  };

  const bgColorMap = {
    critical: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
    info: 'rgba(99, 179, 237, 0.1)',
    success: 'var(--accent-10)'
  };

  const getTrendColor = () => {
    if (!trend) return 'var(--text-tertiary)';
    if (color === 'critical') {
      return trendDirection === 'up' ? '#EF4444' : '#10B981';
    }
    return trendDirection === 'up' ? '#10B981' : '#EF4444';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trendDirection === 'up' ? '↑' : '↓';
  };

  return (
    <Card
      padding="lg"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        borderLeft: `4px solid ${colorMap[color]}`,
        background: `linear-gradient(135deg, ${bgColorMap[color]}, transparent)`
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)'
      }}>
        {/* Header with icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {label}
          </span>
          {icon && (
            <span style={{
              fontSize: '24px',
              opacity: 0.6
            }}>
              {icon}
            </span>
          )}
        </div>

        {/* Value and trend */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-2)'
        }}>
          <span style={{
            fontSize: '32px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            lineHeight: 1
          }}>
            {value}
          </span>
          {trend && (
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: getTrendColor(),
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              <span>{getTrendIcon()}</span>
              <span>{trend}</span>
            </span>
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <div style={{ marginTop: 'var(--space-1)' }}>
            <SparklineChart
              data={sparklineData}
              color={colorMap[color]}
              width={140}
              height={28}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
