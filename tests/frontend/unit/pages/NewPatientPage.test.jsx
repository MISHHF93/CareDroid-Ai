import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocationState = { state: null };
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocationState,
}));

// Mock UserContext
vi.mock('@/contexts/UserContext', () => ({
  useUser: () => ({ user: { id: 'doc-1', name: 'Dr. Test' }, signOut: vi.fn() }),
}));

// Mock AppShell — render children directly
vi.mock('@/layout/AppShell', () => ({
  default: ({ children }) => <div data-testid="app-shell">{children}</div>,
}));

// Mock dashboardService
const mockCreatePatient = vi.fn();
vi.mock('@/services/dashboardService', () => ({
  default: {
    createPatient: (...args) => mockCreatePatient(...args),
  },
}));

// Import after mocks
import NewPatientPage from '@/pages/NewPatientPage';

describe('NewPatientPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePatient.mockResolvedValue({ id: 'new-1' });
    mockLocationState.state = null;
  });

  const renderPage = () => render(<NewPatientPage />);

  // ─── Structure ───
  it('renders the page title', () => {
    renderPage();
    expect(screen.getByText('New Patient Intake')).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderPage();
    expect(screen.getByLabelText(/Back to dashboard/i)).toBeInTheDocument();
  });

  it('renders section headers', () => {
    renderPage();
    expect(screen.getByText('Demographics')).toBeInTheDocument();
    expect(screen.getByText('Clinical Status')).toBeInTheDocument();
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    renderPage();
    expect(screen.getByText('Save Patient')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  // ─── Section toggle ───
  it('demographics and clinical sections are expanded by default', () => {
    renderPage();
    // Demographics fields visible
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    // Clinical fields visible
    expect(screen.getByLabelText(/Acuity Status/i)).toBeInTheDocument();
  });

  it('vitals section is collapsed by default', () => {
    renderPage();
    expect(screen.queryByText(/Heart Rate/i)).not.toBeInTheDocument();
  });

  it('expands vitals section when header is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Vital Signs'));
    expect(screen.getByText(/Heart Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Systolic BP/i)).toBeInTheDocument();
  });

  it('collapses demographics section when header is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    await user.click(screen.getByText('Demographics'));
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
  });

  // ─── Validation ───
  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Save Patient'));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Age is required')).toBeInTheDocument();
    expect(screen.getByText('Gender is required')).toBeInTheDocument();
    expect(mockCreatePatient).not.toHaveBeenCalled();
  });

  it('clears individual error when field is edited', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Save Patient'));
    expect(screen.getByText('Name is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Full Name/i), 'Test');
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });

  // ─── Successful submit ───
  it('submits with required fields and navigates to dashboard', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Full Name/i), 'Sarah Johnson');
    await user.type(screen.getByLabelText(/^Age/i), '45');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(mockCreatePatient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sarah Johnson',
          age: 45,
          gender: 'Female',
          status: 'stable',
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('includes optional fields in payload when filled', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/^Age/i), '60');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Male');
    await user.type(screen.getByLabelText(/Room/i), '205');
    await user.type(screen.getByLabelText(/Bed/i), 'B');
    await user.type(screen.getByLabelText(/Admitting Diagnosis/i), 'CHF exacerbation');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(mockCreatePatient).toHaveBeenCalledWith(
        expect.objectContaining({
          room: '205',
          bed: 'B',
          admittingDiagnosis: 'CHF exacerbation',
        })
      );
    });
  });

  // ─── Server error ───
  it('displays server error message on failure', async () => {
    mockCreatePatient.mockRejectedValue(new Error('Validation failed'));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Full Name/i), 'Sarah Johnson');
    await user.type(screen.getByLabelText(/^Age/i), '45');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
  });

  // ─── Cancel / Back ───
  it('navigates to /dashboard on Cancel', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to /dashboard on back button', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText(/Back to dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  // ─── Medications dynamic list ───
  it('adds and removes medications', async () => {
    const user = userEvent.setup();
    renderPage();

    // Open medications section
    await user.click(screen.getByText('Medications'));

    // Should show one empty input
    const medInputs = screen.getAllByPlaceholderText(/Medication/i);
    expect(medInputs.length).toBe(1);

    // Add another
    await user.click(screen.getByText('+ Add Medication'));
    expect(screen.getAllByPlaceholderText(/Medication/i).length).toBe(2);

    // Remove one
    const removeButtons = screen.getAllByLabelText(/Remove medication/i);
    await user.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText(/Medication/i).length).toBe(1);
  });

  // ─── Alerts dynamic list ───
  it('adds and removes alerts', async () => {
    const user = userEvent.setup();
    renderPage();

    // Open alerts section
    await user.click(screen.getByText('Alerts'));

    // No alerts initially
    expect(screen.queryByPlaceholderText('Alert message')).not.toBeInTheDocument();

    // Add one
    await user.click(screen.getByText('+ Add Alert'));
    expect(screen.getByPlaceholderText('Alert message')).toBeInTheDocument();

    // Remove it
    await user.click(screen.getByLabelText(/Remove alert 1/i));
    expect(screen.queryByPlaceholderText('Alert message')).not.toBeInTheDocument();
  });

  // ─── Prefill from modal ───
  it('pre-fills form from location state', () => {
    mockLocationState.state = {
      prefill: { name: 'Prefilled Name', age: '33', gender: 'Male', room: '100' },
    };
    renderPage();

    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Prefilled Name');
    expect(screen.getByLabelText(/^Age/i)).toHaveValue(33);
    expect(screen.getByLabelText(/Gender/i)).toHaveValue('Male');
    expect(screen.getByLabelText(/Room/i)).toHaveValue('100');
  });

  // ─── Vitals integration ───
  it('includes vitals in payload when entered', async () => {
    const user = userEvent.setup();
    renderPage();

    // Expand vitals
    await user.click(screen.getByText('Vital Signs'));

    await user.type(screen.getByLabelText(/Heart Rate/i), '80');
    await user.type(screen.getByLabelText(/Temperature/i), '98.6');

    // Fill required + submit
    await user.type(screen.getByLabelText(/Full Name/i), 'Vitals Test');
    await user.type(screen.getByLabelText(/^Age/i), '50');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(mockCreatePatient).toHaveBeenCalledWith(
        expect.objectContaining({
          vitals: expect.objectContaining({
            heartRate: expect.objectContaining({ value: 80 }),
            temperature: expect.objectContaining({ value: 98.6 }),
          }),
        })
      );
    });
  });

  // ─── Medications in payload ───
  it('includes non-empty medications in payload', async () => {
    const user = userEvent.setup();
    renderPage();

    // Open medications + add
    await user.click(screen.getByText('Medications'));
    await user.type(screen.getByPlaceholderText('Medication 1'), 'Lisinopril');
    await user.click(screen.getByText('+ Add Medication'));
    const medInputs = screen.getAllByPlaceholderText(/Medication/i);
    await user.type(medInputs[1], 'Metformin');

    // Fill required + submit
    await user.type(screen.getByLabelText(/Full Name/i), 'Med Test');
    await user.type(screen.getByLabelText(/^Age/i), '70');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Male');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(mockCreatePatient).toHaveBeenCalledWith(
        expect.objectContaining({
          medications: ['Lisinopril', 'Metformin'],
        })
      );
    });
  });

  // ─── Save button state ───
  it('disables Save button while saving', async () => {
    // Make save hang
    mockCreatePatient.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/Full Name/i), 'Test');
    await user.type(screen.getByLabelText(/^Age/i), '30');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Male');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(screen.getByText('Saving…')).toBeInTheDocument();
    });
  });
});
