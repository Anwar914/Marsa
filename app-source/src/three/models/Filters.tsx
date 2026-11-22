import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Part } from '../Part';
import { B, C, T, Tube, Lathe } from '../shapes';
import { clock } from '../registry';

const PATH: [number, number, number][] = [[-3.4, 0.6, 0], [-2.6, 0.6, 0], [-2.0, 0.8, 0], [-1.2, 0.95, 0], [-0.2, 1.0, 0], [0.6, 1.0, 0], [1.2, 1.2, 0], [1.9, 1.3, 0], [2.6, 1.3, 0], [3.2, 1.3, 0]];

/** Air path: intake → filter housing (element, gasket, cover) → throttle body → intake manifold; plus oil filter cutaway and foam filter. Unit ≈ 10 cm. */
export function Filters() {
  const butterfly = useRef<THREE.Mesh>(null!);
  const dots = useRef<THREE.Mesh[]>([]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p))), []);
  useFrame(() => {
    const open = 0.5 + 0.5 * Math.sin(clock.t * 0.8);
    butterfly.current.rotation.x = Math.PI / 2 - open * 1.3;
    dots.current.forEach((d, i) => {
      const u = (clock.t * (0.05 + open * 0.12) + i / dots.current.length) % 1;
      d.position.copy(curve.getPoint(u));
      d.scale.setScalar(0.6 + open * 0.6);
      (d.material as THREE.MeshBasicMaterial).color.set(u < 0.35 ? '#a16207' : '#38bdf8'); // dusty before the element, clean after
    });
  });
  const pleats = useMemo(() => Array.from({ length: 26 }, (_, i) => i), []);
  return (
    <group>
      <Part id="air-intake" explode={[-0.4, 0, 0]}>
        <Tube radius={0.22} m="plastic" pts={[[-3.4, 0.6, 0], [-2.8, 0.6, 0], [-2.2, 0.7, 0], [-1.85, 0.85, 0]]} />
        <C a={[0.3, 0.22, 0.2]} r={[0, 0, Math.PI / 2]} p={[-3.45, 0.6, 0]} m="plastic" />
      </Part>
      {/* Filter housing (airbox) — lower shell, cut open */}
      <group position={[-0.9, 0, 0]}>
        <Part id="filter-housing" group="air-filter" cut explode={[0, -0.4, 0]}>
          <B a={[1.9, 0.9, 1.4]} p={[0, 0.55, 0]} m="plastic" o={0.95} />
        </Part>
        <Part id="filter-element" group="air-filter" explode={[0, 0.9, 0]}>
          <B a={[1.7, 0.06, 1.25]} p={[0, 1.02, 0]} m="rubber" c="#ea580c" />
          {pleats.map((i) => (
            <B key={i} a={[0.012, 0.26, 1.2]} p={[-0.8 + i * 0.064, 1.15, 0]} r={[0, 0, i % 2 ? 0.22 : -0.22]} m="paper" />
          ))}
        </Part>
        <Part id="gasket" group="air-filter" explode={[0, 1.5, 0]}>
          <T a={[0.8, 0.025, 6, 4]} p={[0, 1.31, 0]} r={[Math.PI / 2, 0, Math.PI / 4]} s={[1.18, 0.86, 1]} m="rubber" />
        </Part>
        <Part id="cover" group="air-filter" explode={[0, 2.0, 0]} seeThrough>
          <B a={[1.9, 0.45, 1.4]} p={[0, 1.55, 0]} m="plastic" o={0.35} />
          {[-0.8, 0.8].map((x) => <B key={x} a={[0.08, 0.3, 0.12]} p={[x, 1.25, 0.72]} m="steel" />)}
        </Part>
      </group>
      <Tube radius={0.2} m="rubber" pts={[[0.05, 1.35, 0], [0.6, 1.25, 0], [1.2, 1.3, 0], [1.7, 1.3, 0]]} />
      <Part id="throttle-body" explode={[0, 0.5, 0]}>
        <group position={[1.95, 1.3, 0]}>
          <C a={[0.24, 0.24, 0.5, 32]} r={[0, 0, Math.PI / 2]} m="alu" open />
          <T a={[0.27, 0.04]} r={[0, Math.PI / 2, 0]} p={[0.25, 0, 0]} m="alu" />
          <T a={[0.27, 0.04]} r={[0, Math.PI / 2, 0]} p={[-0.25, 0, 0]} m="alu" />
          <mesh ref={butterfly}><cylinderGeometry args={[0.23, 0.23, 0.015, 32]} /><meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.3} /></mesh>
          <B a={[0.3, 0.35, 0.25]} p={[0, 0, -0.35]} m="black" />
        </group>
      </Part>
      <Part id="intake-manifold" explode={[0.4, 0, 0]}>
        <C a={[0.3, 0.3, 0.8, 32]} r={[0, 0, Math.PI / 2]} p={[2.6, 1.3, 0]} m="plastic" />
        {[-0.45, -0.15, 0.15, 0.45].map((z) => <Tube key={z} radius={0.1} m="plastic" pts={[[2.6, 1.1, z * 0.4], [2.8, 0.6, z], [3.1, 0.3, z]]} />)}
      </Part>
      <Part id="vacuum-hose" explode={[0, 0.4, 0.3]}>
        <Tube radius={0.04} m="rubber" pts={[[2.7, 1.6, 0], [2.6, 2.1, 0.2], [1.8, 2.2, 0.5], [1.0, 2.0, 0.8]]} />
        <C a={[0.22, 0.22, 0.4]} r={[Math.PI / 2, 0, 0]} p={[0.9, 2.0, 1.0]} m="darkSteel" />
      </Part>
      {/* flow particles (visual aid) */}
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={i} ref={(m) => { if (m) { dots.current[i] = m; m.raycast = () => {}; } }}>
          <sphereGeometry args={[0.035, 8, 6]} /><meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}

      {/* ===== OIL FILTER cutaway ===== */}
      <group position={[-1.3, 0, 2.6]}>
        <Part id="oil-filter" cut explode={[0, 0.6, 0]}>
          <Lathe pts={[[0, 1.45], [0.45, 1.45], [0.55, 1.4], [0.55, 0.12], [0.5, 0.06]]} m="plastic" c="#1d4ed8" seg={48} />
          <C a={[0.52, 0.52, 0.06, 40]} p={[0, 0.06, 0]} m="steel" />
          <C a={[0.12, 0.12, 0.1]} p={[0, 0.02, 0]} m="steel" />
        </Part>
        <Part id="filter-element" explode={[0, 1.6, 0]}>
          <C a={[0.42, 0.42, 1.1, 40]} p={[0, 0.72, 0]} m="paper" />
          <C a={[0.18, 0.18, 1.12, 24]} p={[0, 0.72, 0]} m="steel" open />
          <C a={[0.44, 0.44, 0.04, 40]} p={[0, 1.29, 0]} m="steel" />
          <C a={[0.44, 0.44, 0.04, 40]} p={[0, 0.16, 0]} m="steel" />
        </Part>
        <Part id="gasket" explode={[0, -0.5, 0]}><T a={[0.42, 0.04, 8, 48]} r={[Math.PI / 2, 0, 0]} p={[0, 0.0, 0]} m="rubber" /></Part>
      </group>

      {/* ===== FOAM FILTER ===== */}
      <Part id="foam-filter" explode={[0, 0.6, 0]}>
        <group position={[1.2, 0.45, 2.6]}>
          <C a={[0.5, 0.5, 0.9, 32]} m="foam" />
          <C a={[0.3, 0.3, 0.92, 32]} m="foam" c="#c2410c" />
        </group>
      </Part>
    </group>
  );
}
