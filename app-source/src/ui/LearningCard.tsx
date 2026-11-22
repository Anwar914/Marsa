import { useState } from 'react';
import { useStore } from '../store';
import { getPart, MODULE_MAP } from '../data';
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
  if (!p) {
    return (
      <div className="space-y-2 p-1 text-sm text-slate-500">
        <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{t('noSelection')}</p>
        <p>{t('noSelectionHint')}</p>
        <p className="text-xs">SEE → CLICK → HEAR → UNDERSTAND → REPEAT → PRACTICE</p>
      </div>
    );
  }
  return <LearningCard part={p} />;
}
