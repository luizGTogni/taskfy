import type { Task, Completion, DayKey } from './types';
import { addDays, compareDayKeys } from './dates';
import { isDueOn } from './schedule';
import { isTaskDone } from './completions';

/**
 * Streak atual: caminha para trás a partir de `today`, contando apenas os dias em que a
 * tarefa era devida (para não quebrar o streak de uma tarefa de seg/qua/sex em outros dias).
 * O dia de hoje é tolerado sem quebra caso ainda não tenha sido concluído.
 */
export function currentStreak(task: Task, completions: Completion[], today: DayKey): number {
  let streak = 0;
  let day = today;
  let first = true;

  // evita loop infinito em tarefas 'none'/'weekly' sem dias configurados
  let guard = 0;
  while (guard < 3660) {
    guard++;
    if (isDueOn(task, day, completions)) {
      const done = isTaskDone(task.id, day, completions);
      if (done) {
        streak++;
      } else if (first && day === today) {
        // hoje ainda não concluído: não conta, mas também não quebra
      } else {
        break;
      }
    }
    first = false;
    day = addDays(day, -1);
    if (compareDayKeys(day, task.createdAt.slice(0, 10)) < 0) break;
  }
  return streak;
}

/** Maior streak já alcançado, varrendo o histórico de conclusões. */
export function longestStreak(task: Task, completions: Completion[]): number {
  const dates = [...new Set(completions.filter((c) => c.taskId === task.id && c.done).map((c) => c.date))].sort(
    compareDayKeys,
  );
  if (dates.length === 0) return 0;

  let best = 0;
  let run = 0;
  let prev: DayKey | null = null;

  for (const date of dates) {
    if (prev === null) {
      run = 1;
    } else {
      // conta dias "devidos" entre a conclusão anterior e esta; se só há o próprio dia
      // devido entre elas, a sequência continua
      let cursor = addDays(prev, 1);
      let dueBetween = false;
      while (compareDayKeys(cursor, date) < 0) {
        if (isDueOn(task, cursor, completions)) {
          dueBetween = true;
          break;
        }
        cursor = addDays(cursor, 1);
      }
      run = dueBetween ? 1 : run + 1;
    }
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}
