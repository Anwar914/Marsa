import * as THREE from 'three';

type MP = { color: string; metalness?: number; roughness?: number; opacity?: number; transparent?: boolean; emissive?: string; emissiveIntensity?: number; side?: THREE.Side };
export const MATS = {
  paint: { color: '#2563eb', metalness: 0.5, roughness: 0.32 },
  carPaint: { color: '#1d4f91', metalness: 0.6, roughness: 0.28, side: THREE.DoubleSide },
  trim: { color: '#0b0d10', metalness: 0.1, roughness: 0.5, side: THREE.DoubleSide },
  tintGlass: { color: '#1e293b', metalness: 0.3, roughness: 0.02, opacity: 0.42, transparent: true, side: THREE.DoubleSide },
  headGlass: { color: '#e0f2fe', metalness: 0.2, roughness: 0.02, opacity: 0.35, transparent: true, side: THREE.DoubleSide },
  tailGlass: { color: '#b91c1c', metalness: 0.2, roughness: 0.1, opacity: 0.85, transparent: true, emissive: '#7f1d1d', emissiveIntensity: 0.6, side: THREE.DoubleSide },
  amberGlass: { color: '#f59e0b', metalness: 0.2, roughness: 0.1, opacity: 0.85, transparent: true, emissive: '#92400e', emissiveIntensity: 0.5, side: THREE.DoubleSide },
  paintDark: { color: '#1e3a8a', metalness: 0.5, roughness: 0.35 },
  steel: { color: '#a8b0b8', metalness: 0.85, roughness: 0.35 },
  darkSteel: { color: '#4b5563', metalness: 0.8, roughness: 0.45 },
  iron: { color: '#6b6f74', metalness: 0.6, roughness: 0.65 },
  alu: { color: '#c9ced6', metalness: 0.75, roughness: 0.28 },
  chrome: { color: '#e5e7eb', metalness: 1, roughness: 0.1 },
  rubber: { color: '#1f2226', metalness: 0, roughness: 0.92 },
  plastic: { color: '#2d3238', metalness: 0.05, roughness: 0.7 },
  plasticLight: { color: '#9aa3ad', metalness: 0.05, roughness: 0.6 },
  interior: { color: '#3a3f47', metalness: 0.05, roughness: 0.85 },
  leather: { color: '#5b4636', metalness: 0.05, roughness: 0.7 },
  glass: { color: '#a5d8ff', metalness: 0.1, roughness: 0.05, opacity: 0.28, transparent: true, side: THREE.DoubleSide },
  lightLens: { color: '#f8fafc', metalness: 0.2, roughness: 0.1, emissive: '#fff7d6', emissiveIntensity: 0.4 },
  red: { color: '#dc2626', metalness: 0.2, roughness: 0.3, emissive: '#7f1d1d', emissiveIntensity: 0.3 },
  amber: { color: '#f59e0b', metalness: 0.2, roughness: 0.3, emissive: '#78350f', emissiveIntensity: 0.3 },
  copper: { color: '#c47a3a', metalness: 0.9, roughness: 0.3 },
  brass: { color: '#c8a24a', metalness: 0.9, roughness: 0.3 },
  ceramic: { color: '#f4f4f0', metalness: 0, roughness: 0.4 },
  friction: { color: '#5c4a3a', metalness: 0.1, roughness: 0.95 },
  fluid: { color: '#f59e0b', metalness: 0, roughness: 0.2, opacity: 0.55, transparent: true },
  paper: { color: '#efe2b8', metalness: 0, roughness: 0.95 },
  foam: { color: '#e46a2b', metalness: 0, roughness: 1 },
  cord: { color: '#d6c9a8', metalness: 0, roughness: 0.9 },
  belt: { color: '#71717a', metalness: 0.7, roughness: 0.5 },
  green: { color: '#16a34a', metalness: 0.1, roughness: 0.6 },
  yellow: { color: '#eab308', metalness: 0.2, roughness: 0.5 },
  white: { color: '#f1f5f9', metalness: 0.1, roughness: 0.5 },
  black: { color: '#111315', metalness: 0.2, roughness: 0.6 },
} satisfies Record<string, MP>;
export type MatKey = keyof typeof MATS;

export function Mat({ k = 'steel', c, o }: { k?: MatKey; c?: string; o?: number }) {
  const m = MATS[k] as MP;
  if (k === 'carPaint') {
    // automotive paint: metallic base + clear coat
    return <meshPhysicalMaterial color={c ?? m.color} metalness={m.metalness} roughness={m.roughness} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} envMapIntensity={1.3} />;
  }
  return (
    <meshStandardMaterial
      color={c ?? m.color} metalness={m.metalness ?? 0.2} roughness={m.roughness ?? 0.6}
      transparent={o !== undefined ? o < 1 : m.transparent} opacity={o ?? m.opacity ?? 1}
      emissive={m.emissive ?? '#000000'} emissiveIntensity={m.emissiveIntensity ?? 0}
      side={m.side ?? THREE.FrontSide}
    />
  );
}
