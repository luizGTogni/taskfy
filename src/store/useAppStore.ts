import { create } from 'zustand';
import type { Group, Task, Completion, ChecklistItem, DayKey } from '../domain/types';
import * as repo from '../data/repository';
import { buildSeedData } from '../data/seed';
import { todayKey, addDays } from '../domain/dates';
import { isTaskDone, findCompletion } from '../domain/completions';

interface AppState {
  loaded: boolean;
  groups: Group[];
  tasks: Task[];
  completions: Completion[];
  selectedDay: DayKey;
  openGroupId: string | null;
  openTaskId: string | null;

  loadAll: () => Promise<void>;

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

let loadPromise: Promise<void> | null = null;

async function performLoad(set: (partial: Partial<AppState>) => void): Promise<void> {
  let [groups, tasks, completions] = await Promise.all([
    repo.listGroups(),
    repo.listAllTasks(),
    repo.listAllCompletions(),
  ]);

  if (groups.length === 0) {
    const seed = buildSeedData();
    await repo.saveGroup(seed.group);
    for (const task of seed.tasks) await repo.saveTask(task);
    groups = [seed.group];
    tasks = seed.tasks;
  }

  set({ groups, tasks, completions, loaded: true });
}

export const useAppStore = create<AppState>((set, get) => ({
  loaded: false,
  groups: [],
  tasks: [],
  completions: [],
  selectedDay: todayKey(),
  openGroupId: null,
  openTaskId: null,

  loadAll: () => {
    // Singleton: React 18 StrictMode invoca efeitos de montagem duas vezes em dev,
    // o que faria duas chamadas concorrentes verem o banco vazio e semear o grupo
    // "English" duplicado, cada uma com IDs de tarefa diferentes.
    if (!loadPromise) loadPromise = performLoad(set);
    return loadPromise;
  },

  setSelectedDay: (day) => set({ selectedDay: day }),
  goToday: () => set({ selectedDay: todayKey() }),
  shiftDay: (delta) => set((state) => ({ selectedDay: addDays(state.selectedDay, delta) })),

  openGroup: (id) => set({ openGroupId: id, openTaskId: null }),
  openTask: (id) => set({ openTaskId: id }),

  createGroup: async (title, description, emoji) => {
    const group: Group = {
      id: crypto.randomUUID(),
      title,
      description,
      emoji,
      order: get().groups.length,
      createdAt: new Date().toISOString(),
    };
    await repo.saveGroup(group);
    set((state) => ({ groups: [...state.groups, group] }));
    return group;
  },

  updateGroup: async (id, patch) => {
    const group = get().groups.find((g) => g.id === id);
    if (!group) return;
    const next = { ...group, ...patch };
    await repo.saveGroup(next);
    set((state) => ({ groups: state.groups.map((g) => (g.id === id ? next : g)) }));
  },

  deleteGroup: async (id) => {
    await repo.deleteGroup(id);
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      tasks: state.tasks.filter((t) => t.groupId !== id),
      openGroupId: state.openGroupId === id ? null : state.openGroupId,
    }));
  },

  createTask: async (groupId, title) => {
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
    await repo.saveTask(task);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, patch) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = { ...task, ...patch };
    await repo.saveTask(next);
    set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? next : t)) }));
  },

  deleteTask: async (id) => {
    await repo.deleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      completions: state.completions.filter((c) => c.taskId !== id),
      openTaskId: state.openTaskId === id ? null : state.openTaskId,
    }));
  },

  toggleCompletion: async (taskId, date) => {
    const alreadyDone = isTaskDone(taskId, date, get().completions);
    const updated = await repo.setCompletion(taskId, date, !alreadyDone);
    set((state) => ({
      completions: [...state.completions.filter((c) => c.id !== updated.id), updated],
    }));
  },

  toggleChecklistItem: async (taskId, date, itemId) => {
    const existing = findCompletion(taskId, date, get().completions);
    const isChecked = existing?.checkedItems.includes(itemId) ?? false;
    const updated = await repo.setCheckedItem(taskId, date, itemId, !isChecked);
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
