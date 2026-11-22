import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { PARTS, PART_MAP, partsOfModule, MODULE_MAP } from '../data';
import type { CarPart, QuizMode } from '../types';
import { isDue, mastery } from '../srs';
import { similarity, speak } from '../speech';
import { pick, shuffle, useL, SpeakBtn } from './common';
import { explainFeedback, type ExplainFeedback } from './feedback';
import { LearningCard } from './LearningCard';

const MODES: { id: QuizMode; n: number; en: string; de: string; needs3D?: boolean }[] = [
  { id: 'identify', n: 1, en: 'Identify the part', de: 'Bauteil benennen', needs3D: true },
  { id: 'find', n: 2, en: 'Find the component', de: 'Bauteil finden', needs3D: true },
  { id: 'function', n: 3, en: 'Understand the function', de: 'Funktion verstehen' },
  { id: 'en2de', n: 4, en: 'English → German', de: 'Englisch → Deutsch' },
  { id: 'de2en', n: 5, en: 'German → English', de: 'Deutsch → Englisch' },
  { id: 'listen', n: 6, en: 'Listening', de: 'Hörverstehen' },
  { id: 'explain', n: 7, en: 'Engineering explanation', de: 'Technisch erklären' },
];
type Scope = 'module' | 'all' | 'review';
interface Q { target: CarPart; options: CarPart[] }

function weight(id: string) {
  const p = useStore.getState().progress[id];
  if (!p) return 3;
  const m = mastery(p);
  return 1 + p.wrong * 2 + (isDue(p) ? 4 : 0) + (m === 'new' ? 2 : 0) - (m === 'mastered' ? 0.8 : 0);
}
function weightedPick(pool: CarPart[], avoid?: string) {
  const c = pool.length > 1 ? pool.filter((p) => p.id !== avoid) : pool;
  const ws = c.map((p) => weight(p.id));
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < c.length; i++) { r -= ws[i]; if (r <= 0) return c[i]; }
  return c[c.length - 1];
}

export function QuizPanel() {
  const L = useL();
  const level = useStore((s) => s.level);
  const moduleId = useStore((s) => s.moduleId);
  const scene = useStore((s) => s.scenePartIds);
  const quiz = useStore((s) => s.quiz);
  const quizTarget = useStore((s) => s.quizTarget);
  const [scope, setScope] = useState<Scope>('module');
  const [q, setQ] = useState<Q | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);
  const [fb, setFb] = useState<ExplainFeedback | null>(null);
  const [showMC, setShowMC] = useState(false);
  const [session, setSession] = useState({ a: 0, c: 0 });
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const mode = quiz.mode;
  const meta = MODES.find((m) => m.id === mode)!;

  const pool = useMemo(() => {
    const inScene = new Set(scene);
    let base: CarPart[] = scope === 'all' ? PARTS : scope === 'review'
      ? PARTS.filter((p) => { const pr = useStore.getState().progress[p.id]; return isDue(pr) || pr?.saved || (pr?.wrong ?? 0) > 0; })
      : partsOfModule(moduleId);
    if (meta.needs3D) base = base.filter((p) => inScene.has(p.id));
    return base;
  }, [scope, moduleId, scene.join(), meta.needs3D]);

  const next = (forced?: string) => {
    useStore.getState().setQuiz({ highlightId: null, awaitingClickFor: null, lastClickResult: null });
    setAnswer(null); setResult(null); setTyped(''); setTries(0); setDone(false); setFb(null); setShowMC(level === 'beginner'); setMsg('');
    const usable = pool.length ? pool : [];
    if (!usable.length && !forced) { setQ(null); return; }
    const target = forced ? PART_MAP[forced] : weightedPick(usable, q?.target.id);
    const sameMod = PARTS.filter((p) => p.id !== target.id && p.category === target.category && p.nameEn !== target.nameEn);
    const others = PARTS.filter((p) => p.id !== target.id && p.nameEn !== target.nameEn);
    const distract = shuffle(sameMod.length >= 3 ? sameMod : others).slice(0, 3);
    setQ({ target, options: shuffle([target, ...distract]) });
    if (mode === 'identify') { useStore.getState().setQuiz({ highlightId: target.id }); useStore.setState((s) => ({ focusToken: s.focusToken + 1, selectedId: null })); }
    if (mode === 'find') useStore.getState().setQuiz({ awaitingClickFor: target.id });
    if (mode === 'listen') setTimeout(() => speak(target.nameEn, 'en', useStore.getState().speechRate), 250);
  };

  // new question on mode/scope/module change, or when a card requested "Quiz this part"
  useEffect(() => {
    if (quizTarget) { const t = quizTarget; useStore.getState().set({ quizTarget: null }); next(t); }
    else next();
  }, [mode, scope, moduleId, pool.length]);
  useEffect(() => () => { useStore.getState().setQuiz({ highlightId: null, awaitingClickFor: null, lastClickResult: null }); }, []);

  const finish = (ok: boolean, quality?: number) => {
    if (!q) return;
    setDone(true); setResult(ok);
    useStore.getState().grade(q.target.id, quality ?? (ok ? (tries === 0 ? 4 : 3) : 1), mode);
    setSession((s) => ({ a: s.a + 1, c: s.c + (ok ? 1 : 0) }));
    useStore.getState().setQuiz({ awaitingClickFor: null, highlightId: mode === 'find' || mode === 'identify' ? q.target.id : null });
  };

  // "find" mode: react to 3D clicks
  const lastClick = useRef<unknown>(null);
  useEffect(() => {
    const r = quiz.lastClickResult;
    if (!r || r === lastClick.current || !q || done || mode !== 'find') return;
    lastClick.current = r;
    if (r.ok) { setMsg(L('Correct!', 'Richtig!')); finish(true); }
    else {
      const p = PART_MAP[r.id];
      setTries((n) => n + 1);
      setMsg(`${L('No – that is the', 'Nein – das ist')} ${p?.nameEn ?? r.id} (${p?.nameDe ?? ''}).`);
      if (tries + 1 >= 3) { setMsg((m) => m + ' ' + L('Here it is (highlighted).', 'Hier ist es (markiert).')); finish(false); }
    }
  }, [quiz.lastClickResult]);

  const choose = (opt: CarPart) => {
    if (done || !q) return;
    setAnswer(opt.id);
    finish(opt.id === q.target.id);
  };
  const checkTyped = () => {
    if (!q) return;
    const cands = [q.target.nameEn, ...(q.target.altEn?.split(/[\/,–]/).map((s) => s.replace(/\(.*\)/, '').trim()) ?? [])];
    const s = Math.max(...cands.map((c) => similarity(typed, c)));
    setAnswer(s >= 0.85 ? q.target.id : '__wrong');
    if (s >= 0.85 && s < 1) setMsg(L(`Accepted (small spelling difference). Correct spelling: ${q.target.nameEn}`, `Akzeptiert (kleiner Tippfehler). Richtig: ${q.target.nameEn}`));
    finish(s >= 0.85);
  };
  const checkExplain = () => {
    if (!q) return;
    const f = explainFeedback(typed, q.target);
    setFb(f);
    finish(f.score >= 0.34, f.score >= 0.67 ? 4 : f.score >= 0.34 ? 3 : 1);
  };

  const prompt = () => {
    if (!q) return '';
    const t = q.target;
    switch (mode) {
      case 'identify': return L('What is this part called in English?', 'Wie heißt dieses Bauteil auf Englisch?');
      case 'find': return `${L('Click on the', 'Klicke auf:')} ${t.nameEn}${level === 'beginner' ? ` (${t.nameDe})` : ''}`;
      case 'function': return `${L('What does the', 'Was macht')} ${t.nameEn} ${L('do?', '?')}`;
      case 'en2de': return `${L('Translate into German', 'Übersetze ins Deutsche')}: ${t.nameEn}`;
      case 'de2en': return `${L('Translate into English', 'Übersetze ins Englische')}: ${t.nameDe}`;
      case 'listen': return L('Listen. Which component do you hear?', 'Hör zu. Welches Bauteil hörst du?');
      case 'explain': return `${L('Describe in simple English how the', 'Beschreibe auf einfachem Englisch, wie')} ${t.nameEn} ${L('works.', 'funktioniert.')}`;
    }
  };
  const optLabel = (p: CarPart) => mode === 'function' ? p.mechanicalFunction : mode === 'en2de' ? p.nameDe : p.nameEn;
  const usesMC = mode === 'identify' || mode === 'function' || mode === 'en2de' || mode === 'listen' || (mode === 'de2en' && showMC);

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 gap-1">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => useStore.getState().setQuiz({ mode: m.id })}
            className={`flex items-center gap-2 rounded px-2 py-1 text-left ${mode === m.id ? 'bg-cyan-500/15 font-semibold text-cyan-800 dark:text-cyan-200' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'}`}>
            <span className="w-4 font-mono text-xs text-slate-500">{m.n}</span>{L(m.en, m.de)}{m.needs3D && <span className="ml-auto text-[10px] text-slate-400">3D</span>}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {(['module', 'all', 'review'] as Scope[]).map((s) => (
          <button key={s} onClick={() => setScope(s)} className={`btn flex-1 ${scope === s ? 'btn-on' : 'btn-ghost'}`}>
            {s === 'module' ? `${L('Module', 'Modul')} ${MODULE_MAP[moduleId].letter}` : s === 'all' ? L('All', 'Alle') : L('Review', 'Wiederholen')}
          </button>
        ))}
      </div>
      {meta.needs3D && scope === 'all' && <p className="text-[11px] text-slate-500">{L('3D modes use the parts visible in the current module.', '3D-Modi nutzen die Bauteile im aktuellen Modul.')}</p>}

      <div className="card space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{L('Session', 'Sitzung')}: {session.c}/{session.a}</span>
          <span>{L('Pool', 'Pool')}: {pool.length}</span>
        </div>
        {!q ? (
          <p className="text-slate-500">{scope === 'review' ? L('Nothing to review yet. Save words or answer some questions first.', 'Noch nichts zu wiederholen. Speichere Wörter oder beantworte zuerst Fragen.') : L('No parts available for this mode here.', 'Hier keine Bauteile für diesen Modus.')}</p>
        ) : (
          <>
            <div className="text-base font-semibold">{prompt()}</div>
            {mode === 'listen' && <div className="flex gap-1.5"><SpeakBtn text={q.target.nameEn} label={L('Play again', 'Nochmal')} /><SpeakBtn text={q.target.nameEn} slow label={L('slow', 'langsam')} /></div>}
            {mode === 'identify' && <p className="text-xs text-slate-500">{L('The part glows orange in the 3D view.', 'Das Bauteil leuchtet orange in der 3D-Ansicht.')}</p>}
            {mode === 'find' && !done && <p className="text-xs text-slate-500">{L('Rotate and zoom the model, then click the part. Use X-ray/Cutaway if it is hidden.', 'Modell drehen und zoomen, dann das Teil anklicken. Röntgen/Schnitt nutzen, falls verdeckt.')} ({L('attempts', 'Versuche')}: {tries}/3)</p>}

            {usesMC && (
              <div className="grid gap-1.5">
                {q.options.map((o) => {
                  const correct = done && o.id === q.target.id;
                  const wrong = done && answer === o.id && o.id !== q.target.id;
                  return (
                    <button key={o.id} disabled={done} onClick={() => choose(o)}
                      className={`rounded-md border px-3 py-2 text-left transition ${correct ? 'border-emerald-500 bg-emerald-500/15' : wrong ? 'border-rose-500 bg-rose-500/15' : 'border-slate-300 hover:border-cyan-500 dark:border-slate-700'}`}>
                      {optLabel(o)}
                    </button>
                  );
                })}
              </div>
            )}
            {mode === 'de2en' && !showMC && (
              <div className="flex gap-1.5">
                <input autoFocus value={typed} disabled={done} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !done && checkTyped()}
                  className="flex-1 rounded-md border border-slate-300 bg-transparent px-2 py-1.5 outline-none focus:border-cyan-500 dark:border-slate-700" placeholder={L('Type the English term…', 'Englischen Begriff eingeben…')} />
                <button className="btn btn-primary" disabled={done} onClick={checkTyped}>OK</button>
                <button className="btn btn-ghost" disabled={done} onClick={() => setShowMC(true)}>{L('Choices', 'Auswahl')}</button>
              </div>
            )}
            {mode === 'explain' && (
              <div className="space-y-1.5">
                <textarea value={typed} disabled={done} onChange={(e) => setTyped(e.target.value)} rows={4}
                  className="w-full rounded-md border border-slate-300 bg-transparent p-2 outline-none focus:border-cyan-500 dark:border-slate-700" placeholder={`The ${q.target.nameEn.toLowerCase()} …`} />
                {!done && <button className="btn btn-primary" onClick={checkExplain} disabled={typed.trim().length < 3}>{L('Check', 'Prüfen')}</button>}
              </div>
            )}

            {msg && <div className="text-sm font-medium">{msg}</div>}
            {done && (
              <div className="space-y-2 rounded-md bg-slate-100 p-2 dark:bg-slate-800/60">
                {mode !== 'explain' && (
                  <div className={result ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                    {result ? '✓ ' + L('Correct', 'Richtig') : '✗ ' + L('Answer', 'Lösung')}: {q.target.nameEn} · {q.target.nameDe}
                  </div>
                )}
                {fb && (
                  <div className="space-y-1">
                    <div className="font-semibold">{L('Content', 'Inhalt')}: {Math.round(fb.score * 100)}%</div>
                    {fb.found.length > 0 && <div className="text-emerald-600">✓ {L('Key ideas used', 'Verwendete Schlüsselbegriffe')}: {fb.found.join(', ')}</div>}
                    {fb.missing.length > 0 && <div className="text-amber-600">＋ {L('Could also mention', 'Könnte noch erwähnen')}: {fb.missing.join(', ')}</div>}
                    {fb.tips.map((t, i) => <div key={i} className="text-rose-600">✎ {t}</div>)}
                    <div className="pt-1"><span className="label">{L('Model answer', 'Musterantwort')}</span><p>{q.target.explanationA1}</p><p className="text-slate-500">{q.target.explanationB2}</p></div>
                    <p className="text-[11px] text-slate-500">{L('Automatic feedback checks key words and a few common grammar patterns. It is a helper, not a teacher’s correction.', 'Die automatische Rückmeldung prüft Schlüsselwörter und einige typische Grammatikfehler. Sie ersetzt keine Korrektur durch eine Lehrkraft.')}</p>
                  </div>
                )}
                {mode !== 'explain' && <p className="text-slate-600 dark:text-slate-300">⚙ {q.target.mechanicalFunction}</p>}
                <div className="flex gap-1.5">
                  <SpeakBtn text={q.target.nameEn} label={q.target.nameEn} />
                  <button className="btn btn-primary ml-auto" onClick={() => next()}>{L('Next', 'Weiter')} →</button>
                </div>
              </div>
            )}
            {!done && (mode === 'find' || mode === 'identify') && <button className="btn btn-ghost" onClick={() => { setTries(3); finish(false); }}>{L('Show answer', 'Lösung zeigen')}</button>}
          </>
        )}
      </div>
      {done && q && <details className="card"><summary className="cursor-pointer text-xs font-semibold">{L('Open learning card', 'Lernkarte öffnen')}</summary><div className="mt-2"><LearningCard part={q.target} compact /></div></details>}
    </div>
  );
}
