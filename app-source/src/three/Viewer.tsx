import * as THREE from 'three';
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer, Grid, Html, ContactShadows } from '@react-three/drei';
import { useStore } from '../store';
import { getPart, MODULE_MAP } from '../data';
import { SceneFor, CAMERAS } from './Scenes';
import { clock, partBox } from './registry';

function Clock() {
  const gl = useThree((s) => s.gl);
  useEffect(() => { (window as any).__gl = gl; (window as any).__store = useStore; }, [gl]);
  useFrame((_, dt) => {
    const s = useStore.getState();
    if (s.playing) clock.t += Math.min(dt, 0.05) * s.speed;
  });
  return null;
}

/** In demand mode: request a new frame whenever app state changes (selection, explode, X-ray, theme …). */
function StoreInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => useStore.subscribe(() => invalidate()), [invalidate]);
  return null;
}

/** Animated camera transitions for module changes, reset and focus. */
function CameraRig() {
  const { camera, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; controls: any };
  const moduleId = useStore((s) => s.moduleId);
  const camToken = useStore((s) => s.camToken);
  const focusToken = useStore((s) => s.focusToken);
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; k: number } | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => { (window as any).__cam = { camera, controls }; }, [camera, controls]);

  useEffect(() => {
    const c = CAMERAS[moduleId];
    goal.current = { pos: new THREE.Vector3(...c.pos), target: new THREE.Vector3(...c.target), k: 0 };
    invalidate();
  }, [moduleId, camToken]);

  useEffect(() => {
    if (!focusToken) return;
    const st = useStore.getState();
    const id = st.quiz.highlightId || st.selectedId;
    if (!id || !controls) return;
    const box = partBox(id);
    if (!box) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = Math.max(size * 1.8, CAMERAS[moduleId].grid * 0.15);
    goal.current = { pos: center.clone().add(dir.multiplyScalar(dist)), target: center, k: 0 };
    invalidate();
  }, [focusToken]);

  useFrame(() => {
    const g = goal.current;
    if (!g || !controls) return;
    g.k += 1;
    const a = (window as any).__fastCam ? 1 : 0.12;
    camera.position.lerp(g.pos, a);
    controls.target.lerp(g.target, a);
    controls.update();
    invalidate(); // keep rendering until the transition ends (demand frameloop)
    if (g.k > 60 || camera.position.distanceTo(g.pos) < 1e-3) goal.current = null;
  });
  return null;
}

/** Floating label for the selected component, anchored at its bounding-box centre. */
function SelectedLabel() {
  const id = useStore((s) => s.selectedId);
  const show = useStore((s) => s.showLabels);
  const lang = useStore((s) => s.uiLang);
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!id || !ref.current) return;
    const b = partBox(id);
    if (b) { const c = b.getCenter(new THREE.Vector3()); ref.current.position.set(c.x, b.max.y, c.z); }
  });
  const p = getPart(id);
  if (!p || !show) return null;
  return (
    <group ref={ref}>
      <Html center distanceFactor={undefined} style={{ pointerEvents: 'none', transform: 'translateY(-26px)' }} zIndexRange={[20, 0]}>
        <div className="whitespace-nowrap rounded-md border border-cyan-400/60 bg-slate-900/85 px-2 py-1 text-xs font-semibold text-cyan-100 shadow-lg">
          {p.nameEn} <span className="font-normal text-slate-300">· {p.nameDe}</span>
        </div>
      </Html>
    </group>
  );
}

export function Viewer() {
  const moduleId = useStore((s) => s.moduleId);
  const theme = useStore((s) => s.theme);
  const grid = CAMERAS[moduleId].grid;
  const c = CAMERAS[moduleId];
  // Render continuously only while something animates; otherwise render on demand (saves CPU/GPU and battery)
  const live = useStore((s) => (s.playing && MODULE_MAP[s.moduleId].hasAnimation) || !!s.quiz.highlightId);
  return (
    <Canvas
      frameloop={live ? 'always' : 'demand'}
      camera={{ position: c.pos, fov: 40, near: 0.01, far: 500 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, localClippingEnabled: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => { gl.localClippingEnabled = true; }}
      onPointerMissed={(e) => { if (e.type === 'click' && useStore.getState().tab !== 'quiz') useStore.getState().select(null); }}
    >
      <color attach="background" args={[theme === 'dark' ? '#0b1220' : '#eef2f7']} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={1.6} />
      <directionalLight position={[-6, 4, -4]} intensity={0.5} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.1} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
        <Lightformer form="ring" color="#7dd3fc" intensity={1} position={[0, 2, 6]} scale={3} />
      </Environment>
      <Grid
        position={[0, -0.001, 0]} args={[40 * grid, 40 * grid]} cellSize={grid / 10} sectionSize={grid}
        cellColor={theme === 'dark' ? '#1e293b' : '#cbd5e1'} sectionColor={theme === 'dark' ? '#334155' : '#94a3b8'}
        fadeDistance={30 * grid} infiniteGrid followCamera={false}
      />
      <Suspense fallback={null}>
        <group key={moduleId}><SceneFor id={moduleId} /></group>
      </Suspense>
      <ContactShadows key={`cs-${moduleId}`} position={[0, 0.002, 0]} opacity={theme === 'dark' ? 0.75 : 0.45} scale={12 * grid} blur={2.5} far={2 * grid} resolution={512} frames={40} />
      <SelectedLabel />
      <Clock />
      <StoreInvalidator />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={c.target} minDistance={grid * 0.05} maxDistance={grid * 25} />
      <CameraRig />
    </Canvas>
  );
}
