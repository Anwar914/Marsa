import { useStore } from '../store';

/** Central click routing: quiz "find the part" mode or normal selection. */
export function handlePartClick(id: string, group?: string) {
  const s = useStore.getState();
  if ((s.tab === 'quiz' || s.tab === 'learn') && s.quiz.awaitingClickFor) {
    useStore.getState().setQuiz({ lastClickResult: { id, ok: id === s.quiz.awaitingClickFor || group === s.quiz.awaitingClickFor } });
    return;
  }
  s.select(id);
}
