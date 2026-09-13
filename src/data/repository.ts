import { getDb } from './db';
import type { Group, Task, Completion, DayKey } from '../domain/types';

// --- Groups ---

export async function listGroups(): Promise<Group[]> {
  const db = await getDb();
  return db.getAll('groups');
}

export async function saveGroup(group: Group): Promise<void> {
  const db = await getDb();
  await db.put('groups', group);
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['groups', 'tasks', 'completions'], 'readwrite');
  await tx.objectStore('groups').delete(id);
  const tasks = await tx.objectStore('tasks').index('by-group').getAll(id);
  for (const task of tasks) {
    await tx.objectStore('tasks').delete(task.id);
    const completions = await tx.objectStore('completions').index('by-task').getAll(task.id);
    for (const c of completions) {
      await tx.objectStore('completions').delete(c.id);
    }
  }
  await tx.done;
}

// --- Tasks ---

export async function listTasksByGroup(groupId: string): Promise<Task[]> {
  const db = await getDb();
  return db.getAllFromIndex('tasks', 'by-group', groupId);
}

export async function listAllTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.getAll('tasks');
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDb();
  await db.put('tasks', task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['tasks', 'completions'], 'readwrite');
  await tx.objectStore('tasks').delete(id);
  const completions = await tx.objectStore('completions').index('by-task').getAll(id);
  for (const c of completions) {
    await tx.objectStore('completions').delete(c.id);
  }
  await tx.done;
}

// --- Completions ---

export async function listAllCompletions(): Promise<Completion[]> {
  const db = await getDb();
  return db.getAll('completions');
}

export async function completionsForTask(taskId: string): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllFromIndex('completions', 'by-task', taskId);
}

export async function completionsForDate(date: DayKey): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllFromIndex('completions', 'by-date', date);
}

function completionId(taskId: string, date: DayKey): string {
  return `${taskId}:${date}`;
}

/**
 * Marca/desmarca a tarefa como concluída num dia (checkbox principal).
 * Preserva o estado do checklist daquele dia, que é independente de `done`.
 */
export async function setCompletion(taskId: string, date: DayKey, done: boolean): Promise<Completion> {
  const db = await getDb();
  const id = completionId(taskId, date);
  const existing = await db.get('completions', id);

  const next: Completion = {
    id,
    taskId,
    date,
    done,
    completedAt: done ? new Date().toISOString() : existing?.completedAt,
    checkedItems: existing?.checkedItems ?? [],
  };

  if (!done && next.checkedItems.length === 0) {
    // nada a preservar: remove o registro em vez de deixar uma linha vazia
    await db.delete('completions', id);
  } else {
    await db.put('completions', next);
  }
  return next;
}

/**
 * Marca/desmarca um item do checklist num dia. Não altera `done` — o checklist
 * é apenas progresso; a conclusão da tarefa continua sendo uma ação explícita.
 */
export async function setCheckedItem(
  taskId: string,
  date: DayKey,
  itemId: string,
  checked: boolean,
): Promise<Completion> {
  const db = await getDb();
  const id = completionId(taskId, date);
  const existing = await db.get('completions', id);
  const checkedItems = new Set(existing?.checkedItems ?? []);
  if (checked) checkedItems.add(itemId);
  else checkedItems.delete(itemId);

  const next: Completion = {
    id,
    taskId,
    date,
    done: existing?.done ?? false,
    completedAt: existing?.completedAt,
    checkedItems: [...checkedItems],
  };
  await db.put('completions', next);
  return next;
}
