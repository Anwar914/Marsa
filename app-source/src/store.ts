import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardProgress, Level, ModuleId, QuizMode, Tab } from './types';
import { newCard, review } from './srs';

export type EngineType = 'i4' | 'v6' | 'v8';
export type Gearbox = 'manual' | 'automatic';

interface QuizUI {
  mode: QuizMode;
  /** Part highlighted for "identify" questions */
  highlightId: string | null;
  /** Waiting for user to click a mesh ("find" questions) */
  awaitingClickFor: string | null;
  lastClickResult: { id: string; ok: boolean } | null;
}

interface State {
  tab: Tab;
  moduleId: ModuleId;
  selectedId: string | null;
  hoveredId: string | null;
  isolatedId: string | null;
  xray: boolean;
  cutaway: boolean;
  explode: number;
  playing: boolean;
  speed: number;
  showLabels: boolean;
  engineType: EngineType;
  gearbox: Gearbox;
  camToken: number;
  focusToken: number;
  quiz: QuizUI;
  /** Parts present in the current 3D scene (filled by Part components) */
  scenePartIds: string[];
  /** Part requested from a card's "Quiz this part" button */
  quizTarget: string | null;
  /** Route to open inside the embedded course page (e.g. 'vocab/A2') */
  courseRoute: string | null;
  /** Bumped when the course page reports new progress */
  courseTick: number;
  /** Answers per day in the 3D app: { 'YYYY-MM-DD': { n, c } } */
  log: Record<string, { n: number; c: number }>;

  // persisted
  level: Level;
  uiLang: 'en' | 'de';
  theme: 'dark' | 'light';
  speechRate: number;
  progress: Record<string, CardProgress>;
  quizStats: { answered: number; correct: number; byMode: Record<string, { a: number; c: number }> };
  streak: { last: string; days: number };

  set: (p: Partial<State>) => void;
  setModule: (m: ModuleId) => void;
  select: (id: string | null) => void;
  markSeen: (id: string) => void;
  toggleSave: (id: string) => void;
  grade: (id: string, quality: number, mode?: QuizMode) => void;
  setQuiz: (q: Partial<QuizUI>) => void;
  resetProgress: () => void;
}

const MODULE_DEFAULTS: Partial<Record<ModuleId, Partial<State>>> = {
  exterior: { xray: false, cutaway: false },
  interior: { xray: true, cutaway: false },
  engine: { xray: false, cutaway: true },
  engineTypes: { cutaway: false },
  electrical: { cutaway: true },
  brakes: { cutaway: true },
  drivetrain: { cutaway: true },
  filters: { cutaway: true },
};

const today = () => new Date().toISOString().slice(0, 10);
/** Local calendar day, same format as the course page log */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      tab: 'explore', moduleId: 'exterior', selectedId: null, hoveredId: null, isolatedId: null,
      xray: false, cutaway: false, explode: 0, playing: true, speed: 1, showLabels: true,
      engineType: 'i4', gearbox: 'manual', camToken: 0, focusToken: 0, scenePartIds: [], quizTarget: null, courseRoute: null, courseTick: 0, log: {},
      quiz: { mode: 'identify', highlightId: null, awaitingClickFor: null, lastClickResult: null },
      level: 'beginner', uiLang: 'en', theme: 'dark', speechRate: 0.9,
      progress: {}, quizStats: { answered: 0, correct: 0, byMode: {} }, streak: { last: '', days: 0 },

      set: (p) => set(p),
      setModule: (m) => set({
        moduleId: m, selectedId: null, isolatedId: null, explode: 0, hoveredId: null,
        xray: false, cutaway: false, ...MODULE_DEFAULTS[m], camToken: get().camToken + 1,
        quiz: { ...get().quiz, highlightId: null, awaitingClickFor: null, lastClickResult: null },
      }),
      select: (id) => { set({ selectedId: id }); if (id) get().markSeen(id); },
      markSeen: (id) => {
        const p = get().progress[id] ?? newCard();
        const t = today();
        const s = get().streak;
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const streak = s.last === t ? s : { last: t, days: s.last === yesterday ? s.days + 1 : 1 };
        set({ progress: { ...get().progress, [id]: { ...p, seen: p.seen + 1 } }, streak });
      },
      toggleSave: (id) => {
        const p = get().progress[id] ?? newCard();
        set({ progress: { ...get().progress, [id]: { ...p, saved: !p.saved, due: p.due || Date.now() } } });
      },
      grade: (id, quality, mode) => {
        const p = get().progress[id] ?? newCard();
        const qs = get().quizStats;
        const upd: Partial<State> = { progress: { ...get().progress, [id]: review(p, quality) } };
        if (mode) {
          const m = qs.byMode[mode] ?? { a: 0, c: 0 };
          upd.quizStats = { answered: qs.answered + 1, correct: qs.correct + (quality >= 3 ? 1 : 0), byMode: { ...qs.byMode, [mode]: { a: m.a + 1, c: m.c + (quality >= 3 ? 1 : 0) } } };
        }
        const d = dayKey();
        const l = get().log[d] ?? { n: 0, c: 0 };
        upd.log = { ...get().log, [d]: { n: l.n + 1, c: l.c + (quality >= 3 ? 1 : 0) } };
        set(upd);
      },
      setQuiz: (q) => set({ quiz: { ...get().quiz, ...q } }),
      resetProgress: () => set({ progress: {}, quizStats: { answered: 0, correct: 0, byMode: {} }, streak: { last: '', days: 0 } }),
    }),
    {
      name: 'auto-anatomy-3d-v1',
      partialize: (s) => ({ level: s.level, uiLang: s.uiLang, theme: s.theme, speechRate: s.speechRate, progress: s.progress, quizStats: s.quizStats, streak: s.streak, log: s.log }),
    },
  ),
);
