import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { NotificationDropdown } from '@/components/dashboard/NotificationDropdown';

describe('NotificationDropdown', () => {
  it('renders empty state', () => {
    render(<NotificationDropdown notifications={[]} />);

    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('handles notification actions', async () => {
    const user = userEvent.setup();
    const onMarkRead = vi.fn();
    const onMarkAllRead = vi.fn();
    const onClearAll = vi.fn();

    const notifications = [
      {
        id: 'notif-1',
        title: 'New lab result',
        message: 'Potassium level high',
        read: false,
        timestamp: new Date().toISOString(),
        type: 'alert',
      },
      {
        id: 'notif-2',
        title: 'Shift update',
        read: true,
        timestamp: new Date().toISOString(),
        type: 'info',
      },
    ];

    render(
      <NotificationDropdown
        notifications={notifications}
        onMarkRead={onMarkRead}
        onMarkAllRead={onMarkAllRead}
        onClearAll={onClearAll}
      />
    );

    await user.click(screen.getByText('New lab result'));
    expect(onMarkRead).toHaveBeenCalledWith('notif-1');

    await user.click(screen.getByText('Mark all read'));
    expect(onMarkAllRead).toHaveBeenCalled();

    await user.click(screen.getByText('Clear all'));
    expect(onClearAll).toHaveBeenCalled();
  });
});
