import { lazy, Suspense } from 'react';
import { ActivationDemo } from '../demos/demo-activation';
import { ArtificialNeuronDemo, WeightedInputsDemo } from '../demos/demo-artificial-neuron';
import { BiasDemo } from '../demos/demo-bias-shift';
import { DecisionBoundaryDemo, PointClassificationDemo } from '../demos/demo-decision-boundary';
import { ForwardPassDemo } from '../demos/demo-forward-pass';
import { WeightNormalDemo } from '../demos/demo-weight-normal';
import { AppShell, type DemoTab } from '../shared/app-shell';

const ScorePlaneDemo = lazy(() => import('../demos/demo-score-plane').then((module) => ({ default: module.ScorePlaneDemo })));

const learningTabs: readonly DemoTab[] = [
  { id: 'weighted-inputs', label: 'Weighted Inputs', question: 'Mỗi input và weight đóng góp bao nhiêu vào tổng?', content: <WeightedInputsDemo /> },
  { id: 'decision-boundary', label: 'Decision Boundary', question: 'Tập các điểm có z = 0 là gì?', content: <DecisionBoundaryDemo /> },
  { id: 'bias', label: 'Bias', question: 'Thay đổi b làm boundary dịch như thế nào?', content: <BiasDemo /> },
  { id: 'weight-normal', label: 'Weight Vector ⟂ Boundary', question: 'Tại sao w vuông góc với boundary?', content: <WeightNormalDemo /> },
  { id: 'score-plane', label: 'Linear Score 3D', question: 'z = wᵀx + b tạo thành surface như thế nào?', content: <Suspense fallback={<div className="pending-visual">Đang tải mô hình 3D…</div>}><ScorePlaneDemo /></Suspense> },
  { id: 'activation', label: 'Activation Function', question: 'Activation biến z thành output như thế nào?', content: <ActivationDemo /> },
  { id: 'point-classification', label: 'Point Classification', question: 'Một point đi từ feature space đến prediction như thế nào?', content: <PointClassificationDemo /> },
  { id: 'artificial-neuron', label: 'Artificial Neuron', question: 'Các thành phần ghép lại thành một neuron như thế nào?', content: <ArtificialNeuronDemo /> },
  { id: 'forward-pass', label: 'ANN / Forward Pass', question: 'Output của layer này trở thành input layer sau như thế nào?', content: <ForwardPassDemo /> },
];

export function App() {
  return <AppShell tabs={learningTabs} />;
}
