import * as THREE from 'three';
import { forwardRef, useMemo } from 'react';
import { Mat, type MatKey } from './materials';

type V3 = [number, number, number];
interface Common { p?: V3; r?: V3; m?: MatKey; c?: string; o?: number; s?: V3 | number }

/** Box */
export const B = forwardRef<THREE.Mesh, Common & { a: V3 }>(({ a, p, r, m, c, o, s }, ref) => (
  <mesh ref={ref} position={p} rotation={r} scale={s}><boxGeometry args={a} /><Mat k={m} c={c} o={o} /></mesh>
));
/** Cylinder: a = [radiusTop, radiusBottom, height, segments?] (axis = Y) */
export const C = forwardRef<THREE.Mesh, Common & { a: [number, number, number, number?]; open?: boolean }>(({ a, p, r, m, c, o, s, open }, ref) => (
  <mesh ref={ref} position={p} rotation={r} scale={s}><cylinderGeometry args={[a[0], a[1], a[2], a[3] ?? 32, 1, open]} /><Mat k={m} c={c} o={o} /></mesh>
));
/** Torus: a = [radius, tube, radialSeg?, tubularSeg?, arc?] (in XY plane) */
export const T = forwardRef<THREE.Mesh, Common & { a: [number, number, number?, number?, number?] }>(({ a, p, r, m, c, o, s }, ref) => (
  <mesh ref={ref} position={p} rotation={r} scale={s}><torusGeometry args={[a[0], a[1], a[2] ?? 16, a[3] ?? 48, a[4] ?? Math.PI * 2]} /><Mat k={m} c={c} o={o} /></mesh>
));
/** Sphere */
export const Sp = forwardRef<THREE.Mesh, Common & { a: number }>(({ a, p, r, m, c, o, s }, ref) => (
  <mesh ref={ref} position={p} rotation={r} scale={s}><sphereGeometry args={[a, 24, 16]} /><Mat k={m} c={c} o={o} /></mesh>
));

/** Tube along a smooth path */
export function Tube({ pts, radius = 0.02, m, c, o, closed = false, seg = 64 }: { pts: V3[]; radius?: number; closed?: boolean; seg?: number } & Common) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((v) => new THREE.Vector3(...v)), closed, 'catmullrom', 0.3);
    return new THREE.TubeGeometry(curve, seg, radius, 10, closed);
  }, [JSON.stringify(pts), radius, closed, seg]);
  return <mesh geometry={geo}><Mat k={m} c={c} o={o} /></mesh>;
}

/** Extruded side-profile: shape in XY, extruded along Z by depth (centered) */
export function Extrude({ shape, depth, p, r, m, c, o, bevel = 0.01 }: { shape: [number, number][]; depth: number; bevel?: number } & Common) {
  const geo = useMemo(() => {
    const s = new THREE.Shape(shape.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 16 });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [JSON.stringify(shape), depth, bevel]);
  return <mesh geometry={geo} position={p} rotation={r}><Mat k={m} c={c} o={o} /></mesh>;
}

/** Lathe (revolve a profile around Y). pts = [radius, y] */
export function Lathe({ pts, p, r, m, c, o, seg = 48, phiStart = 0, phiLength = Math.PI * 2 }: { pts: [number, number][]; seg?: number; phiStart?: number; phiLength?: number } & Common) {
  const geo = useMemo(() => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg, phiStart, phiLength), [JSON.stringify(pts), seg, phiStart, phiLength]);
  return <mesh geometry={geo} position={p} rotation={r}><Mat k={m} c={c} o={o} /></mesh>;
}

/** Helical spring along Y, from y=0 to y=height. Scale.y to compress. */
export function Spring({ radius, wire, turns, height, m = 'steel', c, p, r }: { radius: number; wire: number; turns: number; height: number } & Common) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n = Math.ceil(turns * 24);
    for (let i = 0; i <= n; i++) {
      const t = i / n; const a = t * turns * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, t * height, Math.sin(a) * radius));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, wire, 8, false);
  }, [radius, wire, turns, height]);
  return <mesh geometry={geo} position={p} rotation={r}><Mat k={m} c={c} /></mesh>;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
/** Position a unit-height Y cylinder/box between two points (world of parent). */
export function placeBetween(o: THREE.Object3D, a: THREE.Vector3 | V3, b: THREE.Vector3 | V3) {
  _a.set(...(Array.isArray(a) ? a : (a.toArray() as V3)));
  _b.set(...(Array.isArray(b) ? b : (b.toArray() as V3)));
  o.position.copy(_a).add(_b).multiplyScalar(0.5);
  const d = _b.sub(_a); const len = d.length();
  o.quaternion.setFromUnitVectors(_up, d.normalize());
  o.scale.set(1, len, 1);
}

/** Static rod between two points */
export function Rod({ a, b, r = 0.02, m = 'steel', c, o }: { a: V3; b: V3; r?: number } & Omit<Common, 'r'>) {
  const ref = (mesh: THREE.Mesh | null) => { if (mesh) placeBetween(mesh, a, b); };
  return <mesh ref={ref}><cylinderGeometry args={[r, r, 1, 16]} /><Mat k={m} c={c} o={o} /></mesh>;
}
