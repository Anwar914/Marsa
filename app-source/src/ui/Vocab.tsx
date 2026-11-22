import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { PARTS, MODULES, MODULE_MAP, getPart } from '../data';
import { isDue, mastery } from '../srs';
import { MasteryDot, SpeakBtn, useL } from './common';
import { LearningCard } from './LearningCard';

function Flashcards() {
  const L = useL();
  const progress = useStore((s) => s.progress);
  const due = useMemo(() => PARTS.filter((p) => isDue(progress[p.id]) || (progress[p.id]?.saved && !progress[p.id]?.lastReview)), [Object.keys(progress).length]);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [dir, setDir] = useState<'en' | 'de'>('de');
  const p = due[i];
  if (!p) return <div className="card text-sm text-slate-500">{L('No cards due. Save words (☆) or do quizzes – difficult words come back here automatically.', 'Keine Karten fällig. Wörter speichern (☆) oder Quiz machen – schwierige Wörter erscheinen hier automatisch.')}</div>;
  const rate = (q: number) => { useStore.getState().grade(p.id, q); setFlip(false); setI((x) => x + 1); };
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{L('Spaced repetition', 'Verteilte Wiederholung')} · {i + 1}/{due.length}</span>
        <button className="btn btn-ghost" onClick={() => setDir(dir === 'de' ? 'en' : 'de')}>{dir === 'de' ? 'DE → EN' : 'EN → DE'}</button>
      </div>
      <button onClick={() => setFlip(true)} className="flex min-h-[140px] w-full flex-col items-center justify-center rounded-lg border border-slate-300 p-4 text-center dark:border-slate-700">
        <div className="text-2xl font-bold">{dir === 'de' ? p.nameDe : p.nameEn}</div>
        {flip ? (
          <div className="mt-2 space-y-1">
            <div className="text-xl text-cyan-600 dark:text-cyan-300">{dir === 'de' ? p.nameEn : p.nameDe}</div>
            <div className="ipa text-slate-500">{p.pronunciationIPA}</div>
            <div className="text-sm text-slate-500">{p.mechanicalFunction}</div>
          </div>
        ) : <div className="mt-2 text-xs text-slate-400">{L('Think of the answer, then click to reveal', 'Antwort überlegen, dann klicken')}</div>}
      </button>
      {flip && (
        <div className="flex flex-wrap gap-1.5">
          <SpeakBtn text={p.nameEn} label="EN" />
          <button className="btn btn-ghost border-rose-400 text-rose-600" onClick={() => rate(1)}>{L('Again', 'Nochmal')}</button>
          <button className="btn btn-ghost border-amber-400 text-amber-600" onClick={() => rate(3)}>{L('Hard', 'Schwer')}</button>
          <button className="btn btn-ghost border-emerald-400 text-emerald-600" onClick={() => rate(4)}>{L('Good', 'Gut')}</button>
          <button className="btn btn-ghost border-sky-400 text-sky-600" onClick={() => rate(5)}>{L('Easy', 'Leicht')}</button>
        </div>
      )}
    </div>
  );
}

export function VocabView() {
  const L = useL();
  const progress = useStore((s) => s.progress);
  const [filter, setFilter] = useState<'saved' | 'all' | 'difficult'>('saved');
  const [mod, setMod] = useState<string>('all');
  const [open, setOpen] = useState<string | null>(null);
  const list = PARTS.filter((p) => (mod === 'all' || p.category === mod) && (filter === 'all' || (filter === 'saved' ? progress[p.id]?.saved : (progress[p.id]?.wrong ?? 0) > 0)));
  const op = getPart(open);
  const exportCsv = () => {
    const rows = [['English', 'German', 'IPA', 'Module', 'Function'], ...list.map((p) => [p.nameEn, p.nameDe, p.pronunciationIPA, MODULE_MAP[p.category].nameEn, p.mechanicalFunction])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'auto-anatomy-vocabulary.csv'; a.click();
  };
  return (
    <div className="grid h-full gap-4 overflow-hidden lg:grid-cols-[1fr_380px]">
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['saved', 'difficult', 'all'] as const).map((f) => <button key={f} className={`btn ${filter === f ? 'btn-on' : 'btn-ghost'}`} onClick={() => setFilter(f)}>{f === 'saved' ? '★ ' + L('Saved', 'Gespeichert') : f === 'difficult' ? L('Difficult', 'Schwierig') : L('All words', 'Alle Wörter')}</button>)}
          <select className="btn btn-ghost" value={mod} onChange={(e) => setMod(e.target.value)}>
            <option value="all">{L('All modules', 'Alle Module')}</option>
            {MODULES.map((m) => <option key={m.id} value={m.id}>{m.letter} · {L(m.nameEn, m.nameDe)}</option>)}
          </select>
          <span className="text-xs text-slate-500">{list.length} {L('words', 'Wörter')}</span>
          <button className="btn btn-ghost ml-auto" onClick={exportCsv}>⬇ CSV</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 scroll-thin dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 text-left text-xs text-slate-500 dark:bg-slate-900"><tr><th className="p-2"></th><th className="p-2">English</th><th className="p-2">Deutsch</th><th className="hidden p-2 md:table-cell">IPA</th><th className="p-2">✓/✗</th><th></th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} onClick={() => setOpen(p.id)} className={`cursor-pointer border-t border-slate-200 hover:bg-cyan-500/5 dark:border-slate-800 ${open === p.id ? 'bg-cyan-500/10' : ''}`}>
                  <td className="p-2"><MasteryDot id={p.id} /></td>
                  <td className="p-2 font-medium">{p.nameEn}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300">{p.nameDe}</td>
                  <td className="ipa hidden p-2 text-xs text-slate-500 md:table-cell">{p.pronunciationIPA}</td>
                  <td className="p-2 text-xs">{progress[p.id]?.correct ?? 0}/{progress[p.id]?.wrong ?? 0}</td>
                  <td className="p-2"><SpeakBtn text={p.nameEn} /></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-slate-500">{filter === 'saved' ? L('No saved words yet. Click ☆ Save word on a learning card.', 'Noch keine gespeicherten Wörter. Auf einer Lernkarte ☆ klicken.') : L('Nothing here yet.', 'Noch nichts vorhanden.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="min-h-0 space-y-3 overflow-auto pr-1 scroll-thin">
        <Flashcards />
        {op && <div className="card"><LearningCard part={op} /></div>}
      </div>
    </div>
  );
}
