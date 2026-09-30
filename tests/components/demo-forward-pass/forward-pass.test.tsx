import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ForwardPassDemo } from '../../../src/demos/demo-forward-pass';

describe('forward pass diagram', () => {
  it('updates both hidden activations and downstream output from one input', async () => {
    const user=userEvent.setup(); render(<ForwardPassDemo/>);
    const x1=screen.getByLabelText('x₁'); await user.clear(x1); await user.type(x1,'3');
    expect(screen.getAllByText(/a₁=4/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/a₂=2/).length).toBeGreaterThan(0);
    expect(screen.getByText(/\[a₁, a₂\] = \[4, 2\]/)).toBeInTheDocument();
  });
});
