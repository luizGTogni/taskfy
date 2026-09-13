import type { Task, DayKey, Completion } from './types';
import { dayOfWeek, addDays, compareDayKeys } from './dates';
import { isTaskDoneEver } from './completions';

/** Uma tarefa "once" sem data é considerada pendente (aparece em "sem data") até ser concluída. */
function isOnceCompleted(task: Task, completions: Completion[]): boolean {
  return isTaskDoneEver(task.id, completions);
}

/** A tarefa está devida (deveria aparecer/ser contada) no dia informado? */
export function isDueOn(task: Task, day: DayKey, completions: Completion[] = []): boolean {
  switch (task.schedule.kind) {
    case 'daily':
      return true;
    case 'weekly':
      return task.schedule.daysOfWeek.includes(dayOfWeek(day));
    case 'once':
      if (task.schedule.date) return task.schedule.date === day;
      // sem data: só "devida" enquanto não foi concluída (em qualquer dia)
      return !isOnceCompleted(task, completions);
    case 'none':
      return false;
  }
}

/** Tarefa sem data definida (aparece na seção "sem data" enquanto pendente). */
export function isUndated(task: Task): boolean {
  if (task.schedule.kind === 'none') return true;
  if (task.schedule.kind === 'once' && !task.schedule.date) return true;
  return false;
}

/** Tarefa agendada para uma data futura específica. */
export function isScheduledFuture(task: Task, today: DayKey): boolean {
  return task.schedule.kind === 'once' && !!task.schedule.date && compareDayKeys(task.schedule.date, today) > 0;
}

/** Próxima ocorrência a partir de (e incluindo) `from`, ou null se nunca mais ocorrer. */
export function nextOccurrence(task: Task, from: DayKey): DayKey | null {
  switch (task.schedule.kind) {
    case 'daily':
      return from;
    case 'weekly': {
      if (task.schedule.daysOfWeek.length === 0) return null;
      for (let i = 0; i < 7; i++) {
        const candidate = addDays(from, i);
        if (task.schedule.daysOfWeek.includes(dayOfWeek(candidate))) return candidate;
      }
      return null;
    }
    case 'once':
      if (!task.schedule.date) return null;
      return compareDayKeys(task.schedule.date, from) >= 0 ? task.schedule.date : null;
    case 'none':
      return null;
  }
}
