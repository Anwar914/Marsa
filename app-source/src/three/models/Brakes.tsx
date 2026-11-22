import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, T, Tube, Extrude, Spring, Rod, placeBetween } from '../shapes';
import { Mat } from '../materials';
import { clock } from '../registry';
import { useAnim } from '../anim';

/** Brake application profile over a 5 s loop: 0..1 */
export function brakeForce(t: number) {
  const c = t % 5;
  if (c < 1) return 0;
  if (c < 1.6) return (c - 1) / 0.6;
  if (c < 3.2) return 1;
  if (c < 3.6) return 1 - (c - 3.2) / 0.4;
  return 0;
}
function sector(r0: number, r1: number, a0: number, a1: number, n = 24): [number, number][] {
  const o: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; o.push([Math.cos(a) * r1, Math.sin(a) * r1]); }
  for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; o.push([Math.cos(a) * r0, Math.sin(a) * r0]); }
  return o;
}

let wheelSpeed = 1, wheelAngle = 0, lastT = 0;

/** Disc brake (left) and drum brake (right), wheel axis = Z (towards viewer), with pedal + master cylinder behind. Units: metres. */
export function Brakes() {
  const discSpin = useRef<THREE.Group>(null!);
  const drumSpin = useRef<THREE.Group>(null!);
  const piston = useRef<THREE.Group>(null!);
  const innerPad = useRef<THREE.Group>(null!);
  const outerPad = useRef<THREE.Group>(null!);
  const shoeL = useRef<THREE.Group>(null!);
  const shoeR = useRef<THREE.Group>(null!);
  const wcL = useRef<THREE.Group>(null!);
  const wcR = useRef<THREE.Group>(null!);
  const springTop = useRef<THREE.Group>(null!);
  const pedal = useRef<THREE.Group>(null!);
  const push = useRef<THREE.Group>(null!);
  const fluid = useRef<THREE.MeshStandardMaterial[]>([]);
  const shoe = useMemo(() => ({ L: sector(0.098, 0.106, 1.85, 4.43), R: sector(0.098, 0.106, -1.29, 1.29), linL: sector(0.106, 0.113, 1.9, 4.38), linR: sector(0.106, 0.113, -1.24, 1.24) }), []);

  useFrame(() => {
    const t = clock.t;
    const dt = Math.min(0.05, Math.max(0, t - lastT)); lastT = t;
    const f = brakeForce(t);
    // simple wheel dynamics: friction decelerates, then the "car" accelerates again
    wheelSpeed = f > 0.05 ? Math.max(0, wheelSpeed - f * dt * 0.9) : Math.min(1, wheelSpeed + dt * 0.5);
    wheelAngle += wheelSpeed * dt * 6;
    discSpin.current.rotation.z = -wheelAngle;
    drumSpin.current.rotation.z = -wheelAngle;
    const gap = 0.004 * (1 - f); // exaggerated running clearance
    piston.current.position.z = -gap;
    innerPad.current.position.z = -gap;
    outerPad.current.position.z = gap;
    shoeL.current.rotation.z = -0.035 * (1 - f) + 0.0;
    shoeR.current.rotation.z = 0.035 * (1 - f);
    wcL.current.position.x = -0.004 * f; wcR.current.position.x = 0.004 * f;
    placeBetween(springTop.current, [-0.072 + 0.003 * (1 - f), 0.07, 0.005], [0.072 - 0.003 * (1 - f), 0.07, 0.005]);
    pedal.current.rotation.z = -0.35 * f;
    push.current.position.x = -0.03 * f;
    fluid.current.forEach((m) => { m.emissiveIntensity = 0.1 + f * 1.4; });
    const bar = Math.round(f * 80);
    const info = `pressure ≈ ${bar} bar · wheel speed ${Math.round(wheelSpeed * 100)} %`;
    if (useAnim.getState().info !== info) useAnim.setState({ info });
  });
  const fl = (m: THREE.MeshStandardMaterial | null) => { if (m && !fluid.current.includes(m)) fluid.current.push(m); };
  const Fluid = ({ pts }: { pts: [number, number, number][] }) => {
    const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 60, 0.005, 8), []);
    return <mesh geometry={geo}><meshStandardMaterial ref={fl} color="#f59e0b" emissive="#f97316" emissiveIntensity={0.1} metalness={0.3} roughness={0.4} /></mesh>;
  };

  return (
    <group>
      {/* ================= DISC BRAKE (x = -0.25) ================= */}
      <group position={[-0.25, 0, 0]}>
        <Part id="splash-shield" explode={[0, 0, -0.08]}>
          <C a={[0.155, 0.155, 0.003, 48]} r={[Math.PI / 2, 0, 0]} p={[0, 0, -0.03]} m="darkSteel" />
        </Part>
        <group ref={discSpin}>
          <Part id="brake-disc" explode={[0, 0, 0.06]}>
            <C a={[0.14, 0.14, 0.022, 64]} r={[Math.PI / 2, 0, 0]} m="iron" />
            {Array.from({ length: 24 }, (_, k) => <C key={k} a={[0.003, 0.003, 0.0225, 6]} p={[Math.cos(k * 0.2618) * 0.115, Math.sin(k * 0.2618) * 0.115, 0]} r={[Math.PI / 2, 0, 0]} m="darkSteel" />)}
            <C a={[0.075, 0.075, 0.03]} r={[Math.PI / 2, 0, 0]} p={[0, 0, 0.02]} m="steel" />
          </Part>
          <Part id="wheel-hub" explode={[0, 0, 0.14]}>
            <C a={[0.05, 0.055, 0.05]} r={[Math.PI / 2, 0, 0]} p={[0, 0, 0.045]} m="steel" />
            {[0, 1, 2, 3, 4].map((k) => <C key={k} a={[0.006, 0.006, 0.05]} p={[Math.cos(k * 1.2566) * 0.05, Math.sin(k * 1.2566) * 0.05, 0.055]} r={[Math.PI / 2, 0, 0]} m="chrome" />)}
          </Part>
        </group>
        {/* caliper at top-right of the disc */}
        <group rotation={[0, 0, -0.5]}>
          <group position={[0, 0.115, 0]}>
            <Part id="brake-caliper" explode={[0, 0.1, 0]} seeThrough>
              <B a={[0.11, 0.06, 0.016]} p={[0, 0.005, 0.03]} m="red" o={0.85} />
              <B a={[0.11, 0.06, 0.03]} p={[0, 0.005, -0.038]} m="red" o={0.6} />
              <B a={[0.11, 0.02, 0.09]} p={[0, 0.045, -0.004]} m="red" o={0.85} />
            </Part>
            <group ref={piston}>
              <Part id="brake-piston" explode={[0, 0.06, -0.12]}><C a={[0.02, 0.02, 0.02]} r={[Math.PI / 2, 0, 0]} p={[0, 0, -0.03]} m="chrome" /></Part>
            </group>
            <group ref={innerPad}><Part id="brake-pads" explode={[0, 0.04, -0.07]}>
              <B a={[0.1, 0.045, 0.008]} p={[0, 0, -0.016]} m="friction" /><B a={[0.105, 0.05, 0.003]} p={[0, 0, -0.0215]} m="steel" /></Part></group>
            <group ref={outerPad}><Part id="brake-pads" explode={[0, 0.04, 0.07]}>
              <B a={[0.1, 0.045, 0.008]} p={[0, 0, 0.016]} m="friction" /><B a={[0.105, 0.05, 0.003]} p={[0, 0, 0.0215]} m="steel" /></Part></group>
          </group>
        </group>
      </group>

      {/* ================= DRUM BRAKE (x = +0.32) ================= */}
      <group position={[0.322, 0, 0]}>
        <Part id="backing-plate" explode={[0, 0, -0.08]}>
          <C a={[0.135, 0.135, 0.004, 48]} r={[Math.PI / 2, 0, 0]} p={[0, 0, -0.025]} m="darkSteel" />
          <B a={[0.03, 0.03, 0.02]} p={[0, -0.09, -0.015]} m="iron" />
        </Part>
        {/* shoes pivot at the bottom anchor */}
        <group position={[0, -0.09, 0]}>
          <group ref={shoeL}><group position={[0, 0.09, 0]}>
            <Part id="brake-shoes" explode={[-0.06, 0, 0.04]}><Extrude shape={shoe.L} depth={0.035} bevel={0} m="steel" />
              <B a={[0.004, 0.16, 0.03]} p={[-0.094, 0, 0]} m="steel" /></Part>
            <Part id="brake-lining" explode={[-0.1, 0, 0.04]}><Extrude shape={shoe.linL} depth={0.033} bevel={0} m="friction" /></Part>
          </group></group>
          <group ref={shoeR}><group position={[0, 0.09, 0]}>
            <Part id="brake-shoes" explode={[0.06, 0, 0.04]}><Extrude shape={shoe.R} depth={0.035} bevel={0} m="steel" />
              <B a={[0.004, 0.16, 0.03]} p={[0.094, 0, 0]} m="steel" /></Part>
            <Part id="brake-lining" explode={[0.1, 0, 0.04]}><Extrude shape={shoe.linR} depth={0.033} bevel={0} m="friction" /></Part>
          </group></group>
        </group>
        <Part id="wheel-cylinder" explode={[0, 0.06, 0.05]}>
          <C a={[0.013, 0.013, 0.06]} r={[0, 0, Math.PI / 2]} p={[0, 0.09, 0]} m="alu" />
        </Part>
        <group ref={wcL}><Part id="brake-piston" explode={[-0.03, 0.06, 0.05]}><C a={[0.011, 0.011, 0.012]} r={[0, 0, Math.PI / 2]} p={[-0.036, 0.09, 0]} m="chrome" /></Part></group>
        <group ref={wcR}><Part id="brake-piston" explode={[0.03, 0.06, 0.05]}><C a={[0.011, 0.011, 0.012]} r={[0, 0, Math.PI / 2]} p={[0.036, 0.09, 0]} m="chrome" /></Part></group>
        <Part id="return-spring" explode={[0, 0.03, 0.08]}>
          <group ref={springTop}><Spring radius={0.006} wire={0.0015} turns={14} height={1} p={[0, -0.5, 0]} m="yellow" /></group>
          <Rod a={[-0.07, -0.05, 0.005]} b={[0.07, -0.05, 0.005]} r={0.003} m="yellow" />
        </Part>
        <group ref={drumSpin}>
          <Part id="brake-drum" cut explode={[0, 0, 0.16]}>
            <C a={[0.1145, 0.1145, 0.05, 64]} r={[Math.PI / 2, 0, 0]} p={[0, 0, 0]} m="iron" open />
            <C a={[0.13, 0.13, 0.008, 64]} r={[Math.PI / 2, 0, 0]} p={[0, 0, 0.027]} m="iron" />
            {Array.from({ length: 10 }, (_, k) => <B key={k} a={[0.012, 0.006, 0.05]} p={[Math.cos(k * 0.628) * 0.128, Math.sin(k * 0.628) * 0.128, 0]} r={[0, 0, k * 0.628]} m="iron" />)}
          </Part>
        </group>
      </group>

      {/* ================= HYDRAULICS ================= */}
      <group position={[0.05, 0.05, -0.32]}>
        <group ref={pedal} position={[0.22, 0.12, 0]}>
          <Part id="brake-pedal" explode={[0.1, 0, 0]}>
            <Rod a={[0, 0, 0]} b={[0.02, -0.2, 0]} r={0.006} m="steel" />
            <B a={[0.05, 0.02, 0.06]} p={[0.025, -0.205, 0]} m="rubber" />
          </Part>
        </group>
        <group ref={push}><Rod a={[0.21, 0.07, 0]} b={[0.13, 0.07, 0]} r={0.004} m="chrome" /></group>
        <Part id="master-cylinder" explode={[0, 0.1, 0]}>
          <C a={[0.018, 0.018, 0.12]} r={[0, 0, Math.PI / 2]} p={[0.07, 0.07, 0]} m="alu" />
          <B a={[0.06, 0.035, 0.035]} p={[0.07, 0.105, 0]} m="plasticLight" o={0.8} />
        </Part>
      </group>
      <Part id="brake-line" explode={[0, 0.05, -0.05]}>
        <Fluid pts={[[0.12, 0.12, -0.32], [-0.05, 0.2, -0.3], [-0.3, 0.2, -0.15], [-0.31, 0.135, -0.05], [-0.31, 0.112, -0.035]]} />
        <Fluid pts={[[0.12, 0.12, -0.32], [0.25, 0.2, -0.25], [0.32, 0.16, -0.08], [0.322, 0.095, -0.02], [0.322, 0.09, -0.01]]} />
      </Part>
    </group>
  );
}
