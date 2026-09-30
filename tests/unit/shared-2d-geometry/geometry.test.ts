import { describe, expect, it } from 'vitest';
import { clipLine, createViewport, screenToWorld, vectorEndpoint, worldToScreen } from '../../../src/shared/geometry-2d';

const bounds = { xMin: -5, xMax: 5, yMin: -5, yMax: 5 };

describe('shared 2D geometry', () => {
  it('round-trips world and screen with equal axis scale', () => {
    const viewport = createViewport(bounds, 800, 500, 20)!;
    expect(viewport.scale).toBe(46);
    for (const point of [[0,0],[-5,-5],[5,5],[2,-3]] as const) {
      const roundTrip = screenToWorld(viewport, worldToScreen(viewport, point));
      expect(roundTrip[0]).toBeCloseTo(point[0], 10); expect(roundTrip[1]).toBeCloseTo(point[1], 10);
    }
  });
  it('clips vertical, horizontal and off-screen lines', () => {
    expect(clipLine([2,0],[0,1],bounds)).toEqual({kind:'segment',start:[2,-5],end:[2,5]});
    expect(clipLine([0,2],[1,0],bounds)).toEqual({kind:'segment',start:[-5,2],end:[5,2]});
    expect(clipLine([6,0],[0,1],bounds)).toEqual({kind:'none'});
  });
  it('keeps the true vector displacement', () => {
    expect(vectorEndpoint([-0.4,0.2],[2,-1])).toEqual([1.6,-0.8]);
  });
});
