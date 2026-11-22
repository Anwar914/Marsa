export type ModuleId =
  | 'exterior' | 'interior' | 'engine' | 'engineTypes' | 'brakes' | 'suspension'
  | 'drivetrain' | 'tires' | 'electrical' | 'filters' | 'jack' | 'wiper';

export interface Example { en: string; de: string }

/** One vocabulary record. Linked to 3D meshes through `id` (meshes carry userData.partId). */
export interface CarPart {
  id: string;
  nameEn: string;
  nameDe: string;
  /** Alternative names (e.g. British English) */
  altEn?: string;
  pronunciationIPA: string;
  category: ModuleId;
  /** All modules whose 3D scene contains this part */
  modules: ModuleId[];
  explanationA1: string;
  explanationB2: string;
  explanationDe: string;
  mechanicalFunction: string;
  exampleSentences: Example[];
  relatedParts: string[];
  /** Mesh names in the scene graph (generated as `${id}#n`) */
  modelObjectIds: string[];
  /** Key ideas used by the free-text explanation quiz */
  keywords: string[];
  /** Advanced (B2/C1) troubleshooting vocabulary */
  troubleshooting?: string;
  /** Honest note about educational simplifications in the 3D model */
  modelNote?: string;
}

export interface ModuleInfo {
  id: ModuleId;
  letter: string;
  nameEn: string;
  nameDe: string;
  descEn: string;
  descDe: string;
  hasAnimation: boolean;
  animLabelEn?: string;
  animLabelDe?: string;
}

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Tab = 'explore' | 'learn' | 'course' | 'quiz' | 'vocab' | 'progress';
export type QuizMode = 'identify' | 'find' | 'function' | 'en2de' | 'de2en' | 'listen' | 'explain';

export interface CardProgress {
  seen: number;
  correct: number;
  wrong: number;
  saved: boolean;
  /** SM-2 style scheduling */
  ease: number;
  interval: number; // days
  reps: number;
  due: number; // epoch ms
  lastReview: number;
}
