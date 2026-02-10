import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ClinicalBanner } from '@/components/dashboard/ClinicalBanner';

const mockReminders = [
  { id: 'cds1', message: '3 patients due for sepsis screening', icon: '🦠', priority: 'high' },
  { id: 'cds2', message: 'DVT prophylaxis reminder', icon: '🩸', priority: 'medium' },
];

describe('ClinicalBanner', () => {
  it('renders the first reminder message', () => {
    render(<ClinicalBanner reminders={mockReminders} />);

    expect(screen.getByText('3 patients due for sepsis screening')).toBeInTheDocument();
  });

  it('shows count of additional reminders', () => {
    render(<ClinicalBanner reminders={mockReminders} />);

    expect(screen.getByText('+1 more clinical reminder')).toBeInTheDocument();
  });

  it('shows Snooze and Done buttons', () => {
    render(<ClinicalBanner reminders={mockReminders} />);

    expect(screen.getByText('Snooze 1h')).toBeInTheDocument();
    expect(screen.getByText('Done ✓')).toBeInTheDocument();
  });

  it('dismisses current reminder on Done click', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ClinicalBanner reminders={mockReminders} onDismiss={onDismiss} />);

    await user.click(screen.getByText('Done ✓'));

    expect(onDismiss).toHaveBeenCalledWith('cds1');
    // Second reminder should now be visible
    expect(screen.getByText('DVT prophylaxis reminder')).toBeInTheDocument();
  });

  it('snoozes current reminder', async () => {
    const user = userEvent.setup();
    const onSnooze = vi.fn();
    render(<ClinicalBanner reminders={mockReminders} onSnooze={onSnooze} />);

    await user.click(screen.getByText('Snooze 1h'));

    expect(onSnooze).toHaveBeenCalledWith('cds1');
  });

  it('renders nothing when all reminders are dismissed', async () => {
    const user = userEvent.setup();
    const { container } = render(<ClinicalBanner reminders={[{ id: 'x', message: 'Test', icon: '⚠️', priority: 'low' }]} />);

    await user.click(screen.getByText('Done ✓'));

    expect(container.innerHTML).toBe('');
  });

  it('uses internal defaults when no reminders provided', () => {
    render(<ClinicalBanner />);

    expect(screen.getByText(/patients due for sepsis screening/)).toBeInTheDocument();
  });
});
