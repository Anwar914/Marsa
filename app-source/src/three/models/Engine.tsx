import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, Sp, Tube, Extrude, Spring, placeBetween } from '../shapes';
import { Mat } from '../materials';
import { clock } from '../registry';
import { useAnim, OMEGA, STROKES } from '../anim';

// ---- Geometry constants (1 unit = 10 cm) ----
export const CYL_X = [-1.35, -0.45, 0.45, 1.35];
const BORE = 0.38, CRANK_R = 0.4, ROD_L = 1.35, PISTON_H = 0.45, PIN_TO_TOP = 0.25;
const DECK = 2.1, HEAD_TOP = 2.65, CAM_Y = 2.86, CAM_Z = 0.33, VALVE_Z = 0.24, MAX_LIFT = 0.09;
const VALVE_TILT = Math.atan((CAM_Z - VALVE_Z) / (CAM_Y - 0.12 - DECK));
/** Crank phase offset (rad) and firing-cycle offset (deg) per cylinder; firing order 1-3-4-2 */
const PHASE = [0, Math.PI, Math.PI, 0];
const CYCLE_OFF = [0, 540, 180, 360];
// Valve timing in cycle degrees (0 = TDC start of intake), with realistic overlap
const IV = { open: -10, close: 220 }, EV = { open: 500, close: 730 };

const pinY = (phi: number) => CRANK_R * Math.cos(phi) + Math.sqrt(ROD_L ** 2 - (CRANK_R * Math.sin(phi)) ** 2);
function lift(cycleDeg: number, w: { open: number; close: number }) {
  let c = cycleDeg;
  if (c < w.open) c += 720;
  if (c > w.close) c -= 720;
  if (c < w.open || c > w.close) return 0;
  return Math.sin(((c - w.open) / (w.close - w.open)) * Math.PI) ** 1.5 * MAX_LIFT;
}
const mod = (a: number, n: number) => ((a % n) + n) % n;

function camShape(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const nose = Math.max(0, Math.cos(a)) ** 3 * 0.09;
    const r = 0.1 + nose;
    pts.push([Math.sin(a) * r, Math.cos(a) * r]);
  }
  return pts;
}

/** Inline-four DOHC petrol engine. Crankshaft axis = X, cylinders along +Y, intake side = -Z, exhaust = +Z. */
export function Engine({ accessories = true, hud = false }: { accessories?: boolean; hud?: boolean }) {
  const crank = useRef<THREE.Group>(null!);
  const flywheel = useRef<THREE.Group>(null!);
  const camI = useRef<THREE.Group>(null!);
  const camE = useRef<THREE.Group>(null!);
  const pulleys = useRef<THREE.Group[]>([]);
  const pistons = useRef<THREE.Group[]>([]);
  const rods = useRef<THREE.Mesh[]>([]);
  const ivs = useRef<THREE.Group[]>([]);
  const evs = useRef<THREE.Group[]>([]);
  const ivSpr = useRef<THREE.Group[]>([]);
  const evSpr = useRef<THREE.Group[]>([]);
  const lobesI = useRef<THREE.Group[]>([]);
  const lobesE = useRef<THREE.Group[]>([]);
  const gas = useRef<THREE.Mesh[]>([]);
  const sparks = useRef<THREE.Mesh[]>([]);
  const cam = useMemo(camShape, []);
  const noRay = (m: THREE.Mesh | null) => { if (m) m.raycast = () => {}; };

  useFrame(() => {
    const th = clock.t * OMEGA;
    const thDeg = th * 180 / Math.PI;
    crank.current.rotation.x = th;
    if (flywheel.current) flywheel.current.rotation.x = th;
    camI.current.rotation.x = th / 2; camE.current.rotation.x = th / 2;
    pulleys.current.forEach((p, i) => { if (p) p.rotation.x = i === 0 ? th : i < 3 ? th / 2 : th * 1.6; });
    for (let i = 0; i < 4; i++) {
      const phi = th + PHASE[i];
      const py = pinY(phi);
      pistons.current[i].position.y = py;
      placeBetween(rods.current[i], [CYL_X[i], CRANK_R * Math.cos(phi), CRANK_R * Math.sin(phi)], [CYL_X[i], py, 0]);
      const cyc = mod(thDeg - CYCLE_OFF[i], 720);
      const li = lift(cyc, IV), le = lift(cyc, EV);
      ivs.current[i].position.y = -li; evs.current[i].position.y = -le;
      ivSpr.current[i].scale.y = 1 - li / 0.3; evSpr.current[i].scale.y = 1 - le / 0.3;
      // cam lobes point at the valve (down) at peak lift
      const camA = th / 2;
      lobesI.current[i].rotation.x = Math.PI + camA - ((105 + CYCLE_OFF[i]) * Math.PI) / 360;
      lobesE.current[i].rotation.x = Math.PI + camA - ((615 + CYCLE_OFF[i]) * Math.PI) / 360;
      // gas column above the piston, coloured by stroke
      const top = py + PIN_TO_TOP;
      const g = gas.current[i];
      g.position.y = (top + DECK) / 2; g.scale.y = Math.max(0.001, DECK - top);
      const stroke = Math.floor(cyc / 180);
      const mat = g.material as THREE.MeshStandardMaterial;
      mat.color.set(STROKES[stroke].color);
      mat.opacity = stroke === 2 ? 0.75 - ((cyc - 360) / 180) * 0.45 : 0.4;
      mat.emissive.set(stroke === 2 ? '#ff6a00' : '#000000');
      mat.emissiveIntensity = stroke === 2 ? 1.5 * (1 - (cyc - 360) / 180) : 0;
      sparks.current[i].visible = cyc > 348 && cyc < 372;
      if (hud && i === 0) {
        const a = useAnim.getState();
        const cd = Math.round(mod(thDeg, 720));
        if (a.stroke !== stroke || Math.abs(a.crankDeg - cd) >= 5) useAnim.setState({ stroke, crankDeg: cd });
      }
    }
  });

  const blockLen = 3.7;
  return (
    <group>
      {/* ENGINE BLOCK (hollow shell, cut in cutaway mode) */}
      <Part id="engine-block" cut explode={[0, 0, 0]}>
        <B a={[blockLen, DECK + 0.35, 1.2]} p={[0, (DECK - 0.35) / 2, 0]} m="alu" />
        {CYL_X.slice(0, 3).map((x, i) => <B key={i} a={[0.08, 0.5, 1.1]} p={[x + 0.45, -0.1, 0]} m="alu" />)}
      </Part>
      {CYL_X.map((x, i) => (
        <Part key={`cyl${i}`} id="cylinder" cut>
          <C a={[BORE + 0.02, BORE + 0.02, DECK - 0.75, 40]} p={[x, 0.75 + (DECK - 0.75) / 2, 0]} m="steel" open />
        </Part>
      ))}

      {/* CRANKSHAFT */}
      <Part id="crankshaft" explode={[0, -0.9, 0]}>
        <group ref={crank}>
          <C a={[0.14, 0.14, blockLen + 0.6]} r={[0, 0, Math.PI / 2]} m="steel" />
          {CYL_X.map((x, i) => {
            const y = CRANK_R * Math.cos(PHASE[i]), z = CRANK_R * Math.sin(PHASE[i]);
            return (
              <group key={i}>
                <C a={[0.11, 0.11, 0.2]} p={[x, y, z]} r={[0, 0, Math.PI / 2]} m="chrome" />
                {[-0.14, 0.14].map((dx) => (
                  <group key={dx} position={[x + dx, 0, 0]} rotation={[PHASE[i], 0, 0]}>
                    <B a={[0.08, 0.62, 0.3]} p={[0, 0.17, 0]} m="steel" />
                    <B a={[0.08, 0.3, 0.5]} p={[0, -0.22, 0]} m="iron" />
                  </group>
                ))}
              </group>
            );
          })}
        </group>
      </Part>

      {CYL_X.map((x, i) => (
        <group key={`moving${i}`}>
          {/* PISTON + RINGS move together */}
          <group ref={(g) => { if (g) pistons.current[i] = g; }} position={[x, 0, 0]}>
            <Part id="piston" explode={[0, 0.5, 0]}>
              <C a={[BORE - 0.01, BORE - 0.01, PISTON_H - 0.03]} p={[0, PIN_TO_TOP - PISTON_H / 2 - 0.01, 0]} m="alu" />
              <C a={[0.06, 0.06, 0.5]} r={[0, 0, Math.PI / 2]} m="chrome" />
            </Part>
            <Part id="piston-rings" explode={[0, 0.5, 0]}>
              {[0.2, 0.14, 0.08].map((y, k) => <C key={k} a={[BORE + 0.002, BORE + 0.002, 0.025]} p={[0, y, 0]} m={k === 2 ? 'darkSteel' : 'chrome'} />)}
            </Part>
          </group>
          <Part id="connecting-rod" explode={[0, -0.3, 0]}>
            <mesh ref={(m) => { if (m) rods.current[i] = m; }}><boxGeometry args={[0.1, 1, 0.13]} /><Mat k="steel" /></mesh>
          </Part>
          {/* Gas column (visual aid, not selectable) */}
          <mesh ref={(m) => { if (m) { gas.current[i] = m; noRay(m); } }} position={[x, 1.5, 0]}>
            <cylinderGeometry args={[BORE - 0.02, BORE - 0.02, 1, 32]} />
            <meshStandardMaterial transparent opacity={0.4} color="#60a5fa" depthWrite={false} />
          </mesh>
          {/* spark flash */}
          <mesh ref={(m) => { if (m) { sparks.current[i] = m; noRay(m); } }} position={[x, DECK + 0.02, 0]}>
            <sphereGeometry args={[0.07, 16, 12]} /><meshBasicMaterial color="#fffbe0" />
          </mesh>
        </group>
      ))}

      {/* CYLINDER HEAD */}
      <Part id="cylinder-head" cut explode={[0, 1.3, 0]}>
        <B a={[blockLen, 0.04, 1.22]} p={[0, DECK + 0.02, 0]} m="darkSteel" />
        <B a={[blockLen, HEAD_TOP - DECK - 0.04, 1.2]} p={[0, (HEAD_TOP + DECK + 0.04) / 2, 0]} m="alu" />
        {[-1.8, -0.9, 0, 0.9, 1.8].map((x) => (
          <group key={x}>
            <B a={[0.1, 0.2, 0.2]} p={[x, HEAD_TOP + 0.1, -CAM_Z]} m="alu" />
            <B a={[0.1, 0.2, 0.2]} p={[x, HEAD_TOP + 0.1, CAM_Z]} m="alu" />
          </group>
        ))}
      </Part>

      {/* VALVES + SPRINGS (tilted along their axes) */}
      {CYL_X.map((x, i) => (
        <group key={`valves${i}`}>
          {([['intake-valve', -1, ivs, ivSpr], ['exhaust-valve', 1, evs, evSpr]] as const).map(([id, side, ref, sref]) => (
            <group key={id} position={[x, DECK, side * VALVE_Z]} rotation={[side * VALVE_TILT, 0, 0]}>
              <group ref={(g) => { if (g) ref.current[i] = g; }}>
                <Part id={id} explode={[0, 1.7, 0]}>
                  <C a={[0.03, id === 'intake-valve' ? 0.12 : 0.1, 0.05]} p={[0, 0.025, 0]} m={id === 'intake-valve' ? 'steel' : 'darkSteel'} />
                  <C a={[0.022, 0.022, 0.62]} p={[0, 0.34, 0]} m="steel" />
                  <C a={[0.06, 0.06, 0.03]} p={[0, 0.6, 0]} m="steel" />
                </Part>
              </group>
              <group ref={(g) => { if (g) sref.current[i] = g; }} position={[0, 0.3, 0]}>
                <Part id="valve-spring" explode={[0, 1.6, 0]}>
                  <Spring radius={0.055} wire={0.011} turns={6} height={0.3} m="green" />
                </Part>
              </group>
            </group>
          ))}
          {/* SPARK PLUG */}
          <Part id="spark-plug" explode={[0, 2.6, 0]}>
            <C a={[0.035, 0.035, 0.22]} p={[x, DECK + 0.12, 0]} m="steel" />
            <C a={[0.065, 0.065, 0.08, 6]} p={[x, DECK + 0.4, 0]} m="steel" />
            <C a={[0.045, 0.05, 0.35]} p={[x, DECK + 0.6, 0]} m="ceramic" />
          </Part>
          {accessories && (
            <Part id="ignition-coil" explode={[0, 3.2, 0]}>
              <C a={[0.08, 0.08, 0.4]} p={[x, DECK + 0.98, 0]} m="black" />
              <B a={[0.3, 0.12, 0.22]} p={[x, DECK + 1.2, 0]} m="black" />
            </Part>
          )}
        </group>
      ))}

      {/* CAMSHAFTS */}
      {([['I', -1, camI, lobesI], ['E', 1, camE, lobesE]] as const).map(([k, side, ref, lobes]) => (
        <Part key={k} id="camshaft" explode={[0, 2.1, 0]}>
          <group position={[0, CAM_Y, side * CAM_Z]}>
            <group ref={ref}><C a={[0.06, 0.06, blockLen + 0.3]} r={[0, 0, Math.PI / 2]} m="steel" />
              <B a={[blockLen + 0.25, 0.02, 0.02]} p={[0, 0.06, 0]} m="darkSteel" /></group>
            {CYL_X.map((x, i) => (
              <group key={i} position={[x, 0, 0]} ref={(m) => { if (m) lobes.current[i] = m; }}>
                <Extrude shape={cam} depth={0.12} bevel={0.005} r={[0, Math.PI / 2, 0]} m="chrome" />
              </group>
            ))}
          </group>
        </Part>
      ))}

      {/* TIMING BELT DRIVE at front (-X): crank pulley 1:2 cam pulleys */}
      <group position={[-2.12, 0, 0]}>
        <Part id="timing-belt" explode={[-1, 0, 0]}>
          <Tube closed radius={0.03} m="black" seg={160} pts={[
            [0, -0.15, 0], [0, -0.1, -0.11], [0, 1.4, -0.33], [0, CAM_Y, -CAM_Z - 0.22], [0, CAM_Y + 0.21, -CAM_Z], [0, CAM_Y + 0.22, 0],
            [0, CAM_Y + 0.21, CAM_Z], [0, CAM_Y, CAM_Z + 0.22], [0, 1.9, 0.55], [0, 1.0, 0.69], [0, 0.5, 0.4], [0, -0.1, 0.11]]} />
        </Part>
        {[[0, 0, 0.12], [CAM_Y, -CAM_Z, 0.2], [CAM_Y, CAM_Z, 0.2]].map(([y, z, r], i) => (
          <Part key={i} id={i === 0 ? 'crankshaft' : 'camshaft'} explode={[-1, 0, 0]}>
            <group position={[0, y, z]} ref={(g) => { if (g) pulleys.current[i] = g; }}>
              <C a={[r, r, 0.08]} r={[0, 0, Math.PI / 2]} m="darkSteel" />
              <B a={[0.085, r * 0.9, 0.03]} p={[0, r * 0.45, 0]} m="yellow" />
            </group>
          </Part>
        ))}
      </group>

      {/* FLYWHEEL at rear (+X) */}
      <Part id="flywheel" explode={[1.4, 0, 0]}>
        <group ref={flywheel} position={[blockLen / 2 + 0.35, 0, 0]}>
          <C a={[0.78, 0.78, 0.12, 64]} r={[0, 0, Math.PI / 2]} m="iron" />
          <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.8, 0.04, 6, 90]} /><Mat k="steel" /></mesh>
          <B a={[0.13, 0.15, 0.06]} p={[0, 0.55, 0]} m="yellow" />
        </group>
      </Part>

      {/* OIL PAN */}
      <Part id="oil-pan" cut explode={[0, -1.3, 0]}>
        <Extrude depth={1.15} m="darkSteel" bevel={0.02} shape={[[-1.8, -0.35], [1.8, -0.35], [1.75, -0.9], [0.9, -0.95], [0.6, -1.25], [-1.3, -1.25], [-1.6, -0.9]]} />
        <B a={[2.6, 0.02, 1.0]} p={[-0.25, -1.05, 0]} m="fluid" />
      </Part>

      {accessories && <>
        {/* OIL FILTER */}
        <Part id="oil-filter" explode={[0, 0, -1.1]}>
          <group position={[0.6, 0.15, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
            <C a={[0.2, 0.2, 0.45]} m="plastic" c="#1d4ed8" />
            <C a={[0.21, 0.21, 0.05]} p={[0, 0.24, 0]} m="steel" />
          </group>
        </Part>
        {/* WATER PUMP */}
        <Part id="water-pump" explode={[-0.9, 0, 0.5]}>
          <group position={[-2.05, 1.0, 0.55]}>
            <C a={[0.18, 0.2, 0.25]} r={[0, 0, Math.PI / 2]} p={[0.12, 0, 0]} m="alu" />
            <group ref={(g) => { if (g) pulleys.current[3] = g; }} position={[-0.07, 0, 0]}>
              <C a={[0.13, 0.13, 0.07]} r={[0, 0, Math.PI / 2]} m="darkSteel" />
              <B a={[0.075, 0.1, 0.03]} p={[0, 0.05, 0]} m="yellow" />
            </group>
          </group>
        </Part>
        {/* ALTERNATOR */}
        <Part id="alternator" explode={[-0.5, 0, 1]}>
          <group position={[-1.5, 0.7, 1.05]}>
            <C a={[0.3, 0.3, 0.55]} r={[0, 0, Math.PI / 2]} m="alu" />
            {[0, 1, 2, 3, 4, 5].map((k) => <B key={k} a={[0.5, 0.03, 0.62]} r={[(k * Math.PI) / 6, 0, 0]} m="darkSteel" />)}
            <C a={[0.12, 0.12, 0.1]} r={[0, 0, Math.PI / 2]} p={[-0.8, 0, 0]} m="darkSteel" />
            <C a={[0.03, 0.03, 0.5]} r={[0, 0, Math.PI / 2]} p={[-0.5, 0, 0]} m="steel" />
          </group>
        </Part>
        <Tube radius={0.025} m="rubber" closed seg={80} pts={[[-2.3, -0.2, 0], [-2.3, 0, 0.2], [-2.3, 0.6, 1.2], [-2.3, 0.85, 1.05], [-2.3, 0.6, 0.85], [-2.3, 0, -0.2]]} />
        {/* RADIATOR */}
        <Part id="radiator" explode={[-1.3, 0, 0]}>
          <group position={[-3.3, 1.2, 0]}>
            <B a={[0.22, 2.0, 2.0]} m="darkSteel" />
            {Array.from({ length: 22 }, (_, k) => <B key={k} a={[0.24, 0.025, 1.96]} p={[0, -0.95 + k * 0.09, 0]} m="alu" />)}
            <B a={[0.3, 0.25, 2.1]} p={[0, 1.1, 0]} m="black" />
            <B a={[0.3, 0.25, 2.1]} p={[0, -1.1, 0]} m="black" />
          </group>
        </Part>
        <Tube radius={0.06} m="rubber" pts={[[-3.15, 2.2, 0.6], [-2.7, 2.3, 0.6], [-2.2, 2.2, 0.4], [-1.9, 2.0, 0.3]]} />
        <Tube radius={0.06} m="rubber" pts={[[-3.15, 0.2, 0.6], [-2.6, 0.3, 0.7], [-2.1, 0.8, 0.6], [-1.95, 1.0, 0.55]]} />
        {/* EXHAUST MANIFOLD */}
        <Part id="exhaust-manifold" explode={[0, 0, 1.5]}>
          {CYL_X.map((x, i) => (
            <Tube key={i} radius={0.1} m="iron" c="#8b5a3c" pts={[[x, 2.35, 0.6], [x, 2.3, 0.85], [x * 0.7, 1.7, 1.05], [0.3, 1.0, 1.1]]} />
          ))}
          <B a={[3.4, 0.3, 0.08]} p={[0, 2.35, 0.62]} m="iron" c="#8b5a3c" />
          <Tube radius={0.13} m="iron" c="#8b5a3c" pts={[[0.3, 1.0, 1.1], [0.6, 0.2, 1.1], [1.5, -0.6, 0.9]]} />
        </Part>
        {/* INTAKE MANIFOLD + THROTTLE BODY */}
        <Part id="intake-manifold" explode={[0, 0.6, -1.3]}>
          {CYL_X.map((x, i) => (
            <Tube key={i} radius={0.11} m="plastic" pts={[[x, 2.35, -0.6], [x, 2.6, -0.9], [x, 2.9, -1.15]]} />
          ))}
          <C a={[0.25, 0.25, 3.5]} r={[0, 0, Math.PI / 2]} p={[0, 3.0, -1.25]} m="plastic" />
        </Part>
        <Part id="throttle-body" explode={[-0.6, 0.6, -1.3]}>
          <group position={[-2.0, 3.0, -1.25]}>
            <C a={[0.18, 0.18, 0.3]} r={[0, 0, Math.PI / 2]} m="alu" open />
            <C a={[0.17, 0.17, 0.01]} r={[0, 0, Math.PI / 2 - 0.6]} m="steel" />
            <B a={[0.2, 0.25, 0.12]} p={[0, 0, -0.25]} m="black" />
          </group>
        </Part>
      </>}
    </group>
  );
}
