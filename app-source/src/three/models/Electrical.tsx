import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, T, Spring } from '../shapes';
import { clock } from '../registry';

/** Battery cutaway, enlarged spark plug, ignition coil and alternator. Unit ≈ 10 cm (spark plug ×6). */
export function Electrical() {
  const spark = useRef<THREE.Mesh>(null!);
  const pulley = useRef<THREE.Group>(null!);
  useFrame(() => {
    const c = (clock.t * 1.2) % 1;
    spark.current.visible = c < 0.12;
    spark.current.scale.setScalar(0.8 + Math.random() * 0.4);
    pulley.current.rotation.x = clock.t * 4;
  });
  const cells = [0, 1, 2, 3, 4, 5];
  return (
    <group>
      {/* ===== BATTERY (cut open at the front) ===== */}
      <group position={[-2.2, 0, 0]}>
        <Part id="battery-case" cut explode={[0, 0, -0.6]}>
          <B a={[2.6, 1.7, 1.5]} p={[0, 0.85, 0]} m="plastic" c="#1f2937" />
          {cells.slice(1).map((i) => <B key={i} a={[0.04, 1.55, 1.44]} p={[-1.3 + i * (2.6 / 6), 0.82, 0]} m="plastic" c="#1f2937" />)}
          <B a={[2.66, 0.12, 1.56]} p={[0, 1.76, 0]} m="plastic" c="#111827" />
        </Part>
        <Part id="electrolyte" cut><B a={[2.5, 1.35, 1.4]} p={[0, 0.75, 0]} m="glass" c="#fde68a" o={0.18} /></Part>
        {cells.map((ci) => {
          const x0 = -1.3 + (ci + 0.5) * (2.6 / 6);
          return (
            <group key={ci} position={[x0, 0.72, 0]}>
              {[-0.15, -0.075, 0, 0.075, 0.15].map((dx, k) => (
                <Part key={k} id="plates" explode={[0, 0.9, 0]}>
                  <B a={[0.025, 1.15, 1.25]} p={[dx, 0, 0]} m={k % 2 ? 'darkSteel' : 'copper'} c={k % 2 ? '#6b7280' : '#7c2d12'} />
                </Part>
              ))}
              {[-0.112, -0.037, 0.037, 0.112].map((dx, k) => (
                <Part key={`s${k}`} id="separator" explode={[0, 0.5, 0]}><B a={[0.012, 1.2, 1.3]} p={[dx, 0, 0]} m="white" /></Part>
              ))}
            </group>
          );
        })}
        <Part id="positive-terminal" explode={[0, 0.4, 0]}>
          <C a={[0.11, 0.13, 0.25]} p={[0.95, 1.94, 0.35]} m="brass" />
          <T a={[0.16, 0.02]} p={[0.95, 1.83, 0.35]} r={[Math.PI / 2, 0, 0]} m="red" />
          <B a={[0.08, 0.06, 0.01]} p={[0.95, 1.83, 0.55]} m="red" />
        </Part>
        <Part id="negative-terminal" explode={[0, 0.4, 0]}>
          <C a={[0.1, 0.12, 0.25]} p={[-0.95, 1.94, 0.35]} m="steel" c="#9ca3af" />
          <B a={[0.1, 0.025, 0.01]} p={[-0.95, 1.83, 0.55]} m="black" />
        </Part>
      </group>

      {/* ===== SPARK PLUG (enlarged, cut lengthwise) ===== */}
      <group position={[1.2, 0.35, 0]}>
        <Part id="spark-plug" cut explode={[0, 0, -0.5]}>
          {/* threaded shell */}
          <C a={[0.24, 0.24, 0.85, 40]} p={[0, 0.55, 0]} m="steel" />
          {Array.from({ length: 9 }, (_, i) => <T key={i} a={[0.245, 0.018, 6, 40]} p={[0, 0.17 + i * 0.085, 0]} r={[Math.PI / 2, 0, 0]} m="steel" />)}
          <C a={[0.38, 0.38, 0.3, 6]} p={[0, 1.15, 0]} m="steel" />
          <C a={[0.06, 0.06, 0.15]} p={[0, 2.85, 0]} m="steel" />
          <C a={[0.1, 0.1, 0.12]} p={[0, 2.98, 0]} m="steel" />
        </Part>
        <Part id="ceramic-insulator" cut explode={[0, 0.3, 0.6]}>
          <C a={[0.1, 0.14, 0.75]} p={[0, 0.5, 0]} m="ceramic" />
          <C a={[0.22, 0.22, 1.5]} p={[0, 2.0, 0]} m="ceramic" />
          {[1.6, 1.8, 2.0, 2.2, 2.4].map((y) => <T key={y} a={[0.225, 0.025, 8, 40]} p={[0, y, 0]} r={[Math.PI / 2, 0, 0]} m="ceramic" />)}
        </Part>
        <Part id="center-electrode" explode={[0, 0, 0.9]}>
          <C a={[0.035, 0.035, 2.75]} p={[0, 1.42, 0]} m="copper" />
          <C a={[0.03, 0.03, 0.08]} p={[0, 0.01, 0]} m="chrome" />
        </Part>
        <Part id="ground-electrode" explode={[0, -0.3, 0]}>
          <B a={[0.07, 0.3, 0.09]} p={[0.2, -0.0, 0]} m="steel" />
          <B a={[0.27, 0.07, 0.09]} p={[0.08, -0.15, 0]} m="steel" />
        </Part>
        <Part id="spark-plug-gap">
          <C a={[0.05, 0.05, 0.09]} p={[0, -0.075, 0]} m="glass" c="#38bdf8" o={0.35} />
        </Part>
        <mesh ref={spark} position={[0, -0.075, 0]} raycast={() => {}}>
          <cylinderGeometry args={[0.035, 0.02, 0.1, 8]} /><meshBasicMaterial color="#e0f2fe" />
        </mesh>
      </group>

      {/* ===== IGNITION COIL (pencil coil, cut) ===== */}
      <group position={[2.6, 0.4, 0]}>
        <Part id="ignition-coil" cut explode={[0, 0, 0]}>
          <C a={[0.22, 0.22, 2.0, 32]} p={[0, 1.2, 0]} m="black" o={0.9} />
          <B a={[0.55, 0.4, 0.4]} p={[0, 2.35, 0]} m="black" />
          <C a={[0.06, 0.06, 1.8]} p={[0, 1.2, 0]} m="iron" />
          <Spring radius={0.11} wire={0.02} turns={18} height={1.6} p={[0, 0.4, 0]} m="copper" />
          <Spring radius={0.16} wire={0.012} turns={40} height={1.6} p={[0, 0.4, 0]} m="copper" c="#b45309" />
          <C a={[0.16, 0.16, 0.25]} p={[0, 0.05, 0]} m="rubber" />
        </Part>
      </group>

      {/* ===== ALTERNATOR ===== */}
      <group position={[4.1, 1.0, 0]}>
        <Part id="alternator" explode={[0, 0, 0]}>
          <C a={[0.7, 0.7, 1.1, 40]} r={[0, 0, Math.PI / 2]} m="alu" />
          {Array.from({ length: 12 }, (_, k) => <B key={k} a={[1.12, 0.05, 1.45]} r={[(k * Math.PI) / 12, 0, 0]} m="darkSteel" />)}
          <C a={[0.08, 0.08, 0.5]} r={[0, 0, Math.PI / 2]} p={[-0.75, 0, 0]} m="steel" />
          <group ref={pulley} position={[-0.95, 0, 0]}>
            <C a={[0.3, 0.3, 0.2, 32]} r={[0, 0, Math.PI / 2]} m="darkSteel" />
            <B a={[0.21, 0.25, 0.06]} p={[0, 0.12, 0]} m="yellow" />
          </group>
          <B a={[0.3, 0.2, 0.25]} p={[0.4, 0.75, 0]} m="black" />
        </Part>
      </group>
    </group>
  );
}
