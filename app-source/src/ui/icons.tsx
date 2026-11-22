/** Minimal stroke icon set (24×24, currentColor). */
const P: Record<string, string[]> = {
  explore: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'm16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z'],
  learn: ['M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z', 'M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z'],
  course: ['M22 10 12 5 2 10l10 5 10-5Z', 'M6 12v5c3 3 9 3 12 0v-5', 'M22 10v6'],
  quiz: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  vocab: ['m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1L12 2Z'],
  progress: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  xray: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  cut: ['M4 4h16v16H4z', 'M4 20 20 4'],
  explode: ['M15 3h6v6', 'M9 21H3v-6', 'M21 3l-7 7', 'M3 21l7-7'],
  isolate: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'],
  focus: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M22 12h-4', 'M6 12H2', 'M12 6V2', 'M12 22v-4'],
  reset: ['M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-6.7 2.7L3 8', 'M3 3v5h5'],
  label: ['M12 2H2v10l9.3 9.3a1 1 0 0 0 1.4 0l8.6-8.6a1 1 0 0 0 0-1.4Z', 'M7 7h.01'],
  fullscreen: ['M8 3H5a2 2 0 0 0-2 2v3', 'M21 8V5a2 2 0 0 0-2-2h-3', 'M3 16v3a2 2 0 0 0 2 2h3', 'M16 21h3a2 2 0 0 0 2-2v-3'],
  play: ['M7 4v16l13-8Z'],
  pause: ['M7 4h3v16H7z', 'M14 4h3v16h-3z'],
  sun: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M12 2v2', 'M12 20v2', 'm4.9 4.9 1.4 1.4', 'm17.7 17.7 1.4 1.4', 'M2 12h2', 'M20 12h2', 'm6.3 17.7-1.4 1.4', 'm19.1 4.9-1.4 1.4'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  volume: ['M11 5 6 9H2v6h4l5 4V5Z', 'M15.5 8.5a5 5 0 0 1 0 7'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
};
export type IconName = keyof typeof P;
export function Icon({ name, size = 16, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name].map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
/** Marsa logo mark: stylised wheel/anchor “M”. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#14675a" />
      <path d="M8 22V10l8 8 8-8v12" fill="none" stroke="#d6ee94" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
