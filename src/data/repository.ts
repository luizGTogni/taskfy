import { supabase } from './supabaseClient';
import type { Group, Task, Completion, DayKey, Schedule, ChecklistItem } from '../domain/types';

// Todas as funções recebem `userId` explicitamente e o gravam nas linhas que criam.
// A leitura/escrita é, além disso, restrita pelas políticas de RLS do Supabase
// (cada usuário só enxerga e altera as próprias linhas) — ver supabase/schema.sql.

// --- Mapeamento linha (snake_case) <-> domínio (camelCase) ---

interface GroupRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  emoji: string | null;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
}

function groupFromRow(row: GroupRow): Group {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    emoji: row.emoji ?? undefined,
    order: row.sort_order,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
  };
}

function groupToRow(group: Group, userId: string): GroupRow {
  return {
    id: group.id,
    user_id: userId,
    title: group.title,
    description: group.description,
    emoji: group.emoji ?? null,
    sort_order: group.order,
    created_at: group.createdAt,
    archived_at: group.archivedAt ?? null,
  };
}

interface TaskRow {
  id: string;
  user_id: string;
  group_id: string;
  title: string;
  details: string;
  schedule: Schedule;
  checklist: ChecklistItem[];
  sort_order: number;
  created_at: string;
  archived_at: string | null;
}

function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    details: row.details,
    schedule: row.schedule,
    checklist: row.checklist,
    order: row.sort_order,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
  };
}

function taskToRow(task: Task, userId: string): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    group_id: task.groupId,
    title: task.title,
    details: task.details,
    schedule: task.schedule,
    checklist: task.checklist,
    sort_order: task.order,
    created_at: task.createdAt,
    archived_at: task.archivedAt ?? null,
  };
}

interface CompletionRow {
  id: string;
  user_id: string;
  task_id: string;
  date: DayKey;
  done: boolean;
  completed_at: string | null;
  checked_items: string[];
}

function completionFromRow(row: CompletionRow): Completion {
  return {
    id: row.id,
    taskId: row.task_id,
    date: row.date,
    done: row.done,
    completedAt: row.completed_at ?? undefined,
    checkedItems: row.checked_items,
  };
}

// --- Groups ---

export async function listGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase.from('groups').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as GroupRow[]).map(groupFromRow);
}

export async function saveGroup(userId: string, group: Group): Promise<void> {
  const { error } = await supabase.from('groups').upsert(groupToRow(group, userId));
  if (error) throw error;
}

export async function deleteGroup(userId: string, id: string): Promise<void> {
  // tasks e completions são removidas em cascata pelas foreign keys do schema.
  const { error } = await supabase.from('groups').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// --- Tasks ---

export async function listTasksByGroup(userId: string, groupId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('group_id', groupId);
  if (error) throw error;
  return (data as TaskRow[]).map(taskFromRow);
}

export async function listAllTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as TaskRow[]).map(taskFromRow);
}

export async function saveTask(userId: string, task: Task): Promise<void> {
  const { error } = await supabase.from('tasks').upsert(taskToRow(task, userId));
  if (error) throw error;
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// --- Completions ---

export async function listAllCompletions(userId: string): Promise<Completion[]> {
  const { data, error } = await supabase.from('completions').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as CompletionRow[]).map(completionFromRow);
}

export async function completionsForTask(userId: string, taskId: string): Promise<Completion[]> {
  const { data, error } = await supabase
    .from('completions')
    .select('*')
    .eq('user_id', userId)
    .eq('task_id', taskId);
  if (error) throw error;
  return (data as CompletionRow[]).map(completionFromRow);
}

export async function completionsForDate(userId: string, date: DayKey): Promise<Completion[]> {
  const { data, error } = await supabase
    .from('completions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw error;
  return (data as CompletionRow[]).map(completionFromRow);
}

function completionId(taskId: string, date: DayKey): string {
  return `${taskId}:${date}`;
}

async function getCompletionRow(userId: string, id: string): Promise<CompletionRow | null> {
  const { data, error } = await supabase
    .from('completions')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as CompletionRow | null;
}

/**
 * Marca/desmarca a tarefa como concluída num dia (checkbox principal).
 * Preserva o estado do checklist daquele dia, que é independente de `done`.
 */
export async function setCompletion(userId: string, taskId: string, date: DayKey, done: boolean): Promise<Completion> {
  const id = completionId(taskId, date);
  const existing = await getCompletionRow(userId, id);

  const next: CompletionRow = {
    id,
    user_id: userId,
    task_id: taskId,
    date,
    done,
    completed_at: done ? new Date().toISOString() : (existing?.completed_at ?? null),
    checked_items: existing?.checked_items ?? [],
  };

  if (!done && next.checked_items.length === 0) {
    // nada a preservar: remove a linha em vez de deixar um registro vazio
    const { error } = await supabase.from('completions').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('completions').upsert(next);
    if (error) throw error;
  }
  return completionFromRow(next);
}

/**
 * Marca/desmarca um item do checklist num dia. Não altera `done` — o checklist
 * é apenas progresso; a conclusão da tarefa continua sendo uma ação explícita.
 */
export async function setCheckedItem(
  userId: string,
  taskId: string,
  date: DayKey,
  itemId: string,
  checked: boolean,
): Promise<Completion> {
  const id = completionId(taskId, date);
  const existing = await getCompletionRow(userId, id);
  const checkedItems = new Set(existing?.checked_items ?? []);
  if (checked) checkedItems.add(itemId);
  else checkedItems.delete(itemId);

  const next: CompletionRow = {
    id,
    user_id: userId,
    task_id: taskId,
    date,
    done: existing?.done ?? false,
    completed_at: existing?.completed_at ?? null,
    checked_items: [...checkedItems],
  };

  const { error } = await supabase.from('completions').upsert(next);
  if (error) throw error;
  return completionFromRow(next);
}
