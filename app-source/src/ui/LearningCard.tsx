import { useState } from 'react';
import { useStore } from '../store';
import { getPart, MODULE_MAP, partsOfModule } from '../data';
import { mastery } from '../srs';
import { Icon } from './icons';
import { useT } from '../i18n';
import { SpeakBtn, MasteryDot, useL } from './common';
import { Pronounce } from './Pronounce';
import type { CarPart } from '../types';
import { COURSE_LINKS } from '../course/link';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-1"><div className="label">{title}</div>{children}</section>;
}

export function LearningCard({ part, compact = false }: { part: CarPart; compact?: boolean }) {
  const t = useT(); const L = useL();
  const level = useStore((s) => s.level);
  const saved = useStore((s) => !!s.progress[part.id]?.saved);
  const moduleId = useStore((s) => s.moduleId);
  const [showDe, setShowDe] = useState(level === 'beginner');
  const [practice, setPractice] = useState(false);
  const beginner = level === 'beginner', adv = level === 'advanced';
  const animModule = part.modules.find((m) => MODULE_MAP[m].hasAnimation);

  const show3D = () => {
    const s = useStore.getState();
    const m = part.modules.includes(s.moduleId) ? s.moduleId : animModule ?? part.modules[0];
    if (m !== s.moduleId) s.setModule(m);
    if (s.tab !== 'explore' && s.tab !== 'learn') s.set({ tab: 'explore' });
    setTimeout(() => { useStore.getState().set({ selectedId: part.id, playing: true }); useStore.setState((x) => ({ focusToken: x.focusToken + 1 })); }, 80);
  };

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {/* Header */}
      <div>
        <div className="flex items-start gap-2">
          <h2 className="flex-1 text-xl font-bold leading-tight text-slate-900 dark:text-white">{part.nameEn}</h2>
          <MasteryDot id={part.id} />
        </div>
        {part.altEn && <div className="text-xs text-slate-500">{L('also', 'auch')}: {part.altEn}</div>}
        <div className="mt-1 text-base font-medium text-cyan-700 dark:text-cyan-300">🇩🇪 {part.nameDe}</div>
        <div className="ipa mt-1 text-slate-600 dark:text-slate-300">{part.pronunciationIPA}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <SpeakBtn text={part.nameEn} label="EN" />
          <SpeakBtn text={part.nameEn} slow label={L('slow', 'langsam')} />
          <SpeakBtn text={part.nameDe} lang="de" label="DE" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button className={`btn ${saved ? 'btn-on' : 'btn-ghost'}`} onClick={() => useStore.getState().toggleSave(part.id)}>{saved ? '★ ' + t('saved') : '☆ ' + t('save')}</button>
        <button className={`btn ${practice ? 'btn-on' : 'btn-ghost'}`} onClick={() => setPractice(!practice)}>🎙 {t('practice')}</button>
        <button className="btn btn-ghost" onClick={() => useStore.getState().set({ tab: 'quiz', quizTarget: part.id })}>❓ {t('startQuiz')}</button>
        {COURSE_LINKS[part.id] && <button className="btn btn-ghost" onClick={() => useStore.getState().set({ tab: 'course', courseRoute: COURSE_LINKS[part.id].route })}>📝 {L('Practise in course', 'Im Kurs üben')} ({COURSE_LINKS[part.id].label})</button>}
        {(animModule || !part.modules.includes(moduleId)) && <button className="btn btn-ghost" onClick={show3D}>▶ {animModule ? L('3D animation', '3D-Animation') : L('Show in 3D', 'In 3D zeigen')}</button>}
      </div>
      {practice && <Pronounce part={part} />}

      {!adv && (
        <Section title={t('simple')}>
          <p className="flex items-start gap-2"><span className="flex-1">{part.explanationA1}</span><SpeakBtn text={part.explanationA1} /></p>
        </Section>
      )}
      {!beginner && (
        <Section title={t('technical')}>
          <p className="flex items-start gap-2"><span className="flex-1">{part.explanationB2}</span><SpeakBtn text={part.explanationB2} /></p>
        </Section>
      )}
      <Section title={t('func')}><p className="font-medium">⚙ {part.mechanicalFunction}</p></Section>

      <Section title={t('german')}>
        {showDe ? <p className="text-slate-700 dark:text-slate-300">{part.explanationDe}</p>
          : <button className="btn btn-ghost" onClick={() => setShowDe(true)}>{t('showGerman')}</button>}
      </Section>

      {!compact && (
        <Section title={t('examples')}>
          <ul className="space-y-1.5">
            {part.exampleSentences.map((e, i) => (
              <li key={i} className="rounded bg-slate-100 p-2 dark:bg-slate-800/60">
                <div className="flex items-start gap-2"><span className="flex-1">“{e.en}”</span><SpeakBtn text={e.en} /></div>
                {(showDe || beginner) && <div className="text-xs text-slate-500">{e.de}</div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {adv && (
        <>
          <Section title={t('simple')}><p className="text-slate-600 dark:text-slate-400">{part.explanationA1}</p></Section>
          {part.troubleshooting && <Section title={t('trouble')}><p className="rounded border-l-4 border-amber-500 bg-amber-500/10 p-2">🔧 {part.troubleshooting}</p></Section>}
        </>
      )}
      {!adv && part.troubleshooting && level === 'intermediate' && (
        <Section title={t('trouble')}><p className="text-slate-600 dark:text-slate-400">🔧 {part.troubleshooting}</p></Section>
      )}

      {!compact && part.relatedParts.length > 0 && (
        <Section title={t('related')}>
          <div className="flex flex-wrap gap-1">
            {part.relatedParts.map((id) => {
              const r = getPart(id);
              if (!r) return null;
              return (
                <button key={id} className="btn btn-ghost" onClick={() => {
                  const s = useStore.getState();
                  if (!r.modules.includes(s.moduleId)) s.setModule(r.modules[0]);
                  setTimeout(() => useStore.getState().select(id), 50);
                }}>{r.nameEn} <span className="text-slate-500">· {r.nameDe}</span></button>
              );
            })}
          </div>
        </Section>
      )}
      {part.modelNote && <Section title={t('note')}><p className="text-xs italic text-slate-500">ⓘ {part.modelNote}</p></Section>}
    </div>
  );
}

export function SelectedCard() {
  const t = useT();
  const id = useStore((s) => s.selectedId);
  const p = getPart(id);
  if (!p) return <ModuleOverview />;
  return <LearningCard part={p} />;
}

/** Shown when nothing is selected: what this module offers and where to start. */
function ModuleOverview() {
  const t = useT(); const L = useL();
  const moduleId = useStore((s) => s.moduleId);
  const progress = useStore((s) => s.progress);
  const scene = useStore((s) => s.scenePartIds);
  const m = MODULE_MAP[moduleId];
  const parts = partsOfModule(moduleId);
  const seen = parts.filter((p) => mastery(progress[p.id]) !== 'new').length;
  const mastered = parts.filter((p) => mastery(progress[p.id]) === 'mastered').length;
  const inScene = new Set(scene);
  const pick = (id: string) => { useStore.getState().select(id); useStore.setState((x) => ({ focusToken: x.focusToken + 1 })); };
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 font-mono text-lg font-bold text-accent">{m.letter}</span>
        <div>
          <div className="label">{L('Module', 'Modul')} {m.letter}</div>
          <h2 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">{L(m.nameEn, m.nameDe)}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{L(m.descEn, m.descDe)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[[parts.length, L('terms', 'Begriffe')], [seen, L('seen', 'gesehen')], [mastered, L('mastered', 'sicher')]].map(([v, l]) => (
          <div key={l as string} className="rounded-lg bg-slate-100 py-2 dark:bg-slate-800/70"><div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{v}</div><div className="text-[11px] text-slate-500">{l}</div></div>
        ))}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(seen / parts.length) * 100}%` }} /></div>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn btn-primary justify-center py-2 text-[13px]" onClick={() => useStore.getState().set({ tab: 'learn' })}><Icon name="learn" size={15} />{L('Guided lesson', 'Geführte Lektion')}</button>
        <button className="btn btn-ghost justify-center py-2 text-[13px]" onClick={() => useStore.getState().set({ tab: 'quiz' })}><Icon name="quiz" size={15} />{L('Quiz module', 'Modul-Quiz')}</button>
      </div>
      <div>
        <div className="label mb-2">{L('Click a part to start', 'Bauteil anklicken und loslegen')}</div>
        <div className="flex flex-wrap gap-1.5">
          {parts.filter((p) => inScene.has(p.id)).slice(0, 14).map((p) => (
            <button key={p.id} onClick={() => pick(p.id)} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-900/40 dark:hover:text-brand-100">{p.nameEn}</button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 p-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700">
        <b className="text-slate-700 dark:text-slate-300">{t('noSelection')}</b><br />{t('noSelectionHint')}
        <div className="mt-1.5 font-semibold tracking-wide text-brand-700 dark:text-accent">SEE → CLICK → HEAR → UNDERSTAND → REPEAT → PRACTICE</div>
      </div>
    </div>
  );
}
