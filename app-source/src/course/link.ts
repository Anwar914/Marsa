/** Which course worksheet practises a 3D part (course = embedded Technical English page). */
export const COURSE_LINKS: Record<string, { route: string; label: string }> = {
  crankshaft: { route: 'vocab/A2', label: 'A2' }, piston: { route: 'vocab/A2', label: 'A2' },
  'spark-plug': { route: 'vocab/A2', label: 'A2' }, 'exhaust-valve': { route: 'vocab/A2', label: 'A2' },
  'cylinder-head': { route: 'vocab/A2', label: 'A2' }, windshield: { route: 'vocab/A2', label: 'A2' },
  trunk: { route: 'vocab/A2', label: 'A2' }, transmission: { route: 'vocab/A2', label: 'A2' },
  cylinder: { route: 'vocab', label: 'flashcards' },
  'intake-valve': { route: 'writing/0', label: 'writing: four-stroke engine' },
  camshaft: { route: 'writing/0', label: 'writing: four-stroke engine' },
  'inline-four': { route: 'writing/0', label: 'writing: four-stroke engine' },
};

export interface UnitStats { c: number; t: number; n: number; groups: { id: string; title: string; c: number; t: number; n: number }[] }
export interface CourseSummary {
  worksheetsCorrect: number; attempted: number; total: number;
  groups: { id: string; title: string; n: number; t: number; c: number }[];
  mistakes: number; flashMastered: number; flashTotal: number; flashDue: number;
  readiness: number; bestExam: number; examsDone: number;
  b1?: UnitStats; b2?: UnitStats;
  tests?: Record<'b1' | 'b2', { n: number; best: number; last: number | null }>;
  log: Record<string, { n: number; c: number }>; updated: number;
}
export function readCourseSummary(): CourseSummary | null {
  try { const s = localStorage.getItem('werkstatt-summary'); return s ? JSON.parse(s) : null; } catch { return null; }
}
