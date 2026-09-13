import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Group, Task, Completion } from '../domain/types';

interface TaskfyDB extends DBSchema {
  groups: {
    key: string;
    value: Group;
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-group': string };
  };
  completions: {
    key: string;
    value: Completion;
    indexes: { 'by-task': string; 'by-date': string };
  };
}

let dbPromise: Promise<IDBPDatabase<TaskfyDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<TaskfyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TaskfyDB>('taskfy', 1, {
      upgrade(db) {
        db.createObjectStore('groups', { keyPath: 'id' });

        const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
        tasks.createIndex('by-group', 'groupId');

        const completions = db.createObjectStore('completions', { keyPath: 'id' });
        completions.createIndex('by-task', 'taskId');
        completions.createIndex('by-date', 'date');
      },
    });
  }
  return dbPromise;
}
