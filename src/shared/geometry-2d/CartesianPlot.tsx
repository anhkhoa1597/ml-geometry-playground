import { useId, type MouseEvent } from 'react';
import { createViewport, screenToWorld, worldToScreen, type Point2, type Segment } from '.';

export type PlotPoint = { point: Point2; label: string; tone?: 'positive' | 'negative' | 'zero' | 'selected'; shape?: 'circle' | 'diamond' };
export type PlotLine = { segment: Segment; label?: string; reference?: boolean };
export type PlotPolygon = { points: readonly Point2[]; tone: 'positive' | 'negative' | 'zero' };
export type PlotArrow = { origin: Point2; displacement: Point2; label: string; rightAngle?: boolean };

type Props = {
  title: string;
  description: string;
  points?: readonly PlotPoint[];
  lines?: readonly PlotLine[];
  polygons?: readonly PlotPolygon[];
  arrows?: readonly PlotArrow[];
  onPick?: (point: Point2) => void;
};

const width = 640;
const height = 560;
const viewportResult = createViewport({ xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, width, height, 30);
if (!viewportResult) throw new Error('Invalid shared plot viewport.');
const viewport = viewportResult;

export function CartesianPlot({ title, description, points = [], lines = [], polygons = [], arrows = [], onPick }: Props) {
  const markerId = `plot-arrow-${useId().replaceAll(':', '')}`;
  function handleClick(event: MouseEvent<SVGSVGElement>) {
    if (!onPick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const screen: Point2 = [(event.clientX - rect.left) * width / rect.width, (event.clientY - rect.top) * height / rect.height];
    const world = screenToWorld(viewport, screen);
    if (world[0] >= -5 && world[0] <= 5 && world[1] >= -5 && world[1] <= 5) onPick(world);
  }
  const polygonPath = (values: readonly Point2[]) => values.map((p) => worldToScreen(viewport, p).join(',')).join(' ');
  return (
    <svg className={`cartesian-plot${onPick ? ' cartesian-plot--interactive' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} onClick={handleClick}>
      <title>{title}</title><desc>{description}</desc>
      <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" /></marker></defs>
      <rect x={viewport.rect.left} y={viewport.rect.top} width={viewport.rect.right - viewport.rect.left} height={viewport.rect.bottom - viewport.rect.top} className="plot-background" />
      {polygons.map((polygon, index) => <polygon key={index} points={polygonPath(polygon.points)} className={`plot-region plot-region--${polygon.tone}`} />)}
      {[-4,-2,0,2,4].map((tick) => { const [x] = worldToScreen(viewport,[tick,0]); const [,y] = worldToScreen(viewport,[0,tick]); return <g key={tick}><line className="plot-grid" x1={x} x2={x} y1={viewport.rect.top} y2={viewport.rect.bottom}/><line className="plot-grid" x1={viewport.rect.left} x2={viewport.rect.right} y1={y} y2={y}/><text className="plot-tick" x={x} y={viewport.rect.bottom+20} textAnchor="middle">{tick}</text><text className="plot-tick" x={viewport.rect.left-8} y={y+5} textAnchor="end">{tick}</text></g>; })}
      <line className="plot-axis" x1={viewport.rect.left} x2={viewport.rect.right} y1={worldToScreen(viewport,[0,0])[1]} y2={worldToScreen(viewport,[0,0])[1]} />
      <line className="plot-axis" x1={worldToScreen(viewport,[0,0])[0]} x2={worldToScreen(viewport,[0,0])[0]} y1={viewport.rect.top} y2={viewport.rect.bottom} />
      <text className="plot-axis-label" x={viewport.rect.right} y={viewport.rect.bottom+25} textAnchor="end">x₁</text><text className="plot-axis-label" x={viewport.rect.left+8} y={viewport.rect.top+18}>x₂</text>
      {lines.map((line,index) => {
        const a=worldToScreen(viewport,line.segment.start);
        const b=worldToScreen(viewport,line.segment.end);
        const fraction=line.reference ? .78 : .22;
        const x=a[0]+(b[0]-a[0])*fraction;
        const y=a[1]+(b[1]-a[1])*fraction;
        return <g key={index}>
          <line className={`plot-boundary${line.reference?' plot-boundary--reference':''}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
          {line.label&&<text className="plot-label" x={x+(x>width*.6?-8:8)} y={y-12} textAnchor={x>width*.6?'end':'start'}>{line.label}</text>}
        </g>;
      })}
      {arrows.map((arrow,index) => {
        const a=worldToScreen(viewport,arrow.origin);
        const end:Point2=[arrow.origin[0]+arrow.displacement[0],arrow.origin[1]+arrow.displacement[1]];
        const b=worldToScreen(viewport,end);
        const length=Math.hypot(...arrow.displacement);
        // Only the angle annotation uses unit directions; the arrow remains exactly q → q+w.
        const size=Math.min(.4,length/2);
        const u=arrow.displacement.map((value)=>value/length);
        const tangent=[-u[1],u[0]];
        const corner=(along:number,across:number):Point2=>[
          arrow.origin[0]+size*(along*u[0]+across*tangent[0]),
          arrow.origin[1]+size*(along*u[1]+across*tangent[1]),
        ];
        const labelX=Math.max(viewport.rect.left+8,Math.min(viewport.rect.right-8,b[0]));
        return <g key={index}>
          {arrow.rightAngle&&length>0&&<g>
            <polyline className="plot-right-angle" points={polygonPath([corner(1,0),corner(1,1),corner(0,1)])} />
            <text className="plot-label plot-angle-label" x={worldToScreen(viewport,corner(2,2))[0]} y={worldToScreen(viewport,corner(2,2))[1]} textAnchor={u[0]+tangent[0]>=0?'start':'end'}>90°</text>
          </g>}
          <line className="plot-arrow" markerEnd={`url(#${markerId})`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}/>
          <text className="plot-label plot-label--vector" x={labelX} y={Math.max(viewport.rect.top+20,Math.min(viewport.rect.bottom-12,b[1]+(b[1]>=a[1]?26:-16)))} textAnchor={labelX>width*.65?'end':'start'}>{arrow.label}</text>
        </g>;
      })}
      {points.map((item,index) => { const p=worldToScreen(viewport,item.point); const left=item.tone==='zero'||item.tone==='negative'||item.point[0]>3; return <g key={index} className={`plot-point plot-point--${item.tone??'selected'}`} transform={`translate(${p[0]} ${p[1]})`}><path d={item.shape==='diamond'?'M0 -8 L8 0 L0 8 L-8 0 Z':'M0 0 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0-14 0'} /><text className="plot-label" textAnchor={left?'end':'start'} x={left?-12:12} y={item.point[1]>4?24:-14}>{item.label}</text></g>; })}
    </svg>
  );
}
