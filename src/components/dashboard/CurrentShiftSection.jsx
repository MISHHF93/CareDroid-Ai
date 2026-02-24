import React from 'react';
import { ClinicalBanner } from './ClinicalBanner';
import { StatsRow } from './StatsRow';
import { SmartTriageQueue } from './SmartTriageQueue';
import { MyWorkload } from './MyWorkload';
import { ToolsGrid } from './ToolsGrid';
import WidgetErrorBoundary from './WidgetErrorBoundary';

/**
 * CurrentShiftSection - Main clinical operations section
 * Contains immediate action items, stats, and quick tools
 */
export const CurrentShiftSection = ({
  tr,
  cdsReminders,
  stats,
  alerts,
  handleAcknowledgeAlert,
  handleAlertClick,
  workload,
  toggleTask,
  toolRegistry,
  favorites,
  recentTools,
  recordToolAccess,
  trackToolAccess,
  navigate,
  isMobile
}) => {
  return (
    <section className="dashboard-tier" aria-label="Current Shift - Immediate action and operations">
      <div className="dashboard-tier-head">
        <h2 className="dashboard-tier-title">{tr('dashboard.tierShift', 'Current Shift')}</h2>
      </div>

      <div className="dashboard-tier-body">
        <WidgetErrorBoundary widgetName="Clinical Banner">
          <ClinicalBanner reminders={cdsReminders.length > 0 ? cdsReminders : undefined} />
        </WidgetErrorBoundary>

        <section className="dashboard-overview" aria-label="Clinical overview">
          <StatsRow stats={stats} tr={tr} />

          <div className="dashboard-row-2col dashboard-row-enter">
            <WidgetErrorBoundary widgetName="Triage Queue">
              <SmartTriageQueue
                alerts={alerts}
                onAcknowledge={handleAcknowledgeAlert}
                onAlertClick={handleAlertClick}
              />
            </WidgetErrorBoundary>
            <WidgetErrorBoundary widgetName="My Workload">
              <MyWorkload
                tasks={workload?.tasks}
                shiftEnd={workload?.shiftEnd}
                onToggleTask={toggleTask}
              />
            </WidgetErrorBoundary>
          </div>

          <ToolsGrid
            toolRegistry={toolRegistry}
            favorites={favorites}
            recentTools={recentTools}
            recordToolAccess={recordToolAccess}
            trackToolAccess={trackToolAccess}
            navigate={navigate}
            isMobile={isMobile}
          />
        </section>
      </div>
    </section>
  );
};