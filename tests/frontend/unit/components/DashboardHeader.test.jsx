import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

describe('DashboardHeader', () => {
  it('renders greeting and user name', () => {
    render(<DashboardHeader userName="Dr. Patel" />);

    expect(screen.getByText(/Dr. Patel/)).toBeInTheDocument();
  });

  it('shows search input and handles notifications', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onMarkNotificationRead = vi.fn();

    render(
      <DashboardHeader
        userName="Dr. Patel"
        notificationCount={1}
        notifications={[{
          id: 'n1',
          title: 'New lab result',
          read: false,
          timestamp: new Date().toISOString(),
        }]}
        onSearchChange={onSearchChange}
        onMarkNotificationRead={onMarkNotificationRead}
      />
    );

    const searchInput = screen.getByRole('searchbox', { name: /search patients/i });
    await user.type(searchInput, 'Sarah');

    expect(onSearchChange).toHaveBeenCalled();

    await user.click(screen.getByLabelText(/Notifications/));
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    await user.click(screen.getByText('New lab result'));
    expect(onMarkNotificationRead).toHaveBeenCalledWith('n1');
  });
});
