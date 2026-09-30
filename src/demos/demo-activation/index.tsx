import { useId, useState } from 'react';
import { activate, type ActivationId } from '../../shared/math-core';
import { formatNumber } from '../../shared/format-number';
import { ParameterControl, ParameterHint, PresetControl, ResetControl } from '../../shared/app-shell';

const labels: Record<ActivationId, string> = { step: 'Step', sigmoid: 'Sigmoid', relu: 'ReLU' };

function activationValue(z: number, activation: ActivationId): number {
  const result = activate(z, activation);
  return result.ok ? result.value : 0;
}

function ActivationGraph({ activation, z }: { activation: ActivationId; z: number }) {
  const ids = useId().replaceAll(':', '');
  const width = 820;
  const height = 460;
  const left = 76;
  const right = 780;
  const top = 30;
  const bottom = 400;
  const yDomain: readonly [number, number] = activation === 'relu' ? [-1, 10.5] : [-0.1, 1.1];
  const sx = (value: number) => left + ((value + 10) / 20) * (right - left);
  const sy = (value: number) => bottom - ((value - yDomain[0]) / (yDomain[1] - yDomain[0])) * (bottom - top);
  const a = activationValue(z, activation);
  const xTicks = [-10, -5, 0, 5, 10];
  const yTicks = activation === 'relu' ? [0, 5, 10] : [0, 0.5, 1];

  const continuousPath = activation === 'step'
    ? ''
    : Array.from({ length: 81 }, (_, index) => -10 + index * 0.25)
      .map((sample, index) => `${index === 0 ? 'M' : 'L'}${sx(sample).toFixed(2)} ${sy(activationValue(sample, activation)).toFixed(2)}`)
      .join(' ');

  return (
    <svg className="activation-graph" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${ids}-title ${ids}-desc`}>
      <title id={`${ids}-title`}>{labels[activation]} biến linear score z thành activation output a</title>
      <desc id={`${ids}-desc`}>Điểm đang chọn z bằng {formatNumber(z)}, output a bằng {formatNumber(a)}. Trục ngang là z, trục dọc là a bằng f của z.</desc>
      <g className="chart-grid">
        {xTicks.map((tick) => <line key={`x-${tick}`} x1={sx(tick)} x2={sx(tick)} y1={top} y2={bottom} />)}
        {yTicks.map((tick) => <line key={`y-${tick}`} x1={left} x2={right} y1={sy(tick)} y2={sy(tick)} />)}
      </g>
      <line className="chart-axis" x1={left} x2={right} y1={sy(0)} y2={sy(0)} />
      <line className="chart-axis" x1={sx(0)} x2={sx(0)} y1={top} y2={bottom} />
      {xTicks.map((tick) => <text className="chart-tick" key={`xt-${tick}`} x={sx(tick)} y={bottom + 28} textAnchor="middle">{tick}</text>)}
      {yTicks.map((tick) => <text className="chart-tick" key={`yt-${tick}`} x={left - 14} y={sy(tick) + 5} textAnchor="end">{tick}</text>)}
      <text className="chart-label" x={right} y={bottom + 48} textAnchor="end">z · linear score</text>
      <text className="chart-label" x={left + 8} y={top + 18}>a = f(z)</text>
      {activation === 'step' ? (
        <g className="activation-curve">
          <path d={`M${sx(-10)} ${sy(0)} L${sx(0)} ${sy(0)}`} />
          <path d={`M${sx(0)} ${sy(1)} L${sx(10)} ${sy(1)}`} />
          <circle className="open-point" cx={sx(0)} cy={sy(0)} r="7" />
          <circle className="closed-point" cx={sx(0)} cy={sy(1)} r="7" />
        </g>
      ) : <path className="activation-curve" d={continuousPath} />}
      {activation === 'sigmoid' && <g className="reference-point"><circle cx={sx(0)} cy={sy(0.5)} r="5" /><text x={sx(0) + 12} y={sy(0.5) - 12}>(0, 0.5)</text></g>}
      <line className="selected-guide" x1={sx(z)} x2={sx(z)} y1={sy(0)} y2={sy(a)} />
      <line className="selected-guide" x1={left} x2={sx(z)} y1={sy(a)} y2={sy(a)} />
      <g className="selected-point"><circle cx={sx(z)} cy={sy(a)} r="9" /><text textAnchor={z>4?'end':'start'} x={sx(z) + (z>4?-14:14)} y={sy(a) + (activation==='sigmoid'||(activation==='step'&&a===1)?30:-14)}>z={formatNumber(z)}, a={formatNumber(a)}</text></g>
    </svg>
  );
}

function observationFor(activation: ActivationId) {
  if (activation === 'step') return 'Đầu ra nhảy từ 0 sang 1 tại threshold. Theo convention của demo, Step(0) = 1.';
  if (activation === 'relu') return 'Score âm cho output 0; score dương giữ nguyên giá trị. ReLU output có thể lớn hơn 1 và không phải probability.';
  return 'z = 0 tương ứng σ(z) = 0.5. Chỉ trong logistic-classification context riêng mới diễn giải output này là probability.';
}

export function ActivationDemo() {
  const [activation, setActivation] = useState<ActivationId>('sigmoid');
  const [z, setZ] = useState(2);
  const [resetKey, setResetKey] = useState(0);
  const a = activationValue(z, activation);

  function reset() {
    setActivation('sigmoid');
    setZ(2);
    setResetKey((key) => key + 1);
  }

  function setPreset(value: number) {
    setZ(value);
    setResetKey((key) => key + 1);
  }

  return (
    <div className="demo-workspace activation-workspace">
      <div className="visualization-stage">
        <ActivationGraph activation={activation} z={z} />
        <p className="primary-equation" aria-live="polite">a = {activation === 'sigmoid' ? 'σ' : labels[activation]}({formatNumber(z)}) {Number.isInteger(a) ? '=' : '≈'} {formatNumber(a)}</p>
        {activation === 'sigmoid' && <p className="supporting-equation">wᵀx + b = 0 ⇔ z = 0 ⇔ σ(z) = 0.5 <span>· logistic threshold 0.5</span></p>}
        <p className="observation">{observationFor(activation)}</p>
        <p className="nonlinear-note">Nếu chỉ nối các phép affine, toàn bộ chuỗi vẫn rút gọn thành một phép affine. Nonlinear activation cho phép network biểu diễn quan hệ không thể thu được chỉ bằng chuỗi đó.</p>
      </div>
      <aside className="control-panel" aria-label="Tham số Activation Function">
        <h3>Function và score</h3><ParameterHint min={-10} max={10} />
        <fieldset className="activation-selector"><legend>Activation f</legend>{(['step', 'sigmoid', 'relu'] as const).map((id) => <label key={id}><input type="radio" name="curve-activation" value={id} checked={activation === id} onChange={() => setActivation(id)} />{labels[id]}</label>)}</fieldset>
        <ParameterControl label="Score z" value={z} min={-10} max={10} resetKey={resetKey} onChange={setZ} />
        <div className="demo-actions"><ResetControl onReset={reset} /><PresetControl presets={[-2, 0, 2].map((value) => ({ label: `z = ${value}`, apply: () => setPreset(value) }))} /></div>
      </aside>
    </div>
  );
}
