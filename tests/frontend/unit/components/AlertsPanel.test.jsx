import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';

describe('AlertsPanel', () => {
  it('renders empty state', () => {
    render(<AlertsPanel alerts={[]} />);

    expect(screen.getByText('No active alerts')).toBeInTheDocument();
    expect(screen.getByText('All systems normal')).toBeInTheDocument();
  });

  it('renders alerts and handles acknowledge', async () => {
    const user = userEvent.setup();
    const handleAcknowledge = vi.fn().mockResolvedValue(true);
    const alerts = [
      {
        id: 'alert-1',
        severity: 'critical',
        message: 'Sepsis criteria met',
        patientName: 'Sarah Johnson',
        timestamp: new Date(),
        acknowledged: false,
      },
    ];

    render(
      <AlertsPanel
        alerts={alerts}
        onAcknowledge={handleAcknowledge}
      />
    );

    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('Sepsis criteria met')).toBeInTheDocument();
    expect(screen.getByText(/Patient: Sarah Johnson/)).toBeInTheDocument();

    await user.click(screen.getByText('Acknowledge'));

    expect(handleAcknowledge).toHaveBeenCalledWith('alert-1');
  });
});
