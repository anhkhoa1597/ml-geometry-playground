import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import type { ScorePlaneAnalysis } from './model';

export type ScorePlaneSceneHandle = { resetCamera: () => void; rotate: (x: number, y: number) => void; zoom: (factor: number) => void };
type Props = { analysis: ScorePlaneAnalysis; fallback: ReactNode };
const cameraHome = new THREE.Vector3(24, 16, -18);
const cameraTarget = new THREE.Vector3(0, 2, 0);
const axisLabels = [
  { text: 'x₁', point: [6.2, 0, 0] },
  { text: 'x₂', point: [0, 0, 6.2] },
  { text: 'z · score', point: [0, 9, 0] },
  { text: 'z = 0', point: [4.5, 0, -4.5] },
] as const;

export const ScorePlaneScene = forwardRef<ScorePlaneSceneHandle, Props>(function ScorePlaneScene({ analysis, fallback }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const labelElements = useRef<Array<HTMLSpanElement | null>>([]);
  const scene = useRef<THREE.Scene | null>(null);
  const group = useRef<THREE.Group | null>(null);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const controls = useRef<OrbitControls | null>(null);
  const [failed, setFailed] = useState(false);

  const render = () => {
    if (!renderer.current || !scene.current || !camera.current || !host.current) return;
    const width = host.current.clientWidth;
    const height = renderer.current.domElement.clientHeight;
    scene.current.traverse((item) => {
      if (item instanceof Line2) item.material.resolution.set(width, height);
    });
    renderer.current.render(scene.current, camera.current);
    axisLabels.forEach(({ point }, index) => {
      const label = labelElements.current[index];
      if (!label) return;
      const projected = new THREE.Vector3(...point).project(camera.current!);
      label.style.left = `${(projected.x + 1) * width / 2}px`;
      label.style.top = `${(1 - projected.y) * height / 2}px`;
      label.style.visibility = Math.abs(projected.z) < 1 ? 'visible' : 'hidden';
    });
  };
  const resetCamera = () => { if (!camera.current || !controls.current) return; camera.current.position.copy(cameraHome); controls.current.target.copy(cameraTarget); controls.current.update(); render(); };
  useImperativeHandle(ref, () => ({
    resetCamera,
    rotate: (x, y) => { if (!camera.current) return; camera.current.position.applyAxisAngle(new THREE.Vector3(0,1,0), x); camera.current.position.y = Math.max(-18, Math.min(18, camera.current.position.y + y)); camera.current.lookAt(cameraTarget); render(); },
    zoom: (factor) => { if (!camera.current) return; const radius=camera.current.position.length(); camera.current.position.multiplyScalar(Math.max(8,Math.min(38,radius*factor))/radius); render(); },
  }));

  useEffect(() => {
    if (!host.current) return;
    let resize: ResizeObserver | undefined;
    try {
      const nextRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      host.current.appendChild(nextRenderer.domElement);
      const nextScene = new THREE.Scene();
      const nextCamera = new THREE.PerspectiveCamera(46, 1, .1, 100);
      const nextControls = new OrbitControls(nextCamera, nextRenderer.domElement);
      nextControls.enablePan = false; nextControls.enableDamping = false; nextControls.minDistance = 8; nextControls.maxDistance = 38;
      const nextGroup = new THREE.Group(); nextScene.add(nextGroup);
      const grid = new THREE.GridHelper(10, 10, 0x7d8986, 0xb1beb8);
      grid.material.transparent = true; grid.material.opacity = .65; grid.material.depthWrite = false;
      nextScene.add(grid);
      const axes = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-5,0,0), new THREE.Vector3(6,0,0),
          new THREE.Vector3(0,0,-5), new THREE.Vector3(0,0,6),
          new THREE.Vector3(0,-9,0), new THREE.Vector3(0,9,0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x52635e, transparent: true, opacity: .85 }),
      );
      nextScene.add(axes);
      scene.current = nextScene; camera.current = nextCamera; renderer.current = nextRenderer; controls.current = nextControls; group.current = nextGroup;
      nextCamera.position.copy(cameraHome); nextControls.target.copy(cameraTarget); nextControls.update(); nextRenderer.render(nextScene,nextCamera);
      nextControls.addEventListener('change', render);
      let lastWidth=0;
      resize = new ResizeObserver(() => { if (!host.current) return; const width=host.current.clientWidth; if(width===0||width===lastWidth)return; lastWidth=width; const height=Math.max(380,Math.min(600,Math.round(width*.62))); nextRenderer.setSize(width,height,false); nextCamera.aspect=width/height; nextCamera.updateProjectionMatrix(); render(); });
      resize.observe(host.current);
    } catch { setFailed(true); }
    return () => {
      resize?.disconnect(); controls.current?.dispose();
      scene.current?.traverse((item) => { if (item instanceof THREE.Mesh || item instanceof THREE.Line) { item.geometry.dispose(); const materials=Array.isArray(item.material)?item.material:[item.material]; materials.forEach((material) => material.dispose()); } });
      renderer.current?.dispose(); renderer.current?.domElement.remove();
      scene.current=null; camera.current=null; renderer.current=null; controls.current=null; group.current=null;
    };
  }, []);

  useEffect(() => {
    const root = group.current;
    if (!root) return;
    while (root.children.length) { const item=root.children.pop(); if (!item) continue; if (item instanceof THREE.Mesh || item instanceof THREE.Line) { item.geometry.dispose(); const materials=Array.isArray(item.material)?item.material:[item.material]; materials.forEach((material) => material.dispose()); } }
    const reference = new THREE.Mesh(new THREE.PlaneGeometry(10,10), new THREE.MeshBasicMaterial({ color:0x85918d, transparent:true, opacity:.2, side:THREE.DoubleSide, depthWrite:false }));
    reference.rotation.x=-Math.PI/2; root.add(reference);
    const frame = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([[-5,0,-5],[5,0,-5],[5,0,5],[-5,0,5]].map(([x,y,z])=>new THREE.Vector3(x,y,z))),
      new THREE.LineBasicMaterial({ color: 0x85918d }),
    );
    root.add(frame);
    if (analysis.kind !== 'coincident' && analysis.surface.length >= 3) {
      const vertices:number[]=[]; for(let i=1;i<analysis.surface.length-1;i+=1){ for(const p of [analysis.surface[0],analysis.surface[i],analysis.surface[i+1]]) vertices.push(p[0],p[2],p[1]); }
      const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geometry.computeVertexNormals();
      root.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({ color:0x23776c, transparent:true, opacity:.48, side:THREE.DoubleSide, depthWrite:false })));
      root.add(new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(analysis.surface.map((p)=>new THREE.Vector3(p[0],p[2],p[1]))),
        new THREE.LineBasicMaterial({ color: 0x23776c, transparent: true, opacity: .8 }),
      ));
    }
    if (analysis.intersection.length === 2) {
      // Screen-space stroke, centered on the exact analytic intersection (no z offset).
      const geometry = new LineGeometry();
      geometry.setPositions(analysis.intersection.flatMap((p)=>[p[0],p[2],p[1]]));
      const intersection = new Line2(geometry, new LineMaterial({ color: 0xb54c28, linewidth: 4, transparent: true, depthWrite: false }));
      intersection.renderOrder = 2;
      root.add(intersection);
    }
    render();
  }, [analysis]);

  if (failed) return <>{fallback}</>;
  return <div className="score-scene" ref={host} role="img" aria-label="Interactive 3D graph with x1 and x2 on the ground plane and linear score z vertically">{axisLabels.map(({text},index)=><span key={index} ref={(element)=>{labelElements.current[index]=element;}} className="score-axis-label" aria-hidden="true">{text}</span>)}</div>;
});
