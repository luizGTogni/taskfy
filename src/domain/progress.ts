import type { Group, Task, Completion, DayKey } from './types';
import { isDueOn } from './schedule';
import { isTaskDone } from './completions';

export interface Progress {
  done: number;
  total: number;
}

export function tasksDueOn(tasks: Task[], day: DayKey, completions: Completion[]): Task[] {
  return tasks.filter((t) => !t.archivedAt && isDueOn(t, day, completions));
}

export function groupProgressFor(
  _group: Group,
  tasks: Task[],
  completions: Completion[],
  day: DayKey,
): Progress {
  const due = tasksDueOn(tasks, day, completions);
  const done = due.filter((t) => isTaskDone(t.id, day, completions)).length;
  return { done, total: due.length };
}
