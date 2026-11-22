import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { partsOfModule, PARTS, MODULE_MAP } from '../data';
import { mastery } from '../srs';
import { speak } from '../speech';
import { shuffle, useL, SpeakBtn } from './common';
import { Pronounce } from './Pronounce';
import type { CarPart } from '../types';

const STEPS = ['SEE', 'CLICK', 'HEAR', 'UNDERSTAND', 'REPEAT', 'PRACTICE'] as const;
const STEPS_DE = ['SEHEN', 'KLICKEN', 'HÖREN', 'VERSTEHEN', 'WIEDERHOLEN', 'ÜBEN'];

/** Guided lesson through the current module: SEE → CLICK → HEAR → UNDERSTAND → REPEAT → PRACTICE */
export function LearnPanel() {
  const L = useL();
  const level = useStore((s) => s.level);
  const moduleId = useStore((s) => s.moduleId);
  const scene = useStore((s) => s.scenePartIds);
  const click = useStore((s) => s.quiz.lastClickResult);
  const progress = useStore((s) => s.progress);
  const list = useMemo(() => {
    const inScene = new Set(scene);
    const ps = partsOfModule(moduleId).filter((p) => inScene.has(p.id));
    return [...ps.filter((p) => mastery(progress[p.id]) === 'new'), ...ps.filter((p) => mastery(progress[p.id]) !== 'new')];
  }, [moduleId, scene.join()]);
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [clickMsg, setClickMsg] = useState('');
  const [pick, setPick] = useState<string | null>(null);
  const part: CarPart | undefined = list[idx % Math.max(1, list.length)];

  const opts = useMemo(() => part ? shuffle([part, ...shuffle(PARTS.filter((p) => p.id !== part.id && p.category === part.category)).slice(0, 2)]) : [], [part?.id]);

  // set up 3D state for each step
  useEffect(() => {
    const st = useStore.getState();
    st.setQuiz({ highlightId: null, awaitingClickFor: null, lastClickResult: null });
    if (!part) return;
    setClickMsg(''); setPick(null);
    if (step === 0) { st.setQuiz({ highlightId: part.id }); st.set({ selectedId: null }); useStore.setState((s) => ({ focusToken: s.focusToken + 1 })); }
    if (step === 1) st.setQuiz({ awaitingClickFor: part.id });
    if (step === 2) { st.set({ selectedId: part.id }); speak(part.nameEn, 'en', level === 'beginner' ? 0.7 : st.speechRate); }
    if (step >= 3) st.set({ selectedId: part.id });
  }, [step, part?.id]);
  useEffect(() => () => useStore.getState().setQuiz({ highlightId: null, awaitingClickFor: null }), []);

  useEffect(() => {
    if (step !== 1 || !click || !part) return;
    if (click.ok) { setClickMsg(L('Well done!', 'Gut gemacht!')); useStore.getState().markSeen(part.id); setTimeout(() => setStep(2), 600); }
    else setClickMsg(L('Not this one – look for the orange part from step 1. Try X-ray or Cutaway.', 'Nicht dieses – suche das orange Teil aus Schritt 1. Probiere Röntgen oder Schnitt.'));
  }, [click]);

  if (!part) return <p className="text-sm text-slate-500">{L('Loading parts…', 'Lade Bauteile…')}</p>;
  const nextPart = () => { setIdx((i) => (i + 1) % list.length); setStep(0); };

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="label">{L('Lesson', 'Lektion')} · {L(MODULE_MAP[moduleId].nameEn, MODULE_MAP[moduleId].nameDe)}</div>
        <div className="text-xs text-slate-500">{(idx % list.length) + 1}/{list.length}</div>
      </div>
      <div className="flex gap-0.5">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className={`flex-1 rounded px-0.5 py-1 text-[9px] font-bold tracking-wide ${i === step ? 'bg-cyan-600 text-white' : i < step ? 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
            {L(s, STEPS_DE[i])}
          </button>
        ))}
      </div>
      <div className="card space-y-3">
        {step === 0 && <><p className="text-base font-semibold">👁 {L('Look at the orange part in the 3D view.', 'Schau dir das orange Teil in der 3D-Ansicht an.')}</p><p className="text-slate-500">{L('Rotate the model to see where it sits and what it is connected to.', 'Drehe das Modell: Wo sitzt es, womit ist es verbunden?')}</p></>}
        {step === 1 && <><p className="text-base font-semibold">👆 {L('Now click this part in the 3D model.', 'Klicke jetzt dieses Teil im 3D-Modell an.')}</p>{clickMsg && <p className="font-medium">{clickMsg}</p>}</>}
        {step >= 2 && (
          <div>
            <div className="text-2xl font-bold">{part.nameEn}</div>
            <div className="text-cyan-700 dark:text-cyan-300">🇩🇪 {part.nameDe}</div>
            <div className="ipa text-slate-500">{part.pronunciationIPA}</div>
          </div>
        )}
        {step === 2 && <div className="flex gap-1.5"><SpeakBtn text={part.nameEn} label={L('Listen', 'Anhören')} /><SpeakBtn text={part.nameEn} slow label={L('slow', 'langsam')} /><SpeakBtn text={part.exampleSentences[0].en} label={L('Sentence', 'Satz')} /></div>}
        {step === 3 && (
          <div className="space-y-2">
            <p>{level === 'advanced' ? part.explanationB2 : part.explanationA1}</p>
            {level === 'intermediate' && <p className="text-slate-600 dark:text-slate-400">{part.explanationB2}</p>}
            <p className="text-slate-500">🇩🇪 {part.explanationDe}</p>
            <p className="font-medium">⚙ {part.mechanicalFunction}</p>
            <p className="rounded bg-slate-100 p-2 dark:bg-slate-800/60">“{part.exampleSentences[0].en}”<br /><span className="text-xs text-slate-500">{part.exampleSentences[0].de}</span></p>
          </div>
        )}
        {step === 4 && <><p className="font-semibold">🔁 {L('Listen and repeat the word three times.', 'Höre zu und sprich das Wort dreimal nach.')}</p><Pronounce part={part} /></>}
        {step === 5 && (
          <div className="space-y-1.5">
            <p className="font-semibold">✍ {L('What does it do?', 'Was macht es?')}</p>
            {opts.map((o) => (
              <button key={o.id} disabled={!!pick} onClick={() => { setPick(o.id); useStore.getState().grade(part.id, o.id === part.id ? 4 : 1, 'function'); }}
                className={`block w-full rounded-md border px-3 py-2 text-left ${pick && o.id === part.id ? 'border-emerald-500 bg-emerald-500/15' : pick === o.id ? 'border-rose-500 bg-rose-500/15' : 'border-slate-300 dark:border-slate-700'}`}>
                {o.mechanicalFunction}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1.5 pt-1">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>←</button>}
          {step < 5 ? <button className="btn btn-primary ml-auto" onClick={() => setStep(step + 1)}>{step === 1 ? L('Skip', 'Überspringen') : L('Next step', 'Nächster Schritt')} →</button>
            : <button className="btn btn-primary ml-auto" onClick={nextPart}>{L('Next word', 'Nächstes Wort')} →</button>}
        </div>
      </div>
    </div>
  );
}
