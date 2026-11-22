import * as THREE from 'three';
import { useStore } from '../store';

/** partId -> root groups currently mounted in the scene for that part */
export const registry = new Map<string, Set<THREE.Object3D>>();
let pending = false;
function sync() {
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    const ids = [...registry.entries()].filter(([, s]) => s.size > 0).map(([k]) => k).sort();
    const cur = useStore.getState().scenePartIds;
    if (ids.join() !== cur.join()) useStore.setState({ scenePartIds: ids });
  });
}
export function register(id: string, o: THREE.Object3D) {
  if (!registry.has(id)) registry.set(id, new Set());
  registry.get(id)!.add(o); sync();
}
export function unregister(id: string, o: THREE.Object3D) {
  registry.get(id)?.delete(o); sync();
}
const _b = new THREE.Box3();
export function partBox(id: string): THREE.Box3 | null {
  const set = registry.get(id);
  if (!set || set.size === 0) return null;
  const box = new THREE.Box3();
  set.forEach((o) => { o.updateWorldMatrix(true, true); _b.setFromObject(o); if (!_b.isEmpty()) box.union(_b); });
  return box.isEmpty() ? null : box;
}

/** Shared animation clock; advances only while playing. */
export const clock = { t: 0 };
