import { useRef, useState } from 'react';
import { ParameterControl, ParameterHint, PresetControl, ResetControl } from '../../shared/app-shell';
import { formatAdditiveTerm, formatNumber } from '../../shared/format-number';
import { analyzeScorePlane, type ScoreModel } from './model';
import { ScorePlaneScene, type ScorePlaneSceneHandle } from './ScorePlaneScene';

const defaults: ScoreModel = { w1: 2, w2: -1, b: 1 };

function Fallback({ model, retry }: { model: ScoreModel; retry?: () => void }) {
  const analysis=analyzeScorePlane(model);
  return <div className="score-fallback" role="status"><strong>Không có tương tác 3D</strong><p>{analysis.message}</p><table><caption>Ba điểm trên score plane</caption><thead><tr><th>x₁</th><th>x₂</th><th>z</th></tr></thead><tbody>{analysis.samples.map((point)=><tr key={`${point[0]}-${point[1]}`}><td>{point[0]}</td><td>{point[1]}</td><td>{formatNumber(point[2])}</td></tr>)}</tbody></table>{analysis.intersection.length===2&&<p>Giao tuyến: ({analysis.intersection[0].map(formatNumber).join(', ')}) → ({analysis.intersection[1].map(formatNumber).join(', ')})</p>}{retry&&<button type="button" className="secondary-button" onClick={retry}>Thử tải lại 3D</button>}</div>;
}

export function ScorePlaneDemo() {
  const [model,setModel]=useState<ScoreModel>(defaults);
  const [resetKey,setResetKey]=useState(0);
  const [sceneKey,setSceneKey]=useState(0);
  const scene=useRef<ScorePlaneSceneHandle>(null);
  const analysis=analyzeScorePlane(model);
  const setAll=(next:ScoreModel,resetCamera=false)=>{setModel(next);setResetKey((key)=>key+1);if(resetCamera)requestAnimationFrame(()=>scene.current?.resetCamera());};
  return <div className="demo-workspace">
    <div className="visualization-stage">
      <div className="score-legend" aria-label="Các thành phần hình học">
        <span><i aria-hidden="true" />Score plane</span>
        <span><i className="reference-key" aria-hidden="true" />Reference · z = 0</span>
        <span><i className="intersection-key" aria-hidden="true" />Giao tuyến · decision boundary</span>
      </div>
      <ScorePlaneScene key={sceneKey} ref={scene} analysis={analysis} fallback={<Fallback model={model} retry={()=>setSceneKey((key)=>key+1)} />} />
      <div className="camera-controls" aria-label="Camera controls"><button type="button" onClick={()=>scene.current?.rotate(-.18,0)}>Rotate left</button><button type="button" onClick={()=>scene.current?.rotate(.18,0)}>Rotate right</button><button type="button" onClick={()=>scene.current?.rotate(0,1)}>Rotate up</button><button type="button" onClick={()=>scene.current?.rotate(0,-1)}>Rotate down</button><button type="button" onClick={()=>scene.current?.zoom(.85)}>Zoom +</button><button type="button" onClick={()=>scene.current?.zoom(1.15)}>Zoom −</button><button type="button" onClick={()=>scene.current?.resetCamera()}>Reset Camera</button></div>
      <p className="primary-equation">z = {formatNumber(model.w1)}x₁ {formatAdditiveTerm(model.w2, 'x₂')} {formatAdditiveTerm(model.b)}</p><p className="geometry-status" role="status">{analysis.message}</p><p className="observation">Màu xanh là graph của linear score; mặt lưới là z = 0. Đường cam là intersection và trở thành decision boundary khi nhìn trong feature space.</p>
    </div>
    <aside className="control-panel" aria-label="Linear Score 3D controls"><h3>Score plane</h3><ParameterHint /><ParameterControl label="w₁" value={model.w1} min={-5} max={5} resetKey={resetKey} onChange={(w1)=>setModel((current)=>({...current,w1}))}/><ParameterControl label="w₂" value={model.w2} min={-5} max={5} resetKey={resetKey} onChange={(w2)=>setModel((current)=>({...current,w2}))}/><ParameterControl label="Bias b" value={model.b} min={-5} max={5} resetKey={resetKey} onChange={(b)=>setModel((current)=>({...current,b}))}/><div className="demo-actions"><ResetControl onReset={()=>setAll(defaults,true)}/><PresetControl presets={[{label:'Score hằng 2',apply:()=>setAll({w1:0,w2:0,b:2})},{label:'Trùng z = 0',apply:()=>setAll({w1:0,w2:0,b:0})}]}/></div></aside>
  </div>;
}
