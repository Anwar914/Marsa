import { create } from 'zustand';
/** Low-frequency animation info for HUD overlays (not persisted). */
export const useAnim = create<{ stroke: number; crankDeg: number; info: string }>(() => ({ stroke: 0, crankDeg: 0, info: '' }));
export const STROKES = [
  { en: 'Intake', de: 'Ansaugen', color: '#60a5fa' },
  { en: 'Compression', de: 'Verdichten', color: '#a78bfa' },
  { en: 'Power', de: 'Arbeiten', color: '#f97316' },
  { en: 'Exhaust', de: 'Ausstoßen', color: '#9ca3af' },
];
/** Engine crank angular speed at speed 1 (rad/s): one revolution per 3 s for learning. */
export const OMEGA = (2 * Math.PI) / 3;
