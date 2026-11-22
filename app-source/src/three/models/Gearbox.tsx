import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, Lathe, T } from '../shapes';
import { clock } from '../registry';
import { OMEGA } from '../anim';
import { useStore } from '../../store';

/** Gear pairs: [x position, main gear radius, counter gear radius] — 4 forward gears (simplified). */
const GEARS: [number, number, number][] = [[-0.06, 0.028, 0.05], [-0.13, 0.036, 0.042], [-0.2, 0.043, 0.035], [-0.27, 0.05, 0.028]];
export const GEAR_RATIO = 1.4, FINAL_DRIVE = 3.7;

/** Clutch/torque converter + manual gearbox. Axis = X; the engine side is +X. Origin = crank centre at flywheel face. */
export function Gearbox({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const auto = useStore((s) => s.gearbox === 'automatic');
  const input = useRef<THREE.Group>(null!);
  const counter = useRef<THREE.Group>(null!);
  useFrame(() => {
    const th = clock.t * OMEGA;
    if (input.current) input.current.rotation.x = th;
    if (counter.current) counter.current.rotation.x = -th * 0.8;
  });
  return (
    <group position={position} scale={scale}>
      <group ref={input}>
        {auto ? (
          <Part id="torque-converter" explode={[0.12, 0, 0]}>
            <group rotation={[0, 0, Math.PI / 2]} position={[0.1, 0, 0]}>
              <Lathe pts={[[0.02, -0.04], [0.07, -0.045], [0.1, -0.03], [0.105, 0], [0.1, 0.03], [0.07, 0.045], [0.02, 0.04]]} m="alu" seg={40} />
            </group>
            <B a={[0.006, 0.18, 0.02]} p={[0.11, 0, 0]} m="yellow" />
          </Part>
        ) : (
          <Part id="clutch" explode={[0.12, 0, 0]}>
            <C a={[0.085, 0.085, 0.012, 40]} r={[0, 0, Math.PI / 2]} p={[0.13, 0, 0]} m="friction" />
            <C a={[0.09, 0.095, 0.03, 40]} r={[0, 0, Math.PI / 2]} p={[0.105, 0, 0]} m="steel" />
            <C a={[0.03, 0.03, 0.03]} r={[0, 0, Math.PI / 2]} p={[0.08, 0, 0]} m="chrome" />
            <B a={[0.006, 0.16, 0.012]} p={[0.137, 0, 0]} m="yellow" />
          </Part>
        )}
        <Part id="transmission" explode={[0, 0.12, 0]}>
          <C a={[0.012, 0.012, 0.4]} r={[0, 0, Math.PI / 2]} p={[-0.12, 0, 0]} m="chrome" />
          {GEARS.map(([x, r]) => <C key={x} a={[r, r, 0.022, 20]} r={[0, 0, Math.PI / 2]} p={[x, 0, 0]} m="steel" />)}
        </Part>
      </group>
      <group position={[0, -0.078, 0]}>
        <group ref={counter}>
          <Part id="transmission" explode={[0, 0.06, 0]}>
            <C a={[0.01, 0.01, 0.32]} r={[0, 0, Math.PI / 2]} p={[-0.16, 0, 0]} m="chrome" />
            {GEARS.map(([x, , r]) => <C key={x} a={[r, r, 0.022, 20]} r={[0, 0, Math.PI / 2]} p={[x, 0, 0]} m="darkSteel" />)}
          </Part>
        </group>
      </group>
      {/* Housing: translucent bell housing + case, clickable where nothing is behind */}
      <Part id="transmission" cut seeThrough explode={[0, 0.25, 0]}>
        <group rotation={[0, 0, Math.PI / 2]} position={[0.07, 0, 0]}>
          <Lathe pts={[[0.07, -0.1], [0.11, -0.03], [0.12, 0.08], [0.12, 0.085]]} m="alu" o={0.35} seg={40} />
        </group>
        <B a={[0.36, 0.2, 0.16]} p={[-0.16, -0.035, 0]} m="alu" o={0.35} />
        <C a={[0.03, 0.03, 0.06]} r={[0, 0, Math.PI / 2]} p={[-0.37, 0, 0]} m="darkSteel" />
        <C a={[0.008, 0.008, 0.18]} p={[-0.1, 0.17, 0]} m="black" />
      </Part>
      <T a={[0.12, 0.004, 6, 48]} r={[0, Math.PI / 2, 0]} p={[0.165, 0, 0]} m="darkSteel" />
    </group>
  );
}
