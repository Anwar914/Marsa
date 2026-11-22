import * as THREE from 'three';
import { useMemo } from 'react';
import { Part } from '../Part';
import { Mat, type MatKey } from '../materials';
import { C, B } from '../shapes';

type P2 = [number, number];
const PHI0 = 1.22 * Math.PI, PHIL = 1.56 * Math.PI; // removed wedge faces the viewer

/** Solid ring section: lathe of a closed (r, y) profile over a partial revolution, with flat caps at both cut faces. */
function Layer({ pts, m, c }: { pts: P2[]; m: MatKey; c?: string }) {
  const { lathe, cap } = useMemo(() => {
    const closed = [...pts, pts[0]].map(([r, y]) => new THREE.Vector2(r, y));
    const lathe = new THREE.LatheGeometry(closed, 96, PHI0, PHIL);
    lathe.computeVertexNormals();
    const cap = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([r, y]) => new THREE.Vector2(r, y))));
    return { lathe, cap };
  }, [pts]);
  return (
    <group>
      <mesh geometry={lathe}><meshStandardMaterial {...matProps(m, c)} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={cap} rotation={[0, PHI0 - Math.PI / 2, 0]}><meshStandardMaterial {...matProps(m, c)} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={cap} rotation={[0, PHI0 + PHIL - Math.PI / 2, 0]}><meshStandardMaterial {...matProps(m, c)} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}
import { MATS } from '../materials';
function matProps(k: MatKey, c?: string) { const m = MATS[k] as any; return { color: c ?? m.color, metalness: m.metalness ?? 0.2, roughness: m.roughness ?? 0.6 }; }
const mirror = (pts: P2[]): P2[] => pts.map(([r, y]) => [r, -y] as P2).reverse();

const TREAD_BASE: P2[] = [[0.9, -0.28], [0.95, -0.3], [0.975, -0.29], [0.975, 0.29], [0.95, 0.3], [0.9, 0.28]];
const BELT1: P2[] = [[0.885, -0.26], [0.9, -0.26], [0.9, 0.26], [0.885, 0.26]];
const BELT2: P2[] = [[0.871, -0.24], [0.884, -0.24], [0.884, 0.24], [0.871, 0.24]];
const CARCASS: P2[] = [[0.69, -0.24], [0.72, -0.31], [0.8, -0.325], [0.86, -0.29], [0.87, -0.2], [0.87, 0.2], [0.86, 0.29], [0.8, 0.325], [0.72, 0.31], [0.69, 0.24],
  [0.705, 0.235], [0.73, 0.295], [0.8, 0.31], [0.848, 0.28], [0.855, 0.2], [0.855, -0.2], [0.848, -0.28], [0.8, -0.31], [0.73, -0.295], [0.705, -0.235]];
const LINER: P2[] = [[0.72, -0.23], [0.74, -0.285], [0.8, -0.298], [0.838, -0.272], [0.843, -0.2], [0.843, 0.2], [0.838, 0.272], [0.8, 0.298], [0.74, 0.285], [0.72, 0.23],
  [0.732, 0.228], [0.75, 0.275], [0.8, 0.286], [0.828, 0.265], [0.832, 0.2], [0.832, -0.2], [0.828, -0.265], [0.8, -0.286], [0.75, -0.275], [0.732, -0.228]];
const SIDEWALL: P2[] = [[0.672, -0.29], [0.7, -0.335], [0.8, -0.348], [0.89, -0.322], [0.93, -0.29], [0.9, -0.28], [0.86, -0.29], [0.8, -0.325], [0.72, -0.31], [0.69, -0.24], [0.68, -0.25]];
const BEAD: P2[] = [[0.662, -0.255], [0.69, -0.255], [0.69, -0.285], [0.662, -0.285]];
const APEX: P2[] = [[0.69, -0.255], [0.695, -0.288], [0.78, -0.31]];
const RIM: P2[] = [[0.7, -0.34], [0.7, -0.32], [0.663, -0.31], [0.66, -0.24], [0.6, -0.18], [0.6, 0.18], [0.66, 0.24], [0.663, 0.31], [0.7, 0.32], [0.7, 0.34],
  [0.685, 0.345], [0.65, 0.33], [0.645, 0.25], [0.585, 0.19], [0.585, -0.19], [0.645, -0.25], [0.65, -0.33], [0.685, -0.345]];

/** Radial tyre cutaway on a steel rim. Axis = Z. Unit: tyre outer radius = 1. Layer thicknesses exaggerated for clarity. */
export function Tire() {
  const blocks = useMemo(() => {
    const out: { a: number; y: number; w: number }[] = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      const a = PHI0 + (PHIL * (i + 0.5)) / n;
      for (const [y, w] of [[-0.225, 0.09], [-0.09, 0.1], [0.09, 0.1], [0.225, 0.09]] as const) out.push({ a, y: y + (i % 2 ? 0.01 : -0.01), w });
    }
    return out;
  }, []);
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Part id="tread" explode={[0, 0, 0]}><group scale={[1, 1, 1]}><Layer pts={TREAD_BASE} m="rubber" /></group></Part>
      <Part id="tread-pattern" explode={[0, 0, 0]}>
        {blocks.map((b, i) => (
          <group key={i} rotation={[0, b.a, 0]}>
            <B a={[0.055, b.w, 0.03]} p={[0, b.y, 0.988]} m="rubber" c="#2a2e33" />
          </group>
        ))}
      </Part>
      <Part id="belt" explode={[0, 0, 0]}><Layer pts={BELT1} m="belt" /><Layer pts={BELT2} m="belt" c="#9ca3af" /></Part>
      <Part id="radial-cords" explode={[0, 0, 0]}><Layer pts={CARCASS} m="cord" /></Part>
      <Part id="inner-liner" explode={[0, 0, 0]}><Layer pts={LINER} m="plastic" c="#52525b" /></Part>
      <Part id="sidewall"><Layer pts={SIDEWALL} m="rubber" c="#26292d" /><Layer pts={mirror(SIDEWALL)} m="rubber" c="#26292d" /></Part>
      <Part id="bead-wire"><Layer pts={BEAD} m="copper" /><Layer pts={mirror(BEAD)} m="copper" /></Part>
      <Part id="bead-apex"><Layer pts={APEX} m="yellow" c="#a16207" /><Layer pts={mirror(APEX)} m="yellow" c="#a16207" /></Part>
      <Part id="rim">
        <Layer pts={RIM} m="steel" />
        <C a={[0.59, 0.59, 0.03, 64]} m="steel" />
        <C a={[0.15, 0.15, 0.12, 32]} p={[0, 0.06, 0]} m="steel" />
      </Part>
    </group>
  );
}
