import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SparklineChart } from '@/components/dashboard/SparklineChart';

describe('SparklineChart', () => {
  it('renders SVG with correct dimensions', () => {
    const { container } = render(
      <SparklineChart data={[1, 2, 3, 4, 5]} width={120} height={32} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders nothing with fewer than 2 data points', () => {
    const { container } = render(<SparklineChart data={[5]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders nothing with empty data', () => {
    const { container } = render(<SparklineChart data={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders end dot always', () => {
    const { container } = render(
      <SparklineChart data={[1, 2, 3]} showDots={false} />
    );

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(1); // only end dot
  });

  it('renders all dots when showDots is true', () => {
    const { container } = render(
      <SparklineChart data={[1, 2, 3]} showDots={true} />
    );

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4); // 3 dots + 1 end dot
  });

  it('applies custom color', () => {
    const { container } = render(
      <SparklineChart data={[1, 2, 3]} color="#FF0000" />
    );

    const path = container.querySelectorAll('path')[1]; // line path
    expect(path).toHaveAttribute('stroke', '#FF0000');
  });
});
