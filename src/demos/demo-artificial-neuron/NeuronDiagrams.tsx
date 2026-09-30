import { formatNumber, formatSignedTerm } from '../../shared/format-number';

type WeightedDiagramProps = {
  x: readonly [number, number];
  w: readonly [number, number];
  contributions: readonly number[];
  s: number;
};

function DiagramNode({ x, y, title, value, tone = 'neutral' }: { x: number; y: number; title: string; value: string; tone?: 'neutral' | 'positive' | 'negative' }) {
  return (
    <g transform={`translate(${x} ${y})`} className={`flow-node flow-node--${tone}`}>
      <rect x="-62" y="-36" width="124" height="72" rx="8" />
      <text className="flow-node__title" y="-8" textAnchor="middle">{title}</text>
      <text className="flow-node__value" y="19" textAnchor="middle">{value}</text>
    </g>
  );
}

export function WeightedDiagram({ x, w, contributions, s }: WeightedDiagramProps) {
  const c1Tone = contributions[0] < 0 ? 'negative' : contributions[0] > 0 ? 'positive' : 'neutral';
  const c2Tone = contributions[1] < 0 ? 'negative' : contributions[1] > 0 ? 'positive' : 'neutral';
  return (
    <svg className="flow-diagram weighted-diagram" viewBox="0 0 940 430" role="img" aria-labelledby="weighted-title weighted-desc">
      <title id="weighted-title">Hai weighted contributions hội tụ thành weighted sum</title>
      <desc id="weighted-desc">x1 nhân w1 bằng {formatNumber(contributions[0])}; x2 nhân w2 bằng {formatNumber(contributions[1])}; tổng s bằng {formatNumber(s)}.</desc>
      <defs><marker id="arrow-weighted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
      <path className="flow-line" markerEnd="url(#arrow-weighted)" d="M132 115 H225" />
      <path className="flow-line" markerEnd="url(#arrow-weighted)" d="M350 115 H445" />
      <path className="flow-line" markerEnd="url(#arrow-weighted)" d="M132 315 H225" />
      <path className="flow-line" markerEnd="url(#arrow-weighted)" d="M350 315 H445" />
      <path className="flow-line" markerEnd="url(#arrow-weighted)" d="M570 115 C650 115 630 215 690 215" />
      <path className="flow-line" markerEnd="url(#arrow-weighted)" d="M570 315 C650 315 630 215 690 215" />
      <path className="flow-line" markerEnd="url(#arrow-weighted)" d="M765 215 H820" />
      <DiagramNode x={70} y={115} title="Input x₁" value={formatNumber(x[0])} />
      <DiagramNode x={288} y={115} title="× weight w₁" value={formatSignedTerm(w[0])} />
      <DiagramNode x={508} y={115} title="Contribution c₁" value={formatSignedTerm(contributions[0])} tone={c1Tone} />
      <DiagramNode x={70} y={315} title="Input x₂" value={formatNumber(x[1])} />
      <DiagramNode x={288} y={315} title="× weight w₂" value={formatSignedTerm(w[1])} />
      <DiagramNode x={508} y={315} title="Contribution c₂" value={formatSignedTerm(contributions[1])} tone={c2Tone} />
      <g className="sum-node" transform="translate(728 215)"><circle r="38" /><text textAnchor="middle" y="8">Σ</text></g>
      <DiagramNode x={862} y={215} title="Weighted sum s" value={formatNumber(s)} />
    </svg>
  );
}

type NeuronDiagramProps = WeightedDiagramProps & {
  b: number;
  z: number;
  activationLabel: string;
  a: number;
};

export function NeuronDiagram({ x, w, contributions, s, b, z, activationLabel, a }: NeuronDiagramProps) {
  return (
    <svg className="flow-diagram neuron-diagram" viewBox="0 0 1180 430" role="img" aria-labelledby="neuron-title neuron-desc">
      <title id="neuron-title">Luồng tính toán của một artificial neuron</title>
      <desc id="neuron-desc">Hai inputs tạo contributions {formatNumber(contributions[0])} và {formatNumber(contributions[1])}, tổng s {formatNumber(s)}, thêm bias {formatNumber(b)} thành z {formatNumber(z)}, qua {activationLabel} thành activation output a {formatNumber(a)}.</desc>
      <defs><marker id="arrow-neuron" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M132 115 H190" />
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M315 115 C375 115 365 215 420 215" />
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M132 315 H190" />
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M315 315 C375 315 365 215 420 215" />
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M495 215 H535" />
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M660 215 H700" />
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M825 215 H865" />
      <path className="flow-line" markerEnd="url(#arrow-neuron)" d="M990 215 H1030" />
      <DiagramNode x={70} y={115} title="x₁ × w₁" value={`${formatNumber(x[0])} × ${formatSignedTerm(w[0])}`} />
      <DiagramNode x={253} y={115} title="Contribution c₁" value={formatSignedTerm(contributions[0])} tone={contributions[0] < 0 ? 'negative' : 'positive'} />
      <DiagramNode x={70} y={315} title="x₂ × w₂" value={`${formatNumber(x[1])} × ${formatSignedTerm(w[1])}`} />
      <DiagramNode x={253} y={315} title="Contribution c₂" value={formatSignedTerm(contributions[1])} tone={contributions[1] < 0 ? 'negative' : 'positive'} />
      <g className="sum-node" transform="translate(458 215)"><circle r="38" /><text textAnchor="middle" y="8">Σ</text><text className="sum-node__value" textAnchor="middle" y="65">s = {formatNumber(s)}</text></g>
      <DiagramNode x={598} y={215} title="Add bias +b" value={formatSignedTerm(b)} />
      <DiagramNode x={763} y={215} title="Linear score z" value={formatNumber(z)} />
      <DiagramNode x={928} y={215} title="Activation f" value={activationLabel} />
      <DiagramNode x={1093} y={215} title="Output a" value={formatNumber(a)} tone="positive" />
    </svg>
  );
}
