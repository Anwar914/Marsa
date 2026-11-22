import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, placeBetween } from '../shapes';
import { Mat } from '../materials';
import { clock } from '../registry';

const LA = 0.85, Y0 = 0.3, PITCH = 0.06;
/** Scissor jack. Unit ≈ 10 cm. Height oscillates; the spindle turns according to the change of the side-pivot distance. */
export function Jack() {
  const arms = useRef<THREE.Mesh[]>([]);
  const pivots = useRef<THREE.Group[]>([]);
  const saddle = useRef<THREE.Group>(null!);
  const spindle = useRef<THREE.Group>(null!);
  const crank = useRef<THREE.Group>(null!);
  const w0 = useRef(0);
  useFrame(() => {
    const hh = 0.25 + 0.4 * (0.5 - 0.5 * Math.cos(clock.t * 0.5)); // half height of the rhombus
    const w = Math.sqrt(LA * LA - hh * hh);
    if (!w0.current) w0.current = w;
    const B0: [number, number, number] = [0, Y0, 0];
    const T0: [number, number, number] = [0, Y0 + 2 * hh, 0];
    const L: [number, number, number] = [-w, Y0 + hh, 0];
    const R: [number, number, number] = [w, Y0 + hh, 0];
    const segs: [typeof B0, typeof B0][] = [[B0, L], [B0, R], [L, T0], [R, T0]];
    segs.forEach(([a, b], i) => placeBetween(arms.current[i], a, b));
    [B0, L, R, T0].forEach((p, i) => pivots.current[i].position.set(...p));
    saddle.current.position.y = Y0 + 2 * hh;
    spindle.current.position.y = Y0 + hh;
    const turn = ((w0.current - w) / PITCH) * Math.PI * 2;
    spindle.current.rotation.x = turn;
    crank.current.position.y = Y0 + hh;
    crank.current.rotation.x = turn;
  });
  return (
    <group>
      <Part id="jack-base" group="scissor-jack" explode={[0, -0.4, 0]}>
        <B a={[1.9, 0.08, 0.7]} p={[0, 0.04, 0]} m="darkSteel" />
        <B a={[0.6, 0.25, 0.45]} p={[0, 0.18, 0]} m="darkSteel" />
      </Part>
      <Part id="lever-arms" group="scissor-jack" explode={[0, 0, 0.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} ref={(m) => { if (m) arms.current[i] = m; }}><boxGeometry args={[0.1, 1, 0.38]} /><Mat k="paint" c="#64748b" /></mesh>
        ))}
      </Part>
      <Part id="pivot" group="scissor-jack" explode={[0, 0, 0.7]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} ref={(g) => { if (g) pivots.current[i] = g; }}>
            <C a={[0.06, 0.06, 0.5]} r={[Math.PI / 2, 0, 0]} m="chrome" />
          </group>
        ))}
      </Part>
      <Part id="lifting-saddle" group="scissor-jack" explode={[0, 0.4, 0]}>
        <group ref={saddle}>
          <B a={[0.5, 0.12, 0.42]} p={[0, 0.08, 0]} m="darkSteel" />
          <B a={[0.5, 0.12, 0.08]} p={[0, 0.2, 0.17]} m="darkSteel" />
          <B a={[0.5, 0.12, 0.08]} p={[0, 0.2, -0.17]} m="darkSteel" />
        </group>
      </Part>
      <Part id="threaded-spindle" group="scissor-jack" explode={[0, 0, -0.5]}>
        <group ref={spindle}>
          <C a={[0.035, 0.035, 2.0]} r={[0, 0, Math.PI / 2]} p={[0.25, 0, 0]} m="steel" />
          {Array.from({ length: 30 }, (_, i) => <B key={i} a={[0.012, 0.085, 0.085]} p={[-0.6 + i * 0.06, 0, 0]} r={[0.6, 0, 0]} m="steel" />)}
        </group>
      </Part>
      <Part id="crank" group="scissor-jack" explode={[0.5, 0, 0]}>
        <group ref={crank} position={[1.3, 0, 0]}>
          <C a={[0.05, 0.05, 0.15]} r={[0, 0, Math.PI / 2]} m="darkSteel" />
          <B a={[0.04, 0.5, 0.04]} p={[0.07, -0.25, 0]} m="steel" />
          <C a={[0.03, 0.03, 0.5]} r={[0, 0, Math.PI / 2]} p={[0.3, -0.5, 0]} m="steel" />
          <C a={[0.045, 0.045, 0.2]} r={[0, 0, Math.PI / 2]} p={[0.6, -0.5, 0]} m="rubber" />
        </group>
      </Part>
    </group>
  );
}
