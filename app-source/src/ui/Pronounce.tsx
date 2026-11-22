import { useState } from 'react';
import { listen, recognitionSupported, similarity, speak } from '../speech';
import { useStore } from '../store';
import type { CarPart } from '../types';
import { useL } from './common';

/** Pronunciation practice: listen → repeat → speech-to-text comparison (NOT phoneme-level assessment). */
export function Pronounce({ part, onResult }: { part: CarPart; onResult?: (score: number) => void }) {
  const L = useL();
  const rate = useStore((s) => s.speechRate);
  const [state, setState] = useState<'idle' | 'listening' | 'done' | 'error'>('idle');
  const [heard, setHeard] = useState<string>('');
  const [score, setScore] = useState(0);
  const [err, setErr] = useState('');
  const targets = [part.nameEn, ...(part.altEn ? part.altEn.split(/[\/,–]/).map((x) => x.trim()) : [])].filter((x) => /^[\x00-\x7F’'\-\s()]+$/.test(x));

  const go = async () => {
    setState('listening'); setErr('');
    try {
      const r = await listen('en-GB');
      let best = 0, bestT = r.transcripts[0] ?? '';
      for (const tr of r.transcripts) for (const tg of targets) { const s = similarity(tr, tg); if (s > best) { best = s; bestT = tr; } }
      setHeard(bestT); setScore(best); setState('done'); onResult?.(best);
    } catch (e: any) { setErr(e.message || String(e)); setState('error'); }
  };
  const verdict = score >= 0.9 ? L('Recognised correctly ✓', 'Korrekt erkannt ✓') : score >= 0.7 ? L('Almost – try again', 'Fast – noch einmal') : L('Not recognised – listen and repeat', 'Nicht erkannt – anhören und wiederholen');
  return (
    <div className="space-y-2 rounded-md border border-dashed border-cyan-500/50 p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-ghost" onClick={() => speak(part.nameEn, 'en', 0.6)}>🐢 {L('Slow', 'Langsam')}</button>
        <button className="btn btn-ghost" onClick={() => speak(part.nameEn, 'en', rate)}>🔊 {L('Normal', 'Normal')}</button>
        <button className="btn btn-primary" disabled={!recognitionSupported || state === 'listening'} onClick={go}>
          🎙 {state === 'listening' ? L('Listening…', 'Höre zu…') : L('Say it', 'Sprich es')}
        </button>
      </div>
      {state === 'done' && (
        <div>
          <div>{L('Browser heard', 'Der Browser hat verstanden')}: <b>“{heard}”</b> · {L('text match', 'Textübereinstimmung')} {Math.round(score * 100)}%</div>
          <div className={score >= 0.9 ? 'text-emerald-600' : score >= 0.7 ? 'text-amber-600' : 'text-rose-600'}>{verdict}</div>
        </div>
      )}
      {state === 'error' && <div className="text-rose-600">{err}</div>}
      <p className="text-[11px] leading-snug text-slate-500">
        {recognitionSupported
          ? L('Note: this is speech-to-text matching. The browser turns your voice into text and the app compares the text with the word. It does not measure individual sounds, stress or accent – a match means the word was understandable, not that the pronunciation is perfect.',
              'Hinweis: Das ist ein Sprache-zu-Text-Abgleich. Der Browser wandelt deine Stimme in Text um, die App vergleicht den Text mit dem Wort. Einzelne Laute, Betonung oder Akzent werden nicht bewertet – ein Treffer heißt „verständlich“, nicht „perfekt ausgesprochen“.')
          : L('Speech recognition is not available in this browser (try Chrome or Edge). You can still practise: listen, repeat aloud three times, compare with the IPA.', 'Spracherkennung ist in diesem Browser nicht verfügbar (Chrome oder Edge probieren). Üben geht trotzdem: anhören, dreimal laut wiederholen, mit der Lautschrift vergleichen.')}
      </p>
    </div>
  );
}
