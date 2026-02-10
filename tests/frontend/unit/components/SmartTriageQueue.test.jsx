import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SmartTriageQueue } from '@/components/dashboard/SmartTriageQueue';

const mockAlerts = [
  { id: 'a1', severity: 'critical', message: 'Sepsis criteria met', patientName: 'Smith, J.', timestamp: new Date().toISOString(), acknowledged: false, location: 'Room 312A' },
  { id: 'a2', severity: 'high', message: 'K+ 6.2 mEq/L', patientName: 'Chen, M.', timestamp: new Date().toISOString(), acknowledged: false },
  { id: 'a3', severity: 'medium', message: 'Med due in 15min', patientName: 'Smith, J.', timestamp: new Date().toISOString(), acknowledged: false },
];

describe('SmartTriageQueue', () => {
  it('renders with alert count badge', () => {
    render(<SmartTriageQueue alerts={mockAlerts} />);

    expect(screen.getByText('Triage Queue')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // badge count
  });

  it('shows severity badges', () => {
    render(<SmartTriageQueue alerts={mockAlerts} />);

    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('shows empty state when no alerts', () => {
    render(<SmartTriageQueue alerts={[]} />);

    expect(screen.getByText('No active alerts')).toBeInTheDocument();
    expect(screen.getByText('All systems normal')).toBeInTheDocument();
  });

  it('groups alerts by patient', () => {
    render(<SmartTriageQueue alerts={mockAlerts} />);

    // Smith, J. has 2 alerts, should show group header
    expect(screen.getByText('Smith, J.')).toBeInTheDocument();
    expect(screen.getByText('2 alerts')).toBeInTheDocument();
  });

  it('calls onAcknowledge when Acknowledge button is clicked', async () => {
    const user = userEvent.setup();
    const onAck = vi.fn().mockResolvedValue(true);
    render(<SmartTriageQueue alerts={mockAlerts} onAcknowledge={onAck} />);

    const ackButtons = screen.getAllByText(/Acknowledge/);
    await user.click(ackButtons[0]);

    expect(onAck).toHaveBeenCalled();
  });

  it('shows escalation timers', () => {
    render(<SmartTriageQueue alerts={mockAlerts} />);

    // Timers should be visible (⏱ character)
    const timers = screen.getAllByText(/⏱/);
    expect(timers.length).toBeGreaterThan(0);
  });

  it('shows SBAR button for grouped alerts and toggles SBAR panel', async () => {
    const user = userEvent.setup();
    render(<SmartTriageQueue alerts={mockAlerts} />);

    // Smith, J. has 2 alerts — SBAR button should appear in group header
    const sbarBtn = screen.getByRole('button', { name: /sbar summary for smith/i });
    expect(sbarBtn).toBeInTheDocument();
    expect(sbarBtn).toHaveTextContent('SBAR');

    // Click to expand SBAR panel
    await user.click(sbarBtn);
    expect(screen.getByText(/S:/)).toBeInTheDocument();
    expect(screen.getByText(/B:/)).toBeInTheDocument();
    expect(screen.getByText(/A:/)).toBeInTheDocument();
    expect(screen.getByText(/R:/)).toBeInTheDocument();

    // Click again to collapse
    await user.click(sbarBtn);
    expect(screen.queryByText(/S:/)).not.toBeInTheDocument();
  });

  it('archives acknowledged alerts to resolved and shows toggle', async () => {
    const user = userEvent.setup();
    const onAck = vi.fn().mockResolvedValue(true);
    render(<SmartTriageQueue alerts={mockAlerts} onAcknowledge={onAck} />);

    // Initially no resolved button
    expect(screen.queryByRole('button', { name: /resolved/i })).not.toBeInTheDocument();

    // Acknowledge first alert
    const ackButtons = screen.getAllByText(/Acknowledge/);
    await user.click(ackButtons[0]);

    // After ack resolves, resolved toggle should appear
    expect(await screen.findByRole('button', { name: /1 resolved/i })).toBeInTheDocument();
  });

  it('toggles between active and resolved views', async () => {
    const user = userEvent.setup();
    const onAck = vi.fn().mockResolvedValue(true);
    render(<SmartTriageQueue alerts={mockAlerts} onAcknowledge={onAck} />);

    // Acknowledge an alert to create resolved entry
    const ackButtons = screen.getAllByText(/Acknowledge/);
    await user.click(ackButtons[0]);

    // Click resolved toggle to switch to resolved view
    const resolvedBtn = await screen.findByRole('button', { name: /1 resolved/i });
    await user.click(resolvedBtn);

    // Should show "Active" button text now (toggle label changes)
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
