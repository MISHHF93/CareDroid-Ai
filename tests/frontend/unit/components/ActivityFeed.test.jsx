import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

describe('ActivityFeed', () => {
  it('renders empty state', () => {
    render(<ActivityFeed activities={[]} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders activities with message fallback', () => {
    const activities = [
      {
        id: 'activity-1',
        type: 'lab',
        message: 'Lab results received',
        patientName: 'Sarah Johnson',
        timestamp: new Date(),
      },
    ];

    render(<ActivityFeed activities={activities} />);

    expect(screen.getByText('Lab results received')).toBeInTheDocument();
    expect(screen.getByText(/Patient: Sarah Johnson/)).toBeInTheDocument();
  });
});
