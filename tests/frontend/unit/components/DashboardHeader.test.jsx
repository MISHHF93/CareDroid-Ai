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

  it('shows search input and handles search change', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(
      <DashboardHeader
        userName="Dr. Patel"
        onSearchChange={onSearchChange}
      />
    );

    const searchInput = screen.getByRole('searchbox', { name: /search patients/i });
    await user.type(searchInput, 'Sarah');

    expect(onSearchChange).toHaveBeenCalled();
  });

  it('renders New Patient and Emergency buttons', () => {
    const onNewPatient = vi.fn();
    const onEmergency = vi.fn();

    render(
      <DashboardHeader
        userName="Dr. Patel"
        onNewPatient={onNewPatient}
        onEmergency={onEmergency}
      />
    );

    expect(screen.getByText(/New Patient/)).toBeInTheDocument();
    expect(screen.getByText(/Emergency/)).toBeInTheDocument();
  });

  it('shows Live when SSE connected', () => {
    render(
      <DashboardHeader
        userName="Dr. Patel"
        connectionState="connected"
      />
    );

    expect(screen.getByLabelText(/Real-time status: connected/)).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('shows Connecting when SSE is connecting', () => {
    render(
      <DashboardHeader
        userName="Dr. Patel"
        connectionState="connecting"
      />
    );

    expect(screen.getByText('Connecting…')).toBeInTheDocument();
  });

  it('shows Offline when SSE disconnected', () => {
    render(
      <DashboardHeader
        userName="Dr. Patel"
        connectionState="disconnected"
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });
});
