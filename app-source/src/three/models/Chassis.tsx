import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, Sp, T, Tube, Spring, Rod, placeBetween } from '../shapes';
import { Mat } from '../materials';
import { Wheel, WHEEL_R } from './Wheel';
import { Engine } from './Engine';
import { Gearbox } from './Gearbox';

/** Shared, mutable chassis animation state (written by scene controllers). */
export const chassis = { steer: 0, bump: [0, 0, 0, 0], wheel: 0, shaft: 0 };

export const FX = 1.35, RX = -1.3, TRACK = 0.78;
type V3 = [number, number, number];

function FrontCorner({ s, show }: { s: 1 | -1; show: Show }) {
  const idx = s === 1 ? 1 : 0;
  const corner = useRef<THREE.Group>(null!); // vertical travel
  const steer = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const arm = useRef<THREE.Group>(null!);
  const strut = useRef<THREE.Mesh>(null!);
  const spring = useRef<THREE.Group>(null!);
  const tieRod = useRef<THREE.Mesh>(null!);
  const top: V3 = [FX - 0.02, 0.86, s * 0.56];
  const armIn: V3 = [FX, 0.17, s * 0.3];
  const armLen = 0.34;
  const v = new THREE.Vector3();

  useFrame(() => {
    const b = chassis.bump[idx], d = chassis.steer;
    corner.current.position.y = b;
    steer.current.rotation.y = d;
    spin.current.rotation.z = -chassis.wheel;
    arm.current.rotation.x = -s * Math.asin(b / armLen);
    // strut from knuckle top (moves with corner + steer) to top mount (fixed)
    v.set(FX, 0.47 + b, s * 0.63);
    placeBetween(strut.current, v, top);
    const sp = v.clone().lerp(new THREE.Vector3(...top), 0.42);
    placeBetween(spring.current, sp, top);
    spring.current.scale.set(1, sp.distanceTo(new THREE.Vector3(...top)) / 0.3, 1);
    // tie rod from rack end to steering arm end
    const ax = -0.15 * Math.cos(d), az = 0.15 * Math.sin(d);
    placeBetween(tieRod.current, [FX - 0.15, 0.23, s * 0.3 + 0.15 * Math.sin(d)], [FX + ax, 0.3 + b, s * 0.64 + az]);
  });

  return (
    <group>
      <group ref={corner}>
        <group position={[FX, WHEEL_R, s * 0.64]}>
          <group ref={steer}>
            <Part id="steering-knuckle" group="front-axle" explode={[0, 0, s * 0.15]}>
              <B a={[0.07, 0.3, 0.05]} p={[0, 0.0, 0]} m="iron" />
              <B a={[0.16, 0.035, 0.035]} p={[-0.08, -0.02, -s * 0.0]} m="iron" />
              <C a={[0.05, 0.05, 0.06]} r={[Math.PI / 2, 0, 0]} m="iron" />
            </Part>
            <Part id="wheel-bearing" group="front-axle" explode={[0, 0, s * 0.25]}>
              <T a={[0.04, 0.012]} p={[0, 0, s * 0.035]} m="chrome" />
            </Part>
            {show.brakes && (
              <Part id="brake-caliper" group="front-axle" explode={[-0.15, 0.1, s * 0.25]}>
                <group rotation={[0, 0, 0.5]}><B a={[0.07, 0.11, 0.06]} p={[-0.13, 0, s * 0.05]} m="red" /></group>
              </Part>
            )}
            <group ref={spin} position={[0, 0, s * 0.05]}>
              <Part id="wheel-hub" group="front-axle" explode={[0, 0, s * 0.35]}>
                <C a={[0.06, 0.06, 0.04]} r={[Math.PI / 2, 0, 0]} m="steel" />
                {[0, 1, 2, 3, 4].map((k) => <C key={k} a={[0.006, 0.006, 0.05]} p={[Math.cos(k * 1.2566) * 0.045, Math.sin(k * 1.2566) * 0.045, s * 0.02]} r={[Math.PI / 2, 0, 0]} m="chrome" />)}
              </Part>
              {show.brakes && (
                <Part id="brake-disc" group="front-axle" explode={[0, 0, s * 0.45]}>
                  <C a={[0.14, 0.14, 0.024, 48]} r={[Math.PI / 2, 0, 0]} p={[0, 0, s * 0.005]} m="iron" />
                  <C a={[0.07, 0.07, 0.05]} r={[Math.PI / 2, 0, 0]} p={[0, 0, s * 0.02]} m="steel" />
                </Part>
              )}
              {show.wheels && (
                <group position={[0, 0, s * 0.09]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
                  <Wheel />
                </group>
              )}
            </group>
          </group>
        </group>
      </group>
      {/* control arm pivots on the subframe */}
      <group ref={arm} position={armIn}>
        <Part id="control-arm" group="front-axle" explode={[0, -0.15, s * 0.1]}>
          <Rod a={[0, 0, 0]} b={[0, 0, s * armLen]} r={0.022} m="darkSteel" />
          <Rod a={[-0.28, 0, 0]} b={[0, 0, s * armLen]} r={0.02} m="darkSteel" />
          <C a={[0.03, 0.03, 0.06]} r={[0, 0, Math.PI / 2]} m="rubber" />
          <C a={[0.03, 0.03, 0.06]} r={[0, 0, Math.PI / 2]} p={[-0.28, 0, 0]} m="rubber" />
        </Part>
        <Part id="ball-joint" group="front-axle" explode={[0, -0.2, s * 0.2]}>
          <Sp a={0.03} p={[0, 0, s * armLen]} m="chrome" />
        </Part>
      </group>
      <Part id="shock-absorber" group="front-axle" explode={[0, 0.25, s * 0.1]}>
        <mesh ref={strut}><cylinderGeometry args={[0.03, 0.03, 1, 20]} /><Mat k="yellow" /></mesh>
        <C a={[0.06, 0.06, 0.03]} p={top} m="darkSteel" />
      </Part>
      <Part id="coil-spring" group="front-axle" explode={[0, 0.35, s * 0.15]}>
        <group ref={spring}><Spring radius={0.07} wire={0.011} turns={5} height={0.3} p={[0, -0.15, 0]} m="green" /></group>
      </Part>
      <Part id="tie-rod" group="front-axle" explode={[0, 0, s * 0.1]}>
        <mesh ref={tieRod}><cylinderGeometry args={[0.012, 0.012, 1, 12]} /><Mat k="steel" /></mesh>
      </Part>
    </group>
  );
}

function RearCorner({ s, show }: { s: 1 | -1; show: Show }) {
  const idx = s === 1 ? 3 : 2;
  const corner = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const shaft = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armU = useRef<THREE.Group>(null!);
  const shock = useRef<THREE.Mesh>(null!);
  const spring = useRef<THREE.Group>(null!);
  useFrame(() => {
    const b = chassis.bump[idx];
    corner.current.position.y = b;
    spin.current.rotation.z = -chassis.wheel;
    armL.current.rotation.x = -s * Math.asin(b / 0.42);
    armU.current.rotation.x = -s * Math.asin(b / 0.32);
    placeBetween(shock.current, [RX - 0.12, 0.2 + b, s * 0.6], [RX - 0.14, 0.62, s * 0.52]);
    placeBetween(spring.current, [RX + 0.08, 0.2 + b * 0.8, s * 0.48], [RX + 0.08, 0.5, s * 0.48]);
    spring.current.scale.set(1, (0.3 - b * 0.8) / 0.3, 1);
    // axle shaft follows wheel travel (CV joints allow the angle)
    const dz = s * (0.66 - 0.18), dy = b;
    shaft.current.rotation.x = s * Math.atan2(dy, Math.abs(dz)) * -1;
  });
  return (
    <group>
      <group ref={corner}>
        <group position={[RX, WHEEL_R, s * 0.64]}>
          <Part id="wheel-bearing" group="rear-axle"><C a={[0.06, 0.06, 0.06]} r={[Math.PI / 2, 0, 0]} m="iron" /><B a={[0.06, 0.3, 0.05]} m="iron" /></Part>
          {show.brakes && <Part id="backing-plate" group="rear-axle" explode={[0, 0, s * 0.15]}><C a={[0.13, 0.13, 0.008, 40]} r={[Math.PI / 2, 0, 0]} p={[0, 0, s * 0.04]} m="darkSteel" /></Part>}
          <group ref={spin} position={[0, 0, s * 0.05]}>
            <Part id="wheel-hub" group="rear-axle" explode={[0, 0, s * 0.3]}>
              <C a={[0.06, 0.06, 0.04]} r={[Math.PI / 2, 0, 0]} m="steel" />
            </Part>
            {show.brakes && (
              <Part id="brake-drum" group="rear-axle" explode={[0, 0, s * 0.42]}>
                <C a={[0.13, 0.13, 0.07, 48]} r={[Math.PI / 2, 0, 0]} p={[0, 0, s * 0.015]} m="iron" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <B key={k} a={[0.02, 0.01, 0.07]} p={[Math.cos(k * 0.785) * 0.132, Math.sin(k * 0.785) * 0.132, s * 0.015]} r={[0, 0, k * 0.785]} m="iron" />)}
              </Part>
            )}
            {show.wheels && <group position={[0, 0, s * 0.09]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}><Wheel /></group>}
          </group>
        </group>
      </group>
      {/* axle shaft with inner + outer CV joints; pivots at the differential */}
      {show.drivetrain && (
        <group position={[RX, WHEEL_R, s * 0.18]}>
          <group ref={shaft}>
            <Part id="axle-shaft" group="rear-axle" explode={[0, -0.1, s * 0.15]}>
              <C a={[0.02, 0.02, 0.38]} r={[Math.PI / 2, 0, 0]} p={[0, 0, s * 0.24]} m="steel" />
            </Part>
            <Part id="cv-joint" group="rear-axle" explode={[0, -0.1, s * 0.15]}>
              <C a={[0.035, 0.05, 0.08]} r={[s * Math.PI / 2, 0, 0]} p={[0, 0, s * 0.04]} m="rubber" />
              <C a={[0.035, 0.05, 0.08]} r={[-s * Math.PI / 2, 0, 0]} p={[0, 0, s * 0.43]} m="rubber" />
            </Part>
          </group>
        </group>
      )}
      <group ref={armL} position={[RX, 0.15, s * 0.22]}>
        <Part id="control-arm" group="rear-axle" explode={[0, -0.15, s * 0.1]}>
          <Rod a={[0.15, 0, 0]} b={[0, 0, s * 0.42]} r={0.02} m="darkSteel" />
          <Rod a={[-0.15, 0, 0]} b={[0, 0, s * 0.42]} r={0.02} m="darkSteel" />
        </Part>
      </group>
      <group ref={armU} position={[RX, 0.5, s * 0.32]}>
        <Part id="control-arm" group="rear-axle" explode={[0, 0.15, s * 0.1]}><Rod a={[0, 0, 0]} b={[0, -0.02, s * 0.32]} r={0.016} m="darkSteel" /></Part>
      </group>
      <Part id="shock-absorber" group="rear-axle" explode={[0, 0.2, s * 0.1]}>
        <mesh ref={shock}><cylinderGeometry args={[0.025, 0.025, 1, 16]} /><Mat k="yellow" /></mesh>
      </Part>
      <Part id="coil-spring" group="rear-axle" explode={[0, 0.3, s * 0.1]}>
        <group ref={spring}><Spring radius={0.06} wire={0.011} turns={5} height={0.3} p={[0, -0.15, 0]} m="green" /></group>
      </Part>
    </group>
  );
}

export interface Show { engine: boolean; drivetrain: boolean; brakes: boolean; wheels: boolean; exhaust: boolean; steeringColumn: boolean }
const ALL: Show = { engine: true, drivetrain: true, brakes: true, wheels: true, exhaust: true, steeringColumn: true };

export function Chassis({ show: sh }: { show?: Partial<Show> }) {
  const show = { ...ALL, ...sh };
  const rack = useRef<THREE.Group>(null!);
  const column = useRef<THREE.Group>(null!);
  const dshaft = useRef<THREE.Group>(null!);
  useFrame(() => {
    rack.current.position.z = 0.15 * Math.sin(chassis.steer);
    if (column.current) column.current.rotation.y = chassis.steer * 15;
    if (dshaft.current) dshaft.current.rotation.x = chassis.shaft;
  });
  return (
    <group>
      {/* FRONT AXLE */}
      <FrontCorner s={1} show={show} />
      <FrontCorner s={-1} show={show} />
      <Part id="subframe" group="front-axle" explode={[0, -0.25, 0]}>
        <B a={[0.08, 0.06, 0.66]} p={[FX - 0.1, 0.16, 0]} m="darkSteel" />
        <B a={[0.6, 0.06, 0.07]} p={[FX - 0.05, 0.16, 0.3]} m="darkSteel" />
        <B a={[0.6, 0.06, 0.07]} p={[FX - 0.05, 0.16, -0.3]} m="darkSteel" />
      </Part>
      <Part id="steering-rack" group="front-axle" explode={[-0.15, 0, 0]}>
        <C a={[0.03, 0.03, 0.5]} r={[Math.PI / 2, 0, 0]} p={[FX - 0.15, 0.23, 0]} m="alu" />
        <group ref={rack}><C a={[0.013, 0.013, 0.66]} r={[Math.PI / 2, 0, 0]} p={[FX - 0.15, 0.23, 0]} m="chrome" /></group>
        <C a={[0.04, 0.04, 0.08]} p={[FX - 0.15, 0.27, -0.12]} m="alu" />
      </Part>
      <Part id="stabilizer-bar" group="front-axle" explode={[0.2, 0, 0]}>
        <Tube radius={0.012} m="black" pts={[[FX + 0.1, 0.3, -0.55], [FX + 0.18, 0.24, -0.4], [FX + 0.2, 0.24, 0], [FX + 0.18, 0.24, 0.4], [FX + 0.1, 0.3, 0.55]]} />
        <Rod a={[FX + 0.1, 0.3, 0.55]} b={[FX + 0.02, 0.5, 0.6]} r={0.008} m="steel" />
        <Rod a={[FX + 0.1, 0.3, -0.55]} b={[FX + 0.02, 0.5, -0.6]} r={0.008} m="steel" />
      </Part>
      {show.steeringColumn && (
        <Part id="steering-column" explode={[-0.1, 0.1, 0]}>
          <Rod a={[FX - 0.15, 0.28, -0.12]} b={[0.85, 0.55, -0.36]} r={0.012} m="steel" />
          <group position={[0.85, 0.55, -0.36]}><group ref={column} /></group>
          <Rod a={[0.85, 0.55, -0.36]} b={[0.5, 0.8, -0.38]} r={0.022} m="darkSteel" />
        </Part>
      )}

      {/* REAR AXLE */}
      <RearCorner s={1} show={show} />
      <RearCorner s={-1} show={show} />
      <Part id="subframe" group="rear-axle" explode={[0, -0.2, 0]}>
        <B a={[0.07, 0.06, 0.62]} p={[RX + 0.18, 0.18, 0]} m="darkSteel" />
        <B a={[0.07, 0.06, 0.62]} p={[RX - 0.18, 0.18, 0]} m="darkSteel" />
        <B a={[0.42, 0.06, 0.06]} p={[RX, 0.18, 0.3]} m="darkSteel" />
        <B a={[0.42, 0.06, 0.06]} p={[RX, 0.18, -0.3]} m="darkSteel" />
      </Part>

      {/* DRIVETRAIN: engine → clutch/gearbox → driveshaft → differential */}
      {show.engine && (
        <group position={[1.5, 0.36, 0]} rotation={[0, Math.PI, 0]} scale={0.1}>
          <Engine />
        </group>
      )}
      {show.drivetrain && <>
        <Gearbox position={[1.12, 0.36, 0]} scale={1} />
        <group position={[0.62, 0.34, 0]}>
          <group ref={dshaft}>
            <Part id="driveshaft" explode={[0, -0.15, 0]}>
              <C a={[0.035, 0.035, 1.6]} r={[0, 0, Math.PI / 2]} p={[-0.82, 0, 0]} m="steel" />
              {[-0.02, -1.64].map((x) => <B key={x} a={[0.05, 0.08, 0.08]} p={[x, 0, 0]} m="darkSteel" />)}
              <B a={[0.6, 0.02, 0.02]} p={[-0.82, 0.036, 0]} m="yellow" />
            </Part>
          </group>
        </group>
        <Part id="differential" group="rear-axle" explode={[0, 0.15, 0]} seeThrough>
          <Sp a={0.13} p={[RX, WHEEL_R, 0]} s={[1, 0.9, 1.1]} m="iron" />
          <C a={[0.06, 0.08, 0.16]} r={[0, 0, Math.PI / 2]} p={[RX + 0.15, WHEEL_R, 0]} m="iron" />
        </Part>
      </>}

      {show.exhaust && (
        <Part id="exhaust-system" explode={[0, -0.2, 0.2]}>
          <Tube radius={0.025} m="steel" pts={[[1.38, 0.3, 0.12], [1.1, 0.2, 0.18], [0.6, 0.18, 0.2], [-0.4, 0.2, 0.2], [-1.5, 0.25, 0.25], [-2.15, 0.22, 0.4]]} />
          <C a={[0.06, 0.06, 0.32]} r={[0, 0, Math.PI / 2]} p={[0.5, 0.18, 0.2]} m="steel" />
          <B a={[0.42, 0.14, 0.3]} p={[-1.85, 0.25, 0.3]} m="darkSteel" />
          <C a={[0.035, 0.035, 0.1]} r={[0, 0, Math.PI / 2]} p={[-2.18, 0.22, 0.4]} m="chrome" />
        </Part>
      )}
    </group>
  );
}
