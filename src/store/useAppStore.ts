import { create } from 'zustand';
import type { Group, Task, Completion, ChecklistItem, DayKey } from '../domain/types';
import * as repo from '../data/repository';
import { buildSeedData } from '../data/seed';
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

  createTask: (groupId: string, title: string) => Promise<Task>;
  updateTask: (
    id: string,
    patch: Partial<Pick<Task, 'title' | 'details' | 'schedule' | 'checklist'>>,
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  toggleCompletion: (taskId: string, date: DayKey) => Promise<void>;
  toggleChecklistItem: (taskId: string, date: DayKey, itemId: string) => Promise<void>;
  addChecklistItem: (taskId: string, text: string) => Promise<void>;
  removeChecklistItem: (taskId: string, itemId: string) => Promise<void>;
}

// Singleton por usuário: React 18 StrictMode invoca efeitos de montagem duas vezes em
// dev, o que faria duas chamadas concorrentes verem o banco vazio e semear o grupo
// "English" duplicado, cada uma com IDs de tarefa diferentes.
let loadPromise: Promise<void> | null = null;
let loadPromiseUserId: string | null = null;

async function performLoad(userId: string, set: (partial: Partial<AppState>) => void): Promise<void> {
  let [groups, tasks, completions] = await Promise.all([
    repo.listGroups(userId),
    repo.listAllTasks(userId),
    repo.listAllCompletions(userId),
  ]);

  if (groups.length === 0) {
    const seed = buildSeedData();
    await repo.saveGroup(userId, seed.group);
    await Promise.all(seed.tasks.map((task) => repo.saveTask(userId, task)));
    groups = [seed.group];
    tasks = seed.tasks;
  }

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
