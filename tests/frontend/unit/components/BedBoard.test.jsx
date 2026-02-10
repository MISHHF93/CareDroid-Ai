import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BedBoard } from '@/components/dashboard/BedBoard';

const mockBeds = [
  { id: 'b1', room: '201', status: 'occupied', patient: 'Smith, J.', acuity: 'critical', unit: 'Unit 3A' },
  { id: 'b2', room: '202', status: 'available', patient: null, acuity: null, unit: 'Unit 3A' },
  { id: 'b3', room: '203', status: 'cleaning', patient: null, acuity: null, unit: 'Unit 3B' },
  { id: 'b4', room: '204', status: 'occupied', patient: 'Chen, M.', acuity: 'stable', unit: 'Unit 3B' },
];

describe('BedBoard', () => {
  it('renders title and unit filter', () => {
    render(<BedBoard beds={mockBeds} unit="Unit 3A" />);

    expect(screen.getByText(/Bed Board/)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by unit/i })).toBeInTheDocument();
  });

  it('shows occupancy percentage for all beds by default', () => {
    render(<BedBoard beds={mockBeds} unit="Unit 3A" />);

    expect(screen.getByText('2/4 beds occupied')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders room numbers', () => {
    render(<BedBoard beds={mockBeds} unit="Unit 3A" />);

    expect(screen.getByText('201')).toBeInTheDocument();
    expect(screen.getByText('202')).toBeInTheDocument();
    expect(screen.getByText('203')).toBeInTheDocument();
    expect(screen.getByText('204')).toBeInTheDocument();
  });

  it('renders legend with status types', () => {
    render(<BedBoard beds={mockBeds} unit="Unit 3A" />);

    expect(screen.getByText('occupied')).toBeInTheDocument();
    expect(screen.getByText('available')).toBeInTheDocument();
    expect(screen.getByText('cleaning')).toBeInTheDocument();
  });

  it('filters beds by unit when filter is changed', async () => {
    const user = userEvent.setup();
    render(<BedBoard beds={mockBeds} unit="Unit 3A" />);

    const filter = screen.getByRole('combobox', { name: /filter by unit/i });
    await user.selectOptions(filter, 'Unit 3A');

    expect(screen.getByText('201')).toBeInTheDocument();
    expect(screen.getByText('202')).toBeInTheDocument();
    expect(screen.queryByText('203')).not.toBeInTheDocument();
    expect(screen.queryByText('204')).not.toBeInTheDocument();
  });

  it('uses internal defaults when no beds provided', () => {
    render(<BedBoard />);

    expect(screen.getByText(/Bed Board/)).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();
  });
});
