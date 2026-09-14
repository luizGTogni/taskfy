import type { Completion, DayKey } from './types';

export function findCompletion(taskId: string, date: DayKey, completions: Completion[]): Completion | undefined {
  return completions.find((c) => c.taskId === taskId && c.date === date);
}

/** A tarefa foi marcada como concluída nesse dia (checkbox principal, não o checklist). */
export function isTaskDone(taskId: string, date: DayKey, completions: Completion[]): boolean {
  return findCompletion(taskId, date, completions)?.done ?? false;
}

/** A tarefa foi concluída em algum dia (usado por tarefas "once" sem data, que não têm um dia fixo). */
export function isTaskDoneEver(taskId: string, completions: Completion[]): boolean {
  return completions.some((c) => c.taskId === taskId && c.done);
}

/** O dia foi protegido por um freeze de streak (não concluído, mas a sequência não quebra). */
export function isFrozen(taskId: string, date: DayKey, completions: Completion[]): boolean {
  return findCompletion(taskId, date, completions)?.frozen ?? false;
}

/** A sequência considera o dia coberto: foi concluído OU protegido por freeze. */
export function isStreakCovered(taskId: string, date: DayKey, completions: Completion[]): boolean {
  const completion = findCompletion(taskId, date, completions);
  return (completion?.done || completion?.frozen) ?? false;
}
