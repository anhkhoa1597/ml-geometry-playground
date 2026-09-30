import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../../src/app/App';
import { ArtificialNeuronDemo, WeightedInputsDemo } from '../../../src/demos/demo-artificial-neuron';

describe('Weighted Inputs', () => {
  it('propagates inputs and weights through contributions to s', async () => {
    const user = userEvent.setup();
    render(<WeightedInputsDemo />);
    expect(screen.getByText('s = 2(2) + (−1)(3) = 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Bỏ đóng góp x₂' }));
    expect(screen.getByText('s = 2(2) + 0(3) = 4')).toBeInTheDocument();
    expect(screen.getByText('Contribution c₂')).toBeInTheDocument();
  });
});

describe('Artificial Neuron', () => {
  it('updates all downstream values and preserves z when activation changes', async () => {
    const user = userEvent.setup();
    render(<ArtificialNeuronDemo />);
    expect(screen.getByText(/a ≈ 0\.881/)).toBeInTheDocument();

    const x1 = screen.getByLabelText('x₁');
    await user.clear(x1);
    await user.type(x1, '3');
    expect(screen.getByText('z = 4')).toBeInTheDocument();
    expect(screen.getByText(/a ≈ 0\.982/)).toBeInTheDocument();

    await user.click(screen.getByLabelText('ReLU'));
    expect(screen.getByText('z = 4')).toBeInTheDocument();
    expect(screen.getByText('a = 4')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Step'));
    expect(screen.getByText('z = 4')).toBeInTheDocument();
    expect(screen.getByText('a = 1')).toBeInTheDocument();
  });
});

describe('tab-local neuron state', () => {
  it('keeps Weighted Inputs and Artificial Neuron independent', async () => {
    const user = userEvent.setup();
    render(<App />);
    const weightedPanel = screen.getByRole('tabpanel');
    const weightedW1 = within(weightedPanel).getByLabelText('w₁');
    await user.clear(weightedW1);
    await user.type(weightedW1, '4');

    await user.click(screen.getByRole('tab', { name: /Artificial Neuron/ }));
    const neuronPanel = screen.getByRole('tabpanel');
    expect(within(neuronPanel).getByLabelText('w₁')).toHaveValue('2');

    await user.click(screen.getByRole('tab', { name: /Weighted Inputs/ }));
    expect(within(screen.getByRole('tabpanel')).getByLabelText('w₁')).toHaveValue('4');
  });
});
