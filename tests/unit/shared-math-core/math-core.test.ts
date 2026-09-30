import { describe, expect, it } from 'vitest';
import {
  activate,
  classifyLinearScore,
  evaluateNeuron,
  linearScore,
  weightedContributions,
  weightedSum,
  zeroSet1D,
  zeroSet2D,
} from '../../../src/shared/math-core';

function valueOf<T>(result: { ok: true; value: T } | { ok: false }): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected a successful math result');
  return result.value;
}

describe('linear model arithmetic', () => {
  it('computes contributions, sum, and score without mutating inputs', () => {
    const x = [2, 3];
    const w = [2, -1];

    expect(valueOf(weightedContributions(x, w))).toEqual([4, -3]);
    expect(valueOf(weightedSum(x, w))).toBe(1);
    expect(valueOf(linearScore(x, w, 1))).toBe(2);
    expect(x).toEqual([2, 3]);
    expect(w).toEqual([2, -1]);
  });

  it('preserves arbitrary finite decimal inputs', () => {
    expect(valueOf(linearScore([1.23, -0.75], [2, -1], 1))).toBeCloseTo(4.21);
  });

  it('rejects invalid dimensions and numerical overflow', () => {
    expect(weightedSum([1], [1, 2])).toMatchObject({ ok: false, error: { kind: 'invalid-input' } });
    expect(linearScore([Number.MAX_VALUE], [2], 0)).toMatchObject({
      ok: false,
      error: { kind: 'numerical-range-error' },
    });
  });
});

describe('activations and neuron evaluation', () => {
  it('computes Step, Sigmoid, and ReLU including stable sigmoid extremes', () => {
    expect(valueOf(activate(-2, 'step'))).toBe(0);
    expect(valueOf(activate(0, 'step'))).toBe(1);
    expect(valueOf(activate(2, 'sigmoid'))).toBeCloseTo(0.880797078);
    expect(valueOf(activate(-1000, 'sigmoid'))).toBe(0);
    expect(valueOf(activate(1000, 'sigmoid'))).toBe(1);
    expect(valueOf(activate(-2, 'relu'))).toBe(0);
    expect(valueOf(activate(2, 'relu'))).toBe(2);
  });

  it('keeps zero activation and classification conventions separate', () => {
    expect(valueOf(activate(0, 'step'))).toBe(1);
    expect(valueOf(classifyLinearScore(0))).toBe(1);
    expect(valueOf(classifyLinearScore(-1e-12))).toBe(0);
    expect(valueOf(classifyLinearScore(1e-12))).toBe(1);
  });

  it('evaluates a complete neuron', () => {
    expect(valueOf(evaluateNeuron([2, 3], [2, -1], 1, 'sigmoid'))).toEqual({
      contributions: [4, -3],
      s: 1,
      z: 2,
      a: expect.closeTo(0.880797078),
    });
  });
});

describe('zero sets', () => {
  it('describes 1D points and degenerate outcomes', () => {
    expect(valueOf(zeroSet1D(2, 1))).toEqual({ kind: 'point', x: -0.5 });
    expect(valueOf(zeroSet1D(0, 0))).toEqual({ kind: 'all-space' });
    expect(valueOf(zeroSet1D(0, 1))).toEqual({ kind: 'empty' });
  });

  it('describes vertical and horizontal 2D lines without slope division', () => {
    const horizontal = valueOf(zeroSet2D([0, 2], -4));
    const vertical = valueOf(zeroSet2D([2, 0], -4));

    expect(horizontal).toMatchObject({ kind: 'line', point: [0, 2], direction: [-2, 0], normal: [0, 2] });
    expect(vertical).toMatchObject({ kind: 'line', point: [2, 0], direction: [-0, 2], normal: [2, 0] });
  });

  it('does not treat tiny nonzero weights as degenerate', () => {
    expect(valueOf(zeroSet2D([1e-12, 0], 1))).toMatchObject({ kind: 'line' });
    expect(valueOf(zeroSet2D([0, 0], 0))).toEqual({ kind: 'all-space' });
    expect(valueOf(zeroSet2D([0, 0], -1))).toEqual({ kind: 'empty' });
  });

  it('returns a boundary direction perpendicular to the weight and translates it with bias', () => {
    const first = valueOf(zeroSet2D([2, -1], 0));
    const shifted = valueOf(zeroSet2D([2, -1], 5));
    if (first.kind !== 'line' || shifted.kind !== 'line') throw new Error('Expected lines');
    expect(first.normal[0] * first.direction[0] + first.normal[1] * first.direction[1]).toBe(0);
    expect(shifted.direction).toEqual(first.direction);
    expect(2 * shifted.point[0] - shifted.point[1] + 5).toBeCloseTo(0);
  });
});
