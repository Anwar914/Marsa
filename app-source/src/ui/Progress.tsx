import { useStore } from '../store';
import { MODULES, PARTS, partsOfModule } from '../data';
import { mastery, isDue } from '../srs';
import { useL } from './common';
import { readCourseSummary } from '../course/link';
import { dayKey } from '../store';

function unionStreak(logs: Record<string, { n: number }>[]) {
  const has = (k: string) => logs.some((l) => (l[k]?.n ?? 0) > 0);
  const d = new Date(); let n = 0;
  if (!has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/** Combined 14-day activity: 3D app answers + course answers (stacked bars). */
function ActivityChart({ app, course }: { app: Record<string, { n: number; c: number }>; course: Record<string, { n: number; c: number }> }) {
  const L = useL();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = dayKey(d); return { k, label: `${d.getDate()}.${d.getMonth() + 1}.`, a: app[k]?.n ?? 0, c: course[k]?.n ?? 0 }; });
  const max = Math.max(5, ...days.map((d) => d.a + d.c));
  const W = 560, H = 160, bw = W / 14;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label="Answers per day, last 14 days">
        {days.map((d, i) => {
          const ha = (d.a / max) * (H - 36), hc = (d.c / max) * (H - 36), x = i * bw + 5, w = bw - 10;
          return (
            <g key={d.k}>
              <title>{`${d.label} 3D: ${d.a} · Course: ${d.c}`}</title>
              <rect x={x} y={H - 20 - hc} width={w} height={hc} rx={3} fill="#10b981" />
              <rect x={x} y={H - 20 - hc - ha} width={w} height={ha} rx={3} fill="#06b6d4" />
              {d.a + d.c > 0 && <text x={x + w / 2} y={H - 24 - hc - ha} textAnchor="middle" fontSize="10" fill="currentColor" opacity={0.7}>{d.a + d.c}</text>}
              <text x={x + w / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.55}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 text-xs text-slate-500"><span><b className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-cyan-500" />{L('3D anatomy', '3D-Anatomie')}</span><span><b className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />{L('Course (Technical English)', 'Kurs (Technical English)')}</span></div>
    </div>
  );
}


const MODE_NAMES: Record<string, [string, string]> = {
  identify: ['Identify', 'Benennen'], find: ['Find', 'Finden'], function: ['Function', 'Funktion'], en2de: ['EN→DE', 'EN→DE'],
  de2en: ['DE→EN', 'DE→EN'], listen: ['Listening', 'Hören'], explain: ['Explain', 'Erklären'],
};

export function ProgressView() {
  const L = useL();
  const progress = useStore((s) => s.progress);
  const qs = useStore((s) => s.quizStats);
  const appLog = useStore((s) => s.log);
  useStore((s) => s.courseTick); // re-read the course summary when the course reports progress
  const cs = readCourseSummary();
  const streakAll = unionStreak([appLog, cs?.log ?? {}]);
  const goCourse = (route: string) => useStore.getState().set({ tab: 'course', courseRoute: route });
  const streak = useStore((s) => s.streak);
  const counts = { new: 0, learning: 0, review: 0, mastered: 0 } as Record<string, number>;
  PARTS.forEach((p) => counts[mastery(progress[p.id])]++);
  const due = PARTS.filter((p) => isDue(progress[p.id])).length;
  const saved = PARTS.filter((p) => progress[p.id]?.saved).length;
  const Stat = ({ v, l, c }: { v: string | number; l: string; c?: string }) => <div className="card"><div className={`text-2xl font-bold ${c ?? ''}`}>{v}</div><div className="text-xs text-slate-500">{l}</div></div>;
  return (
    <div className="h-full space-y-4 overflow-auto pr-1 scroll-thin">
      <section className="card space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{L('Overall progress', 'Gesamtfortschritt')}</h2>
          <span className="text-2xl font-bold">🔥 {streakAll} <span className="text-sm font-normal text-slate-500">{streakAll === 1 ? L('day in a row (3D + course)', 'Tag in Folge (3D + Kurs)') : L('days in a row (3D + course)', 'Tage in Folge (3D + Kurs)')}</span></span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div><div className="label mb-1">{L('Last 14 days', 'Letzte 14 Tage')}</div><ActivityChart app={appLog} course={cs?.log ?? {}} /></div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-cyan-500/10 p-2"><div className="label">{L('3D words seen', '3D-Wörter gesehen')}</div><div className="text-xl font-bold">{PARTS.length - counts.new}/{PARTS.length}</div></div>
            <div className="rounded-md bg-cyan-500/10 p-2"><div className="label">{L('3D quiz accuracy', '3D-Quizquote')}</div><div className="text-xl font-bold">{qs.answered ? `${Math.round((qs.correct / qs.answered) * 100)}%` : '–'}</div></div>
            {cs ? <>
              <button onClick={() => goCourse('plan')} className="rounded-md bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20"><div className="label">{L('Course readiness', 'Kurs-Bereitschaft')}</div><div className="text-xl font-bold">{cs.readiness}%</div></button>
              <button onClick={() => goCourse('vocab/A1')} className="rounded-md bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20"><div className="label">{L('Worksheets correct', 'Übungen richtig')}</div><div className="text-xl font-bold">{cs.worksheetsCorrect}/{cs.total}</div></button>
              <button onClick={() => goCourse('mistakes')} className="rounded-md bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20"><div className="label">{L('Course mistakes to review', 'Kursfehler zu wiederholen')}</div><div className="text-xl font-bold">{cs.mistakes}</div></button>
              <button onClick={() => goCourse('vocab')} className="rounded-md bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20"><div className="label">{L('Course flashcards', 'Kurs-Karteikarten')}</div><div className="text-xl font-bold">{cs.flashMastered}/{cs.flashTotal} <span className="text-xs font-normal">· {cs.flashDue} {L('due', 'fällig')}</span></div></button>
              <button onClick={() => goCourse('exams')} className="col-span-2 rounded-md bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20"><div className="label">{L('Best practice exam', 'Beste Probeklausur')}</div><div className="text-xl font-bold">{cs.examsDone ? `${cs.bestExam}/60` : L('not taken yet', 'noch nicht geschrieben')} <span className="text-xs font-normal text-slate-500">{L('target 40/60', 'Ziel 40/60')}</span></div></button>
            </> : <button onClick={() => goCourse('home')} className="col-span-2 rounded-md bg-emerald-500/10 p-3 text-left hover:bg-emerald-500/20">🎓 {L('Open the Course tab once to include your Technical English progress here.', 'Öffne einmal den Kurs-Tab, damit dein Technical-English-Fortschritt hier erscheint.')}</button>}
          </div>
        </div>
        {cs && (
          <div>
            <div className="label mb-1">{L('Course worksheets', 'Kurs-Übungsblätter')}</div>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {cs.groups.map((g) => (
                <button key={g.id} onClick={() => goCourse((g.id[0] === 'A' ? 'vocab/' : 'grammar/') + g.id)} className="flex items-center gap-2 text-left text-sm hover:opacity-80">
                  <span className="w-7 font-mono text-xs font-bold text-slate-500">{g.id}</span>
                  <span className="relative h-2 flex-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                    <span className="absolute inset-y-0 left-0 bg-amber-400/60" style={{ width: `${(g.t / g.n) * 100}%` }} />
                    <span className="absolute inset-y-0 left-0 bg-emerald-500" style={{ width: `${(g.c / g.n) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right text-xs text-slate-500">{g.c}/{g.n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {cs && (['b1', 'b2'] as const).map((lv) => {
          const u = cs[lv];
          if (!u) return null;
          const t = cs.tests?.[lv];
          return (
            <div key={lv}>
              <div className="label mb-1 flex flex-wrap justify-between gap-2">
                <span>{lv.toUpperCase()} {L('grammar unit', 'Grammatik')} · {u.c}/{u.n} {L('correct', 'richtig')} · {L('final test', 'Abschlusstest')}: {t?.n ? `${L('best', 'beste')} ${t.best}% (${t.n}×)` : L('not taken', 'noch nicht')}</span>
                <span className="flex gap-3"><button className="text-cyan-600 hover:underline" onClick={() => goCourse(lv)}>{L('Topics', 'Themen')} →</button><button className="text-cyan-600 hover:underline" onClick={() => goCourse('test/' + lv)}>{L('Test', 'Test')} →</button></span>
              </div>
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {u.groups.map((g, k) => (
                  <button key={g.id} onClick={() => goCourse(lv + '/' + g.id)} className="flex items-center gap-2 text-left text-sm hover:opacity-80" title={g.title}>
                    <span className="w-44 truncate text-xs text-slate-500">{k + 1}. {g.title}</span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                      <span className="absolute inset-y-0 left-0 bg-amber-400/60" style={{ width: `${(g.t / g.n) * 100}%` }} />
                      <span className="absolute inset-y-0 left-0 bg-emerald-500" style={{ width: `${(g.c / g.n) * 100}%` }} />
                    </span>
                    <span className="w-9 text-right text-xs text-slate-500">{g.c}/{g.n}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>
      <h3 className="label">{L('3D anatomy vocabulary', '3D-Anatomie-Vokabular')}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat v={PARTS.length - counts.new} l={L(`of ${PARTS.length} words seen`, `von ${PARTS.length} Wörtern gesehen`)} />
        <Stat v={counts.mastered} l={L('mastered (interval ≥ 7 days)', 'sicher (Intervall ≥ 7 Tage)')} c="text-emerald-500" />
        <Stat v={due} l={L('due for review', 'fällig zur Wiederholung')} c="text-amber-500" />
        <Stat v={saved} l={L('saved words', 'gespeicherte Wörter')} />
        <Stat v={qs.answered ? `${Math.round((qs.correct / qs.answered) * 100)}%` : '–'} l={L(`quiz accuracy (${qs.answered} answers)`, `Quiz-Trefferquote (${qs.answered} Antworten)`)} />
        <Stat v={`${streak.days} 🔥`} l={L('day streak', 'Tage in Folge')} />
      </div>
      <div className="card">
        <div className="label mb-2">{L('Mastery', 'Lernstand')}</div>
        <div className="flex h-4 overflow-hidden rounded">
          {(['mastered', 'review', 'learning', 'new'] as const).map((k) => (
            <div key={k} title={`${k}: ${counts[k]}`} style={{ width: `${(counts[k] / PARTS.length) * 100}%` }} className={{ mastered: 'bg-emerald-500', review: 'bg-sky-400', learning: 'bg-amber-400', new: 'bg-slate-300 dark:bg-slate-700' }[k]} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>🟢 {L('mastered', 'sicher')} {counts.mastered}</span><span>🔵 {L('reviewing', 'in Wiederholung')} {counts.review}</span><span>🟡 {L('learning', 'am Lernen')} {counts.learning}</span><span>⚪ {L('new', 'neu')} {counts.new}</span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="label mb-2">{L('By module', 'Nach Modul')}</div>
          <div className="space-y-1.5">
            {MODULES.map((m) => {
              const ps = partsOfModule(m.id);
              const seen = ps.filter((p) => mastery(progress[p.id]) !== 'new').length;
              const mast = ps.filter((p) => mastery(progress[p.id]) === 'mastered').length;
              return (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 font-mono text-xs font-bold text-slate-500">{m.letter}</span>
                  <span className="w-44 truncate">{L(m.nameEn, m.nameDe)}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                    <div className="absolute inset-y-0 left-0 bg-sky-400" style={{ width: `${(seen / ps.length) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-emerald-500" style={{ width: `${(mast / ps.length) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs text-slate-500">{seen}/{ps.length}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="label mb-2">{L('Quiz modes', 'Quiz-Modi')}</div>
          <div className="space-y-1.5 text-sm">
            {Object.entries(MODE_NAMES).map(([k, n]) => {
              const s = qs.byMode[k];
              return (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-24">{L(n[0], n[1])}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-800"><div className="h-full bg-cyan-500" style={{ width: s ? `${(s.c / s.a) * 100}%` : 0 }} /></div>
                  <span className="w-16 text-right text-xs text-slate-500">{s ? `${s.c}/${s.a}` : '–'}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">{L('Progress is stored in this browser (localStorage). Clearing site data deletes it.', 'Der Fortschritt wird in diesem Browser gespeichert (localStorage). Löschen der Websitedaten entfernt ihn.')}</p>
          <button className="btn btn-ghost mt-2 border-rose-400 text-rose-600" onClick={() => { if (confirm(L('Reset all learning progress?', 'Gesamten Lernfortschritt zurücksetzen?'))) useStore.getState().resetProgress(); }}>{L('Reset progress', 'Fortschritt zurücksetzen')}</button>
        </div>
      </div>
    </div>
  );
}
