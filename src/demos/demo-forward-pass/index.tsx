import { useId, useState } from 'react';
import { ParameterControl, ParameterHint, PresetControl, ResetControl } from '../../shared/app-shell';
import { formatAdditiveTerm, formatNumber } from '../../shared/format-number';
import { defaultForwardModel, evaluateForwardPass, type ForwardModel, type Pair } from './model';

type Selected = 'hidden1' | 'hidden2' | 'output';
const labels: Record<Selected, string> = { hidden1: 'h₁', hidden2: 'h₂', output: 'output' };
const cloneDefault = (): ForwardModel => ({ x: [...defaultForwardModel.x], hidden1: { w: [...defaultForwardModel.hidden1.w], b: 1 }, hidden2: { w: [...defaultForwardModel.hidden2.w], b: -4 }, output: { w: [...defaultForwardModel.output.w], b: 0 } });

export function ForwardPassDemo() {
  const edgeMarker = useId();
  const [model, setModel] = useState<ForwardModel>(cloneDefault);
  const [selected, setSelected] = useState<Selected>('hidden1');
  const [resetKey, setResetKey] = useState(0);
  const result = evaluateForwardPass(model);
  if (!result.ok) return <p role="alert">{result.error.message}</p>;
  const values = result.value;
  const chosen = model[selected];
  const evaluation = values[selected];
  const incoming: Pair = selected === 'output' ? [values.hidden1.a, values.hidden2.a] : model.x;
  const setAll = (next: ForwardModel, resetSelection = false) => { setModel(next); if (resetSelection) setSelected('hidden1'); setResetKey((key) => key + 1); };
  const updateNode = (field: 'w0' | 'w1' | 'b', value: number) => setModel((current) => ({ ...current, [selected]: field === 'b' ? { ...current[selected], b: value } : { ...current[selected], w: field === 'w0' ? [value, current[selected].w[1]] : [current[selected].w[0], value] } }));
  return <div className="demo-workspace">
    <div className="visualization-stage">
      <p className="diagram-scroll-hint">Sơ đồ 2 → 2 → 1 · cuộn ngang để xem toàn bộ.</p>
      <div className="network-scroll" tabIndex={0} role="region" aria-label="Sơ đồ mạng 2 → 2 → 1"><svg className="network-diagram" viewBox="0 0 840 480" role="group" aria-label={`Network: x1 ${model.x[0]}, x2 ${model.x[1]}; hidden activations a1 ${values.hidden1.a}, a2 ${values.hidden2.a}; output ${values.output.a}`}>
        <defs><marker id={edgeMarker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker></defs>
        <text className="network-layer-label" x="90" y="28">Inputs</text>
        <text className="network-layer-label" x="425" y="28">Hidden · ReLU</text>
        <text className="network-layer-label" x="735" y="28">Output</text>
        {[
          [138,140,366,123,model.hidden1.w[0],'w₁₁',230,112],
          [130,312,379,157,model.hidden1.w[1],'w₁₂',204,290],
          [130,168,379,303,model.hidden2.w[0],'w₂₁',204,197],
          [138,340,366,340,model.hidden2.w[1],'w₂₂',230,365],
          [479,143,673,202,model.output.w[0],'v₁',580,195],
          [479,317,673,258,model.output.w[1],'v₂',580,283],
        ].map(([x1,y1,x2,y2,weight,label,lx,ly]) => <g key={String(label)}>
          <line className="network-edge" markerEnd={`url(#${edgeMarker})`} x1={Number(x1)} y1={Number(y1)} x2={Number(x2)} y2={Number(y2)} />
          <text className="network-edge-label" x={Number(lx)} y={Number(ly)} textAnchor="middle">{String(label)}={formatNumber(Number(weight))}</text>
        </g>)}
        <g className="network-node input-node"><circle cx="90" cy="140" r="48"/><text x="90" y="132">x₁</text><text x="90" y="158">{formatNumber(model.x[0])}</text></g><g className="network-node input-node"><circle cx="90" cy="340" r="48"/><text x="90" y="332">x₂</text><text x="90" y="358">{formatNumber(model.x[1])}</text></g>
        <g className={`network-node${selected==='hidden1'?' selected':''}`} role="button" tabIndex={0} aria-pressed={selected==='hidden1'} aria-label={`Inspect h₁ · z=${formatNumber(values.hidden1.z)}, a=${formatNumber(values.hidden1.a)}`} onClick={() => setSelected('hidden1')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected('hidden1');}}}><circle cx="425" cy="120" r="58"/><text x="425" y="101">h₁ · ReLU</text><text className="node-score" x="425" y="126">z₁={formatNumber(values.hidden1.z)}</text><text className="activation-value" x="425" y="151">a₁={formatNumber(values.hidden1.a)}</text></g>
        <g className={`network-node${selected==='hidden2'?' selected':''}`} role="button" tabIndex={0} aria-pressed={selected==='hidden2'} aria-label={`Inspect h₂ · z=${formatNumber(values.hidden2.z)}, a=${formatNumber(values.hidden2.a)}`} onClick={() => setSelected('hidden2')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected('hidden2');}}}><circle cx="425" cy="340" r="58"/><text x="425" y="321">h₂ · ReLU</text><text className="node-score" x="425" y="346">z₂={formatNumber(values.hidden2.z)}</text><text className="activation-value" x="425" y="371">a₂={formatNumber(values.hidden2.a)}</text></g>
        <text className="transmission-label" x="562" y="124">a₁={formatNumber(values.hidden1.a)}</text><text className="transmission-label" x="562" y="350">a₂={formatNumber(values.hidden2.a)}</text>
        <g className={`network-node${selected==='output'?' selected':''}`} role="button" tabIndex={0} aria-pressed={selected==='output'} aria-label={`Inspect output · z=${formatNumber(values.output.z)}, a=${formatNumber(values.output.a)}`} onClick={() => setSelected('output')} onKeyDown={(e) => { if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected('output');}}}><circle cx="735" cy="230" r="68"/><text x="735" y="205">o · Sigmoid</text><text className="node-score" x="735" y="232">z={formatNumber(values.output.z)}</text><text className="activation-value" x="735" y="259">a={formatNumber(values.output.a)}</text></g>
        <text className="bias-label" x="425" y="52">b₁={formatNumber(model.hidden1.b)}</text><text className="bias-label" x="425" y="433">b₂={formatNumber(model.hidden2.b)}</text><text className="bias-label" x="735" y="135">bₒ={formatNumber(model.output.b)}</text>
        <text className="network-layer-label" x={selected==='output'?735:425} y={selected==='hidden1'?205:selected==='hidden2'?456:325}>Đang chọn: {labels[selected]}</text>
      </svg></div>
      <div className="mobile-flow"><span>Inputs: x₁={formatNumber(model.x[0])}, x₂={formatNumber(model.x[1])}</span><span>h₁ ReLU → a₁={formatNumber(values.hidden1.a)}</span><span>h₂ ReLU → a₂={formatNumber(values.hidden2.a)}</span><strong>[a₁,a₂] → output Sigmoid → {formatNumber(values.output.a)}</strong></div>
      <p className="primary-equation" aria-live="polite">{labels[selected]}: z = {formatNumber(chosen.w[0])}({formatNumber(incoming[0])}) {formatAdditiveTerm(chosen.w[1], `(${formatNumber(incoming[1])})`)} {formatAdditiveTerm(chosen.b)} = {formatNumber(evaluation.z)} → a = {formatNumber(evaluation.a)}</p>
      <p className="observation">Output neuron nhận activated values [a₁, a₂] = [{formatNumber(values.hidden1.a)}, {formatNumber(values.hidden2.a)}], không nhận hidden scores trước ReLU.</p>
    </div>
    <aside className="control-panel" aria-label="Forward Pass controls"><h3>Inputs</h3><ParameterHint /><div className="compact-controls"><ParameterControl label="x₁" value={model.x[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setModel((current) => ({ ...current, x: [value, current.x[1]] }))} /><ParameterControl label="x₂" value={model.x[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setModel((current) => ({ ...current, x: [current.x[0], value] }))} /></div>
      <label className="select-control">Inspect neuron<select value={selected} onChange={(event) => setSelected(event.target.value as Selected)}><option value="hidden1">h₁</option><option value="hidden2">h₂</option><option value="output">output</option></select></label>
      <h3>{labels[selected]} incoming parameters</h3><div className="compact-controls"><ParameterControl label={selected==='output'?'v₁':'w to x₁'} value={chosen.w[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => updateNode('w0', value)} /><ParameterControl label={selected==='output'?'v₂':'w to x₂'} value={chosen.w[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => updateNode('w1', value)} /><ParameterControl label="Bias" value={chosen.b} min={-5} max={5} resetKey={resetKey} onChange={(value) => updateNode('b', value)} /></div>
      <div className="demo-actions"><ResetControl onReset={() => setAll(cloneDefault(), true)} /><PresetControl presets={[{ label: 'Một hidden tắt', apply: () => setAll({ ...cloneDefault(), x: [0,0] }) }, { label: 'Cả hai hidden tắt', apply: () => setAll({ ...cloneDefault(), x: [-1,0] }) }]} /></div>
    </aside>
  </div>;
}
