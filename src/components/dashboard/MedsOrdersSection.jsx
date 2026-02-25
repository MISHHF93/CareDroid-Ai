import React from 'react';
import { MARPreview } from './MARPreview';
import { QuickOrders } from './QuickOrders';
import WidgetErrorBoundary from './WidgetErrorBoundary';

/**
 * MedsOrdersSection — Medication administration record + quick order templates
 * 2-column: MARPreview (left) + QuickOrders (right)
 */
export const MedsOrdersSection = ({
  tr,
  medications = [],
  patients = [],
  onAdminister,
  onViewMAR,
  onPlaceOrder,
}) => {
  return (
    <section className="dashboard-tier" aria-label="Medications and Orders">
      <div className="dashboard-tier-head">
        <h2 className="dashboard-tier-title">{tr('dashboard.tierMedsOrders', 'Medications & Orders')}</h2>
      </div>
      <div className="dashboard-tier-body">
        <div className="dashboard-row-2col dashboard-row-enter">
          <WidgetErrorBoundary widgetName="MAR Preview">
            <MARPreview
              medications={medications.length > 0 ? medications : undefined}
              onAdminister={onAdminister}
              onViewMAR={onViewMAR}
            />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary widgetName="Quick Orders">
            <QuickOrders
              patients={patients}
              onPlaceOrder={onPlaceOrder}
            />
          </WidgetErrorBoundary>
        </div>
      </div>
    </section>
  );
};

export default MedsOrdersSection;
