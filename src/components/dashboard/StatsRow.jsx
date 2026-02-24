import React from 'react';
import { StatCard } from './StatCard';
import WidgetErrorBoundary from './WidgetErrorBoundary';

/**
 * StatsRow - Composite component for dashboard statistics
 * Groups related stat cards with error boundaries
 */
export const StatsRow = ({ stats, tr }) => {
  return (
    <div className="dashboard-stats-row dashboard-row-enter">
      <WidgetErrorBoundary widgetName="Critical Patients">
        <StatCard
          label={tr('dashboard.criticalPatients', 'Critical Patients')}
          value={stats?.criticalPatients ?? 0}
          trend={stats?.trends?.criticalPatients?.value != null ? `${stats.trends.criticalPatients.value > 0 ? '+' : ''}${stats.trends.criticalPatients.value}` : undefined}
          trendDirection={stats?.trends?.criticalPatients?.direction}
          color="critical"
          icon="🚨"
        />
      </WidgetErrorBoundary>
      <WidgetErrorBoundary widgetName="Active Patients">
        <StatCard
          label={tr('dashboard.activePatients', 'Active Patients')}
          value={stats?.activePatients ?? 0}
          trend={stats?.trends?.activePatients?.value != null ? `${stats.trends.activePatients.value > 0 ? '+' : ''}${stats.trends.activePatients.value}` : undefined}
          trendDirection={stats?.trends?.activePatients?.direction}
          color="info"
          icon="👥"
        />
      </WidgetErrorBoundary>
      <WidgetErrorBoundary widgetName="Overdue Meds">
        <StatCard
          label="Overdue Meds"
          value={stats?.overdueMeds ?? 0}
          trend={stats?.trends?.overdueMeds?.value != null ? `${stats.trends.overdueMeds.value > 0 ? '+' : ''}${stats.trends.overdueMeds.value}` : undefined}
          trendDirection={stats?.trends?.overdueMeds?.direction}
          color="critical"
          icon="💊"
        />
      </WidgetErrorBoundary>
      <WidgetErrorBoundary widgetName="Pending Orders">
        <StatCard
          label="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          trend={stats?.trends?.pendingOrders?.value != null ? `${stats.trends.pendingOrders.value > 0 ? '+' : ''}${stats.trends.pendingOrders.value}` : undefined}
          trendDirection={stats?.trends?.pendingOrders?.direction}
          color="warning"
          icon="📋"
        />
      </WidgetErrorBoundary>
    </div>
  );
};