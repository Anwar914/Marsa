import type { CardProgress } from './types';

const DAY = 86_400_000;
export const newCard = (): CardProgress => ({ seen: 0, correct: 0, wrong: 0, saved: false, ease: 2.5, interval: 0, reps: 0, due: 0, lastReview: 0 });

/** SM-2 scheduling. quality: 0 = again, 3 = hard, 4 = good, 5 = easy */
export function review(c: CardProgress, quality: number, now = Date.now()): CardProgress {
  const n = { ...c, lastReview: now };
  if (quality < 3) {
    n.reps = 0; n.interval = 0; n.wrong += 1;
    n.due = now + 60_000; // retry in ~1 minute (same session)
  } else {
    n.correct += 1;
    n.reps += 1;
    n.interval = n.reps === 1 ? 1 : n.reps === 2 ? 3 : Math.round(n.interval * n.ease);
    if (quality === 3) n.interval = Math.max(1, Math.round(n.interval * 0.6));
    n.due = now + n.interval * DAY;
  }
  n.ease = Math.max(1.3, n.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  return n;
}

export type Mastery = 'new' | 'learning' | 'review' | 'mastered';
export function mastery(c?: CardProgress): Mastery {
  if (!c || (c.seen === 0 && c.correct + c.wrong === 0)) return 'new';
  if (c.reps === 0) return 'learning';
  if (c.interval >= 7) return 'mastered';
  return 'review';
}
export const isDue = (c?: CardProgress, now = Date.now()) => !!c && c.correct + c.wrong > 0 && c.due <= now;
