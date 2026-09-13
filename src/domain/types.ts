export type DayKey = string; // "2026-09-13" — dia local, formato yyyy-MM-dd

export interface Group {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  order: number;
  createdAt: string;
  archivedAt?: string;
}

export type Schedule =
  | { kind: 'none' }
  | { kind: 'once'; date?: DayKey; time?: string }
  | { kind: 'daily'; time?: string }
  | { kind: 'weekly'; daysOfWeek: number[]; time?: string }; // 0=dom .. 6=sáb

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface Task {
  id: string;
  groupId: string;
  title: string;
  details: string;
  schedule: Schedule;
  checklist: ChecklistItem[];
  order: number;
  createdAt: string;
  archivedAt?: string;
}

export interface Completion {
  id: string; // `${taskId}:${date}`
  taskId: string;
  date: DayKey;
  /** A tarefa foi marcada como feita nesse dia (checkbox principal). */
  done: boolean;
  completedAt?: string;
  /** Estado do checklist nesse dia — independente de `done`. */
  checkedItems: string[];
}
