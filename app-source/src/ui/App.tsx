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
import { Icon, Logo, type IconName } from './icons';
import { ttsSupported } from '../speech';
import type { Level, Tab } from '../types';

const TABS: { id: Tab; icon: IconName }[] = [
  { id: 'explore', icon: 'explore' }, { id: 'learn', icon: 'learn' }, { id: 'course', icon: 'course' }, { id: 'quiz', icon: 'quiz' }, { id: 'vocab', icon: 'vocab' }, { id: 'progress', icon: 'progress' },
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
      {/* Top bar: brand · tabs (desktop) · settings */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900 sm:px-3">
        {!course && <button className="toolbtn" onClick={() => setLeftOpen(!leftOpen)} aria-label="Menu" title={L('Systems & components', 'Systeme & Bauteile')}><Icon name="menu" size={18} /></button>}
        <div className="flex min-w-0 items-center gap-2">
          <Logo size={30} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-extrabold tracking-wide text-slate-900 dark:text-white">MARSA <span lang="ar" dir="rtl" className="font-semibold text-brand-600 dark:text-accent">مرسى</span></div>
            <div className="hidden truncate text-[10px] font-medium uppercase tracking-[.14em] text-slate-500 sm:block">Auto Anatomy 3D · Technical English</div>
          </div>
        </div>
        <nav className="mx-auto hidden items-center gap-0.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70 md:flex" aria-label="Main">
          {TABS.map((tb) => (
            <button key={tb.id} onClick={() => s.set({ tab: tb.id })} aria-current={s.tab === tb.id ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${s.tab === tb.id ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-950 dark:text-accent' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
              <Icon name={tb.icon} size={15} /><span className="hidden lg:inline">{t(tb.id)}</span>
            </button>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <select value={s.level} onChange={(e) => s.set({ level: e.target.value as Level })} className="h-8 max-w-[7.5rem] rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-medium sm:max-w-none text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" title={t('level')} aria-label={t('level')}>
            <option value="beginner">{t('beginner')}</option>
            <option value="intermediate">{t('intermediate')}</option>
            <option value="advanced">{t('advanced')}</option>
          </select>
          <label className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300 xl:inline-flex" title={L('Speech speed', 'Sprechtempo')}>
            <Icon name="volume" size={14} /><input type="range" min={0.5} max={1.3} step={0.05} value={s.speechRate} onChange={(e) => s.set({ speechRate: +e.target.value })} className="w-16 accent-brand-500" aria-label={L('Speech speed', 'Sprechtempo')} />
            <span className="w-7 tabular-nums">{s.speechRate.toFixed(2)}</span>
          </label>
          <div className="flex h-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {(['en', 'de'] as const).map((l) => <button key={l} onClick={() => s.set({ uiLang: l })} aria-pressed={s.uiLang === l} className={`px-2 text-xs font-bold ${s.uiLang === l ? 'bg-brand-600 text-white dark:bg-accent dark:text-accent-ink' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{l.toUpperCase()}</button>)}
          </div>
          <button className="toolbtn h-8 border border-slate-200 dark:border-slate-700" onClick={() => s.set({ theme: s.theme === 'dark' ? 'light' : 'dark' })} aria-label={L('Toggle dark mode', 'Dunkelmodus umschalten')}><Icon name={s.theme === 'dark' ? 'sun' : 'moon'} size={15} /></button>
        </div>
      </header>
      {!ttsSupported && <div className="bg-amber-500/20 px-3 py-1 text-xs">{L('Text-to-speech is not supported in this browser – audio buttons will be silent.', 'Sprachausgabe wird von diesem Browser nicht unterstützt.')}</div>}

      <div className="relative flex min-h-0 flex-1">
        {/* Course page stays mounted once opened, so timers and scroll position survive tab switches */}
        {courseOpened && <div className={course ? 'min-h-0 flex-1' : 'hidden'}><CourseView /></div>}
        {!course && leftOpen && <div className="absolute inset-0 z-10 bg-black/30 xl:hidden" onClick={() => setLeftOpen(false)} />}
        {!course && leftOpen && (
          <div className="absolute inset-y-0 left-0 z-20 w-72 shrink-0 border-r border-slate-200 bg-white p-3 shadow-panel dark:border-slate-800 dark:bg-slate-900 xl:static xl:z-auto xl:shadow-none">
            <Sidebar />
          </div>
        )}
        {course ? null : page ? (
          <main className="min-h-0 flex-1 p-4">{s.tab === 'vocab' ? <VocabView /> : <ProgressView />}</main>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div ref={viewerRef} className="relative h-[44vh] shrink-0 bg-slate-100 dark:bg-slate-950 md:h-auto md:min-h-0 md:flex-1 md:shrink">
              <Viewer />
              <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-col gap-2 sm:inset-x-3 sm:top-3">
                <Toolbar containerRef={viewerRef} />
              </div>
              <div className="pointer-events-none absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] flex-col items-start gap-2">
                <Hud />
                <div className="hidden items-center gap-2 rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-[11px] text-slate-200 backdrop-blur sm:flex">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-accent font-mono text-[11px] font-bold text-accent-ink">{mod.letter}</span>
                  <span><b>{L(mod.nameEn, mod.nameDe)}</b> <span className="text-slate-400">— {L(mod.descEn, mod.descDe)}</span></span>
                </div>
              </div>
            </div>
            <aside className="min-h-0 w-full flex-1 overflow-auto border-t border-slate-200 bg-white p-4 scroll-thin dark:border-slate-800 dark:bg-slate-900 md:w-[360px] md:flex-none md:border-l md:border-t-0 xl:w-[400px]">
              {s.tab === 'explore' && <SelectedCard />}
              {s.tab === 'learn' && <LearnPanel key={s.moduleId} />}
              {s.tab === 'quiz' && <QuizPanel />}
            </aside>
          </div>
        )}
      </div>

      {/* Bottom navigation (phones/tablets only) */}
      <nav className="grid shrink-0 grid-cols-6 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900 md:hidden" aria-label="Main">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => s.set({ tab: tb.id })} aria-current={s.tab === tb.id ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${s.tab === tb.id ? 'text-brand-700 dark:text-accent' : 'text-slate-500'}`}>
            {s.tab === tb.id && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-brand-600 dark:bg-accent" />}
            <Icon name={tb.icon} size={19} />{t(tb.id)}
          </button>
        ))}
      </nav>
    </div>
  );
}
