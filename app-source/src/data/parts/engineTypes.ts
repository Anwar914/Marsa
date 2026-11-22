import { P } from '../helper';
const T = 'engineTypes' as const;
export const engineTypes = [
  P('inline-four', 'Inline-four engine', 'Reihenvierzylindermotor', '/ˌɪn.laɪn ˈfɔː ˌen.dʒɪn/', T, { alt: 'Straight-four, I4', mods: ['engine'],
    a1: 'An inline-four engine has four cylinders in one row.',
    b2: 'In an inline-four all four cylinders stand in a single row over one crankshaft with a flat-plane crank (throws at 0°/180°); it is compact, cheap and the most common passenger-car engine, but has second-order vibration.',
    de: 'Beim Reihenvierzylinder stehen alle vier Zylinder in einer Reihe über einer Kurbelwelle mit 180°-Kröpfung; kompakt und günstig, aber mit Massenkräften 2. Ordnung.',
    fn: 'Four cylinders in a row; firing order 1-3-4-2, one power stroke every 180°.',
    ex: [['Most small cars have an inline-four engine.', 'Die meisten Kleinwagen haben einen Reihenvierzylinder.'], ['The cylinders are in one line.', 'Die Zylinder stehen in einer Linie.']],
    rel: ['v6', 'v8', 'crankshaft'], kw: ['four', 'row', 'line', 'cylinder'] }),
  P('v6', 'V6 engine', 'V6-Motor', '/ˌviː ˈsɪks ˌen.dʒɪn/', T, {
    a1: 'A V6 engine has six cylinders in two rows. The rows make a V.',
    b2: 'A V6 has two banks of three cylinders arranged in a V (here 60°) on a common crankshaft; it is shorter than an inline-six and fits transversely or longitudinally.',
    de: 'Ein V6 hat zwei Zylinderbänke mit je drei Zylindern in V-Form (hier 60°) an einer gemeinsamen Kurbelwelle; kürzer als ein Reihensechszylinder.',
    fn: 'Six cylinders in two banks; one power stroke every 120°.',
    ex: [['The V6 engine is shorter than an inline-six.', 'Der V6 ist kürzer als ein Reihensechszylinder.'], ['A V6 has two cylinder banks.', 'Ein V6 hat zwei Zylinderbänke.']],
    rel: ['inline-four', 'v8', 'cylinder-bank'], kw: ['six', 'two', 'bank', 'v', 'cylinder'],
    note: 'Simplified 60° V6 with six separate crankpins (120° apart); real 60° V6 cranks look like this, 90° V6s use split pins.' }),
  P('v8', 'V8 engine', 'V8-Motor', '/ˌviː ˈeɪt ˌen.dʒɪn/', T, {
    a1: 'A V8 engine has eight cylinders in two rows of four.',
    b2: 'A V8 has two banks of four cylinders at 90°; with a cross-plane crankshaft (four throws at 90° intervals, two connecting rods per crankpin) it is smooth and powerful.',
    de: 'Ein V8 hat zwei Bänke mit je vier Zylindern im 90°-Winkel; mit Cross-Plane-Kurbelwelle (zwei Pleuel pro Hubzapfen) läuft er ruhig und kräftig.',
    fn: 'Eight cylinders in two banks; one power stroke every 90°.',
    ex: [['Sports cars often have a V8 engine.', 'Sportwagen haben oft einen V8-Motor.'], ['Two connecting rods share one crankpin.', 'Zwei Pleuel teilen sich einen Hubzapfen.']],
    rel: ['v6', 'inline-four', 'cylinder-bank'], kw: ['eight', 'two', 'bank', 'v', 'cylinder'] }),
  P('cylinder-bank', 'Cylinder bank', 'Zylinderbank', '/ˈsɪl.ɪn.də ˌbæŋk/', T, {
    a1: 'A cylinder bank is one row of cylinders in a V engine.',
    b2: 'A cylinder bank is one of the two rows of cylinders in a V engine; each bank has its own cylinder head and camshafts, and the angle between the banks is the V angle.',
    de: 'Eine Zylinderbank ist eine der beiden Zylinderreihen eines V-Motors mit eigenem Zylinderkopf; der Winkel dazwischen ist der V-Winkel.',
    fn: 'One row of cylinders in a V engine.',
    ex: [['Each cylinder bank has its own cylinder head.', 'Jede Zylinderbank hat einen eigenen Zylinderkopf.'], ['The banks are at 90 degrees.', 'Die Bänke stehen im 90-Grad-Winkel.']],
    rel: ['v6', 'v8', 'cylinder-head'], kw: ['row', 'v', 'cylinder', 'side'] }),
];
