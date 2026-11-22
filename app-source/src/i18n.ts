import { useStore } from './store';
const S = {
  explore: ['Explore', 'Erkunden'], learn: ['Learn', 'Lernen'], course: ['Course', 'Kurs'], quiz: ['Quiz', 'Quiz'], vocab: ['Vocabulary', 'Vokabeln'], progress: ['Progress', 'Fortschritt'],
  systems: ['Vehicle systems', 'Fahrzeugsysteme'], search: ['Search English or German…', 'Englisch oder Deutsch suchen…'], components: ['Components', 'Bauteile'],
  xray: ['X-ray', 'Röntgen'], cutaway: ['Cutaway', 'Schnitt'], explode: ['Explode', 'Explosion'], isolate: ['Isolate', 'Isolieren'], showAll: ['Show all', 'Alle zeigen'],
  reset: ['Reset view', 'Ansicht zurücksetzen'], fullscreen: ['Fullscreen', 'Vollbild'], focus: ['Focus', 'Fokus'], labels: ['Label', 'Beschriftung'],
  play: ['Play', 'Abspielen'], pause: ['Pause', 'Pause'], speed: ['Speed', 'Tempo'],
  noSelection: ['Click a component in the 3D view.', 'Klicke ein Bauteil in der 3D-Ansicht an.'],
  noSelectionHint: ['Hover to highlight, click to learn. Drag to rotate, scroll to zoom, right-drag to pan.', 'Zeigen zum Hervorheben, klicken zum Lernen. Ziehen = drehen, Scrollen = zoomen, Rechtsklick-Ziehen = verschieben.'],
  simple: ['Simple English (A1–A2)', 'Einfaches Englisch (A1–A2)'], technical: ['Technical English (B1–B2)', 'Technisches Englisch (B1–B2)'], german: ['German explanation', 'Deutsche Erklärung'],
  func: ['Main function', 'Hauptfunktion'], examples: ['Example sentences', 'Beispielsätze'], related: ['Related components', 'Verwandte Bauteile'],
  trouble: ['Troubleshooting vocabulary (B2/C1)', 'Fehlersuche-Vokabular (B2/C1)'], note: ['Model note', 'Modellhinweis'],
  save: ['Save word', 'Wort speichern'], saved: ['Saved', 'Gespeichert'], practice: ['Practise pronunciation', 'Aussprache üben'], startQuiz: ['Quiz this part', 'Dieses Teil abfragen'],
  level: ['Level', 'Niveau'], beginner: ['Beginner A1/A2', 'Anfänger A1/A2'], intermediate: ['Intermediate B1', 'Mittelstufe B1'], advanced: ['Advanced B2/C1', 'Fortgeschritten B2/C1'],
  animation: ['Animation', 'Animation'], showGerman: ['Show German', 'Deutsch zeigen'],
};
export type Key = keyof typeof S;
export function useT() {
  const lang = useStore((s) => s.uiLang);
  return (k: Key) => S[k][lang === 'en' ? 0 : 1];
}
