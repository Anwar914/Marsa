import { useStore, type EngineType } from '../store';
import { MODULE_MAP } from '../data';
import { useT } from '../i18n';
import { useL } from './common';
import { Icon, type IconName } from './icons';
import { useAnim, STROKES, OMEGA } from '../three/anim';
import { clock } from '../three/registry';
import { ENGINE_CONFIGS } from '../three/models/EngineTypes';

function TB({ on, onClick, icon, label, title, wide }: { on?: boolean; onClick: () => void; icon?: IconName; label?: string; title?: string; wide?: boolean }) {
  return (
    <button title={title ?? label} aria-label={title ?? label} aria-pressed={on} onClick={onClick} className={`toolbtn ${on ? 'toolbtn-on' : ''}`}>
      {icon && <Icon name={icon} size={15} />}
      {label && <span className={wide ? '' : 'hidden min-[1700px]:inline'}>{label}</span>}
    </button>
  );
}

/** Compact viewer toolbar: grouped icon buttons, labels on wide screens, horizontal scroll on phones. */
export function Toolbar({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const t = useT(); const L = useL();
  const s = useStore();
  const mod = MODULE_MAP[s.moduleId];
  const hasCut = ['exterior', 'interior', 'engine', 'brakes', 'drivetrain', 'electrical', 'filters'].includes(s.moduleId);
  const hasXray = s.moduleId === 'exterior' || s.moduleId === 'interior';
  const fs = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) el?.requestFullscreen?.(); else document.exitFullscreen();
  };
  return (
    <div className="no-scrollbar pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto">
      {(hasXray || hasCut) && (
        <div className="toolgroup">
          {hasXray && <TB on={s.xray} icon="xray" label={t('xray')} title={L('X-ray: transparent body', 'Röntgen: transparente Karosserie')} onClick={() => s.set({ xray: !s.xray })} />}
          {hasCut && <TB on={s.cutaway} icon="cut" label={t('cutaway')} title={L('Cutaway / section view', 'Schnittansicht')} onClick={() => s.set({ cutaway: !s.cutaway })} />}
        </div>
      )}
      <div className="toolgroup px-2" title={L('Exploded view', 'Explosionsansicht')}>
        <Icon name="explode" size={15} className="text-slate-500" />
        <input aria-label={t('explode')} type="range" min={0} max={1} step={0.01} value={s.explode} onChange={(e) => s.set({ explode: +e.target.value })} className="h-8 w-20 accent-brand-500 sm:w-24" />
      </div>
      <div className="toolgroup">
        <TB on={!!s.isolatedId} icon="isolate" label={s.isolatedId ? t('showAll') : t('isolate')} title={L('Show only the selected component', 'Nur das ausgewählte Bauteil zeigen')} onClick={() => s.set({ isolatedId: s.isolatedId ? null : s.selectedId })} />
        <TB icon="focus" label={t('focus')} onClick={() => useStore.setState((x) => ({ focusToken: x.focusToken + 1 }))} />
        <TB icon="reset" label={t('reset')} onClick={() => s.set({ camToken: s.camToken + 1, explode: 0, isolatedId: null })} />
        <TB on={s.showLabels} icon="label" title={t('labels')} onClick={() => s.set({ showLabels: !s.showLabels })} />
        <TB icon="fullscreen" title={t('fullscreen')} onClick={fs} />
      </div>
      {mod.hasAnimation && (
        <div className="toolgroup">
          <TB on={s.playing} icon={s.playing ? 'pause' : 'play'} label={L(mod.animLabelEn!, mod.animLabelDe!)} title={s.playing ? t('pause') : t('play')} onClick={() => s.set({ playing: !s.playing })} />
          <select aria-label={t('speed')} value={s.speed} onChange={(e) => s.set({ speed: +e.target.value })} className="h-8 rounded-md bg-transparent px-1 text-xs text-slate-600 outline-none hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            {[0.25, 0.5, 1, 2, 4].map((v) => <option key={v} value={v}>{v}×</option>)}
          </select>
        </div>
      )}
      {s.moduleId === 'engineTypes' && (
        <div className="toolgroup">
          {(['i4', 'v6', 'v8'] as EngineType[]).map((e) => <TB key={e} wide on={s.engineType === e} label={e === 'i4' ? 'I4' : e.toUpperCase()} onClick={() => s.set({ engineType: e, selectedId: null, isolatedId: null })} />)}
        </div>
      )}
      {s.moduleId === 'drivetrain' && (
        <div className="toolgroup">
          <TB wide on={s.gearbox === 'manual'} label={L('Manual', 'Schaltung')} onClick={() => s.set({ gearbox: 'manual' })} />
          <TB wide on={s.gearbox === 'automatic'} label={L('Automatic', 'Automatik')} onClick={() => s.set({ gearbox: 'automatic' })} />
        </div>
      )}
    </div>
  );
}

/** Module-specific overlay information (stroke indicator, pressure, comparison table). */
export function Hud() {
  const L = useL();
  const moduleId = useStore((s) => s.moduleId);
  const engineType = useStore((s) => s.engineType);
  const gearbox = useStore((s) => s.gearbox);
  const stroke = useAnim((a) => a.stroke);
  const crankDeg = useAnim((a) => a.crankDeg);
  const info = useAnim((a) => a.info);
  if (moduleId === 'engine') {
    const jump = (i: number) => { clock.t = ((i * 180 + 90) * Math.PI / 180) / OMEGA; useStore.setState({ playing: false }); };
    return (
      <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/90 p-2.5 text-xs shadow-panel backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/85">
        <div className="mb-1 font-semibold">{L('Cylinder 1', 'Zylinder 1')} · {L('crank angle', 'Kurbelwinkel')} {crankDeg}° / 720°</div>
        <div className="flex gap-1">
          {STROKES.map((st, i) => (
            <button key={i} onClick={() => jump(i)} className={`rounded px-2 py-1 font-medium ${stroke === i ? 'text-white' : 'opacity-60 hover:opacity-100'}`} style={{ background: stroke === i ? st.color : 'transparent', border: `1px solid ${st.color}` }}>
              {i + 1}. {st.en}<span className="block text-[10px] font-normal">{st.de}</span>
            </button>
          ))}
        </div>
        <div className="mt-1 max-w-sm text-[11px] text-slate-500 dark:text-slate-400">{L('Firing order 1-3-4-2. Camshafts turn at half crankshaft speed. Colours show the gas: blue = fresh mixture, violet = compressed, orange = burning, grey = exhaust. Click a stroke to jump there.', 'Zündfolge 1-3-4-2. Nockenwellen drehen mit halber Kurbelwellendrehzahl. Farben: blau = Frischgas, violett = verdichtet, orange = Verbrennung, grau = Abgas. Takt anklicken zum Springen.')}</div>
        <button className="mt-1 rounded border border-cyan-500/60 px-2 py-1 text-[11px] font-medium text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300" onClick={() => useStore.getState().set({ tab: 'course', courseRoute: 'writing/0' })}>📝 {L('Writing task: describe the four-stroke engine (course)', 'Schreibaufgabe: Viertaktmotor beschreiben (Kurs)')}</button>
      </div>
    );
  }
  if (moduleId === 'engineTypes') {
    const c = ENGINE_CONFIGS[engineType];
    return (
      <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/90 p-2.5 text-xs shadow-panel backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/85">
        <table className="text-left">
          <thead><tr className="text-slate-500"><th className="pr-3"></th>{Object.values(ENGINE_CONFIGS).map((e) => <th key={e.id} className={`pr-3 ${e.id === engineType ? 'text-cyan-500' : ''}`}>{e.name}</th>)}</tr></thead>
          <tbody>
            <tr><td className="pr-3 text-slate-500">{L('Pistons', 'Kolben')}</td>{Object.values(ENGINE_CONFIGS).map((e) => <td key={e.id}>{e.cyls.length}</td>)}</tr>
            <tr><td className="pr-3 text-slate-500">{L('Arrangement', 'Anordnung')}</td>{Object.values(ENGINE_CONFIGS).map((e) => <td key={e.id}>{e.vAngle ? `2 × ${e.cyls.length / 2}, ${e.vAngle}° V` : L('1 row', '1 Reihe')}</td>)}</tr>
            <tr><td className="pr-3 text-slate-500">{L('Firing interval', 'Zündabstand')}</td>{Object.values(ENGINE_CONFIGS).map((e) => <td key={e.id}>{e.interval}°</td>)}</tr>
            <tr><td className="pr-3 text-slate-500">{L('Firing order', 'Zündfolge')}</td>{Object.values(ENGINE_CONFIGS).map((e) => <td key={e.id} className="pr-3">{e.firing.join('-')}</td>)}</tr>
          </tbody>
        </table>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{L('Crankshaft', 'Kurbelwelle')}: {c.crank}. {L('Orange flash = power stroke begins. Camshafts/valves omitted in this comparison view.', 'Orange = Beginn Arbeitstakt. Nockenwellen/Ventile in dieser Vergleichsansicht weggelassen.')}</div>
      </div>
    );
  }
  if (moduleId === 'brakes') return <div className="rounded-xl border border-slate-200 bg-white/90 p-2.5 text-xs shadow-panel backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/85"><b>{L('Hydraulics', 'Hydraulik')}:</b> {info}<div className="text-[11px] text-slate-500">{L('Pedal → master cylinder → brake fluid → pistons → pads/shoes → friction slows the disc/drum. Clearances exaggerated. Left: disc brake · Right: drum brake (cutaway).', 'Pedal → Hauptbremszylinder → Bremsflüssigkeit → Kolben → Beläge/Backen → Reibung bremst Scheibe/Trommel. Spiele übertrieben dargestellt. Links: Scheibenbremse · Rechts: Trommelbremse (Schnitt).')}</div></div>;
  if (moduleId === 'drivetrain') return <div className="max-w-md rounded-xl border border-slate-200 bg-white/90 p-2.5 text-xs shadow-panel backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/85"><b>{L('Torque flow', 'Kraftfluss')}:</b> {L('crankshaft → flywheel →', 'Kurbelwelle → Schwungrad →')} {gearbox === 'manual' ? L('clutch', 'Kupplung') : L('torque converter', 'Drehmomentwandler')} → {L('gearbox (3rd gear 1.4:1) → driveshaft → differential (3.7:1) → axle shafts + CV joints → rear wheels', 'Getriebe (3. Gang 1,4:1) → Kardanwelle → Differential (3,7:1) → Antriebswellen + Gleichlaufgelenke → Hinterräder')}<div className="text-[11px] text-slate-500">{L('Watch the yellow marks: each shaft turns slower than the one before. Use Cutaway to see inside the gearbox.', 'Gelbe Markierungen beachten: jede Welle dreht langsamer als die vorherige. Schnitt zeigt das Getriebeinnere.')}</div></div>;
  return null;
}
