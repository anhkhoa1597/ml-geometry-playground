export type ActivationId = 'step' | 'sigmoid' | 'relu';

export type MathError = {
  kind: 'invalid-input' | 'numerical-range-error';
  message: string;
};

export type MathResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: MathError };

export type ZeroSet1D =
  | { kind: 'point'; x: number }
  | { kind: 'all-space' }
  | { kind: 'empty' };

export type ZeroSet2D =
  | {
      kind: 'line';
      point: readonly [number, number];
      direction: readonly [number, number];
      normal: readonly [number, number];
    }
  | { kind: 'all-space' }
  | { kind: 'empty' };

export type NeuronEvaluation = {
  contributions: readonly number[];
  s: number;
  z: number;
  a: number;
};

const invalid = (message: string): MathResult<never> => ({
  ok: false,
  error: { kind: 'invalid-input', message },
});

const outOfRange = (message: string): MathResult<never> => ({
  ok: false,
  error: { kind: 'numerical-range-error', message },
});

const success = <T>(value: T): MathResult<T> => ({ ok: true, value });

function validateVectors(x: readonly number[], w: readonly number[]): MathResult<true> {
  if (x.length !== w.length || (x.length !== 1 && x.length !== 2)) {
    return invalid('Input and weight vectors must have the same dimension of 1 or 2.');
  }
  if (![...x, ...w].every(Number.isFinite)) {
    return invalid('Inputs and weights must be finite numbers.');
  }
  return success(true);
}

export function weightedContributions(
  x: readonly number[],
  w: readonly number[],
): MathResult<readonly number[]> {
  const validation = validateVectors(x, w);
  if (!validation.ok) return validation;

  const contributions = x.map((value, index) => value * w[index]);
  if (!contributions.every(Number.isFinite)) {
    return outOfRange('A weighted contribution exceeds the supported numeric range.');
  }
  return success(contributions);
}

export function weightedSum(x: readonly number[], w: readonly number[]): MathResult<number> {
  const contributions = weightedContributions(x, w);
  if (!contributions.ok) return contributions;

  let sum = 0;
  for (const contribution of contributions.value) {
    sum += contribution;
    if (!Number.isFinite(sum)) {
      return outOfRange('The weighted sum exceeds the supported numeric range.');
    }
  }
  return success(sum);
}

export function linearScore(
  x: readonly number[],
  w: readonly number[],
  b: number,
): MathResult<number> {
  if (!Number.isFinite(b)) return invalid('Bias must be a finite number.');
  const sum = weightedSum(x, w);
  if (!sum.ok) return sum;
  const score = sum.value + b;
  return Number.isFinite(score)
    ? success(score)
    : outOfRange('The linear score exceeds the supported numeric range.');
}

export function zeroSet1D(w: number, b: number): MathResult<ZeroSet1D> {
  if (!Number.isFinite(w) || !Number.isFinite(b)) {
    return invalid('Weight and bias must be finite numbers.');
  }
  if (w === 0) return success(b === 0 ? { kind: 'all-space' } : { kind: 'empty' });

  const x = -b / w;
  return Number.isFinite(x)
    ? success({ kind: 'point', x })
    : outOfRange('The zero-set point is outside the supported numeric range.');
}

export function zeroSet2D(w: readonly number[], b: number): MathResult<ZeroSet2D> {
  if (w.length !== 2 || !w.every(Number.isFinite) || !Number.isFinite(b)) {
    return invalid('A 2D zero set requires two finite weights and a finite bias.');
  }
  const [w1, w2] = w;
  if (w1 === 0 && w2 === 0) {
    return success(b === 0 ? { kind: 'all-space' } : { kind: 'empty' });
  }

  const scale = Math.max(Math.abs(w1), Math.abs(w2));
  const u1 = w1 / scale;
  const u2 = w2 / scale;
  const scaledNormSquared = u1 * u1 + u2 * u2;
  const pointScale = -b / scale / scaledNormSquared;
  const point: readonly [number, number] = [pointScale * u1, pointScale * u2];

  if (!point.every(Number.isFinite)) {
    return outOfRange('The zero-set line is outside the supported numeric range.');
  }

  return success({
    kind: 'line',
    point,
    direction: [-w2, w1],
    normal: [w1, w2],
  });
}

export function activate(z: number, activation: string): MathResult<number> {
  if (!Number.isFinite(z)) return invalid('Activation input must be finite.');

  switch (activation) {
    case 'step':
      return success(z >= 0 ? 1 : 0);
    case 'relu':
      return success(Math.max(0, z));
    case 'sigmoid': {
      const value = z >= 0
        ? 1 / (1 + Math.exp(-z))
        : Math.exp(z) / (1 + Math.exp(z));
      return success(value);
    }
    default:
      return invalid(`Unsupported activation: ${activation}`);
  }
}

export function classifyLinearScore(z: number): MathResult<0 | 1> {
  return Number.isFinite(z)
    ? success(z >= 0 ? 1 : 0)
    : invalid('Classification score must be finite.');
}

export function evaluateNeuron(
  x: readonly number[],
  w: readonly number[],
  b: number,
  activation: ActivationId,
): MathResult<NeuronEvaluation> {
  const contributions = weightedContributions(x, w);
  if (!contributions.ok) return contributions;
  const s = weightedSum(x, w);
  if (!s.ok) return s;
  const z = linearScore(x, w, b);
  if (!z.ok) return z;
  const a = activate(z.value, activation);
  if (!a.ok) return a;

  return success({ contributions: contributions.value, s: s.value, z: z.value, a: a.value });
}
