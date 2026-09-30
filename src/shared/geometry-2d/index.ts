export type Point2 = readonly [number, number];
export type Bounds2 = { xMin: number; xMax: number; yMin: number; yMax: number };
export type ScreenRect = { left: number; right: number; top: number; bottom: number };
export type Viewport2D = { bounds: Bounds2; rect: ScreenRect; scale: number; offsetX: number; offsetY: number };
export type Segment = { kind: 'segment'; start: Point2; end: Point2 };
export type LineClip = Segment | { kind: 'point'; point: Point2 } | { kind: 'none' };

function finite(values: readonly number[]) { return values.every(Number.isFinite); }

export function createViewport(bounds: Bounds2, width: number, height: number, padding = 0): Viewport2D | null {
  if (!finite([bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, width, height, padding]) || bounds.xMin >= bounds.xMax || bounds.yMin >= bounds.yMax || width <= padding * 2 || height <= padding * 2) return null;
  const scale = Math.min((width - 2 * padding) / (bounds.xMax - bounds.xMin), (height - 2 * padding) / (bounds.yMax - bounds.yMin));
  const drawableWidth = (bounds.xMax - bounds.xMin) * scale;
  const drawableHeight = (bounds.yMax - bounds.yMin) * scale;
  const offsetX = (width - drawableWidth) / 2;
  const offsetY = (height - drawableHeight) / 2;
  return { bounds, scale, offsetX, offsetY, rect: { left: offsetX, right: offsetX + drawableWidth, top: offsetY, bottom: offsetY + drawableHeight } };
}

export function worldToScreen(viewport: Viewport2D, point: Point2): Point2 {
  return [viewport.offsetX + (point[0] - viewport.bounds.xMin) * viewport.scale, viewport.offsetY + (viewport.bounds.yMax - point[1]) * viewport.scale];
}

export function screenToWorld(viewport: Viewport2D, point: Point2): Point2 {
  return [viewport.bounds.xMin + (point[0] - viewport.offsetX) / viewport.scale, viewport.bounds.yMax - (point[1] - viewport.offsetY) / viewport.scale];
}

export function clipLine(point: Point2, direction: Point2, bounds: Bounds2): LineClip | null {
  if (!finite([...point, ...direction, bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax]) || bounds.xMin >= bounds.xMax || bounds.yMin >= bounds.yMax || (direction[0] === 0 && direction[1] === 0)) return null;
  let tMin = -Infinity;
  let tMax = Infinity;
  const axes = [[point[0], direction[0], bounds.xMin, bounds.xMax], [point[1], direction[1], bounds.yMin, bounds.yMax]] as const;
  for (const [q, d, min, max] of axes) {
    if (d === 0) {
      if (q < min || q > max) return { kind: 'none' };
      continue;
    }
    const t1 = (min - q) / d;
    const t2 = (max - q) / d;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
    if (tMin > tMax) return { kind: 'none' };
  }
  const start: Point2 = [point[0] + tMin * direction[0], point[1] + tMin * direction[1]];
  const end: Point2 = [point[0] + tMax * direction[0], point[1] + tMax * direction[1]];
  if (!finite([...start, ...end])) return null;
  return Math.hypot(start[0] - end[0], start[1] - end[1]) <= 1e-10 ? { kind: 'point', point: start } : { kind: 'segment', start, end };
}

export function clipHalfPlane(normal: Point2, constant: number, keepPositive: boolean, bounds: Bounds2): Point2[] | null {
  if (!finite([...normal, constant, bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax]) || (normal[0] === 0 && normal[1] === 0)) return null;
  let polygon: Point2[] = [[bounds.xMin, bounds.yMin], [bounds.xMax, bounds.yMin], [bounds.xMax, bounds.yMax], [bounds.xMin, bounds.yMax]];
  const signed = (p: Point2) => (normal[0] * p[0] + normal[1] * p[1] + constant) * (keepPositive ? 1 : -1);
  const output: Point2[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const a = signed(current);
    const b = signed(next);
    if (a >= 0) output.push(current);
    if ((a >= 0) !== (b >= 0)) {
      const t = a / (a - b);
      output.push([current[0] + t * (next[0] - current[0]), current[1] + t * (next[1] - current[1])]);
    }
  }
  polygon = output;
  return polygon;
}

export function vectorEndpoint(origin: Point2, displacement: Point2): Point2 | null {
  if (!finite([...origin, ...displacement])) return null;
  const endpoint: Point2 = [origin[0] + displacement[0], origin[1] + displacement[1]];
  return finite(endpoint) ? endpoint : null;
}
