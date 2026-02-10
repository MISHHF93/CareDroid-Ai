import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MARPreview } from '@/components/dashboard/MARPreview';

const now = Date.now();
const mockMeds = [
  { id: 'm1', name: 'Metoprolol 25mg', patient: 'Smith, J.', dueAt: new Date(now - 20 * 60000).toISOString(), route: 'PO' },
  { id: 'm2', name: 'Insulin sliding scale', patient: 'Chen, M.', dueAt: new Date(now + 5 * 60000).toISOString(), route: 'SubQ' },
  { id: 'm3', name: 'Vancomycin 1g', patient: 'Davis, E.', dueAt: new Date(now + 45 * 60000).toISOString(), route: 'IV' },
];

describe('MARPreview', () => {
  it('renders title and time window', () => {
    render(<MARPreview medications={mockMeds} />);

    expect(screen.getByText(/MAR Preview/)).toBeInTheDocument();
    expect(screen.getByText('Next 2 hours')).toBeInTheDocument();
  });

  it('shows overdue badge when medications are overdue', () => {
    render(<MARPreview medications={mockMeds} />);

    expect(screen.getByText('1 overdue')).toBeInTheDocument();
  });

  it('renders medication names', () => {
    render(<MARPreview medications={mockMeds} />);

    expect(screen.getByText('Metoprolol 25mg')).toBeInTheDocument();
    expect(screen.getByText('Insulin sliding scale')).toBeInTheDocument();
    expect(screen.getByText('Vancomycin 1g')).toBeInTheDocument();
  });

  it('shows patient and route info', () => {
    render(<MARPreview medications={mockMeds} />);

    expect(screen.getByText(/Smith, J\. · PO/)).toBeInTheDocument();
    expect(screen.getByText(/Chen, M\. · SubQ/)).toBeInTheDocument();
  });

  it('shows status labels', () => {
    render(<MARPreview medications={mockMeds} />);

    expect(screen.getByText('OVERDUE')).toBeInTheDocument();
    expect(screen.getByText('DUE NOW')).toBeInTheDocument();
    expect(screen.getByText('UPCOMING')).toBeInTheDocument();
  });

  it('renders administered checkboxes for each medication', () => {
    render(<MARPreview medications={mockMeds} onAdminister={vi.fn()} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3);
  });

  it('marks medication as administered when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onAdminister = vi.fn().mockResolvedValue(undefined);
    render(<MARPreview medications={mockMeds} onAdminister={onAdminister} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(onAdminister).toHaveBeenCalledWith(mockMeds[0]);
    expect(screen.getByText('ADMINISTERED')).toBeInTheDocument();
  });

  it('shows Open Full MAR button when onViewMAR is provided', () => {
    const onViewMAR = vi.fn();
    render(<MARPreview medications={mockMeds} onViewMAR={onViewMAR} />);

    expect(screen.getByText(/Open Full MAR/)).toBeInTheDocument();
  });

  it('uses internal defaults when no medications provided', () => {
    render(<MARPreview />);

    expect(screen.getByText(/MAR Preview/)).toBeInTheDocument();
    const meds = screen.getAllByText(/mg|sliding|1g|40mg|5000u/i);
    expect(meds.length).toBeGreaterThan(0);
  });
});
