import React from 'react';
import { BedBoard } from './BedBoard';
import { OnCallRoster } from './OnCallRoster';
import { ActivityFeed } from './ActivityFeed';
import WidgetErrorBoundary from './WidgetErrorBoundary';

/**
 * WardSection — Bed board, on-call roster, and recent activity feed
 * Layout:
 *   Row 1 (2-col): BedBoard | OnCallRoster
 *   Row 2 (full):  ActivityFeed
 */
export const WardSection = ({
  tr,
  beds = [],
  roster = [],
  activities = [],
  onPage,
  onMessage,
  onActivityClick,
}) => {
  return (
    <section className="dashboard-tier" aria-label="Ward Overview — beds, on-call team, and activity">
      <div className="dashboard-tier-head">
        <h2 className="dashboard-tier-title">{tr('dashboard.tierWard', 'Ward Overview')}</h2>
      </div>
      <div className="dashboard-tier-body">
        <div className="dashboard-row-2col dashboard-row-enter">
          <WidgetErrorBoundary widgetName="Bed Board">
            <BedBoard beds={beds.length > 0 ? beds : undefined} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="On-Call Roster">
            <OnCallRoster
              roster={roster.length > 0 ? roster : undefined}
              onPage={onPage}
              onMessage={onMessage}
            />
          </WidgetErrorBoundary>
        </div>
        <WidgetErrorBoundary widgetName="Activity Feed">
          <ActivityFeed
            activities={activities}
            onActivityClick={onActivityClick}
          />
        </WidgetErrorBoundary>
      </div>
    </section>
  );
};

export default WardSection;
