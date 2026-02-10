import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LabTimeline } from '@/components/dashboard/LabTimeline';

const now = Date.now();
const mockEvents = [
  { id: 'l1', test: 'CBC', patient: 'Smith, J.', status: 'resulted', orderedAt: new Date(now - 4 * 3600000).toISOString(), resultedAt: new Date(now - 2 * 3600000).toISOString(), critical: false, value: 'WBC 7.2, Hgb 13.1', refRange: 'WBC 4.5-11.0, Hgb 12-16' },
  { id: 'l2', test: 'Troponin', patient: 'Davis, E.', status: 'resulted', orderedAt: new Date(now - 3 * 3600000).toISOString(), resultedAt: new Date(now - 1.5 * 3600000).toISOString(), critical: true, value: '0.42 ng/mL', refRange: '< 0.04 ng/mL' },
  { id: 'l3', test: 'Lactate', patient: 'Davis, E.', status: 'pending', orderedAt: new Date(now - 1 * 3600000).toISOString(), resultedAt: null, critical: false },
];

describe('LabTimeline', () => {
  it('renders title and time window', () => {
    render(<LabTimeline events={mockEvents} />);

    expect(screen.getByText(/Lab Timeline/)).toBeInTheDocument();
    expect(screen.getByText('Last 12h')).toBeInTheDocument();
  });

  it('shows critical count badge', () => {
    render(<LabTimeline events={mockEvents} />);

    expect(screen.getByText('1 critical')).toBeInTheDocument();
  });

  it('shows pending count', () => {
    render(<LabTimeline events={mockEvents} />);

    expect(screen.getByText('1 pending')).toBeInTheDocument();
  });

  it('renders test names', () => {
    render(<LabTimeline events={mockEvents} />);

    // Use getAllByText since test names appear in both timeline and filter dropdown
    expect(screen.getAllByText('CBC').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Troponin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lactate').length).toBeGreaterThan(0);
  });

  it('shows CRITICAL badge for critical results', () => {
    render(<LabTimeline events={mockEvents} />);

    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('shows status labels', () => {
    render(<LabTimeline events={mockEvents} />);

    const resultedLabels = screen.getAllByText('resulted');
    expect(resultedLabels.length).toBe(2);

    const pendingLabels = screen.getAllByText('pending');
    expect(pendingLabels.length).toBe(1);
  });

  it('renders lab type filter dropdown', () => {
    render(<LabTimeline events={mockEvents} />);

    const filter = screen.getByRole('combobox', { name: /filter by lab type/i });
    expect(filter).toBeInTheDocument();
  });

  it('filters events by lab type', async () => {
    const user = userEvent.setup();
    render(<LabTimeline events={mockEvents} />);

    const filter = screen.getByRole('combobox', { name: /filter by lab type/i });
    await user.selectOptions(filter, 'CBC');

    // CBC should still be in timeline, Troponin and Lactate should not be in timeline list items
    const timelineList = screen.getByRole('list', { name: /lab events/i });
    expect(timelineList).toHaveTextContent('CBC');
    expect(timelineList).not.toHaveTextContent('Troponin');
    expect(timelineList).not.toHaveTextContent('Lactate');
  });

  it('expands result detail when a resulted event is clicked', async () => {
    const user = userEvent.setup();
    const onViewResult = vi.fn();
    render(<LabTimeline events={mockEvents} onViewResult={onViewResult} />);

    // Click the CBC text inside the timeline (not the filter dropdown option)
    const cbcElements = screen.getAllByText('CBC');
    // The first one should be in the filter, the second in the timeline
    const timelineCBC = cbcElements.find(el => el.closest('[role="listitem"]'));
    await user.click(timelineCBC);

    // Expanded panel should show result value
    expect(screen.getByText('WBC 7.2, Hgb 13.1')).toBeInTheDocument();
    expect(screen.getByText('WBC 4.5-11.0, Hgb 12-16')).toBeInTheDocument();
  });

  it('shows new results badge when lastViewedTimestamp is provided', () => {
    const oldTimestamp = new Date(now - 3 * 3600000).toISOString();
    render(<LabTimeline events={mockEvents} lastViewedTimestamp={oldTimestamp} />);

    // Both resulted events should be "new" since they resulted after oldTimestamp
    const newBadges = screen.getAllByText('NEW');
    expect(newBadges.length).toBeGreaterThan(0);
  });

  it('uses internal defaults when no events provided', () => {
    render(<LabTimeline />);

    expect(screen.getByText(/Lab Timeline/)).toBeInTheDocument();
    // CBC appears in both timeline and filter dropdown
    expect(screen.getAllByText('CBC').length).toBeGreaterThan(0);
  });
});
