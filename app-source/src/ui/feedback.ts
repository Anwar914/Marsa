import type { CarPart } from '../types';

export interface ExplainFeedback { score: number; found: string[]; missing: string[]; tips: string[] }

const VERBS = ['change', 'convert', 'move', 'turn', 'make', 'keep', 'hold', 'open', 'close', 'clean', 'push', 'pull', 'connect', 'stop', 'carry', 'let', 'give', 'cool', 'store', 'protect', 'press', 'create', 'show', 'transmit', 'absorb', 'reduce', 'control', 'drive', 'rotate', 'seal', 'lift', 'slow', 'help', 'need', 'use', 'go', 'do', 'have'];

/** Rule-based feedback for short engineering explanations. It is a heuristic helper, not a human-quality grammar check. */
export function explainFeedback(text: string, part: CarPart): ExplainFeedback {
  const t = text.trim();
  const low = ' ' + t.toLowerCase().replace(/[^a-z\s-]/g, ' ') + ' ';
  const found: string[] = [], missing: string[] = [];
  for (const k of part.keywords) (low.includes(k.toLowerCase()) ? found : missing).push(k);
  const tips: string[] = [];
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 5) tips.push('Write a full sentence with at least 5–6 words. / Schreibe einen ganzen Satz (mind. 5–6 Wörter).');
  if (t && t[0] !== t[0].toUpperCase()) tips.push('Start the sentence with a capital letter. / Beginne mit einem Großbuchstaben.');
  if (t && !/[.!?]$/.test(t)) tips.push('End the sentence with a full stop (.). / Beende den Satz mit einem Punkt.');
  // third person singular -s: "it change" / "the crankshaft change"
  const subj = new RegExp(`\\b(it|the ${part.nameEn.toLowerCase().split(' ').slice(-1)[0]}|this part)\\s+(${VERBS.join('|')})\\b`, 'i');
  const m = t.match(subj);
  if (m) tips.push(`Third person singular needs -s: “${m[1]} ${m[2]}s” (not “${m[1]} ${m[2]}”). / 3. Person Singular braucht -s.`);
  if (/\b(it|this part|the [a-z]+) (are)\b/i.test(t)) tips.push('Use “is” with a singular subject: “It is …”. / Bei Singular „is“ verwenden.');
  if (/\bmake (the )?(car|engine|wheel)s? (to )\w+/i.test(t)) tips.push('After “make” do not use “to”: “It makes the car stop.” / Nach „make“ kein „to“.');
  if (part.nameEn.split(' ').length > 1 && !low.includes(part.nameEn.toLowerCase()) && !/\bit\b/i.test(t)) tips.push(`Name the part: “The ${part.nameEn.toLowerCase()} …” / Nenne das Bauteil.`);
  const coverage = part.keywords.length ? found.length / Math.min(3, part.keywords.length) : 0;
  const score = Math.max(0, Math.min(1, coverage) - tips.length * 0.05);
  return { score, found, missing, tips };
}
