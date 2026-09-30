import { useState } from 'react';
import { ParameterControl, ParameterHint, PresetControl, ResetControl } from '../../shared/app-shell';
import { CartesianPlot, type PlotLine } from '../../shared/geometry-2d/CartesianPlot';
import { clipHalfPlane, clipLine } from '../../shared/geometry-2d';
import { zeroSet2D } from '../../shared/math-core';
import { formatAdditiveTerm, formatNumber } from '../../shared/format-number';

const w = [2, -1] as const;
const bounds = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };

function boundary(b: number, reference = false): PlotLine[] {
  const zero = zeroSet2D(w, b);
  if (!zero.ok || zero.value.kind !== 'line') return [];
  const clipped = clipLine(zero.value.point, zero.value.direction, bounds);
  return clipped?.kind === 'segment' ? [{ segment: clipped, label: reference ? 'b = 0' : `b = ${formatNumber(b)}`, reference }] : [];
}

export function BiasDemo() {
  const [b, setB] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const apply = (value: number) => { setB(value); setResetKey((key) => key + 1); };
  const signedDistance = -b / Math.hypot(...w);
  const positive = clipHalfPlane(w, b, true, bounds) ?? [];
  const negative = clipHalfPlane(w, b, false, bounds) ?? [];
  return <div className="demo-workspace">
    <div className="visualization-stage">
      <CartesianPlot title="Bias dịch decision boundary" description="Boundary hiện tại song song với reference boundary b bằng không." polygons={[{points:positive,tone:'positive'},{points:negative,tone:'negative'}]} lines={b === 0 ? boundary(0).map((line)=>({...line,label:'current = reference'})) : [...boundary(0, true), ...boundary(b)]} arrows={b === 0 ? [] : [{ origin: [0, 0], displacement: [signedDistance * w[0] / Math.hypot(...w), signedDistance * w[1] / Math.hypot(...w)], label: 'translation' }]} />
      <p className="primary-equation">2x₁ − x₂ {formatAdditiveTerm(b)} = 0</p>
      <p className="observation">w = [2, −1] được giữ cố định. Bias chỉ đổi offset: boundary hiện tại luôn song song với đường tham chiếu b = 0.</p>
    </div>
    <aside className="control-panel" aria-label="Tham số Bias"><h3>Chỉ thay đổi bias</h3><ParameterHint /><ParameterControl label="Bias b" value={b} min={-5} max={5} resetKey={resetKey} onChange={setB} /><div className="demo-actions"><ResetControl onReset={() => apply(1)} /><PresetControl presets={[-4, 0, 4].map((value) => ({ label: `b = ${value}`, apply: () => apply(value) }))} /></div></aside>
  </div>;
}
