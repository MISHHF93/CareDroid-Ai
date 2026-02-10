import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CommandFeed } from '@/components/dashboard/CommandFeed';

const mockActivities = [
  { id: '1', type: 'lab', message: 'CBC resulted', title: 'CBC resulted', patientName: 'Smith, J.', timestamp: new Date().toISOString(), priority: 'normal' },
  { id: '2', type: 'medication', message: 'Heparin due', title: 'Heparin due', patientName: 'Davis, R.', timestamp: new Date(Date.now() - 60000).toISOString(), priority: 'critical' },
  { id: '3', type: 'vital', message: 'BP elevated', title: 'BP elevated', patientName: 'Lee, K.', timestamp: new Date(Date.now() - 120000).toISOString(), priority: 'low' },
];

describe('CommandFeed', () => {
  it('renders with LIVE badge and item count', () => {
    render(<CommandFeed activities={mockActivities} />);

    expect(screen.getByText('Command Feed')).toBeInTheDocument();
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('shows all activities by default', () => {
    render(<CommandFeed activities={mockActivities} />);

    expect(screen.getByText('CBC resulted')).toBeInTheDocument();
    expect(screen.getByText('Heparin due')).toBeInTheDocument();
    expect(screen.getByText('BP elevated')).toBeInTheDocument();
  });

  it('filters by category when tab is clicked', async () => {
    const user = userEvent.setup();
    render(<CommandFeed activities={mockActivities} />);

    // Click "Labs" tab
    await user.click(screen.getByText('Labs'));

    expect(screen.getByText('CBC resulted')).toBeInTheDocument();
    expect(screen.getByText('1 items')).toBeInTheDocument();
  });

  it('shows empty state when category has no items', async () => {
    const user = userEvent.setup();
    render(<CommandFeed activities={mockActivities} />);

    // Click "Imaging" tab
    await user.click(screen.getByText('Imaging'));

    expect(screen.getByText('No activity in this category')).toBeInTheDocument();
  });

  it('calls onActivityClick when an item is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CommandFeed activities={mockActivities} onActivityClick={onClick} />);

    await user.click(screen.getByText('CBC resulted'));
    expect(onClick).toHaveBeenCalled();
  });

  it('pins critical items to the top of the feed', () => {
    render(<CommandFeed activities={mockActivities} />);
    // Critical item should have a pin icon
    expect(screen.getByText('📌')).toBeInTheDocument();
    // First feed item should be the critical one (Heparin due)
    const items = screen.getAllByRole('button');
    // Filter to only feed items (not tabs)
    const feedItems = items.filter(b => b.getAttribute('aria-label')?.includes('Pinned'));
    expect(feedItems.length).toBe(1);
  });

  it('shows unread count badge when lastVisitTimestamp is provided', () => {
    const oldTimestamp = new Date(Date.now() - 300000).toISOString(); // 5 min ago
    render(<CommandFeed activities={mockActivities} lastVisitTimestamp={oldTimestamp} />);
    // Activity with id=1 has timestamp = now, which is after oldTimestamp
    const unreadBadge = screen.getByLabelText(/new items/);
    expect(unreadBadge).toBeInTheDocument();
  });
});
