import { useStore } from '../store';
import { speak } from '../speech';
import type { CarPart } from '../types';
import { mastery } from '../srs';

export const useL = () => { const lang = useStore((s) => s.uiLang); return (en: string, de: string) => (lang === 'en' ? en : de); };

export function SpeakBtn({ text, lang = 'en', slow = false, label, className = '' }: { text: string; lang?: 'en' | 'de'; slow?: boolean; label?: string; className?: string }) {
  const rate = useStore((s) => s.speechRate);
  const level = useStore((s) => s.level);
  const r = slow || level === 'beginner' ? Math.min(rate, 0.75) : rate;
  return (
    <button className={`btn btn-ghost ${className}`} title={`Listen (${lang.toUpperCase()})`} onClick={(e) => { e.stopPropagation(); speak(text, lang, r); }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" /></svg>
      {label}
    </button>
  );
}

const DOT: Record<string, string> = { new: 'bg-slate-400/40', learning: 'bg-amber-400', review: 'bg-sky-400', mastered: 'bg-emerald-500' };
export function MasteryDot({ id }: { id: string }) {
  const p = useStore((s) => s.progress[id]);
  const m = mastery(p);
  return <span title={m} className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT[m]}`} />;
}

export function PartName({ p, de = true }: { p: CarPart; de?: boolean }) {
  return <span>{p.nameEn}{de && <span className="text-slate-500 dark:text-slate-400"> · {p.nameDe}</span>}</span>;
}

export function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
export const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
