import React from 'react';
import { ToolCard } from './ToolCard';
import WidgetErrorBoundary from './WidgetErrorBoundary';

/**
 * ToolsGrid - Composite component for dashboard tool access
 * Displays quick access tools with error boundaries
 */
export const ToolsGrid = ({ toolRegistry, favorites, recentTools, recordToolAccess, trackToolAccess, navigate, isMobile }) => {
  return (
    <div className="dashboard-tools-grid dashboard-row-enter">
      {toolRegistry.slice(0, 4).map((tool) => (
        <WidgetErrorBoundary key={tool.id} widgetName={tool.name}>
          <ToolCard
            icon={tool.icon}
            name={tool.name}
            description={tool.description}
            color={tool.color}
            shortcut={!isMobile ? tool.shortcut : undefined}
            isFavorite={favorites.includes(tool.id)}
            recentlyUsed={recentTools.includes(tool.id)}
            onClick={() => {
              recordToolAccess(tool.id);
              trackToolAccess(tool.id);
              navigate(tool.path);
            }}
          />
        </WidgetErrorBoundary>
      ))}
    </div>
  );
};