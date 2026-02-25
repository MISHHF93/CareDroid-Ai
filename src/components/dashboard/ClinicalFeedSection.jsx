import React from 'react';
import { CommandFeed } from './CommandFeed';
import { LabTimeline } from './LabTimeline';
import WidgetErrorBoundary from './WidgetErrorBoundary';

/**
 * ClinicalFeedSection — Activity command feed + lab timeline
 * 2-column: CommandFeed (left) + LabTimeline (right)
 */
export const ClinicalFeedSection = ({
  tr,
  activities = [],
  labEvents = [],
  onActivityClick,
}) => {
  return (
    <section className="dashboard-tier" aria-label="Clinical Feed — activity and lab results">
      <div className="dashboard-tier-head">
        <h2 className="dashboard-tier-title">{tr('dashboard.tierClinicalFeed', 'Clinical Feed')}</h2>
      </div>
      <div className="dashboard-tier-body">
        <div className="dashboard-row-2col dashboard-row-enter">
          <WidgetErrorBoundary widgetName="Command Feed">
            <CommandFeed
              activities={activities}
              onActivityClick={onActivityClick}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Lab Timeline">
            <LabTimeline events={labEvents.length > 0 ? labEvents : undefined} />
          </WidgetErrorBoundary>
        </div>
      </div>
    </section>
  );
};

export default ClinicalFeedSection;
