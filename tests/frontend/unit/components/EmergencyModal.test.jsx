import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmergencyModal } from '@/components/dashboard/EmergencyModal';

describe('EmergencyModal', () => {
  let onClose;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn();
    document.body.style.overflow = '';
  });

  const renderModal = (props = {}) =>
    render(
      <EmergencyModal
        isOpen={true}
        onClose={onClose}
        patients={[]}
        {...props}
      />
    );

  // ─── Rendering ───
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EmergencyModal isOpen={false} onClose={onClose} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the modal dialog when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Emergency Protocol/)).toBeInTheDocument();
  });

  it('renders patient identification section', () => {
    renderModal();
    expect(screen.getByText('Patient Identification')).toBeInTheDocument();
    expect(screen.getByLabelText(/Patient Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Room \/ Location/i)).toBeInTheDocument();
  });

  it('renders emergency classification section', () => {
    renderModal();
    expect(screen.getByText('Emergency Classification')).toBeInTheDocument();
    expect(screen.getByText(/Critical — Immediate life threat/)).toBeInTheDocument();
    expect(screen.getByText(/Urgent — Requires rapid response/)).toBeInTheDocument();
    expect(screen.getByText(/Moderate — Needs prompt attention/)).toBeInTheDocument();
  });

  it('renders all section headers', () => {
    renderModal();
    expect(screen.getByText('Patient Identification')).toBeInTheDocument();
    expect(screen.getByText('Emergency Classification')).toBeInTheDocument();
    expect(screen.getByText('Vital Signs')).toBeInTheDocument();
    expect(screen.getByText('Immediate Actions')).toBeInTheDocument();
    expect(screen.getByText('Clinical Notes & Documentation')).toBeInTheDocument();
  });

  it('renders emergency type dropdown', () => {
    renderModal();
    expect(screen.getByLabelText(/Emergency Type/i)).toBeInTheDocument();
  });

  it('renders action buttons in the actions section', () => {
    renderModal();
    expect(screen.getByText('Call 911')).toBeInTheDocument();
    expect(screen.getByText('Escalate to MD')).toBeInTheDocument();
    expect(screen.getByText('Activate Code')).toBeInTheDocument();
    expect(screen.getByText('Page RRT')).toBeInTheDocument();
  });

  it('renders medical disclaimer', () => {
    renderModal();
    expect(screen.getByText(/Medical Disclaimer/)).toBeInTheDocument();
  });

  // ─── Patient Selection ───
  it('renders patient quick-select when patients are provided', () => {
    const patients = [
      { id: '1', name: 'John Doe', room: '312' },
      { id: '2', name: 'Jane Smith', room: '418' },
    ];
    renderModal({ patients });
    expect(screen.getByLabelText(/Quick-Select Patient/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe (Room 312)')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith (Room 418)')).toBeInTheDocument();
  });

  it('does not render patient quick-select when no patients', () => {
    renderModal({ patients: [] });
    expect(screen.queryByLabelText(/Quick-Select Patient/i)).not.toBeInTheDocument();
  });

  it('populates name and room when a patient is selected', async () => {
    const user = userEvent.setup();
    const patients = [
      { id: '1', name: 'John Doe', room: '312' },
    ];
    renderModal({ patients });

    await user.selectOptions(screen.getByLabelText(/Quick-Select Patient/i), '1');

    expect(screen.getByLabelText(/Patient Name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/Room \/ Location/i)).toHaveValue('312');
  });

  // ─── Severity Selection ───
  it('defaults to Critical severity', () => {
    renderModal();
    const criticalBtn = screen.getByText(/Critical — Immediate life threat/).closest('button');
    expect(criticalBtn).toHaveClass('em-severity-active');
  });

  it('changes severity when a different option is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText(/Urgent — Requires rapid response/));
    const urgentBtn = screen.getByText(/Urgent — Requires rapid response/).closest('button');
    expect(urgentBtn).toHaveClass('em-severity-active');

    const criticalBtn = screen.getByText(/Critical — Immediate life threat/).closest('button');
    expect(criticalBtn).not.toHaveClass('em-severity-active');
  });

  // ─── Collapsible Sections ───
  it('vitals section is collapsed by default', () => {
    renderModal();
    const vitalsHeader = screen.getByText('Vital Signs').closest('button');
    expect(vitalsHeader).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands vitals section when header is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    const vitalsHeader = screen.getByText('Vital Signs').closest('button');
    await user.click(vitalsHeader);
    // Re-query after click since React re-renders
    const updatedHeader = screen.getByText('Vital Signs').closest('button');
    expect(updatedHeader).toHaveAttribute('aria-expanded', 'true');
  });

  it('notes section is collapsed by default', () => {
    renderModal();
    const notesHeader = screen.getByText('Clinical Notes & Documentation').closest('button');
    expect(notesHeader).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands notes section when clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    const notesHeader = screen.getByText('Clinical Notes & Documentation').closest('button');
    await user.click(notesHeader);
    // Re-query after click since React re-renders
    const updatedHeader = screen.getByText('Clinical Notes & Documentation').closest('button');
    expect(updatedHeader).toHaveAttribute('aria-expanded', 'true');
  });

  // ─── Emergency Actions ───
  it('logs action when Call 911 is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Call 911').closest('button'));

    expect(screen.getByText('Action Log')).toBeInTheDocument();
    expect(screen.getByText(/Called 911/)).toBeInTheDocument();
  });

  it('logs action when Escalate to MD is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Escalate to MD').closest('button'));

    expect(screen.getByText('Action Log')).toBeInTheDocument();
    expect(screen.getByText(/Escalated to Attending Physician/)).toBeInTheDocument();
  });

  it('activates code and disables button', async () => {
    const user = userEvent.setup();
    renderModal();

    const codeBtn = screen.getByText('Activate Code').closest('button');
    await user.click(codeBtn);

    expect(screen.getByText('Code Activated')).toBeInTheDocument();
    expect(screen.getByText('Code Activated').closest('button')).toBeDisabled();
  });

  it('logs Rapid Response Team page', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Page RRT').closest('button'));

    expect(screen.getByText(/Rapid Response Team paged/)).toBeInTheDocument();
  });

  // ─── Validation ───
  it('shows error when patient name is empty on submit', async () => {
    const user = userEvent.setup();
    renderModal();

    // Select emergency type but leave name empty
    await user.selectOptions(screen.getByLabelText(/Emergency Type/i), 'cardiac');
    await user.click(screen.getByText('Document & Close'));

    expect(screen.getByText('Patient name is required')).toBeInTheDocument();
  });

  it('shows error when emergency type is not selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Patient Name/i), 'John Doe');
    await user.click(screen.getByText('Document & Close'));

    expect(screen.getByText('Select an emergency type')).toBeInTheDocument();
  });

  // ─── Submit / Confirmation ───
  it('shows confirmation screen after successful submit', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Patient Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Room \/ Location/i), 'ICU-4A');
    await user.selectOptions(screen.getByLabelText(/Emergency Type/i), 'cardiac');
    await user.click(screen.getByText('Document & Close'));

    await waitFor(() => {
      expect(screen.getByText('Emergency Record Saved')).toBeInTheDocument();
    });

    expect(screen.getByText(/John Doe — Room ICU-4A/)).toBeInTheDocument();
    expect(screen.getByText(/Cardiac Arrest \/ STEMI/i)).toBeInTheDocument();
  });

  it('closes modal when Done is clicked on confirmation', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText(/Patient Name/i), 'John Doe');
    await user.selectOptions(screen.getByLabelText(/Emergency Type/i), 'cardiac');
    await user.click(screen.getByText('Document & Close'));

    await waitFor(() => {
      expect(screen.getByText('Emergency Record Saved')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows actions taken in confirmation screen', async () => {
    const user = userEvent.setup();
    renderModal();

    // Take an action first
    await user.click(screen.getByText('Escalate to MD').closest('button'));

    // Then submit
    await user.type(screen.getByLabelText(/Patient Name/i), 'John Doe');
    await user.selectOptions(screen.getByLabelText(/Emergency Type/i), 'cardiac');
    await user.click(screen.getByText('Document & Close'));

    await waitFor(() => {
      expect(screen.getByText('Emergency Record Saved')).toBeInTheDocument();
    });

    expect(screen.getByText('Actions Taken')).toBeInTheDocument();
    expect(screen.getByText(/Escalated to Attending Physician/)).toBeInTheDocument();
  });

  // ─── Close / Cancel ───
  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay backdrop is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    const overlay = screen.getByRole('dialog').parentElement || screen.getByRole('dialog');
    // Click the overlay itself (not the modal content)
    const overlayEl = document.querySelector('.em-overlay');
    if (overlayEl) {
      await user.click(overlayEl);
      expect(onClose).toHaveBeenCalled();
    }
  });

  // ─── Body scroll lock ───
  it('locks body scroll when modal is open', () => {
    renderModal();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when modal is closed', () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  // ─── Resets on reopen ───
  it('resets form when reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = renderModal();

    await user.type(screen.getByLabelText(/Patient Name/i), 'John Doe');

    // Close + reopen
    rerender(<EmergencyModal isOpen={false} onClose={onClose} patients={[]} />);
    rerender(<EmergencyModal isOpen={true} onClose={onClose} patients={[]} />);

    expect(screen.getByLabelText(/Patient Name/i)).toHaveValue('');
  });
});
