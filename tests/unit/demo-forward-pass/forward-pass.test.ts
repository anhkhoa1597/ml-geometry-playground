import { describe, expect, it } from 'vitest';
import { defaultForwardModel, evaluateForwardPass } from '../../../src/demos/demo-forward-pass/model';

describe('fixed forward pass', () => {
  it('passes hidden activations into the output neuron', () => {
    const result = evaluateForwardPass(defaultForwardModel);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect([result.value.hidden1.z, result.value.hidden1.a]).toEqual([2, 2]);
    expect([result.value.hidden2.z, result.value.hidden2.a]).toEqual([1, 1]);
    expect(result.value.output.z).toBe(1);
    expect(result.value.output.a).toBeCloseTo(0.731058579);
  });

  it('uses zero ReLU activations instead of negative hidden scores', () => {
    const result = evaluateForwardPass({ ...defaultForwardModel, x: [-1, 0] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect([result.value.hidden1.z, result.value.hidden2.z]).toEqual([-1, -5]);
    expect(result.value.output.contributions).toEqual([0, -0]);
    expect(result.value.output.a).toBe(0.5);
  });
});
