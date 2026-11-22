import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { MODULE_MAP } from '../data';
import { useT } from '../i18n';
import { Viewer } from '../three/Viewer';
import { Sidebar } from './Sidebar';
import { Toolbar, Hud } from './Toolbar';
import { SelectedCard } from './LearningCard';
import { QuizPanel } from './Quiz';
import { LearnPanel } from './Learn';
import { VocabView } from './Vocab';
import { ProgressView } from './Progress';
import { CourseView, useCourseBridge } from './Course';
import { useL } from './common';
import { ttsSupported } from '../speech';
import type { Level, Tab } from '../types';

const TABS: { id: Tab; icon: string }[] = [
  { id: 'explore', icon: '🧭' }, { id: 'learn', icon: '📘' }, { id: 'course', icon: '🎓' }, { id: 'quiz', icon: '❓' }, { id: 'vocab', icon: '★' }, { id: 'progress', icon: '📈' },
];

export function App() {
  const t = useT(); const L = useL();
  const s = useStore();
  const viewerRef = useRef<HTMLDivElement>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const mod = MODULE_MAP[s.moduleId];
  useCourseBridge();
  const [courseOpened, setCourseOpened] = useState(false);
  useEffect(() => { if (s.tab === 'course') setCourseOpened(true); }, [s.tab]);

  useEffect(() => { document.documentElement.classList.toggle('dark', s.theme === 'dark'); }, [s.theme]);
  useEffect(() => {
    if (s.tab !== 'quiz' && s.tab !== 'learn') s.setQuiz({ highlightId: null, awaitingClickFor: null, lastClickResult: null });
  }, [s.tab]);
  useEffect(() => { if (window.innerWidth < 1280) setLeftOpen(false); }, []);

  const page = s.tab === 'vocab' || s.tab === 'progress';
  const course = s.tab === 'course';
  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <button className="btn btn-ghost" onClick={() => setLeftOpen(!leftOpen)} title="Menu">☰</button>
        <div className="mr-2 leading-tight">
          <div className="text-sm font-extrabold tracking-wide"><span className="text-cyan-500">MARSA</span> <span lang="ar" dir="rtl" className="font-semibold">مرسى</span> <span className="font-semibold text-slate-500">· Auto Anatomy 3D</span></div>
          <div className="hidden text-[10px] text-slate-500 sm:block">Automotive engineering & Technical English</div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <select value={s.level} onChange={(e) => s.set({ level: e.target.value as Level })} className="btn btn-ghost" title={t('level')}>
            <option value="beginner">{t('beginner')}</option>
            <option value="intermediate">{t('intermediate')}</option>
            <option value="advanced">{t('advanced')}</option>
          </select>
          <label className="btn btn-ghost hidden md:inline-flex" title={L('Speech speed', 'Sprechtempo')}>
            🔊 <input type="range" min={0.5} max={1.3} step={0.05} value={s.speechRate} onChange={(e) => s.set({ speechRate: +e.target.value })} className="w-16 accent-cyan-500" />
            <span className="w-7 text-right">{s.speechRate.toFixed(2)}</span>
          </label>
          <div className="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-700">
            {(['en', 'de'] as const).map((l) => <button key={l} onClick={() => s.set({ uiLang: l })} className={`px-2 py-1 text-xs font-semibold ${s.uiLang === l ? 'bg-cyan-600 text-white' : ''}`}>{l.toUpperCase()}</button>)}
          </div>
          <button className="btn btn-ghost" onClick={() => s.set({ theme: s.theme === 'dark' ? 'light' : 'dark' })}>{s.theme === 'dark' ? '☀' : '☾'}</button>
        </div>
      </header>
      {!ttsSupported && <div className="bg-amber-500/20 px-3 py-1 text-xs">{L('Text-to-speech is not supported in this browser – audio buttons will be silent.', 'Sprachausgabe wird von diesem Browser nicht unterstützt.')}</div>}

      <div className="relative flex min-h-0 flex-1">
        {/* Course page stays mounted once opened, so timers and scroll position survive tab switches */}
        {courseOpened && <div className={course ? 'min-h-0 flex-1' : 'hidden'}><CourseView /></div>}
        {!course && leftOpen && <div className="absolute inset-0 z-10 bg-black/30 xl:hidden" onClick={() => setLeftOpen(false)} />}
        {!course && leftOpen && (
          <div className="absolute inset-y-0 left-0 z-20 w-72 shrink-0 border-r border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 xl:static xl:z-auto">
            <Sidebar />
          </div>
        )}
        {course ? null : page ? (
          <main className="min-h-0 flex-1 p-4">{s.tab === 'vocab' ? <VocabView /> : <ProgressView />}</main>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div ref={viewerRef} className="relative min-h-[45vh] flex-1 bg-slate-100 dark:bg-slate-900">
              <Viewer />
              <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-col gap-2">
                <Toolbar containerRef={viewerRef} />
              </div>
              <div className="pointer-events-none absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] flex-col items-start gap-2">
                <Hud />
                <div className="rounded bg-slate-900/70 px-2 py-1 text-[11px] text-slate-200">
                  <b>{mod.letter} · {L(mod.nameEn, mod.nameDe)}</b> — {L(mod.descEn, mod.descDe)}
                </div>
              </div>
            </div>
            <aside className="max-h-[50vh] w-full shrink-0 overflow-auto border-t border-slate-200 bg-white p-3 scroll-thin dark:border-slate-800 dark:bg-slate-950 md:max-h-none md:w-[360px] md:border-l md:border-t-0 xl:w-[400px]">
              {s.tab === 'explore' && <SelectedCard />}
              {s.tab === 'learn' && <LearnPanel key={s.moduleId} />}
              {s.tab === 'quiz' && <QuizPanel />}
            </aside>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="grid grid-cols-6 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => s.set({ tab: tb.id })}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${s.tab === tb.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            <span className="text-base leading-none">{tb.icon}</span>{t(tb.id)}
          </button>
        ))}
      </nav>
    </div>
  );
}
