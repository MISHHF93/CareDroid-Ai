import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QuickOrders } from '@/components/dashboard/QuickOrders';

const mockPatients = [
  { id: 'p1', name: 'Smith, J.', room: '201' },
  { id: 'p2', name: 'Chen, M.', room: '202' },
];

describe('QuickOrders', () => {
  it('renders title and Fast Path badge', () => {
    render(<QuickOrders patients={mockPatients} />);

    expect(screen.getByText('Quick Orders')).toBeInTheDocument();
    expect(screen.getByText('⚡ Fast Path')).toBeInTheDocument();
  });

  it('renders patient selector with options', () => {
    render(<QuickOrders patients={mockPatients} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Select patient…')).toBeInTheDocument();
  });

  it('renders order template buttons', () => {
    render(<QuickOrders patients={mockPatients} />);

    expect(screen.getByText('Stat CBC')).toBeInTheDocument();
    expect(screen.getByText('BMP')).toBeInTheDocument();
    expect(screen.getByText('NS Bolus 1L')).toBeInTheDocument();
    expect(screen.getByText('Stat EKG')).toBeInTheDocument();
  });

  it('disables order buttons when no patient selected', () => {
    render(<QuickOrders patients={mockPatients} />);

    const statCbc = screen.getByText('Stat CBC').closest('button');
    expect(statCbc).toBeDisabled();
  });

  it('enables order buttons after selecting a patient', async () => {
    const user = userEvent.setup();
    render(<QuickOrders patients={mockPatients} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'p1');

    const statCbc = screen.getByText('Stat CBC').closest('button');
    expect(statCbc).not.toBeDisabled();
  });

  it('calls onPlaceOrder with correct data', async () => {
    const user = userEvent.setup();
    const onPlace = vi.fn().mockResolvedValue({ success: true });
    render(<QuickOrders patients={mockPatients} onPlaceOrder={onPlace} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'p1');

    await user.click(screen.getByText('Stat CBC'));

    expect(onPlace).toHaveBeenCalledWith({
      patientId: 'p1',
      orderId: 'stat-cbc',
      label: 'Stat CBC',
    });
  });
});
