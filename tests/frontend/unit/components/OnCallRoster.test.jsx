import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { OnCallRoster } from '@/components/dashboard/OnCallRoster';

const mockRoster = [
  { id: 'r1', name: 'Dr. Kim', specialty: 'Cardiology', status: 'available', phone: 'x4521' },
  { id: 'r2', name: 'Dr. Patel', specialty: 'General Surgery', status: 'in-surgery', phone: 'x4102' },
  { id: 'r3', name: 'Dr. Lee', specialty: 'Nephrology', status: 'off-site', phone: 'x4330' },
];

describe('OnCallRoster', () => {
  it('renders title', () => {
    render(<OnCallRoster roster={mockRoster} />);

    expect(screen.getByText(/On-Call Roster/)).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders clinician names and specialties', () => {
    render(<OnCallRoster roster={mockRoster} />);

    expect(screen.getByText('Dr. Kim')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Dr. Patel')).toBeInTheDocument();
    expect(screen.getByText('General Surgery')).toBeInTheDocument();
  });

  it('shows status indicators', () => {
    render(<OnCallRoster roster={mockRoster} />);

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('In Surgery')).toBeInTheDocument();
    expect(screen.getByText('Off-site')).toBeInTheDocument();
  });

  it('shows page buttons when onPage is provided', () => {
    const onPage = vi.fn();
    render(<OnCallRoster roster={mockRoster} onPage={onPage} />);

    const pageButtons = screen.getAllByRole('button', { name: /page/i });
    expect(pageButtons.length).toBe(3);
  });

  it('shows message buttons when onMessage is provided', () => {
    const onMessage = vi.fn();
    render(<OnCallRoster roster={mockRoster} onMessage={onMessage} />);

    const msgButtons = screen.getAllByRole('button', { name: /message/i });
    expect(msgButtons.length).toBe(3);
  });

  it('calls onPage when page button is clicked', async () => {
    const user = userEvent.setup();
    const onPage = vi.fn();
    render(<OnCallRoster roster={mockRoster} onPage={onPage} />);

    const pageButtons = screen.getAllByRole('button', { name: /page/i });
    await user.click(pageButtons[0]);
    expect(onPage).toHaveBeenCalledWith(mockRoster[0]);
  });

  it('calls onMessage when message button is clicked', async () => {
    const user = userEvent.setup();
    const onMessage = vi.fn();
    render(<OnCallRoster roster={mockRoster} onMessage={onMessage} />);

    const msgButtons = screen.getAllByRole('button', { name: /message/i });
    await user.click(msgButtons[0]);
    expect(onMessage).toHaveBeenCalledWith(mockRoster[0]);
  });

  it('uses internal defaults when no roster provided', () => {
    render(<OnCallRoster />);

    expect(screen.getByText(/On-Call Roster/)).toBeInTheDocument();
    expect(screen.getByText('Dr. Kim')).toBeInTheDocument();
  });
});
