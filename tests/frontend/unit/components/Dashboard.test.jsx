import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/contexts/UserContext', () => ({
  useUser: () => ({ user: { id: 'doc-1', name: 'Dr. Test' }, signOut: vi.fn() }),
}));

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAll: vi.fn(),
  }),
}));

vi.mock('@/layout/AppShell', () => ({
  default: ({ children }) => <div data-testid="app-shell">{children}</div>,
}));

const mockCreatePatient = vi.fn().mockResolvedValue({ id: 'p-new' });
const mockRefresh = vi.fn();

vi.mock('@/hooks/useDashboard', () => ({
  useDashboard: () => ({
    stats: {
      criticalPatients: 2,
      activePatients: 10,
      pendingOrders: 5,
      pendingLabs: 3,
      todayDischarges: 1,
      changes: {},
    },
    activities: { activities: [] },
    alerts: { alerts: [] },
    criticalPatients: [],
    workload: { tasks: [] },
    marMedications: { medications: [] },
    onCallRoster: { providers: [] },
    bedBoard: { beds: [] },
    labTimeline: { labs: [] },
    cdsReminders: [],
    loading: false,
    refreshing: false,
    error: null,
    acknowledgeAlert: vi.fn(),
    trackToolAccess: vi.fn(),
    toggleTask: vi.fn(),
    placeOrder: vi.fn(),
    createPatient: mockCreatePatient,
    refresh: mockRefresh,
    setPatientFilters: vi.fn(),
  }),
}));

// Lightweight stubs for heavy child components
vi.mock('@/components/dashboard/DashboardHeader', () => ({
  DashboardHeader: (props) => (
    <div data-testid="dashboard-header">
      <button onClick={props.onNewPatient}>+ New Patient</button>
      <button onClick={props.onEmergency}>🚨 Emergency</button>
      <span data-testid="live-indicator">{props.refreshing ? 'Syncing…' : 'Live'}</span>
    </div>
  ),
}));

vi.mock('@/components/dashboard/StatCard', () => ({
  StatCard: () => <div data-testid="stat-card" />,
}));
vi.mock('@/components/dashboard/CommandFeed', () => ({
  CommandFeed: () => <div />,
}));
vi.mock('@/components/dashboard/SmartTriageQueue', () => ({
  SmartTriageQueue: () => <div />,
}));
vi.mock('@/components/dashboard/MyWorkload', () => ({
  MyWorkload: () => <div />,
}));
vi.mock('@/components/dashboard/QuickOrders', () => ({
  QuickOrders: () => <div />,
}));
vi.mock('@/components/dashboard/MARPreview', () => ({
  MARPreview: () => <div />,
}));
vi.mock('@/components/dashboard/OnCallRoster', () => ({
  OnCallRoster: () => <div />,
}));
vi.mock('@/components/dashboard/ClinicalBanner', () => ({
  ClinicalBanner: () => <div />,
}));
vi.mock('@/components/dashboard/BedBoard', () => ({
  BedBoard: () => <div />,
}));
vi.mock('@/components/dashboard/LabTimeline', () => ({
  LabTimeline: () => <div />,
}));
vi.mock('@/components/clinical/PatientCard', () => ({
  PatientCard: () => <div data-testid="patient-card" />,
}));
vi.mock('@/components/dashboard/WidgetErrorBoundary', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('@/components/dashboard/DashboardSkeleton', () => ({
  DashboardSkeletonLayout: () => <div data-testid="skeleton" />,
}));

// Import after all mocks
import Dashboard from '@/pages/Dashboard';

describe('Dashboard — New Patient integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('renders the dashboard without the modal initially', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens NewPatientModal when "+New Patient" is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByText('+ New Patient'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Patient Intake')).toBeInTheDocument();
  });

  it('closes modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByText('+ New Patient'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes modal after successful save', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByText('+ New Patient'));

    // Fill the modal form
    await user.type(screen.getByLabelText(/Full Name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/^Age/i), '40');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(mockCreatePatient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Smith',
          age: 40,
          gender: 'Female',
        })
      );
    });

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('keeps modal open when save fails', async () => {
    mockCreatePatient.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByText('+ New Patient'));
    await user.type(screen.getByLabelText(/Full Name/i), 'Jane Smith');
    await user.type(screen.getByLabelText(/^Age/i), '40');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error');
    });

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes modal on Escape key', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByText('+ New Patient'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens EmergencyModal when "Emergency" is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByText('🚨 Emergency'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Emergency Protocol/)).toBeInTheDocument();
  });

  it('closes EmergencyModal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByText('🚨 Emergency'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
