import React from 'react';
import { Card } from '../ui/molecules/Card';
import { Badge } from '../ui/atoms/Badge';

/**
 * ToolCard - Dashboard quick access tool card
 * Displays clinical tools with shortcuts and favorites
 */
export const ToolCard = ({
  icon,
  name,
  description,
  color,
  shortcut,
  onClick,
  isFavorite = false,
  recentlyUsed = false
}) => {
  return (
    <Card
      padding="lg"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'visible',
        borderTop: `3px solid ${color}`,
        background: `linear-gradient(135deg, ${color}08, transparent)`
      }}
      hoverStyle={{
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${color}20, 0 0 0 1px ${color}30`
      }}
    >
      {/* Badges */}
      <div style={{
        position: 'absolute',
        top: '-8px',
        right: '12px',
        display: 'flex',
        gap: '6px'
      }}>
        {isFavorite && (
          <Badge variant="success" size="sm">
            ⭐
          </Badge>
        )}
        {recentlyUsed && (
          <Badge variant="info" size="sm">
            Recent
          </Badge>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        height: '100%'
      }}>
        {/* Icon and Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}>
          <div style={{
            fontSize: '32px',
            lineHeight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {name}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {description}
        </p>

        {/* Shortcut key */}
        {shortcut && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 'auto'
          }}>
            <kbd style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono, monospace)'
            }}>
              {shortcut}
            </kbd>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ToolCard;
