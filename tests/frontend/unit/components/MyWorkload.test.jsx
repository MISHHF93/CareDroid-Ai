import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MyWorkload } from '@/components/dashboard/MyWorkload';

const mockTasks = [
  { id: 't1', label: 'Review CBC — Johnson, S.', done: false, priority: 'high' },
  { id: 't2', label: 'Sign heparin order', done: false, priority: 'high' },
  { id: 't3', label: 'Respond to consult', done: true, priority: 'medium' },
];

describe('MyWorkload', () => {
  it('renders title and task list', () => {
    render(<MyWorkload tasks={mockTasks} />);

    expect(screen.getByText('My Workload')).toBeInTheDocument();
    expect(screen.getByText('Review CBC — Johnson, S.')).toBeInTheDocument();
    expect(screen.getByText('Sign heparin order')).toBeInTheDocument();
    expect(screen.getByText('Respond to consult')).toBeInTheDocument();
  });

  it('shows progress bar with correct count', () => {
    render(<MyWorkload tasks={mockTasks} />);

    expect(screen.getByText('1/3 tasks done')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('calls onToggleTask when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<MyWorkload tasks={mockTasks} onToggleTask={onToggle} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(onToggle).toHaveBeenCalledWith('t1');
  });

  it('shows shift timer', () => {
    render(<MyWorkload tasks={mockTasks} />);

    expect(screen.getByText(/Shift ends in/)).toBeInTheDocument();
  });

  it('shows handoff notes textarea', () => {
    render(<MyWorkload tasks={mockTasks} />);

    expect(screen.getByPlaceholderText('Type your handoff summary...')).toBeInTheDocument();
  });

  it('uses internal default tasks when none provided', () => {
    render(<MyWorkload />);

    expect(screen.getByText('My Workload')).toBeInTheDocument();
    // Should have some default tasks
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});
