import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, placeBetween } from '../shapes';
import { Mat } from '../materials';
import { clock } from '../registry';
import { OMEGA } from '../anim';
import type { EngineType } from '../../store';

const R = 0.4, L = 1.35, BORE = 0.34;
const D2R = Math.PI / 180;
interface Cyl { n: number; x: number; bank: number /* deg from vertical */; fireOff: number /* crank deg */ }
export interface EngineConfig { id: EngineType; part: string; name: string; vAngle: number; firing: number[]; cyls: Cyl[]; interval: number; crank: string }

function build(id: EngineType): EngineConfig {
  if (id === 'i4') {
    const order = [1, 3, 4, 2];
    return { id, part: 'inline-four', name: 'Inline-four', vAngle: 0, firing: order, interval: 180, crank: 'Flat-plane, 4 throws at 0°/180°/180°/0°',
      cyls: [1, 2, 3, 4].map((n) => ({ n, x: -1.35 + (n - 1) * 0.9, bank: 0, fireOff: order.indexOf(n) * 180 })) };
  }
  if (id === 'v6') {
    const order = [1, 2, 3, 4, 5, 6];
    const xs = [-1.1, -0.8, -0.1, 0.2, 0.9, 1.2];
    return { id, part: 'v6', name: 'V6 (60°)', vAngle: 60, firing: order, interval: 120, crank: 'Six crankpins (split pins) 60° apart',
      cyls: order.map((n, i) => ({ n, x: xs[i], bank: n % 2 ? -30 : 30, fireOff: order.indexOf(n) * 120 })) };
  }
  const order = [1, 5, 4, 2, 6, 3, 7, 8];
  const x = (n: number) => (n <= 4 ? -1.35 + (n - 1) * 0.9 : -1.15 + (n - 5) * 0.9);
  return { id, part: 'v8', name: 'V8 (90°, cross-plane)', vAngle: 90, firing: order, interval: 90, crank: 'Cross-plane: 4 crankpins at 90°, two rods per pin',
    cyls: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, x: x(n), bank: n <= 4 ? -45 : 45, fireOff: order.indexOf(n) * 90 })) };
}
export const ENGINE_CONFIGS = { i4: build('i4'), v6: build('v6'), v8: build('v8') };

/** Simplified cranktrain comparison model: block banks are translucent so pistons, rods and crank are visible. */
export function EngineType({ type }: { type: EngineType }) {
  const cfg = ENGINE_CONFIGS[type];
  const crank = useRef<THREE.Group>(null!);
  const pistons = useRef<THREE.Group[]>([]);
  const rods = useRef<THREE.Mesh[]>([]);
  const flash = useRef<THREE.Mesh[]>([]);
  // pin phase so that each cylinder reaches firing TDC at its firing offset
  const phase = useMemo(() => cfg.cyls.map((c) => (c.bank - c.fireOff) * D2R), [cfg]);
  const g = cfg.part;
  const banks = [...new Set(cfg.cyls.map((c) => c.bank))];

  useFrame(() => {
    const th = clock.t * OMEGA;
    crank.current.rotation.x = th;
    cfg.cyls.forEach((c, i) => {
      const pin = th + phase[i];
      const rel = pin - c.bank * D2R;
      const d = R * Math.cos(rel) + Math.sqrt(L * L - (R * Math.sin(rel)) ** 2);
      const by = Math.cos(c.bank * D2R), bz = Math.sin(c.bank * D2R);
      pistons.current[i].position.set(c.x, by * d, bz * d);
      placeBetween(rods.current[i], [c.x, R * Math.cos(pin), R * Math.sin(pin)], [c.x, by * d, bz * d]);
      const cyc = (((th / D2R - c.fireOff) % 720) + 720) % 720;
      flash.current[i].visible = cyc < 40;
    });
  });

  const len = Math.max(...cfg.cyls.map((c) => c.x)) - Math.min(...cfg.cyls.map((c) => c.x)) + 0.9;
  return (
    <group>
      {/* crankcase */}
      <Part id="engine-block" group={g} seeThrough>
        <B a={[len, 0.9, type === 'i4' ? 1.1 : 1.5]} p={[0, -0.05, 0]} m="alu" o={0.22} />
      </Part>
      {/* cylinder banks (translucent) + heads */}
      {banks.map((bank) => (
        <group key={bank} rotation={[bank * D2R, 0, 0]}>
          <Part id={type === 'i4' ? 'engine-block' : 'cylinder-bank'} group={g} seeThrough>
            <B a={[len, 1.5, 0.95]} p={[0, 1.25, 0]} m="alu" o={0.18} />
          </Part>
          <Part id="cylinder-head" group={g} seeThrough>
            <B a={[len, 0.45, 0.95]} p={[0, 2.25, 0]} m="alu" o={0.5} />
          </Part>
        </group>
      ))}
      <Part id="crankshaft" group={g}>
        <group ref={crank}>
          <C a={[0.12, 0.12, len + 0.5]} r={[0, 0, Math.PI / 2]} m="steel" />
          {cfg.cyls.map((c, i) => (
            <group key={i} position={[c.x, 0, 0]} rotation={[phase[i], 0, 0]}>
              <C a={[0.1, 0.1, 0.18]} p={[0, R, 0]} r={[0, 0, Math.PI / 2]} m="chrome" />
              <B a={[0.06, 0.6, 0.28]} p={[-0.11, R / 2, 0]} m="steel" />
              <B a={[0.06, 0.6, 0.28]} p={[0.11, R / 2, 0]} m="steel" />
            </group>
          ))}
        </group>
      </Part>
      {cfg.cyls.map((c, i) => (
        <group key={c.n}>
          <group ref={(o) => { if (o) pistons.current[i] = o; }} rotation={[c.bank * D2R, 0, 0]}>
            <Part id="piston" group={g}>
              <C a={[BORE, BORE, 0.4]} p={[0, 0.1, 0]} m="alu" />
              {[0.26, 0.2].map((y) => <C key={y} a={[BORE + 0.003, BORE + 0.003, 0.02]} p={[0, y, 0]} m="darkSteel" />)}
            </Part>
            <mesh ref={(m) => { if (m) { flash.current[i] = m; m.raycast = () => {}; } }} position={[0, 0.45, 0]}>
              <cylinderGeometry args={[BORE - 0.02, BORE - 0.02, 0.12, 24]} /><meshBasicMaterial color="#ff7a1a" transparent opacity={0.8} />
            </mesh>
          </group>
          <Part id="connecting-rod" group={g}>
            <mesh ref={(m) => { if (m) rods.current[i] = m; }}><boxGeometry args={[0.08, 1, 0.12]} /><Mat k="steel" /></mesh>
          </Part>
        </group>
      ))}
    </group>
  );
}
