import type { CarPart, ModuleId } from '../types';

interface D {
  alt?: string;
  a1: string; b2: string; de: string; fn: string;
  ex: [string, string][];
  rel: string[]; kw: string[];
  tr?: string; note?: string; mods?: ModuleId[];
}

export function P(id: string, nameEn: string, nameDe: string, ipa: string, category: ModuleId, d: D): CarPart {
  return {
    id, nameEn, nameDe, altEn: d.alt, pronunciationIPA: ipa, category,
    modules: [category, ...(d.mods ?? []).filter((m) => m !== category)],
    explanationA1: d.a1, explanationB2: d.b2, explanationDe: d.de, mechanicalFunction: d.fn,
    exampleSentences: d.ex.map(([en, de]) => ({ en, de })),
    relatedParts: d.rel, modelObjectIds: [`${id}#*`], keywords: d.kw,
    troubleshooting: d.tr, modelNote: d.note,
  };
}
