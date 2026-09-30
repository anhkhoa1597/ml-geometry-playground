import { useState } from 'react';
import { ParameterControl, ParameterHint, PresetControl, ResetControl } from '../../shared/app-shell';
import { CartesianPlot, type PlotLine, type PlotPoint, type PlotPolygon } from '../../shared/geometry-2d/CartesianPlot';
import { clipHalfPlane, clipLine, type Bounds2, type Point2 } from '../../shared/geometry-2d';
import { activate, classifyLinearScore, linearScore, zeroSet1D, zeroSet2D } from '../../shared/math-core';
import { formatAdditiveTerm, formatNumber } from '../../shared/format-number';

type Pair = readonly [number, number];
const bounds: Bounds2 = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };
const defaults = { w: [2, -1] as Pair, b: 1 };
const samples: readonly Point2[] = [[2, 3], [0, 2], [1, 3]];
const sign = (z: number) => Math.abs(z) < 1e-9 ? 'z = 0' : z > 0 ? 'z > 0' : 'z < 0';

function scene(w: Pair, b: number) {
  const zero = zeroSet2D(w, b);
  if (!zero.ok) return { message: zero.error.message, lines: [] as PlotLine[], polygons: [] as PlotPolygon[] };
  if (zero.value.kind === 'all-space') return { message: 'Mọi point đều nằm trên boundary vì z = 0 ở mọi nơi.', lines: [], polygons: [] };
  if (zero.value.kind === 'empty') return { message: `Không có boundary: z luôn bằng ${formatNumber(b)}.`, lines: [], polygons: [] };
  const clipped = clipLine(zero.value.point, zero.value.direction, bounds);
  const positive = clipHalfPlane(w, b, true, bounds) ?? [];
  const negative = clipHalfPlane(w, b, false, bounds) ?? [];
  return {
    message: clipped?.kind === 'none' ? 'Boundary tồn tại nhưng nằm ngoài viewport hiện tại.' : '',
    lines: clipped?.kind === 'segment' ? [{ segment: clipped, label: 'z = 0' }] : [],
    polygons: [
      ...(positive.length ? [{ points: positive, tone: 'positive' as const }] : []),
      ...(negative.length ? [{ points: negative, tone: 'negative' as const }] : []),
    ],
  };
}

function controls(w: Pair, setW: (value: Pair) => void, b: number, setB: (value: number) => void, resetKey: number) {
  return <div className="compact-controls">
    <ParameterControl label="w₁" value={w[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setW([value, w[1]])} />
    <ParameterControl label="w₂" value={w[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setW([w[0], value])} />
    <ParameterControl label="Bias b" value={b} min={-5} max={5} resetKey={resetKey} onChange={setB} />
  </div>;
}

export function DecisionBoundaryDemo() {
  const [dimension, setDimension] = useState<1 | 2>(2);
  const [w, setW] = useState<Pair>(defaults.w);
  const [b, setB] = useState(defaults.b);
  const [w1d, setW1d] = useState(2);
  const [b1d, setB1d] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const plot = scene(w, b);
  const plotPoints: PlotPoint[] = samples.map((point, index) => {
    const result = linearScore(point, w, b);
    const z = result.ok ? result.value : 0;
    return { point, label: `${String.fromCharCode(65 + index)} · ${sign(z)}`, tone: Math.abs(z) < 1e-9 ? 'zero' : z > 0 ? 'positive' : 'negative', shape: Math.abs(z) < 1e-9 ? 'diamond' : 'circle' };
  });
  const one = zeroSet1D(w1d, b1d);
  const reset = () => { setW(defaults.w); setB(defaults.b); setW1d(2); setB1d(1); setResetKey((v) => v + 1); };
  return <div className="demo-workspace">
    <div className="visualization-stage">
      <div className="mode-switch" role="group" aria-label="Số features"><button type="button" aria-pressed={dimension === 1} onClick={() => setDimension(1)}>1 feature</button><button type="button" aria-pressed={dimension === 2} onClick={() => setDimension(2)}>2 features</button></div>
      {dimension === 2 ? <>
        <CartesianPlot title="Decision boundary trong feature space hai chiều" description="Hai vùng dấu được ngăn bởi đường z bằng không." points={plotPoints} lines={plot.lines} polygons={plot.polygons} />
        <div className="sign-legend"><span className="positive">+ z &gt; 0</span><span className="zero">◆ z = 0</span><span className="negative">− z &lt; 0</span></div>
        {plot.message && <p className="geometry-status" role="status">{plot.message}</p>}
        <p className="primary-equation">{formatNumber(w[0])}x₁ {formatAdditiveTerm(w[1], 'x₂')} {formatAdditiveTerm(b)} = 0</p>
      </> : <>
        <div className="number-line" role="img" aria-label="Decision boundary một chiều">
          <div className="number-line__axis" />
          {one.ok && one.value.kind === 'point' && one.value.x >= -5 && one.value.x <= 5 && <span className="number-line__point" style={{ left: `${5 + (one.value.x + 5) * 9}%` }}>◆<small>x = {formatNumber(one.value.x)}</small></span>}
          <span className="number-line__end number-line__end--left">−5</span><span className="number-line__end">5</span>
        </div>
        <p className="geometry-status" role="status">{one.ok && one.value.kind === 'point' ? (one.value.x < -5 || one.value.x > 5 ? 'Boundary là một point nằm ngoài viewport.' : 'Với một feature, decision boundary là một point.') : one.ok && one.value.kind === 'all-space' ? 'Mọi point đều có z = 0.' : 'Không có point nào có z = 0.'}</p>
        <p className="primary-equation">{formatNumber(w1d)}x {formatAdditiveTerm(b1d)} = 0</p><p className="observation">Sample x = 2 → z = {formatNumber(2*w1d+b1d)} ({sign(2*w1d+b1d)})</p>
      </>}
    </div>
    <aside className="control-panel" aria-label="Tham số Decision Boundary">
      <h3>{dimension} feature{dimension === 2 ? 's' : ''}</h3><ParameterHint />
      {dimension === 2 ? controls(w, setW, b, setB, resetKey) : <><ParameterControl label="w" value={w1d} min={-5} max={5} resetKey={resetKey} onChange={setW1d} /><ParameterControl label="b" value={b1d} min={-5} max={5} resetKey={resetKey} onChange={setB1d} /></>}
      <div className="demo-actions"><ResetControl onReset={reset} /><PresetControl presets={dimension === 2 ? [
        { label: 'Vertical', apply: () => { setW([1, 0]); setB(-1); setResetKey((v) => v + 1); } },
        { label: 'Horizontal', apply: () => { setW([0, 1]); setB(-1); setResetKey((v) => v + 1); } },
        { label: 'w = 0, b = 0', apply: () => { setW([0, 0]); setB(0); setResetKey((v) => v + 1); } },
        { label: 'w = 0, b = 1', apply: () => { setW([0, 0]); setB(1); setResetKey((v) => v + 1); } },
      ] : [{ label: 'All space', apply: () => { setW1d(0); setB1d(0); setResetKey((v) => v + 1); } }, { label: 'Empty', apply: () => { setW1d(0); setB1d(1); setResetKey((v) => v + 1); } }]} /></div>
    </aside>
  </div>;
}

export function PointClassificationDemo() {
  const [x, setX] = useState<Pair>([2, 3]);
  const [w, setW] = useState<Pair>(defaults.w);
  const [b, setB] = useState(defaults.b);
  const [logistic, setLogistic] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const plot = scene(w, b);
  const score = linearScore(x, w, b);
  const z = score.ok ? score.value : 0;
  const prediction = classifyLinearScore(z);
  const probability = activate(z, 'sigmoid');
  const onBoundary = Math.abs(z) < 1e-9;
  const reset = () => { setX([2, 3]); setW(defaults.w); setB(1); setLogistic(true); setResetKey((v) => v + 1); };
  return <div className="demo-workspace">
    <div className="visualization-stage">
      <CartesianPlot title="Phân loại một point" description="Point được chọn, decision boundary và hai vùng dấu." lines={plot.lines} polygons={plot.polygons} points={[{ point: x, label: `(${formatNumber(x[0])}, ${formatNumber(x[1])})`, tone: 'selected', shape: 'diamond' }]} onPick={(point) => setX([Math.round(point[0] * 10) / 10, Math.round(point[1] * 10) / 10])} />
      <div className="calculation-flow" aria-live="polite"><span>point ({formatNumber(x[0])}, {formatNumber(x[1])})</span><span aria-hidden="true">→</span><span>z = {formatNumber(z)}</span><span aria-hidden="true">→</span>{logistic && <><span>σ(z) = {formatNumber(probability.ok ? probability.value : 0)}</span><span aria-hidden="true">→</span></>}<strong>{onBoundary ? 'On decision boundary' : `Class ${prediction.ok ? prediction.value : 0}`}</strong></div>
      <p className="primary-equation">z = {formatNumber(w[0])}({formatNumber(x[0])}) {formatAdditiveTerm(w[1], `(${formatNumber(x[1])})`)} {formatAdditiveTerm(b)} = {formatNumber(z)}</p>
      <p className="observation">{onBoundary ? 'On decision boundary. Tie convention: z ≥ 0 maps to Class 1.' : `${sign(z)} nên point nằm ở phía Class ${prediction.ok ? prediction.value : 0}.`}</p>
    </div>
    <aside className="control-panel" aria-label="Tham số Point Classification"><h3>Point và model</h3><ParameterHint />
      <div className="compact-controls"><ParameterControl label="x₁" value={x[0]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setX([value, x[1]])} /><ParameterControl label="x₂" value={x[1]} min={-5} max={5} resetKey={resetKey} onChange={(value) => setX([x[0], value])} /></div>
      {controls(w, setW, b, setB, resetKey)}
      <label className="toggle-control"><input type="checkbox" checked={logistic} onChange={(event) => setLogistic(event.target.checked)} /> Logistic output</label>
      <div className="demo-actions"><ResetControl onReset={reset} /><PresetControl presets={[{ label: 'On boundary', apply: () => { setX([1, 3]); setResetKey((v) => v + 1); } }, { label: 'Negative side', apply: () => { setX([0, 2]); setResetKey((v) => v + 1); } }]} /></div>
    </aside>
  </div>;
}
