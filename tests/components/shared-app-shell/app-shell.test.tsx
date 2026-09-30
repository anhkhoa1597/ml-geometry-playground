import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppShell, type DemoTab, ParameterControl } from '../../../src/shared/app-shell';

function ControlFixture() {
  const [value, setValue] = useState(2);
  return <ParameterControl label="w₁" value={value} min={-5} max={5} onChange={setValue} />;
}

const tabs: readonly DemoTab[] = [
  { id: 'weighted-inputs', label: 'Weighted Inputs', question: 'Question one?', content: <input aria-label="Retained value" /> },
  { id: 'bias', label: 'Bias', question: 'Question two?', content: <button type="button">Inside Bias</button> },
];

beforeEach(() => window.history.replaceState(null, '', '/'));

describe('ParameterControl', () => {
  it('accepts precise decimal values independently of the slider step', async () => {
    const user = userEvent.setup();
    render(<ControlFixture />);
    const input = screen.getByLabelText('w₁');
    await user.clear(input);
    await user.type(input, '1.23');
    expect(input).toHaveValue('1.23');
    expect(screen.getByLabelText('w₁ slider')).toHaveValue('1.23');
  });

  it('keeps the last valid model for an invalid draft and Escape restores it', async () => {
    const user = userEvent.setup();
    render(<ControlFixture />);
    const input = screen.getByLabelText('w₁');
    await user.clear(input);
    await user.type(input, '8');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('chưa được áp dụng');
    expect(screen.getByLabelText('w₁ slider')).toHaveValue('2');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('2');
  });
});

describe('AppShell', () => {
  it('navigates by URL and retains mounted tab state', async () => {
    const user = userEvent.setup();
    render(<AppShell tabs={tabs} />);
    const retained = screen.getByLabelText('Retained value');
    await user.type(retained, '42');
    await user.click(screen.getByRole('tab', { name: /Bias/ }));
    expect(window.location.search).toBe('?demo=bias');
    await user.click(screen.getByRole('tab', { name: /Weighted Inputs/ }));
    expect(screen.getByLabelText('Retained value')).toHaveValue('42');
  });

  it('uses manual keyboard activation', async () => {
    const user = userEvent.setup();
    render(<AppShell tabs={tabs} />);
    const first = screen.getByRole('tab', { name: /Weighted Inputs/ });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Bias/ })).toHaveFocus();
    expect(first).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: /Bias/ })).toHaveAttribute('aria-selected', 'true');
  });
});
