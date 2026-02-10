import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NewPatientModal } from '@/components/dashboard/NewPatientModal';

describe('NewPatientModal', () => {
  let onClose;
  let onSave;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    onSave = vi.fn().mockResolvedValue({ id: 'new-1' });
    document.body.style.overflow = '';
  });

  const renderModal = (props = {}) =>
    render(
      <NewPatientModal
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
        {...props}
      />
    );

  // ─── Rendering ───
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NewPatientModal isOpen={false} onClose={onClose} onSave={onSave} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the modal dialog when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Patient Intake')).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    renderModal();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument();
  });

  it('renders optional fields in demographics', () => {
    renderModal();
    expect(screen.getByLabelText(/Room/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bed/i)).toBeInTheDocument();
  });

  it('renders clinical status section', () => {
    renderModal();
    expect(screen.getByLabelText(/Acuity Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Admitting Diagnosis/i)).toBeInTheDocument();
  });

  it('renders all section headers', () => {
    renderModal();
    expect(screen.getByText('Demographics')).toBeInTheDocument();
    expect(screen.getByText('Clinical Status')).toBeInTheDocument();
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  // ─── Section toggles ───
  it('vitals section is collapsed by default', () => {
    renderModal();
    expect(screen.queryByText(/Heart Rate/i)).not.toBeInTheDocument();
  });

  it('expands vitals section when header is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Vital Signs'));
    expect(screen.getByText(/Heart Rate/i)).toBeInTheDocument();
  });

  it('collapses demographics section when header is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    await user.click(screen.getByText('Demographics'));
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
  });

  // ─── Validation ───
  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Save Patient'));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Age is required')).toBeInTheDocument();
    expect(screen.getByText('Gender is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows name min-length error', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Full Name/i), 'A');
    await user.type(screen.getByLabelText(/^Age/i), '30');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Male');
    await user.click(screen.getByText('Save Patient'));

    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
  });

  it('clears field error when user types', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Save Patient'));
    expect(screen.getByText('Name is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Full Name/i), 'Sarah');
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });

  // ─── Successful submit ───
  it('calls onSave with correct payload on valid submit', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Full Name/i), 'Sarah Johnson');
    await user.type(screen.getByLabelText(/^Age/i), '45');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sarah Johnson',
          age: 45,
          gender: 'Female',
          status: 'stable',
        })
      );
    });
  });

  it('calls onClose after successful save', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Full Name/i), 'Sarah Johnson');
    await user.type(screen.getByLabelText(/^Age/i), '45');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('sends optional fields when filled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Full Name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/^Age/i), '60');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Male');
    await user.type(screen.getByLabelText(/Room/i), '312');
    await user.type(screen.getByLabelText(/Bed/i), 'B');
    await user.type(screen.getByLabelText(/Admitting Diagnosis/i), 'Pneumonia');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe',
          room: '312',
          bed: 'B',
          admittingDiagnosis: 'Pneumonia',
        })
      );
    });
  });

  // ─── Server error ───
  it('displays server error on save failure', async () => {
    onSave.mockRejectedValue(new Error('Duplicate patient'));
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Full Name/i), 'Sarah Johnson');
    await user.type(screen.getByLabelText(/^Age/i), '45');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Duplicate patient');
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ─── Close / Escape ───
  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ✕ button is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking overlay backdrop', async () => {
    const user = userEvent.setup();
    renderModal();

    const overlay = screen.getByRole('dialog').closest('.np-overlay');
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });

  // ─── Medications ───
  it('adds and removes medications', async () => {
    const user = userEvent.setup();
    renderModal();

    // Open medications section
    await user.click(screen.getByText('Medications'));
    expect(screen.getAllByPlaceholderText(/Medication/i).length).toBe(1);

    // Add another
    await user.click(screen.getByText('+ Add Medication'));
    expect(screen.getAllByPlaceholderText(/Medication/i).length).toBe(2);

    // Remove one
    const removeButtons = screen.getAllByLabelText(/Remove medication/i);
    await user.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText(/Medication/i).length).toBe(1);
  });

  it('includes medications in payload', async () => {
    const user = userEvent.setup();
    renderModal();

    // Open medications section and fill
    await user.click(screen.getByText('Medications'));
    await user.type(screen.getByPlaceholderText('Medication 1'), 'Lisinopril');

    // Fill required fields
    await user.type(screen.getByLabelText(/Full Name/i), 'Med Test');
    await user.type(screen.getByLabelText(/^Age/i), '50');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Male');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ medications: ['Lisinopril'] })
      );
    });
  });

  // ─── Alerts ───
  it('adds and removes alerts', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Alerts'));
    expect(screen.queryByPlaceholderText('Alert message')).not.toBeInTheDocument();

    await user.click(screen.getByText('+ Add Alert'));
    expect(screen.getByPlaceholderText('Alert message')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Remove alert 1/i));
    expect(screen.queryByPlaceholderText('Alert message')).not.toBeInTheDocument();
  });

  // ─── Vitals ───
  it('includes vitals in payload when entered', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Vital Signs'));
    await user.type(screen.getByLabelText(/Heart Rate/i), '80');

    await user.type(screen.getByLabelText(/Full Name/i), 'Vitals Test');
    await user.type(screen.getByLabelText(/^Age/i), '40');
    await user.selectOptions(screen.getByLabelText(/Gender/i), 'Female');
    await user.click(screen.getByText('Save Patient'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          vitals: expect.objectContaining({
            heartRate: expect.objectContaining({ value: 80 }),
          }),
        })
      );
    });
  });

  // ─── Body overflow ───
  it('locks body scroll when open', () => {
    renderModal();
    expect(document.body.style.overflow).toBe('hidden');
  });

  // ─── Resets form on re-open ───
  it('resets form when modal re-opens', async () => {
    const user = userEvent.setup();
    const { rerender } = renderModal();

    await user.type(screen.getByLabelText(/Full Name/i), 'Stale Data');

    // Close and re-open
    rerender(<NewPatientModal isOpen={false} onClose={onClose} onSave={onSave} />);
    rerender(<NewPatientModal isOpen={true} onClose={onClose} onSave={onSave} />);

    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('');
  });
});
