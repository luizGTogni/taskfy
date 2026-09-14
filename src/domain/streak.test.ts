import { describe, it, expect } from 'vitest';
import { currentStreak, longestStreak } from './streak';
import type { Task, Completion } from './types';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    groupId: 'g1',
    title: 'Test',
    details: '',
    schedule: { kind: 'daily' },
    checklist: [],
    order: 0,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function completion(taskId: string, date: string): Completion {
  return {
    id: `${taskId}:${date}`,
    taskId,
    date,
    done: true,
    completedAt: `${date}T10:00:00.000Z`,
    checkedItems: [],
    frozen: false,
  };
}

describe('currentStreak', () => {
  it('counts consecutive daily completions ending today', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    const completions = [
      completion('t1', '2026-09-11'),
      completion('t1', '2026-09-12'),
      completion('t1', '2026-09-13'),
    ];
    expect(currentStreak(task, completions, '2026-09-13')).toBe(3);
  });

  it('does not break on non-due days for weekly tasks', () => {
    // seg/qua/sex; simulate weeks of completions on all seg/qua/sex, checking on a domingo
    const task = makeTask({ schedule: { kind: 'weekly', daysOfWeek: [1, 3, 5] } });
    const completions = [
      completion('t1', '2026-09-11'), // sex
      completion('t1', '2026-09-09'), // qua
      completion('t1', '2026-09-07'), // seg
    ];
    // 2026-09-13 is domingo (not due) -> should not break, streak counted from last due day
    expect(currentStreak(task, completions, '2026-09-13')).toBe(3);
  });

  it('breaks when a due day was missed', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    const completions = [completion('t1', '2026-09-13')]; // missed the 12th
    expect(currentStreak(task, completions, '2026-09-13')).toBe(1);
    const completionsNoToday = [completion('t1', '2026-09-11')];
    expect(currentStreak(task, completionsNoToday, '2026-09-13')).toBe(0);
  });

  it('tolerates today not yet completed', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    const completions = [completion('t1', '2026-09-11'), completion('t1', '2026-09-12')];
    expect(currentStreak(task, completions, '2026-09-13')).toBe(2);
  });
});

describe('longestStreak', () => {
  it('finds the best run in history', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    const completions = [
      completion('t1', '2026-09-01'),
      completion('t1', '2026-09-02'),
      completion('t1', '2026-09-03'),
      // gap
      completion('t1', '2026-09-10'),
      completion('t1', '2026-09-11'),
    ];
    expect(longestStreak(task, completions)).toBe(3);
  });

  it('returns 0 with no completions', () => {
    const task = makeTask({});
    expect(longestStreak(task, [])).toBe(0);
  });
});
