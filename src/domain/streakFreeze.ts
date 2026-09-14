import type { Task, Completion, DayKey } from './types';
import { addDays } from './dates';
import { isDueOn } from './schedule';
import { isTaskDone, isFrozen } from './completions';
import { currentStreak } from './streak';

/** Quantos freezes de streak cada usuário ganha por mês (pool único, vale para qualquer tarefa). */
export const MONTHLY_FREEZE_QUOTA = 2;

function monthKeyOf(day: DayKey): string {
  return day.slice(0, 7); // "yyyy-MM"
}

export function freezesUsedInMonth(completions: Completion[], today: DayKey): number {
  const monthKey = monthKeyOf(today);
  return completions.filter((c) => c.frozen && monthKeyOf(c.date) === monthKey).length;
}

export function freezesRemaining(completions: Completion[], today: DayKey): number {
  return Math.max(0, MONTHLY_FREEZE_QUOTA - freezesUsedInMonth(completions, today));
}

export interface FreezeCandidate {
  taskId: string;
  taskTitle: string;
  date: DayKey;
}

/**
 * Tarefas que perderam um dia devido ontem e, sem um freeze, teriam a sequência
 * quebrada hoje. Não gasta a cota — só identifica os candidatos; quem aplica decide
 * quantos cabem na cota disponível.
 */
export function findFreezeCandidates(tasks: Task[], completions: Completion[], today: DayKey): FreezeCandidate[] {
  const yesterday = addDays(today, -1);
  const candidates: FreezeCandidate[] = [];

  for (const task of tasks) {
    if (task.archivedAt) continue;
    if (!isDueOn(task, yesterday, completions)) continue;
    if (isTaskDone(task.id, yesterday, completions) || isFrozen(task.id, yesterday, completions)) continue;

    // havia uma sequência ativa entrando no dia perdido? sem isso não há o que proteger.
    const streakBeforeYesterday = currentStreak(task, completions, addDays(yesterday, -1));
    if (streakBeforeYesterday > 0) {
      candidates.push({ taskId: task.id, taskTitle: task.title, date: yesterday });
    }
  }

  return candidates;
}
