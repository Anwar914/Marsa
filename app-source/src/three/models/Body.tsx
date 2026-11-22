import * as THREE from 'three';
import { useMemo } from 'react';
import { Part } from '../Part';
import { Mat, type MatKey } from '../materials';
import { Tube, C, B } from '../shapes';
import { FX, RX } from './Chassis';

/* ------------------------------------------------------------------
 * Procedural car body. The lower body is a superellipse "loft": every
 * cross-section (station x) is a rounded rectangle whose half-width
 * follows a superellipse plan view and whose top follows the side
 * profile. The greenhouse (cabin) is a second loft sitting on the
 * shoulder. Each triangle is classified into a vocabulary panel, so
 * the surface is smooth but every panel stays a separate clickable mesh.
 * ------------------------------------------------------------------ */

const L2 = 2.24, WMAX = 0.88, MPLAN = 6, Y0 = 0.2, NT = 6, NB = 8, AR = 0.385;
export const XG0 = -1.5, XG1 = 0.95; // greenhouse (cabin) start/end

function lut(points: [number, number][], n = 600) {
  const s = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y))).getSpacedPoints(n).sort((a, b) => a.x - b.x);
  return (x: number) => {
    if (x <= s[0].x) return s[0].y;
    if (x >= s[s.length - 1].x) return s[s.length - 1].y;
    let lo = 0, hi = s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m].x > x) hi = m; else lo = m; }
    const t = (x - s[lo].x) / (s[hi].x - s[lo].x || 1);
    return s[lo].y + (s[hi].y - s[lo].y) * t;
  };
}
export const W = (x: number) => { const r = Math.min(1, Math.abs(x) / L2); return WMAX * Math.pow(Math.max(0, 1 - Math.pow(r, MPLAN)), 1 / MPLAN); };
export const YT = lut([[-2.25, 0.84], [-2.15, 0.93], [-1.95, 0.97], [-1.5, 0.98], [-0.9, 0.955], [0.0, 0.94], [0.95, 0.925], [1.5, 0.88], [2.0, 0.81], [2.25, 0.73]]);
const yc = (x: number) => (Y0 + YT(x)) / 2, hh = (x: number) => (YT(x) - Y0) / 2;
const pw = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);

/** Point of the lower-body section at station x, angle th (0 = right side, π/2 = top). */
function lowerPt(x: number, th: number): [number, number, number] {
  const c = Math.cos(th), s = Math.sin(th);
  const n = s >= 0 ? NT : NB;
  return [x, yc(x) + hh(x) * pw(s, 2 / n), W(x) * pw(c, 2 / n)];
}
/** Half-width of the body side at height y (station x). */
export function sideZ(x: number, y: number) {
  const k = (y - yc(x)) / hh(x);
  const n = k >= 0 ? NT : NB;
  const s = Math.min(1, Math.pow(Math.abs(k), n / 2));
  return W(x) * Math.pow(Math.sqrt(1 - s * s), 2 / n);
}
/** Shoulder: greenhouse base at 85 % of the body width */
const F = 0.85;
export const WB = (x: number) => F * W(x);
export const YB = (x: number) => { const c = Math.pow(F, NT / 2); const s = Math.sqrt(1 - c * c); return yc(x) + hh(x) * Math.pow(s, 2 / NT) - 0.004; };
const YTOP = lut([[XG1, YB(XG1)], [0.72, 1.1], [0.47, 1.29], [0.25, 1.385], [0.0, 1.405], [-0.6, 1.4], [-0.86, 1.365], [-1.1, 1.21], [-1.32, 1.06], [XG0, YB(XG0)]]);
/** Surface x of the nose at height y and half-width z (bisection) */
export function noseX(y: number, z: number, rear = false) {
  let lo = rear ? -L2 : 1.4, hi = rear ? -1.4 : L2;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    const inside = YT(m) > y && sideZ(m, y) > z;
    if (rear) { if (inside) hi = m; else lo = m; } else { if (inside) lo = m; else hi = m; }
  }
  return (lo + hi) / 2;
}
function greenPt(x: number, u: number): [number, number, number] {
  const side = u <= 1 ? 1 : -1, uh = u <= 1 ? u : 2 - u;
  const yb = YB(x), wb = WB(x), yt = Math.max(yb, YTOP(x));
  const h = yt - yb;
  const wr = wb + (0.66 - wb) * Math.min(1, h / 0.35);
  const rr = Math.min(0.05, h * 0.3);
  if (uh < 0.5) { const s = uh / 0.5; return [x, yb + (yt - rr - yb) * s, side * (wb + (wr - wb) * s)]; }
  const a = ((uh - 0.5) / 0.5) * Math.PI / 2;
  return [x, yt - rr + rr * Math.pow(Math.sin(a), 2 / 2.6), side * wr * Math.pow(Math.cos(a), 2 / 2.6)];
}

// ---------------- panel table ----------------
interface PanelDef { id: string; mat: MatKey; explode: (s: number) => [number, number, number]; passive?: boolean; shell?: boolean }
const PANELS: Record<string, PanelDef> = {
  hood: { id: 'hood', mat: 'carPaint', explode: () => [0.25, 0.45, 0] },
  trunk: { id: 'trunk', mat: 'carPaint', explode: () => [-0.25, 0.4, 0] },
  fbumper: { id: 'front-bumper', mat: 'carPaint', explode: () => [0.45, 0, 0] },
  rbumper: { id: 'rear-bumper', mat: 'carPaint', explode: () => [-0.45, 0, 0] },
  grille: { id: 'grille', mat: 'trim', explode: () => [0.4, 0.1, 0], shell: false },
  head: { id: 'headlight', mat: 'headGlass', explode: (s) => [0.3, 0, s * 0.1], shell: false },
  turn: { id: 'turn-signal', mat: 'amberGlass', explode: (s) => [0.3, 0, s * 0.2], shell: false },
  rturn: { id: 'turn-signal', mat: 'amberGlass', explode: (s) => [-0.3, 0, s * 0.2], shell: false },
  tail: { id: 'taillight', mat: 'tailGlass', explode: (s) => [-0.3, 0, s * 0.1], shell: false },
  fender: { id: 'front-fender', mat: 'carPaint', explode: (s) => [0.1, 0, s * 0.3] },
  fdoor: { id: 'door', mat: 'carPaint', explode: (s) => [0, 0, s * 0.45] },
  rdoor: { id: 'door', mat: 'carPaint', explode: (s) => [0, 0, s * 0.45] },
  quarter: { id: 'rear-quarter-panel', mat: 'carPaint', explode: (s) => [-0.1, 0, s * 0.3] },
  under: { id: 'body-structure', mat: 'darkSteel', explode: () => [0, -0.1, 0], passive: true },
  roof: { id: 'roof', mat: 'carPaint', explode: () => [0, 0.4, 0] },
  sunroof: { id: 'sunroof', mat: 'tintGlass', explode: () => [0, 0.6, 0] },
  windshield: { id: 'windshield', mat: 'tintGlass', explode: () => [0.25, 0.25, 0] },
  rearglass: { id: 'window', mat: 'tintGlass', explode: () => [-0.25, 0.25, 0] },
  fwin: { id: 'window', mat: 'tintGlass', explode: (s) => [0, 0.1, s * 0.5] },
  rwin: { id: 'window', mat: 'tintGlass', explode: (s) => [0, 0.1, s * 0.5] },
  apillar: { id: 'a-pillar', mat: 'carPaint', explode: (s) => [0.1, 0.2, s * 0.2] },
  bpillar: { id: 'b-pillar', mat: 'trim', explode: (s) => [0, 0.2, s * 0.25] },
  cpillar: { id: 'c-pillar', mat: 'carPaint', explode: (s) => [-0.1, 0.2, s * 0.2] },
};

function inArch(x: number, y: number, az: number) {
  return az > 0.45 && ((x - FX) ** 2 + (y - 0.32) ** 2 < AR * AR || (x - RX) ** 2 + (y - 0.32) ** 2 < AR * AR);
}
function classifyLower(x: number, y: number, z: number, n: THREE.Vector3): string | null {
  const s = z >= 0 ? 'R' : 'L', az = Math.abs(z), anx = Math.abs(n.x), any = Math.abs(n.y);
  if (inArch(x, y, az)) return null;
  if (y < Y0 + 0.04 && any > 0.5) return 'under';
  if (any > 0.72 && y > 0.6) {
    if (x > XG1) return 'hood';
    if (x < XG0) return 'trunk';
    if (az < WB(x) - 0.03) return null; // under the cabin: open so the interior is visible
  }
  if (x > 1.7 && anx > 0.4 && any < 0.72) { // nose
    return 'fbumper';
  }
  if (x < -1.7 && anx > 0.4 && any < 0.72) { // tail
    if (y < 0.64) return 'rbumper';
    return 'trunk';
  }
  if (any > 0.72 && y > 0.6) { // shoulder strip beside the cabin belongs to the side panel below it
    if (x > 0.95) return 'hood';
  }
  if (x > 1.72 && y < 0.6) return 'fbumper';
  if (x < -1.72 && y < 0.64) return 'rbumper';
  if (x > 1.98) return 'fbumper';
  if (x < -1.98) return 'rbumper';
  if (x > 0.95) return `fender|${s}`;
  if (x > -0.1) return `fdoor|${s}`;
  if (x > -0.92) return `rdoor|${s}`;
  return `quarter|${s}`;
}
function classifyGreen(x: number, uh: number, z: number): string {
  const s = z >= 0 ? 'R' : 'L', az = Math.abs(z);
  if (uh < 0.44) {
    if (x > -0.16 && x < -0.04) return `bpillar|${s}`;
    if (x < -0.98) return `cpillar|${s}`;
    if (x > 0.86) return `apillar|${s}`;
    return x > -0.1 ? `fwin|${s}` : `rwin|${s}`;
  }
  if (uh < 0.6) return x > 0.2 ? `apillar|${s}` : x < -0.82 ? `cpillar|${s}` : 'roof';
  if (x > 0.22) return 'windshield';
  if (x < -0.86) return 'rearglass';
  if (x > -0.45 && x < 0.05 && az < 0.32) return 'sunroof';
  return 'roof';
}

function buildGrid(nx: number, nv: number, xs: (i: number) => number, pt: (x: number, j: number) => [number, number, number]) {
  const pos = new Float32Array(nx * nv * 3);
  for (let i = 0; i < nx; i++) { const x = xs(i); for (let j = 0; j < nv; j++) pos.set(pt(x, j), (i * nv + j) * 3); }
  const idx: number[] = [];
  for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nv - 1; j++) {
    const a = i * nv + j, b = a + 1, c = a + nv, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function split(g: THREE.BufferGeometry, classify: (x: number, y: number, z: number, n: THREE.Vector3, tri: number[]) => string | null) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const idx = g.getIndex()!.array;
  const out = new Map<string, number[]>();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const d = new THREE.Vector3(), n2 = new THREE.Vector3();
  // indices come in quads (2 triangles = 6 indices): classify the whole quad so panel edges follow the grid lines
  for (let t = 0; t < idx.length; t += 6) {
    a.fromBufferAttribute(pos, idx[t]); c.fromBufferAttribute(pos, idx[t + 1]); b.fromBufferAttribute(pos, idx[t + 2]); d.fromBufferAttribute(pos, idx[t + 5]);
    n.crossVectors(c.clone().sub(a), b.clone().sub(a));
    n2.crossVectors(c.clone().sub(b), d.clone().sub(b));
    n.add(n2);
    if (n.lengthSq() < 1e-14) continue;
    n.normalize();
    const k = classify((a.x + b.x + c.x + d.x) / 4, (a.y + b.y + c.y + d.y) / 4, (a.z + b.z + c.z + d.z) / 4, n, [idx[t], idx[t + 1], idx[t + 2]]);
    if (!k) continue;
    if (!out.has(k)) out.set(k, []);
    const l = out.get(k)!;
    for (let q = 0; q < 6; q++) l.push(idx[t + q]);
  }
  const geos: [string, THREE.BufferGeometry][] = [];
  out.forEach((list, k) => {
    const sub = new THREE.BufferGeometry();
    sub.setAttribute('position', pos);
    sub.setAttribute('normal', g.getAttribute('normal'));
    sub.setIndex(list);
    geos.push([k, sub]);
  });
  return geos;
}

function useBody() {
  return useMemo(() => {
    // lower body: denser stations at the nose and tail
    const NX = 200, NV = 120;
    const xs = (i: number) => -L2 * Math.cos((i / (NX - 1)) * Math.PI);
    const lower = buildGrid(NX, NV, (i) => -xs(i), (x, j) => lowerPt(x, -Math.PI / 2 + (j / (NV - 1)) * Math.PI * 2));
    const gx = 120, gu = 97;
    const green = buildGrid(gx, gu, (i) => XG0 + ((XG1 - XG0) * i) / (gx - 1), (x, j) => greenPt(x, (j / (gu - 1)) * 2));
    const gpos = green.getAttribute('position') as THREE.BufferAttribute;
    return [
      ...split(lower, (x, y, z, n) => classifyLower(x, y, z, n)),
      ...split(green, (x, y, z, n, tri) => {
        const j = tri[0] % gu; const u = (j + 0.5) / (gu - 1) * 2; const uh = u <= 1 ? u : 2 - u;
        void gpos;
        return classifyGreen(x, uh, z);
      }),
    ];
  }, []);
}

/* ---------- overlay lenses that follow the body contour ---------- */
type V = THREE.Vector3;
/** Dense contour of the body at height y from the side (x = xs) around the nose to |z| = zEnd */
function cornerContour(y: number, xs: number, zEnd: number, side: number, rear: boolean): V[] {
  const xe = noseX(y, zEnd, rear);
  const pts: V[] = [];
  for (let i = 0; i <= 300; i++) {
    const x = xs + (xe - xs) * (i / 300);
    pts.push(new THREE.Vector3(x, y, side * Math.max(zEnd, sideZ(x, y))));
  }
  return pts;
}
function noseContour(y: number, zHalf: number, rear: boolean): V[] {
  const pts: V[] = [];
  for (let i = 0; i <= 60; i++) { const z = -zHalf + (2 * zHalf * i) / 60; pts.push(new THREE.Vector3(noseX(y, Math.abs(z), rear), y, z)); }
  return pts;
}
function resample(pts: V[], n: number): V[] {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const out: V[] = []; let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (d[d.length - 1] * k) / (n - 1);
    while (j < d.length - 2 && d[j + 1] < t) j++;
    const f = (t - d[j]) / (d[j + 1] - d[j] || 1);
    out.push(pts[j].clone().lerp(pts[j + 1], f));
  }
  return out;
}
function patch(y0: number, y1: number, contour: (y: number) => V[], offset = 0.004, rows = 10, cols = 48) {
  const grid: V[][] = [];
  for (let r = 0; r < rows; r++) grid.push(resample(contour(y0 + ((y1 - y0) * r) / (rows - 1)), cols));
  const pos = new Float32Array(rows * cols * 3);
  grid.forEach((row, r) => row.forEach((p, c) => pos.set([p.x, p.y, p.z], (r * cols + c) * 3)));
  const idx: number[] = [];
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { const a = r * cols + c; idx.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // push outward along the normal (oriented away from the car centre)
  const nrm = g.getAttribute('normal') as THREE.BufferAttribute; const p = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < nrm.count; i++) {
    p.fromBufferAttribute(g.getAttribute('position') as THREE.BufferAttribute, i); n.fromBufferAttribute(nrm, i);
    if (n.x * p.x + n.z * p.z < 0) n.negate();
    pos.set([p.x + n.x * offset, p.y + n.y * offset, p.z + n.z * offset], i * 3);
  }
  g.computeVertexNormals();
  return g;
}
function Lenses() {
  const g = useMemo(() => {
    const out: { id: string; mat: MatKey; side: number; geo: THREE.BufferGeometry; ex: [number, number, number] }[] = [];
    for (const s of [1, -1]) {
      out.push({ id: 'headlight', mat: 'headGlass', side: s, ex: [0.3, 0, s * 0.1], geo: patch(0.64, 0.775, (y) => cornerContour(y, 1.93, 0.37, s, false), 0.016) });
      out.push({ id: 'turn-signal', mat: 'amberGlass', side: s, ex: [0.3, 0, s * 0.2], geo: patch(0.6, 0.632, (y) => cornerContour(y, 1.9, 0.5, s, false), 0.004, 4) });
      out.push({ id: 'taillight', mat: 'tailGlass', side: s, ex: [-0.3, 0, s * 0.1], geo: patch(0.745, 0.875, (y) => cornerContour(y, -1.9, 0.42, s, true), 0.004) });
      out.push({ id: 'turn-signal', mat: 'amberGlass', side: s, ex: [-0.3, 0, s * 0.2], geo: patch(0.705, 0.738, (y) => cornerContour(y, -1.9, 0.42, s, true), 0.004, 4) });
    }
    out.push({ id: 'grille', mat: 'trim', side: 1, ex: [0.4, 0.1, 0], geo: patch(0.47, 0.6, (y) => noseContour(y, 0.32, false), 0.006, 8, 40) });
    return out;
  }, []);
  // dark housings behind the clear headlight lenses
  const housing = useMemo(() => [1, -1].map((s) => patch(0.645, 0.77, (y) => cornerContour(y, 1.94, 0.38, s, false), 0.003)), []);
  return (
    <>
      {g.map((l, i) => (
        <Part key={i} id={l.id} explode={l.ex}>
          <mesh geometry={l.geo}><Mat k={l.mat} /></mesh>
          {l.id === 'headlight' && <mesh geometry={housing[l.side === 1 ? 0 : 1]}><Mat k="chrome" /></mesh>}
          {l.id === 'headlight' && [0.46, 0.6].map((z) => <C key={z} a={[0.032, 0.028, 0.03]} r={[0, 0, Math.PI / 2]} p={[noseX(0.708, z) - 0.006, 0.708, l.side * z]} m="black" />)}
          {l.id === 'grille' && [-0.24, -0.16, -0.08, 0, 0.08, 0.16, 0.24].map((z) => <B key={z} a={[0.02, 0.12, 0.012]} p={[noseX(0.535, Math.abs(z)) + 0.004, 0.535, z]} m="chrome" />)}
        </Part>
      ))}
    </>
  );
}

/** Panel gaps (shut lines) and window seals as thin dark tubes on the surface */
function ShutLines() {
  const lines = useMemo(() => {
    const L: [number, number, number][][] = [];
    for (const s of [1, -1]) {
      for (const x of [0.95, -0.1, -0.92]) {
        const pts: [number, number, number][] = [];
        for (let y = 0.27; y <= YB(x) + 0.001; y += 0.03) if (!inArch(x, y, 1)) pts.push([x, y, s * (sideZ(x, y) + 0.002)]);
        if (pts.length > 2) L.push(pts);
      }
      const seal: [number, number, number][] = [];
      for (let x = XG0 + 0.06; x <= XG1 - 0.04; x += 0.08) seal.push([x, YB(x) + 0.004, s * (WB(x) + 0.004)]);
      L.push(seal);
    }
    for (const x of [XG1 + 0.005, XG0 - 0.005]) {
      const pts: [number, number, number][] = [];
      for (let z = -0.9 * W(x); z <= 0.9 * W(x) + 1e-6; z += W(x) * 0.1) {
        const c = Math.pow(Math.abs(z) / W(x), NT / 2), sn = Math.sqrt(1 - c * c);
        pts.push([x, yc(x) + hh(x) * Math.pow(sn, 2 / NT) + 0.002, z]);
      }
      L.push(pts);
    }
    return L;
  }, []);
  return <>{lines.map((pts, i) => <Tube key={i} pts={pts} radius={0.0045} m="trim" seg={48} />)}</>;
}

export function Body() {
  const geos = useBody();
  const byPart = useMemo(() => {
    const m = new Map<string, { def: PanelDef; side: number; geos: THREE.BufferGeometry[] }>();
    for (const [k, g] of geos) {
      const [key, sd] = k.split('|');
      const side = sd === 'L' ? -1 : 1;
      const mk = `${key}|${sd ?? ''}`;
      if (!m.has(mk)) m.set(mk, { def: PANELS[key], side, geos: [] });
      m.get(mk)!.geos.push(g);
    }
    return [...m.entries()];
  }, [geos]);

  return (
    <group>
      {byPart.map(([k, { def, side, geos }]) => (
        <Part key={k} id={def.id} shell={def.shell !== false && !def.passive} passive={def.passive} explode={def.explode(side)}>
          {geos.map((g, i) => <mesh key={i} geometry={g}><Mat k={def.mat} /></mesh>)}
        </Part>
      ))}
      <Lenses />
      <ShutLines />
      {/* wheel-arch liners hide the inside of the arches */}
      {[FX, RX].flatMap((x) => [1, -1].map((s) => (
        <mesh key={`${x}${s}`} position={[x, 0.32, s * 0.76]} rotation={[Math.PI / 2, 0, 0]} raycast={() => {}}>
          <cylinderGeometry args={[AR + 0.003, AR + 0.003, 0.26, 40, 1, true, Math.PI * 0.47, Math.PI * 1.06]} />
          <meshStandardMaterial color="#0a0b0d" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      )))}
    </group>
  );
}
