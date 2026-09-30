import { describe, expect, it } from 'vitest';
import { analyzeScorePlane } from '../../../src/demos/demo-score-plane/model';

describe('score plane analysis', () => {
  it('finds the exact default z=0 intersection', () => {
    const result=analyzeScorePlane({w1:2,w2:-1,b:1});
    expect(result.kind).toBe('intersecting');
    expect(result.samples[0][2]).toBe(1);
    for(const [x1,x2,z] of result.intersection) expect(2*x1-x2+1+z).toBeCloseTo(0);
    expect(result.intersection).toEqual([[-3,-5,0],[2,5,0]]);
  });
  it('distinguishes parallel and coincident constant planes', () => {
    expect(analyzeScorePlane({w1:0,w2:0,b:2}).kind).toBe('parallel');
    expect(analyzeScorePlane({w1:0,w2:0,b:0}).kind).toBe('coincident');
  });
});
