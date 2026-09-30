import { zeroSet2D } from '../../shared/math-core';

export type ScoreModel = { w1: number; w2: number; b: number };
export type Point3 = readonly [number, number, number];
export type ScorePlaneAnalysis = {
  kind: 'intersecting' | 'parallel' | 'coincident';
  surface: readonly Point3[];
  intersection: readonly Point3[];
  samples: readonly Point3[];
  message: string;
};

const xy = 5;
const zLimit = 15;
const score = (model: ScoreModel, x1: number, x2: number) => model.w1 * x1 + model.w2 * x2 + model.b;

function clipPolygon(points: readonly [number, number][], value: (point: readonly [number, number]) => number): [number, number][] {
  const output: [number, number][] = [];
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const a = value(current);
    const b = value(next);
    if (a >= 0) output.push([...current]);
    if ((a >= 0) !== (b >= 0)) {
      const t = a / (a - b);
      output.push([current[0] + t * (next[0] - current[0]), current[1] + t * (next[1] - current[1])]);
    }
  }
  return output;
}

function clipIntersection(point: readonly [number, number], direction: readonly [number, number]): Point3[] {
  let low = -Infinity;
  let high = Infinity;
  for (const [q, d] of [[point[0], direction[0]], [point[1], direction[1]]] as const) {
    if (d === 0) { if (q < -xy || q > xy) return []; continue; }
    const a = (-xy - q) / d;
    const b = (xy - q) / d;
    low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b));
  }
  return low <= high ? [[point[0] + low * direction[0], point[1] + low * direction[1], 0], [point[0] + high * direction[0], point[1] + high * direction[1], 0]] : [];
}

export function analyzeScorePlane(model: ScoreModel): ScorePlaneAnalysis {
  let polygon: [number, number][] = [[-xy,-xy],[xy,-xy],[xy,xy],[-xy,xy]];
  polygon = clipPolygon(polygon, ([x1,x2]) => score(model,x1,x2) + zLimit);
  polygon = clipPolygon(polygon, ([x1,x2]) => zLimit - score(model,x1,x2));
  const surface = polygon.map(([x1,x2]) => [x1,x2,score(model,x1,x2)] as Point3);
  const zero = zeroSet2D([model.w1, model.w2], model.b);
  const samples = [[0,0],[1,0],[0,1]].map(([x1,x2]) => [x1,x2,score(model,x1,x2)] as Point3);
  if (!zero.ok) return { kind: 'parallel', surface, intersection: [], samples, message: zero.error.message };
  if (zero.value.kind === 'all-space') return { kind: 'coincident', surface, intersection: [], samples, message: 'Hai mặt trùng nhau; toàn bộ feature space có z = 0.' };
  if (zero.value.kind === 'empty') return { kind: 'parallel', surface, intersection: [], samples, message: `Score plane z = ${model.b} song song với z = 0; không có giao tuyến.` };
  const intersection = clipIntersection(zero.value.point, zero.value.direction);
  return { kind: 'intersecting', surface, intersection, samples, message: intersection.length ? 'Giao tuyến z = 0 chính là decision boundary trong feature space.' : 'Giao tuyến tồn tại nhưng nằm ngoài feature window.' };
}
