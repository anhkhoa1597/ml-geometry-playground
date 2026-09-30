import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ActivationDemo } from '../../../src/demos/demo-activation';

describe('Activation Function', () => {
  it('keeps z while switching functions and reports the correct output', async () => {
    const user = userEvent.setup();
    render(<ActivationDemo />);
    expect(screen.getByText(/a = σ\(2\) ≈ 0\.881/)).toBeInTheDocument();

    await user.click(screen.getByLabelText('ReLU'));
    expect(screen.getByLabelText('Score z')).toHaveValue('2');
    expect(screen.getByText('a = ReLU(2) = 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'z = 0' }));
    await user.click(screen.getByLabelText('Step'));
    expect(screen.getByText('a = Step(0) = 1')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Sigmoid'));
    expect(screen.getByText('a = σ(0) ≈ 0.5')).toBeInTheDocument();
  });

  it('shows that ReLU output can exceed one', async () => {
    const user = userEvent.setup();
    render(<ActivationDemo />);
    await user.click(screen.getByLabelText('ReLU'));
    const input = screen.getByLabelText('Score z');
    await user.clear(input);
    await user.type(input, '5');
    expect(screen.getByText('a = ReLU(5) = 5')).toBeInTheDocument();
  });
});
