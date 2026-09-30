import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WeightNormalDemo } from '../../../src/demos/demo-weight-normal';
import { DecisionBoundaryDemo, PointClassificationDemo } from '../../../src/demos/demo-decision-boundary';

describe('geometry learning flows', () => {
  it('draws a perpendicular angle cue without scaling the weight vector', async () => {
    const user=userEvent.setup();
    const {container}=render(<WeightNormalDemo/>);
    const arrow=container.querySelector('.plot-arrow')!;
    const dx=Number(arrow.getAttribute('x2'))-Number(arrow.getAttribute('x1'));
    const dy=Number(arrow.getAttribute('y2'))-Number(arrow.getAttribute('y1'));
    // Shared viewport has 50 SVG units per world unit, with screen y inverted.
    expect([dx,dy]).toEqual([100,50]);
    const corners=container.querySelector('.plot-right-angle')!.getAttribute('points')!.split(' ').map((point)=>point.split(',').map(Number));
    const u=corners[1].map((value,index)=>value-corners[0][index]);
    const v=corners[2].map((value,index)=>value-corners[1][index]);
    expect(u[0]*v[0]+u[1]*v[1]).toBeCloseTo(0,8);
    await user.click(screen.getByRole('button',{name:'w = 0'}));
    expect(container.querySelector('.plot-right-angle')).toBeNull();
    expect(container.querySelector('.plot-arrow')).toBeNull();
  });

  it('updates the decision boundary equation and handles a degenerate model', async () => {
    const user=userEvent.setup(); render(<DecisionBoundaryDemo/>);
    const w1=screen.getByLabelText('w₁'); await user.clear(w1); await user.type(w1,'1.5');
    expect(screen.getByText(/1.5x₁/)).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'w = 0, b = 0'}));
    expect(screen.getByText(/Mọi point đều nằm trên boundary/)).toBeInTheDocument();
  });

  it('foregrounds the on-boundary state before the tie convention', async () => {
    const user=userEvent.setup(); render(<PointClassificationDemo/>);
    await user.click(screen.getByRole('button',{name:'On boundary'}));
    expect(screen.getByText('On decision boundary')).toBeInTheDocument();
    expect(screen.getByText(/Tie convention/)).toBeInTheDocument();
  });
});
