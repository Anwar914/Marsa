import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ModuleId } from '../types';
import { useStore } from '../store';
import { CutContext } from './Part';
import { clock } from './registry';
import { OMEGA } from './anim';
import { Car } from './models/Car';
import { Chassis, chassis } from './models/Chassis';
import { Engine } from './models/Engine';
import { EngineType } from './models/EngineTypes';
import { Brakes } from './models/Brakes';
import { Tire } from './models/Tire';
import { Electrical } from './models/Electrical';
import { Filters } from './models/Filters';
import { Jack } from './models/Jack';
import { WiperSystem } from './models/WiperSystem';
import { GEAR_RATIO, FINAL_DRIVE } from './models/Gearbox';

type Cam = { pos: [number, number, number]; target: [number, number, number]; grid: number };
export const CAMERAS: Record<ModuleId, Cam> = {
  exterior: { pos: [4.6, 2.4, 4.8], target: [0, 0.6, 0], grid: 1 },
  interior: { pos: [-0.9, 1.9, 1.9], target: [0.45, 0.75, 0], grid: 1 },
  engine: { pos: [3.2, 4.2, 8.6], target: [-0.4, 1.3, 0], grid: 10 },
  engineTypes: { pos: [4.2, 3.6, 6.8], target: [0, 1.2, 0], grid: 10 },
  brakes: { pos: [0.15, 0.35, 0.95], target: [0.04, 0.02, -0.05], grid: 0.1 },
  suspension: { pos: [3.8, 1.6, 2.6], target: [0.6, 0.3, 0], grid: 1 },
  drivetrain: { pos: [2.6, 1.9, 2.6], target: [0, 0.3, 0], grid: 1 },
  tires: { pos: [1.1, 2.2, 2.6], target: [0, 1.0, 0], grid: 1 },
  electrical: { pos: [1.0, 3.2, 7.6], target: [1.0, 1.1, 0], grid: 10 },
  filters: { pos: [0.5, 3.6, 7.2], target: [0, 1.0, 1.0], grid: 10 },
  jack: { pos: [1.8, 1.6, 3.0], target: [0.2, 0.6, 0], grid: 10 },
  wiper: { pos: [0.1, 1.0, 1.2], target: [-0.05, 0.1, 0], grid: 1 },
};

const CUT_Z = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
const CUT_BRAKE = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.012)];

function ChassisController({ mode }: { mode: 'drive' | 'suspension' | 'drivetrain' | 'still' }) {
  useFrame(() => {
    const t = clock.t;
    const th = t * OMEGA;
    if (mode === 'suspension') {
      chassis.steer = 0.45 * Math.sin(t * 0.7);
      const b = 0.06 * Math.sin(t * 1.6);
      chassis.bump = [b, -b, -b * 0.8, b * 0.8];
      chassis.wheel = t * 2; chassis.shaft = t * 2 * FINAL_DRIVE;
    } else if (mode === 'drive' || mode === 'drivetrain') {
      chassis.steer = 0; chassis.bump = [0, 0, 0, 0];
      chassis.shaft = th / GEAR_RATIO;
      chassis.wheel = th / (GEAR_RATIO * FINAL_DRIVE);
    } else { chassis.steer = 0; chassis.bump = [0, 0, 0, 0]; }
  });
  return null;
}

export function SceneFor({ id }: { id: ModuleId }) {
  const engineType = useStore((s) => s.engineType);
  switch (id) {
    case 'exterior':
    case 'interior':
      return (
        <CutContext.Provider value={CUT_Z}>
          <ChassisController mode={id === 'exterior' ? 'drive' : 'still'} />
          <Car />
          <Chassis />
        </CutContext.Provider>
      );
    case 'engine':
      return <CutContext.Provider value={CUT_Z}><Engine hud /></CutContext.Provider>;
    case 'engineTypes':
      return <EngineType key={engineType} type={engineType} />;
    case 'brakes':
      return <CutContext.Provider value={CUT_BRAKE}><Brakes /></CutContext.Provider>;
    case 'suspension':
      return <><ChassisController mode="suspension" /><Chassis show={{ engine: false, drivetrain: true, exhaust: false }} /></>;
    case 'drivetrain':
      return (
        <CutContext.Provider value={CUT_Z}>
          <ChassisController mode="drivetrain" />
          <Chassis show={{ exhaust: false, steeringColumn: false }} />
        </CutContext.Provider>
      );
    case 'tires':
      return <group position={[0, 1.05, 0]}><Tire /></group>;
    case 'electrical':
      return <CutContext.Provider value={CUT_Z}><Electrical /></CutContext.Provider>;
    case 'filters':
      return <CutContext.Provider value={CUT_Z}><Filters /></CutContext.Provider>;
    case 'jack':
      return <Jack />;
    case 'wiper':
      return <WiperSystem />;
  }
}
