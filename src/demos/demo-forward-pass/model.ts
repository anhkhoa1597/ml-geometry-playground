import { evaluateNeuron, type MathResult, type NeuronEvaluation } from '../../shared/math-core';

export type Pair = readonly [number, number];
export type ForwardModel = { x: Pair; hidden1: { w: Pair; b: number }; hidden2: { w: Pair; b: number }; output: { w: Pair; b: number } };
export type ForwardResult = { hidden1: NeuronEvaluation; hidden2: NeuronEvaluation; output: NeuronEvaluation };

export const defaultForwardModel: ForwardModel = { x: [2, 3], hidden1: { w: [2, -1], b: 1 }, hidden2: { w: [1, 1], b: -4 }, output: { w: [1, -1], b: 0 } };

export function evaluateForwardPass(model: ForwardModel): MathResult<ForwardResult> {
  const hidden1 = evaluateNeuron(model.x, model.hidden1.w, model.hidden1.b, 'relu');
  if (!hidden1.ok) return hidden1;
  const hidden2 = evaluateNeuron(model.x, model.hidden2.w, model.hidden2.b, 'relu');
  if (!hidden2.ok) return hidden2;
  const output = evaluateNeuron([hidden1.value.a, hidden2.value.a], model.output.w, model.output.b, 'sigmoid');
  if (!output.ok) return output;
  return { ok: true, value: { hidden1: hidden1.value, hidden2: hidden2.value, output: output.value } };
}
