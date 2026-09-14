import { create } from 'zustand';
import type { Group, Task, Completion, ChecklistItem, DayKey } from '../domain/types';
import * as repo from '../data/repository';
import { todayKey, addDays } from '../domain/dates';
import { isTaskDone, findCompletion } from '../domain/completions';

interface AppState {
  loaded: boolean;
  loadedForUserId: string | null;
  groups: Group[];
  tasks: Task[];
  completions: Completion[];
  selectedDay: DayKey;
  openGroupId: string | null;
  openTaskId: string | null;

  loadAll: (userId: string) => Promise<void>;
  reset: () => void;

  setSelectedDay: (day: DayKey) => void;
  goToday: () => void;
  shiftDay: (delta: number) => void;

  openGroup: (id: string | null) => void;
  openTask: (id: string | null) => void;

  createGroup: (title: string, description: string, emoji?: string) => Promise<Group>;
  updateGroup: (id: string, patch: Partial<Pick<Group, 'title' | 'description' | 'emoji'>>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  duplicateGroup: (id: string) => Promise<Group>;
  archiveGroup: (id: string) => Promise<void>;
  unarchiveGroup: (id: string) => Promise<void>;
  reorderGroups: (orderedIds: string[]) => Promise<void>;

  createTask: (groupId: string, title: string) => Promise<Task>;
  updateTask: (
    id: string,
    patch: Partial<Pick<Task, 'title' | 'details' | 'schedule' | 'checklist'>>,
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;

  toggleCompletion: (taskId: string, date: DayKey) => Promise<void>;
  toggleChecklistItem: (taskId: string, date: DayKey, itemId: string) => Promise<void>;
  addChecklistItem: (taskId: string, text: string) => Promise<void>;
  removeChecklistItem: (taskId: string, itemId: string) => Promise<void>;
}

// Singleton por usuário: React 18 StrictMode invoca efeitos de montagem duas vezes em
// dev, o que faria duas chamadas concorrentes disputarem o carregamento inicial.
let loadPromise: Promise<void> | null = null;
let loadPromiseUserId: string | null = null;

async function performLoad(userId: string, set: (partial: Partial<AppState>) => void): Promise<void> {
  const [groups, tasks, completions] = await Promise.all([
    repo.listGroups(userId),
    repo.listAllTasks(userId),
    repo.listAllCompletions(userId),
  ]);

  set({ groups, tasks, completions, loaded: true, loadedForUserId: userId });
}

function currentUserId(get: () => AppState): string {
  const userId = get().loadedForUserId;
  if (!userId) throw new Error('Nenhum usuário autenticado — chame loadAll(userId) antes de mutar dados.');
  return userId;
}

export const useAppStore = create<AppState>((set, get) => ({
  loaded: false,
  loadedForUserId: null,
  groups: [],
  tasks: [],
  completions: [],
  selectedDay: todayKey(),
  openGroupId: null,
  openTaskId: null,

  loadAll: (userId) => {
    if (loadPromiseUserId !== userId) {
      loadPromiseUserId = userId;
      loadPromise = performLoad(userId, set);
    }
    return loadPromise!;
  },

  reset: () => {
    loadPromise = null;
    loadPromiseUserId = null;
    set({
      loaded: false,
      loadedForUserId: null,
      groups: [],
      tasks: [],
      completions: [],
      openGroupId: null,
      openTaskId: null,
    });
  },

  setSelectedDay: (day) => set({ selectedDay: day }),
  goToday: () => set({ selectedDay: todayKey() }),
  shiftDay: (delta) => set((state) => ({ selectedDay: addDays(state.selectedDay, delta) })),

  openGroup: (id) => set({ openGroupId: id, openTaskId: null }),
  openTask: (id) => set({ openTaskId: id }),

  createGroup: async (title, description, emoji) => {
    const userId = currentUserId(get);
    const group: Group = {
      id: crypto.randomUUID(),
      title,
      description,
      emoji,
      order: get().groups.length,
      createdAt: new Date().toISOString(),
    };
    await repo.saveGroup(userId, group);
    set((state) => ({ groups: [...state.groups, group] }));
    return group;
  },

  updateGroup: async (id, patch) => {
    const userId = currentUserId(get);
    const group = get().groups.find((g) => g.id === id);
    if (!group) return;
    const next = { ...group, ...patch };
    await repo.saveGroup(userId, next);
    set((state) => ({ groups: state.groups.map((g) => (g.id === id ? next : g)) }));
  },

  deleteGroup: async (id) => {
    const userId = currentUserId(get);
    await repo.deleteGroup(userId, id);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      tasks: state.tasks.filter((t) => t.groupId !== id),
      openGroupId: state.openGroupId === id ? null : state.openGroupId,
    }));
  },

  duplicateGroup: async (id) => {
    const userId = currentUserId(get);
    const source = get().groups.find((g) => g.id === id);
    if (!source) throw new Error('Grupo não encontrado');

    const visibleCount = get().groups.filter((g) => !g.archivedAt).length;
    const newGroup: Group = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title} (cópia)`,
      order: visibleCount,
      createdAt: new Date().toISOString(),
      archivedAt: undefined,
    };
    const sourceTasks = get().tasks.filter((t) => t.groupId === id && !t.archivedAt);
    const newTasks: Task[] = sourceTasks.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      groupId: newGroup.id,
      checklist: t.checklist.map((item) => ({ ...item, id: crypto.randomUUID() })),
      createdAt: new Date().toISOString(),
    }));

    await repo.saveGroup(userId, newGroup);
    await Promise.all(newTasks.map((t) => repo.saveTask(userId, t)));

    set((state) => ({ groups: [...state.groups, newGroup], tasks: [...state.tasks, ...newTasks] }));
    return newGroup;
  },

  archiveGroup: async (id) => {
    const userId = currentUserId(get);
    const group = get().groups.find((g) => g.id === id);
    if (!group) return;
    const next = { ...group, archivedAt: new Date().toISOString() };
    await repo.saveGroup(userId, next);
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? next : g)),
      openGroupId: state.openGroupId === id ? null : state.openGroupId,
    }));
  },

  unarchiveGroup: async (id) => {
    const userId = currentUserId(get);
    const group = get().groups.find((g) => g.id === id);
    if (!group) return;
    const next = { ...group, archivedAt: undefined };
    await repo.saveGroup(userId, next);
    set((state) => ({ groups: state.groups.map((g) => (g.id === id ? next : g)) }));
  },

  reorderGroups: async (orderedIds) => {
    const userId = currentUserId(get);
    const byId = new Map(get().groups.map((g) => [g.id, g]));
    const updated = orderedIds
      .map((id, index) => {
        const group = byId.get(id);
        return group ? { ...group, order: index } : null;
      })
      .filter((g): g is Group => g !== null);

    set((state) => ({
      groups: state.groups.map((g) => updated.find((u) => u.id === g.id) ?? g),
    }));
    await Promise.all(updated.map((g) => repo.saveGroup(userId, g)));
  },

  createTask: async (groupId, title) => {
    const userId = currentUserId(get);
    const siblingCount = get().tasks.filter((t) => t.groupId === groupId).length;
    const task: Task = {
      id: crypto.randomUUID(),
      groupId,
      title,
      details: '',
      schedule: { kind: 'daily' },
      checklist: [],
      order: siblingCount,
      createdAt: new Date().toISOString(),
    };
    await repo.saveTask(userId, task);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, patch) => {
    const userId = currentUserId(get);
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = { ...task, ...patch };
    await repo.saveTask(userId, next);
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? next : t)) }));
  },

  deleteTask: async (id) => {
    const userId = currentUserId(get);
    await repo.deleteTask(userId, id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      completions: state.completions.filter((c) => c.taskId !== id),
      openTaskId: state.openTaskId === id ? null : state.openTaskId,
    }));
  },

  // Reordena apenas os ids informados (tipicamente as tarefas de uma seção — Hoje,
  // Agendadas etc.) sem afetar a ordem de tarefas de outras seções/grupos.
  reorderTasks: async (orderedIds) => {
    const userId = currentUserId(get);
    const byId = new Map(get().tasks.map((t) => [t.id, t]));
    const updated = orderedIds
      .map((id, index) => {
        const task = byId.get(id);
        return task ? { ...task, order: index } : null;
      })
      .filter((t): t is Task => t !== null);

    set((state) => ({
      tasks: state.tasks.map((t) => updated.find((u) => u.id === t.id) ?? t),
    }));
    await Promise.all(updated.map((t) => repo.saveTask(userId, t)));
  },

  toggleCompletion: async (taskId, date) => {
    const userId = currentUserId(get);
    const alreadyDone = isTaskDone(taskId, date, get().completions);
    const updated = await repo.setCompletion(userId, taskId, date, !alreadyDone);
    set((state) => ({
      completions: [...state.completions.filter((c) => c.id !== updated.id), updated],
    }));
  },

  toggleChecklistItem: async (taskId, date, itemId) => {
    const userId = currentUserId(get);
    const existing = findCompletion(taskId, date, get().completions);
    const isChecked = existing?.checkedItems.includes(itemId) ?? false;
    const updated = await repo.setCheckedItem(userId, taskId, date, itemId, !isChecked);
    set((state) => {
      const rest = state.completions.filter((c) => c.id !== updated.id);
      return { completions: [...rest, updated] };
    });
  },

  addChecklistItem: async (taskId, text) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text };
    await get().updateTask(taskId, { checklist: [...task.checklist, item] });
  },

  removeChecklistItem: async (taskId, itemId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    await get().updateTask(taskId, { checklist: task.checklist.filter((i) => i.id !== itemId) });
  },
}));
