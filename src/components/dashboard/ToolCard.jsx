import React from 'react';
import { Card } from '../ui/molecules/Card';

/**
 * ToolCard — Compact icon tile for quick-access clinical tools
 * EMR-density: icon + name only, ~58px tall
 */
export const ToolCard = ({
  icon,
  name,
  description,   // kept in API, not rendered for density
  color,
  shortcut,      // kept in API, not rendered on mobile
  onClick,
  isFavorite = false,
  recentlyUsed = false
}) => {
  return (
    <Card
      padding="none"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        borderTop: `2px solid ${color}`,
        padding: '8px 8px 7px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        textAlign: 'center',
        minHeight: '58px',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${color}25`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Favorite / recent dot indicator */}
      {(isFavorite || recentlyUsed) && (
        <span style={{
          position: 'absolute',
          top: 5,
          right: 5,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isFavorite ? '#F59E0B' : '#63B3ED',
          flexShrink: 0
        }} />
      )}

      {/* Icon */}
      <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>

      {/* Name */}
      <span style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        paddingInline: 2
      }}>
        {name}
      </span>
    </Card>
  );
};

export default ToolCard;
