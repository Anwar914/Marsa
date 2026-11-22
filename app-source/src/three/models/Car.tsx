import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, T, Sp, Extrude, Tube, Rod } from '../shapes';
import { RoundedBox } from '@react-three/drei';
import { Body, sideZ, YB, WB, noseX } from './Body';
import { Mat } from '../materials';
import { clock } from '../registry';
import { useStore } from '../../store';


function Side({ s }: { s: 1 | -1 }) {
  const hz = (x: number, y: number) => s * (sideZ(x, y) + 0.006);
  const mx = 0.84, my = YB(0.84) + 0.02, mz = s * (WB(0.84) + 0.02);
  return (
    <group>
      <Part id="door-handle" explode={[0, 0, s * 0.55]}>
        {[0.42, -0.5].map((x) => (
          <group key={x} position={[x, 0.83, hz(x, 0.83)]} rotation={[0, s * -0.04, 0]}>
            <RoundedBox args={[0.13, 0.026, 0.022]} radius={0.01} smoothness={3}><Mat k="chrome" /></RoundedBox>
          </group>
        ))}
      </Part>
      <Part id="side-mirror" explode={[0, 0.1, s * 0.4]}>
        <group position={[mx, my, mz]}>
          <RoundedBox args={[0.08, 0.035, 0.09]} position={[0, 0, s * 0.03]} radius={0.012} smoothness={3}><Mat k="carPaint" /></RoundedBox>
          <RoundedBox args={[0.11, 0.12, 0.2]} position={[-0.01, 0.06, s * 0.14]} radius={0.04} smoothness={4}><Mat k="carPaint" /></RoundedBox>
          <B a={[0.006, 0.1, 0.17]} p={[-0.067, 0.06, s * 0.14]} m="chrome" />
          <B a={[0.012, 0.012, 0.08]} p={[0.04, 0.03, s * 0.2]} m="amber" />
        </group>
      </Part>
    </group>
  );
}

function Wipers() {
  const l = useRef<THREE.Group>(null!), r = useRef<THREE.Group>(null!);
  useFrame(() => {
    const a = (useStore.getState().moduleId === 'exterior' ? 0.5 - 0.5 * Math.cos(clock.t * 2.2) : 0) * 1.6;
    l.current.rotation.y = -a; r.current.rotation.y = -a;
  });
  const tilt = -Math.atan2(0.49, 0.7);
  return (
    <Part id="windshield-wiper" explode={[0.2, 0.15, 0]}>
      {[[-0.4, l], [0.12, r]].map(([z, ref], i) => (
        <group key={i} position={[0.9, 0.915, z as number]}>
          <group rotation={[0, 0, tilt]}>
            <group ref={ref as React.MutableRefObject<THREE.Group>}>
              <C a={[0.015, 0.015, 0.03]} m="black" />
              <B a={[0.02, 0.012, 0.5]} p={[-0.02, 0.012, 0.25]} m="black" />
              <B a={[0.012, 0.02, 0.5]} p={[-0.01, 0.02, 0.27]} m="rubber" />
            </group>
          </group>
        </group>
      ))}
    </Part>
  );
}

function Seat({ x, z, rear = false }: { x: number; z: number; rear?: boolean }) {
  const w = rear ? 1.25 : 0.48;
  return (
    <group position={[x, 0, z]}>
      <Part id="seat" explode={[0, 0.25, 0]}>
        <B a={[0.5, 0.1, w]} p={[0, 0.4, 0]} m="leather" />
        <B a={[0.1, 0.55, w]} p={[-0.25, 0.7, 0]} r={[0, 0, 0.15]} m="leather" />
      </Part>
      <Part id="headrest" explode={[0, 0.4, 0]}>
        {(rear ? [-0.4, 0, 0.4] : [0]).map((dz) => (
          <group key={dz}>
            <B a={[0.08, 0.15, 0.24]} p={[-0.32, 1.1, dz]} r={[0, 0, 0.15]} m="leather" />
            <C a={[0.006, 0.006, 0.1]} p={[-0.3, 1.0, dz - 0.06]} m="chrome" />
            <C a={[0.006, 0.006, 0.1]} p={[-0.3, 1.0, dz + 0.06]} m="chrome" />
          </group>
        ))}
      </Part>
    </group>
  );
}

function Interior() {
  const tilt = 0.6; // steering column inclination
  return (
    <group>
      <Part id="dashboard" explode={[0.2, 0.15, 0]}>
        <Extrude depth={1.5} m="interior" shape={[[0.9, 0.9], [0.55, 0.88], [0.5, 0.82], [0.58, 0.62], [0.75, 0.55], [0.9, 0.6]]} />
        <B a={[0.3, 0.32, 0.22]} p={[0.62, 0.62, 0]} m="interior" />
        <B a={[0.6, 0.18, 0.2]} p={[0.25, 0.38, 0]} m="interior" />
      </Part>
      <Part id="instrument-cluster" explode={[0.1, 0.25, 0]}>
        <B a={[0.1, 0.12, 0.3]} p={[0.58, 0.87, -0.38]} m="black" />
        <C a={[0.045, 0.045, 0.01]} r={[0, 0, Math.PI / 2]} p={[0.53, 0.87, -0.44]} m="white" />
        <C a={[0.045, 0.045, 0.01]} r={[0, 0, Math.PI / 2]} p={[0.53, 0.87, -0.32]} m="white" />
        <B a={[0.004, 0.03, 0.003]} p={[0.523, 0.88, -0.44]} r={[0.7, 0, 0]} m="red" />
        <B a={[0.004, 0.03, 0.003]} p={[0.523, 0.88, -0.32]} r={[-0.5, 0, 0]} m="red" />
      </Part>
      <Part id="steering-wheel" explode={[-0.25, 0.1, 0]}>
        <group position={[0.48, 0.81, -0.38]} rotation={[0, 0, tilt]}>
          <T a={[0.17, 0.016, 12, 48]} r={[0, Math.PI / 2, 0]} m="black" />
          <C a={[0.05, 0.05, 0.05]} r={[0, 0, Math.PI / 2]} m="black" />
          <B a={[0.012, 0.03, 0.32]} m="black" />
          <B a={[0.012, 0.16, 0.03]} p={[0, -0.08, 0]} m="black" />
        </group>
      </Part>
      {[['clutch-pedal', -0.5], ['brake-pedal', -0.39], ['accelerator-pedal', -0.27]].map(([id, z]) => (
        <Part key={id as string} id={id as string} explode={[0, 0.2, 0]}>
          <Rod a={[0.78, 0.6, z as number]} b={[0.72, 0.36, z as number]} r={0.008} m="steel" />
          <B a={[0.02, id === 'accelerator-pedal' ? 0.11 : 0.06, id === 'brake-pedal' ? 0.08 : 0.055]} p={[0.71, 0.35, z as number]} r={[0, 0, -0.3]} m="rubber" />
        </Part>
      ))}
      <Part id="gear-selector" explode={[0, 0.25, 0]}>
        <Rod a={[0.25, 0.48, 0]} b={[0.22, 0.62, 0]} r={0.01} m="chrome" />
        <Sp a={0.028} p={[0.22, 0.63, 0]} m="black" />
        <C a={[0.04, 0.05, 0.02]} p={[0.25, 0.48, 0]} m="rubber" />
      </Part>
      <Part id="parking-brake" explode={[0, 0.3, 0]}>
        <group position={[0.02, 0.48, 0]} rotation={[0, 0, 0.35]}><B a={[0.22, 0.03, 0.04]} p={[0.1, 0, 0]} m="black" /></group>
      </Part>
      <Part id="air-vent" explode={[0.1, 0, 0]}>
        {[-0.62, -0.13, 0.13, 0.62].map((z) => (
          <group key={z} position={[0.555, 0.8, z]}>
            <B a={[0.01, 0.05, 0.09]} m="black" />
            {[-0.015, 0, 0.015].map((y) => <B key={y} a={[0.012, 0.004, 0.085]} p={[-0.004, y, 0]} m="plasticLight" />)}
          </group>
        ))}
      </Part>
      <Part id="glove-compartment" explode={[-0.2, 0, 0.1]}><B a={[0.02, 0.1, 0.32]} p={[0.555, 0.68, 0.42]} r={[0, 0, -0.35]} m="plastic" /><B a={[0.01, 0.02, 0.06]} p={[0.53, 0.72, 0.42]} m="chrome" /></Part>
      <Part id="radio-controls" explode={[-0.2, 0.1, 0]}>
        <B a={[0.01, 0.08, 0.18]} p={[0.555, 0.74, 0]} m="black" />
        <C a={[0.012, 0.012, 0.012]} r={[0, 0, Math.PI / 2]} p={[0.548, 0.74, -0.075]} m="chrome" />
        <B a={[0.003, 0.05, 0.11]} p={[0.549, 0.745, 0.01]} m="lightLens" c="#0ea5e9" />
      </Part>
      <Part id="heating-controls" explode={[-0.2, -0.05, 0]}>
        <B a={[0.01, 0.05, 0.18]} p={[0.56, 0.665, 0]} m="plastic" />
        {[-0.06, 0, 0.06].map((z, i) => <C key={z} a={[0.016, 0.016, 0.015]} r={[0, 0, Math.PI / 2]} p={[0.55, 0.665, z]} m={i === 0 ? 'red' : i === 2 ? 'plasticLight' : 'chrome'} c={i === 2 ? '#3b82f6' : undefined} />)}
      </Part>
      <Part id="sun-visor" explode={[0, 0.2, 0]}>
        <B a={[0.15, 0.012, 0.36]} p={[0.25, 1.35, -0.37]} r={[0, 0, -0.25]} m="plasticLight" />
        <B a={[0.15, 0.012, 0.36]} p={[0.25, 1.35, 0.37]} r={[0, 0, -0.25]} m="plasticLight" />
      </Part>
      <Part id="rearview-mirror" explode={[0, 0.2, 0]}>
        <Rod a={[0.36, 1.33, 0]} b={[0.34, 1.28, 0]} r={0.006} m="black" />
        <B a={[0.02, 0.06, 0.22]} p={[0.32, 1.26, 0]} m="black" />
      </Part>
      <Seat x={-0.12} z={-0.38} />
      <Seat x={-0.12} z={0.38} />
      <Seat x={-0.95} z={0} rear />
      <Part id="seat-belt" explode={[0, 0.1, 0]}>
        {[-1, 1].map((s) => (
          <group key={s}>
            <Tube radius={0.008} m="black" pts={[[-0.12, 1.22, s * 0.66], [-0.25, 1.0, s * 0.58], [-0.3, 0.75, s * 0.4], [-0.3, 0.48, s * 0.18]]} />
            <Tube radius={0.008} m="black" pts={[[-0.3, 0.48, s * 0.18], [-0.22, 0.52, s * 0.4], [-0.3, 0.47, s * 0.62]]} />
            <B a={[0.03, 0.05, 0.02]} p={[-0.3, 0.46, s * 0.16]} m="chrome" />
          </group>
        ))}
      </Part>
    </group>
  );
}

export function Car() {
  return (
    <group>
      <Side s={1} />
      <Side s={-1} />
      <Body />
      <Part id="license-plate" explode={[0.55, 0, 0]}><B a={[0.01, 0.11, 0.52]} p={[noseX(0.42, 0.26) + 0.004, 0.42, 0]} m="white" /><B a={[0.012, 0.11, 0.05]} p={[noseX(0.42, 0.26) + 0.005, 0.42, -0.235]} m="plastic" c="#1d4ed8" /></Part>
      <Part id="license-plate" explode={[-0.55, 0, 0]}><B a={[0.01, 0.11, 0.52]} p={[noseX(0.5, 0.26, true) - 0.004, 0.5, 0]} m="white" /><B a={[0.012, 0.11, 0.05]} p={[noseX(0.5, 0.26, true) - 0.005, 0.5, 0.235]} m="plastic" c="#1d4ed8" /></Part>
      {/* Body structure (not a vocabulary item): floor, tunnel, firewall, rear panel */}
      <Part id="body-structure" shell passive>
        <B a={[2.4, 0.02, 1.6]} p={[-0.35, 0.26, 0]} m="interior" />
        <B a={[1.5, 0.12, 0.2]} p={[0.0, 0.32, 0]} m="interior" />
        <B a={[0.03, 0.5, 1.5]} p={[0.97, 0.6, 0]} m="darkSteel" />
      </Part>
      <Wipers />
      <Interior />
      {/* Engine bay ancillaries */}
      <Part id="battery" explode={[0, 0.4, 0.2]}>
        <B a={[0.24, 0.18, 0.17]} p={[1.08, 0.58, -0.55]} m="black" />
        <C a={[0.012, 0.012, 0.03]} p={[1.15, 0.685, -0.6]} m="red" />
        <C a={[0.012, 0.012, 0.03]} p={[1.01, 0.685, -0.6]} m="darkSteel" />
      </Part>
      <Part id="air-filter" explode={[0.2, 0.4, 0.2]}>
        <B a={[0.3, 0.12, 0.25]} p={[1.86, 0.64, 0.5]} m="black" />
        <Tube radius={0.035} m="rubber" pts={[[1.75, 0.66, 0.42], [1.72, 0.7, 0.3], [1.72, 0.66, 0.15]]} />
      </Part>
      <Part id="air-intake" explode={[0.3, 0.3, 0.2]}>
        <Tube radius={0.035} m="plastic" pts={[[2.0, 0.64, 0.5], [2.08, 0.7, 0.4], [2.12, 0.74, 0.3]]} />
      </Part>
    </group>
  );
}
