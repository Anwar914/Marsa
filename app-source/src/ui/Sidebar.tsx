import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { MODULES, PARTS, MODULE_MAP, partsOfModule, PART_MAP } from '../data';
import { useT } from '../i18n';
import { MasteryDot, useL } from './common';
import { normalize } from '../speech';
import { mastery } from '../srs';

export function Sidebar() {
  const t = useT(); const L = useL();
  const moduleId = useStore((s) => s.moduleId);
  const selectedId = useStore((s) => s.selectedId);
  const progress = useStore((s) => s.progress);
  const scene = useStore((s) => s.scenePartIds);
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const n = normalize(q);
    if (n.length < 2) return [];
    return PARTS.filter((p) => normalize(`${p.nameEn} ${p.nameDe} ${p.altEn ?? ''}`).includes(n)).slice(0, 12);
  }, [q]);
  const modParts = partsOfModule(moduleId);
  const inScene = new Set(scene);

  const goTo = (id: string) => {
    const p = PART_MAP[id];
    const s = useStore.getState();
    if (!p.modules.includes(s.moduleId)) s.setModule(p.modules[0]);
    if (s.tab === 'vocab' || s.tab === 'progress') s.set({ tab: 'explore' });
    setTimeout(() => { useStore.getState().select(id); useStore.setState((st) => ({ focusToken: st.focusToken + 1 })); }, 60);
    setQ('');
  };

  return (
    <aside className="flex h-full w-full flex-col gap-3 overflow-hidden">
      <div className="relative">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900" />
        {results.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-xl scroll-thin dark:border-slate-700 dark:bg-slate-900">
            {results.map((p) => (
              <button key={p.id} onClick={() => goTo(p.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cyan-500/10">
                <MasteryDot id={p.id} />
                <span className="flex-1"><b>{p.nameEn}</b> <span className="text-slate-500">· {p.nameDe}</span></span>
                <span className="text-[10px] text-slate-400">{MODULE_MAP[p.modules[0]].letter}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="label">{t('systems')}</div>
      <div className="grid grid-cols-1 gap-1 overflow-auto scroll-thin" style={{ maxHeight: '42%' }}>
        {MODULES.map((m) => {
          const ps = partsOfModule(m.id);
          const done = ps.filter((p) => mastery(progress[p.id]) !== 'new').length;
          const active = m.id === moduleId;
          return (
            <button key={m.id} onClick={() => useStore.getState().setModule(m.id)}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${active ? 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-200' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${active ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{m.letter}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{L(m.nameEn, m.nameDe)}</span>
                <span className="mt-0.5 block h-1 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                  <span className="block h-full bg-emerald-500" style={{ width: `${(done / ps.length) * 100}%` }} />
                </span>
              </span>
              <span className="text-[10px] text-slate-500">{done}/{ps.length}</span>
            </button>
          );
        })}
      </div>

      <div className="label flex items-center justify-between"><span>{t('components')} · {MODULE_MAP[moduleId].letter}</span><span className="normal-case tracking-normal">{modParts.length}</span></div>
      <div className="min-h-0 flex-1 overflow-auto pr-1 scroll-thin">
        {modParts.map((p) => {
          const present = inScene.has(p.id);
          return (
            <button key={p.id} onClick={() => present ? useStore.getState().select(p.id) : goTo(p.id)}
              onDoubleClick={() => useStore.setState((s) => ({ focusToken: s.focusToken + 1 }))}
              onMouseEnter={() => present && useStore.setState({ hoveredId: p.id })}
              onMouseLeave={() => useStore.getState().hoveredId === p.id && useStore.setState({ hoveredId: null })}
              className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] ${selectedId === p.id ? 'bg-cyan-500/20 font-semibold' : 'hover:bg-slate-200/60 dark:hover:bg-slate-800'}`}>
              <MasteryDot id={p.id} />
              <span className="flex-1 truncate">{p.nameEn} <span className="text-slate-500">· {p.nameDe}</span></span>
              {!present && <span title={L('Shown in another module', 'In anderem Modul sichtbar')} className="text-[10px] text-slate-400">↗</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
