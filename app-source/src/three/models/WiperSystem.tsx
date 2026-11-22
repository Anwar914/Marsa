import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, Sp, placeBetween } from '../shapes';
import { Mat } from '../materials';
import { clock } from '../registry';

// Four-bar (crank-rocker) geometry in the windshield plane (x right, y up the glass, z towards viewer). Unit: metres.
const M = new THREE.Vector2(-0.05, -0.16), P1 = new THREE.Vector2(-0.42, 0), P2 = new THREE.Vector2(0.28, 0);
const RC = 0.05, RL = 0.08, LC = 0.37;
function leverAngle(alpha: number) {
  const c = new THREE.Vector2(M.x + RC * Math.cos(alpha), M.y + RC * Math.sin(alpha));
  const d = c.distanceTo(P1);
  const a = (RL * RL - LC * LC + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, RL * RL - a * a));
  const base = P1.clone().add(c.clone().sub(P1).multiplyScalar(a / d));
  const perp = new THREE.Vector2(-(c.y - P1.y) / d, (c.x - P1.x) / d);
  const e = base.clone().add(perp.multiplyScalar(-h)); // choose lower branch
  return { beta: Math.atan2(e.y - P1.y, e.x - P1.x), c, e };
}

export function WiperSystem() {
  const crank = useRef<THREE.Group>(null!);
  const lever1 = useRef<THREE.Group>(null!), lever2 = useRef<THREE.Group>(null!);
  const arm1 = useRef<THREE.Group>(null!), arm2 = useRef<THREE.Group>(null!);
  const rod1 = useRef<THREE.Mesh>(null!), rod2 = useRef<THREE.Mesh>(null!);
  const j = useRef<THREE.Group[]>([]);
  const bmin = useMemo(() => { let m = Infinity; for (let i = 0; i < 360; i++) m = Math.min(m, leverAngle((i * Math.PI) / 180).beta); return m; }, []);
  useFrame(() => {
    const alpha = clock.t * 2.4;
    const { beta, c, e } = leverAngle(alpha);
    crank.current.rotation.z = alpha;
    lever1.current.rotation.z = beta; lever2.current.rotation.z = beta;
    const arm = beta - bmin;
    arm1.current.rotation.z = arm; arm2.current.rotation.z = arm;
    const e2 = new THREE.Vector2(P2.x + RL * Math.cos(beta), P2.y + RL * Math.sin(beta));
    placeBetween(rod1.current, [c.x, c.y, -0.06], [e.x, e.y, -0.06]);
    placeBetween(rod2.current, [e.x, e.y, -0.07], [e2.x, e2.y, -0.07]);
    [[c.x, c.y], [e.x, e.y], [e2.x, e2.y]].forEach(([x, y], i) => j.current[i]?.position.set(x, y, -0.065));
  });
  const ArmBlade = ({ len }: { len: number }) => (
    <group>
      <Part id="wiper-arm" explode={[0, 0, 0.12]}>
        <B a={[len, 0.02, 0.012]} p={[len / 2, 0, 0.03]} m="black" />
        <C a={[0.022, 0.022, 0.04]} r={[Math.PI / 2, 0, 0]} p={[0, 0, 0.02]} m="black" />
      </Part>
      <Part id="wiper-blade" explode={[0, 0.06, 0.2]}>
        <B a={[len * 0.95, 0.025, 0.018]} p={[len * 0.55, 0.0, 0.045]} m="darkSteel" />
      </Part>
      <Part id="wiper-rubber" explode={[0, 0.06, 0.28]}>
        <B a={[len * 0.95, 0.008, 0.01]} p={[len * 0.55, 0, 0.033]} m="rubber" c="#0b0c0d" />
      </Part>
    </group>
  );
  return (
    <group rotation={[-1.0, 0, 0]}>
      {/* windshield (context only) */}
      <mesh position={[0, 0.42, 0.005]} raycast={() => {}}><boxGeometry args={[1.5, 0.95, 0.006]} /><Mat k="glass" o={0.07} /></mesh>
      <Part id="wiper-motor" explode={[0, -0.12, -0.12]}>
        <group position={[M.x, M.y, -0.12]}>
          <C a={[0.04, 0.04, 0.14]} r={[0, 0, Math.PI / 2]} p={[0.1, 0, 0]} m="black" />
          <C a={[0.055, 0.055, 0.05]} r={[Math.PI / 2, 0, 0]} m="darkSteel" />
        </group>
        <group ref={crank} position={[M.x, M.y, -0.085]}>
          <B a={[RC, 0.016, 0.01]} p={[RC / 2, 0, 0]} m="steel" />
        </group>
      </Part>
      <Part id="wiper-linkage" explode={[0, -0.1, -0.08]}>
        <mesh ref={rod1}><cylinderGeometry args={[0.006, 0.006, 1, 10]} /><Mat k="steel" /></mesh>
        <mesh ref={rod2}><cylinderGeometry args={[0.006, 0.006, 1, 10]} /><Mat k="steel" /></mesh>
        <group ref={lever1} position={[P1.x, P1.y, -0.065]}><B a={[RL, 0.014, 0.008]} p={[RL / 2, 0, 0]} m="steel" /></group>
        <group ref={lever2} position={[P2.x, P2.y, -0.065]}><B a={[RL, 0.014, 0.008]} p={[RL / 2, 0, 0]} m="steel" /></group>
        <B a={[0.8, 0.025, 0.012]} p={[-0.07, -0.02, -0.1]} m="darkSteel" />
      </Part>
      <Part id="articulation" explode={[0, -0.1, -0.02]}>
        {[0, 1, 2].map((i) => <group key={i} ref={(g) => { if (g) j.current[i] = g; }}><Sp a={0.012} m="chrome" /></group>)}
      </Part>
      <Part id="pivot-shaft" explode={[0, 0, 0.05]}>
        {[P1, P2].map((p, i) => <C key={i} a={[0.012, 0.012, 0.13]} r={[Math.PI / 2, 0, 0]} p={[p.x, p.y, -0.035]} m="chrome" />)}
      </Part>
      <group position={[P1.x, P1.y, 0]}><group ref={arm1}><ArmBlade len={0.55} /></group></group>
      <group position={[P2.x, P2.y, 0]}><group ref={arm2}><ArmBlade len={0.5} /></group></group>
    </group>
  );
}
