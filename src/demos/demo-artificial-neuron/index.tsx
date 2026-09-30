import { useState } from 'react';
import { activate, evaluateNeuron, weightedContributions, weightedSum, type ActivationId } from '../../shared/math-core';
import { formatNumber, formatSignedTerm } from '../../shared/format-number';
import { ParameterControl, ParameterHint, PresetControl, ResetControl } from '../../shared/app-shell';
import { NeuronDiagram, WeightedDiagram } from './NeuronDiagrams';

type Pair = readonly [number, number];
const defaultX: Pair = [2, 3];
const defaultW: Pair = [2, -1];

function usePair(initial: Pair): [Pair, (index: 0 | 1, value: number) => void, (value: Pair) => void] {
  const [pair, setPair] = useState<Pair>(initial);
  return [pair, (index, value) => setPair((current) => index === 0 ? [value, current[1]] : [current[0], value]), setPair];
}

function readValue<T>(result: { ok: true; value: T } | { ok: false }): T | null {
  return result.ok ? result.value : null;
}

export function WeightedInputsDemo() {
  const [x, setXAt, setX] = usePair(defaultX);
  const [w, setWAt, setW] = usePair(defaultW);
  const [resetKey, setResetKey] = useState(0);
  const contributions = readValue(weightedContributions(x, w));
  const s = readValue(weightedSum(x, w));

  if (!contributions || s === null) return <p role="alert">Không thể tính weighted sum với các giá trị hiện tại.</p>;

  function apply(values: { x?: Pair; w?: Pair }) {
    if (values.x) setX(values.x);
    if (values.w) setW(values.w);
    setResetKey((key) => key + 1);
  }

  return (
    <div className="demo-workspace">
      <div className="visualization-stage">
        <div className="vector-context"><span><strong>x</strong> = [{formatNumber(x[0])}, {formatNumber(x[1])}]</span><span><strong>w</strong> = [{formatNumber(w[0])}, {formatNumber(w[1])}]</span></div>
        <WeightedDiagram x={x} w={w} contributions={contributions} s={s} />
        <div className="mobile-flow" aria-hidden="true">
          <span>x₁ {formatNumber(x[0])} × w₁ {formatSignedTerm(w[0])} → c₁ {formatSignedTerm(contributions[0])}</span>
          <span>x₂ {formatNumber(x[1])} × w₂ {formatSignedTerm(w[1])} → c₂ {formatSignedTerm(contributions[1])}</span>
          <strong>Σ → s = {formatNumber(s)}</strong>
        </div>
        <p className="primary-equation" aria-live="polite">s = {formatSignedTerm(w[0])}({formatNumber(x[0])}) + {formatSignedTerm(w[1])}({formatNumber(x[1])}) = {formatNumber(s)}</p>
        <p className="observation">Mỗi weight thay đổi độ lớn và dấu của contribution trong ví dụ này. Độ lớn weight không tự động là “feature importance” trong mọi model.</p>
      </div>
      <aside className="control-panel" aria-label="Tham số Weighted Inputs">
        <h3>Inputs và weights</h3><ParameterHint />
        <ParameterControl label="x₁" value={x[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setXAt(0, value)} />
        <ParameterControl label="w₁" value={w[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setWAt(0, value)} />
        <ParameterControl label="x₂" value={x[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setXAt(1, value)} />
        <ParameterControl label="w₂" value={w[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setWAt(1, value)} />
        <div className="demo-actions">
          <ResetControl onReset={() => apply({ x: defaultX, w: defaultW })} />
          <PresetControl presets={[
            { label: 'Bỏ đóng góp x₂', apply: () => apply({ w: [w[0], 0] }) },
            { label: 'w₂ = +1', apply: () => apply({ w: [w[0], 1] }) },
            { label: 'Inputs bằng 0', apply: () => apply({ x: [0, 0] }) },
          ]} />
        </div>
      </aside>
    </div>
  );
}

const activationLabels: Record<ActivationId, string> = { step: 'Step', sigmoid: 'Sigmoid', relu: 'ReLU' };

export function ArtificialNeuronDemo() {
  const [x, setXAt, setX] = usePair(defaultX);
  const [w, setWAt, setW] = usePair(defaultW);
  const [b, setB] = useState(1);
  const [activation, setActivation] = useState<ActivationId>('sigmoid');
  const [resetKey, setResetKey] = useState(0);
  const evaluation = readValue(evaluateNeuron(x, w, b, activation));

  if (!evaluation) return <p role="alert">Không thể tính neuron với các giá trị hiện tại.</p>;

  function apply(values: { x: Pair; w: Pair; b: number }, resetActivation = false) {
    setX(values.x); setW(values.w); setB(values.b);
    if (resetActivation) setActivation('sigmoid');
    setResetKey((key) => key + 1);
  }

  const activated = readValue(activate(evaluation.z, activation));

  return (
    <div className="demo-workspace">
      <div className="visualization-stage">
        <NeuronDiagram x={x} w={w} contributions={evaluation.contributions} s={evaluation.s} b={b} z={evaluation.z} activationLabel={activationLabels[activation]} a={evaluation.a} />
        <div className="calculation-flow" aria-live="polite">
          <span>x₁ {formatNumber(x[0])} × w₁ {formatSignedTerm(w[0])} = c₁ {formatSignedTerm(evaluation.contributions[0])}</span><span aria-hidden="true">+</span>
          <span>x₂ {formatNumber(x[1])} × w₂ {formatSignedTerm(w[1])} = c₂ {formatSignedTerm(evaluation.contributions[1])}</span><span aria-hidden="true">→</span>
          <span>[{evaluation.contributions.map((value) => formatSignedTerm(value)).join(', ')}]</span><span aria-hidden="true">→</span>
          <span>s = {formatNumber(evaluation.s)}</span><span aria-hidden="true">→</span>
          <span>+b = {formatSignedTerm(b)}</span><span aria-hidden="true">→</span>
          <span>z = {formatNumber(evaluation.z)}</span><span aria-hidden="true">→</span>
          <span>{activationLabels[activation]}</span><span aria-hidden="true">→</span>
          <strong>a {Number.isInteger(evaluation.a) ? '=' : '≈'} {formatNumber(activated ?? evaluation.a)}</strong>
        </div>
        <p className="observation">Neuron ghép weighted sum, bias và activation đã thấy ở các tab trước. <strong>a</strong> là activation output của phép tính hiện tại.</p>
      </div>
      <aside className="control-panel" aria-label="Tham số Artificial Neuron">
        <h3>Neuron parameters</h3><ParameterHint />
        <div className="compact-controls">
          <ParameterControl label="x₁" value={x[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setXAt(0, value)} />
          <ParameterControl label="w₁" value={w[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setWAt(0, value)} />
          <ParameterControl label="x₂" value={x[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setXAt(1, value)} />
          <ParameterControl label="w₂" value={w[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setWAt(1, value)} />
        </div>
        <ParameterControl label="Bias b" value={b} min={-5} max={5} resetKey={resetKey} onChange={setB} />
        <fieldset className="activation-selector"><legend>Activation f</legend>{(['step', 'sigmoid', 'relu'] as const).map((id) => <label key={id}><input type="radio" name="neuron-activation" value={id} checked={activation === id} onChange={() => setActivation(id)} />{activationLabels[id]}</label>)}</fieldset>
        <div className="demo-actions">
          <ResetControl onReset={() => apply({ x: defaultX, w: defaultW, b: 1 }, true)} />
          <PresetControl presets={[
            { label: 'Score âm', apply: () => apply({ x: [0, 2], w: defaultW, b: 1 }) },
            { label: 'Score bằng 0', apply: () => apply({ x: [1, 3], w: defaultW, b: 1 }) },
          ]} />
        </div>
      </aside>
    </div>
  );
}
