import { useState } from 'react';
import { ParameterControl, ParameterHint, PresetControl, ResetControl } from '../../shared/app-shell';
import { CartesianPlot, type PlotLine } from '../../shared/geometry-2d/CartesianPlot';
import { clipLine } from '../../shared/geometry-2d';
import { zeroSet2D } from '../../shared/math-core';
import { formatAdditiveTerm, formatNumber } from '../../shared/format-number';

type Pair = readonly [number, number];
const bounds = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
const defaults = { w: [2, -1] as Pair, b: 1 };

export function WeightNormalDemo() {
  const [w, setW] = useState<Pair>(defaults.w);
  const [b, setB] = useState(defaults.b);
  const [resetKey, setResetKey] = useState(0);
  const zero = zeroSet2D(w, b);
  const lines: PlotLine[] = [];
  let origin: Pair = [0, 0];
  let message = '';
  if (zero.ok && zero.value.kind === 'line') {
    origin = zero.value.point;
    const clipped = clipLine(zero.value.point, zero.value.direction, bounds);
    if (clipped?.kind === 'segment') lines.push({ segment: clipped, label: 'decision boundary' });
    else message = 'Boundary tồn tại nhưng nằm ngoài viewport.';
  } else if (zero.ok) message = zero.value.kind === 'all-space' ? 'Không có một normal direction duy nhất: mọi point đều có z = 0.' : 'Không có decision boundary cho model này.';
  const hasDirection = Math.hypot(...w) > 0;
  const apply = (nextW: Pair, nextB = b) => { setW(nextW); setB(nextB); setResetKey((key) => key + 1); };
  return <div className="demo-workspace">
    <div className="visualization-stage">
      <CartesianPlot title="Weight vector vuông góc decision boundary" description="Vector weight bắt đầu trên boundary và chỉ theo normal direction." lines={lines} arrows={hasDirection && lines.length ? [{ origin, displacement: w, rightAngle: true, label: `w = [${formatNumber(w[0])}, ${formatNumber(w[1])}]` }] : []} />
      {hasDirection && lines.length ? <div className="right-angle-note"><span aria-hidden="true">∟</span><strong>90°</strong> — w · d = 0</div> : <p className="geometry-status" role="status">{message}</p>}
      <p className="primary-equation">w = [{formatNumber(w[0])}, {formatNumber(w[1])}] · boundary: {formatNumber(w[0])}x₁ {formatAdditiveTerm(w[1], 'x₂')} {formatAdditiveTerm(b)} = 0</p>
      <p className="observation">Thay đổi w quay cả normal vector và boundary. Thay đổi b chỉ dịch boundary; hướng của w không đổi.</p>
    </div>
    <aside className="control-panel" aria-label="Tham số Weight Normal"><h3>Weight và bias</h3><ParameterHint /><div className="compact-controls"><ParameterControl label="w₁" value={w[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setW([value, w[1]])} /><ParameterControl label="w₂" value={w[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setW([w[0], value])} /><ParameterControl label="Bias b" value={b} min={-5} max={5} resetKey={resetKey} onChange={setB} /></div><div className="demo-actions"><ResetControl onReset={() => apply(defaults.w, defaults.b)} /><PresetControl presets={[{ label: 'Vertical boundary', apply: () => apply([1, 0], -1) }, { label: 'Horizontal boundary', apply: () => apply([0, 1], -1) }, { label: 'Diagonal', apply: () => apply([1, 1], 0) }, { label: 'w = 0', apply: () => apply([0, 0], 0) }]} /></div></aside>
  </div>;
}
