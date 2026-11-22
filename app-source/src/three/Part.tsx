import * as THREE from 'three';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useStore } from '../store';
import { register, unregister } from './registry';
import { handlePartClick } from './interaction';

/** Clipping planes used when cutaway mode is on (provided per scene). */
export const CutContext = createContext<THREE.Plane[]>([new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)]);

const noRaycast = () => {};
const HOVER = new THREE.Color('#38bdf8');
const SELECT = new THREE.Color('#22d3ee');
const QUIZ = new THREE.Color('#f97316');

interface Orig { color: THREE.Color; emissive: THREE.Color; emissiveIntensity: number; opacity: number; transparent: boolean; depthWrite: boolean; side: THREE.Side }

interface Props {
  id: string;
  children: ReactNode;
  /** Exploded-view offset (applied × explode factor) */
  explode?: [number, number, number];
  /** Become a transparent shell in X-ray mode (body panels) */
  shell?: boolean;
  /** Is cut by the scene's clipping plane in cutaway mode */
  cut?: boolean;
  /** Hidden entirely in X-ray mode (e.g. seats that block the view) */
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /** Not selectable (only visual), still part of the registry */
  passive?: boolean;
  /** Assembly this part belongs to (e.g. 'front-axle', 'v6'); selecting the assembly highlights all members */
  group?: string;
  /** Translucent part that lets clicks pass through to parts behind it */
  seeThrough?: boolean;
}

export function Part({ id, children, explode, shell, cut, position, rotation, scale, passive, group, seeThrough }: Props) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const meshes = useRef<THREE.Mesh[]>([]);
  const planes = useContext(CutContext);
  const invalidate = useThree((s) => s.invalidate);

  const selected = useStore((s) => s.selectedId === id || (!!group && s.selectedId === group));
  const hovered = useStore((s) => s.hoveredId === id);
  const quizHi = useStore((s) => s.quiz.highlightId === id || (!!group && s.quiz.highlightId === group));
  const isolatedRaw = useStore((s) => s.isolatedId);
  const isolated = isolatedRaw !== null && group && isolatedRaw === group ? id : isolatedRaw;
  const xray = useStore((s) => s.xray);
  const cutaway = useStore((s) => s.cutaway);

  useLayoutEffect(() => {
    const list: THREE.Mesh[] = [];
    let i = 0;
    inner.current.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.userData.partId = id;
      m.name = `${id}#${i++}`;
      const mat = m.material as THREE.MeshStandardMaterial;
      if (!mat.userData.orig) {
        mat.userData.orig = { color: mat.color.clone(), emissive: mat.emissive.clone(), emissiveIntensity: mat.emissiveIntensity, opacity: mat.opacity, transparent: mat.transparent, depthWrite: mat.depthWrite, side: mat.side } as Orig;
      }
      list.push(m);
    });
    meshes.current = list;
    register(id, inner.current);
    if (group) register(group, inner.current);
    const g = inner.current;
    return () => { unregister(id, g); if (group) unregister(group, g); };
  });

  // Apply visual state
  useEffect(() => {
    const ghostIso = isolated !== null && isolated !== id;
    const ghostShell = xray && shell && isolated !== id;
    for (const m of meshes.current) {
      const mat = m.material as THREE.MeshStandardMaterial;
      const o = mat.userData.orig as Orig;
      let opacity = o.opacity, transparent = o.transparent, depthWrite = o.depthWrite;
      if (ghostIso) { opacity = 0.05; transparent = true; depthWrite = false; }
      else if (ghostShell) { opacity = Math.min(o.opacity, 0.1); transparent = true; depthWrite = false; }
      mat.opacity = opacity; mat.transparent = transparent; mat.depthWrite = depthWrite;
      m.raycast = ghostIso || ghostShell || passive ? noRaycast : THREE.Mesh.prototype.raycast;
      m.renderOrder = transparent ? 2 : 0;
      if (selected) { mat.emissive.copy(SELECT); mat.emissiveIntensity = 0.55; }
      else if (hovered) { mat.emissive.copy(HOVER); mat.emissiveIntensity = 0.35; }
      else if (!quizHi) { mat.emissive.copy(o.emissive); mat.emissiveIntensity = o.emissiveIntensity; }
      const clip = cut && cutaway && !ghostIso;
      mat.clippingPlanes = clip ? planes : null;
      mat.side = clip ? THREE.DoubleSide : o.side;
      mat.clipShadows = true;
      mat.needsUpdate = true;
    }
    invalidate();
  }, [selected, hovered, quizHi, isolated, xray, cutaway, shell, cut, planes, passive, id]);

  // Quiz pulse + explode animation
  useFrame((state) => {
    if (quizHi) {
      const k = 0.45 + 0.35 * Math.sin(state.clock.elapsedTime * 6);
      for (const m of meshes.current) { const mat = m.material as THREE.MeshStandardMaterial; mat.emissive.copy(QUIZ); mat.emissiveIntensity = k; }
    }
    if (explode) {
      const f = useStore.getState().explode;
      const g = inner.current;
      const dx = explode[0] * f - g.position.x, dy = explode[1] * f - g.position.y, dz = explode[2] * f - g.position.z;
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 1e-4) {
        g.position.x += dx * 0.15; g.position.y += dy * 0.15; g.position.z += dz * 0.15;
        state.invalidate();
      }
    }
  });

  const behind = (e: ThreeEvent<any>) => seeThrough && e.intersections.some((h) => h.object.userData.partId && h.object.userData.partId !== id && h.object.visible && (h.object as any).raycast === THREE.Mesh.prototype.raycast);
  const over = (e: ThreeEvent<PointerEvent>) => { if (behind(e)) return; e.stopPropagation(); useStore.setState({ hoveredId: id }); document.body.style.cursor = 'pointer'; };
  const out = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); if (useStore.getState().hoveredId === id) useStore.setState({ hoveredId: null }); document.body.style.cursor = 'auto'; };
  const click = (e: ThreeEvent<MouseEvent>) => { if (behind(e)) return; e.stopPropagation(); if (e.delta > 5) return; handlePartClick(id, group); };

  return (
    <group ref={outer} position={position} rotation={rotation} scale={scale}
      onPointerOver={passive ? undefined : over} onPointerOut={passive ? undefined : out} onClick={passive ? undefined : click}>
      <group ref={inner}>{children}</group>
    </group>
  );
}
