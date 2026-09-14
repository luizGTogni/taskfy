import { describe, it, expect } from 'vitest';
import { findFreezeCandidates, freezesRemaining, freezesUsedInMonth, MONTHLY_FREEZE_QUOTA } from './streakFreeze';
import type { Task, Completion } from './types';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    groupId: 'g1',
    title: 'Duolingo',
    details: '',
    schedule: { kind: 'daily' },
    checklist: [],
    order: 0,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

function completion(overrides: Partial<Completion> & Pick<Completion, 'taskId' | 'date'>): Completion {
  return {
    id: `${overrides.taskId}:${overrides.date}`,
    done: false,
    frozen: false,
    checkedItems: [],
    ...overrides,
  };
}

describe('findFreezeCandidates', () => {
  it('finds a task with an active streak that missed yesterday', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    const completions = [
      completion({ taskId: 't1', date: '2026-09-10', done: true }),
      completion({ taskId: 't1', date: '2026-09-11', done: true }),
      // 09-12 (ontem, dado hoje=09-13) foi perdido
    ];
    const candidates = findFreezeCandidates([task], completions, '2026-09-13');
    expect(candidates).toEqual([{ taskId: 't1', taskTitle: 'Duolingo', date: '2026-09-12' }]);
  });

  it('does not flag a task with no active streak', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    const candidates = findFreezeCandidates([task], [], '2026-09-13');
    expect(candidates).toEqual([]);
  });

  it('does not flag a task already completed or frozen yesterday', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    const completions = [
      completion({ taskId: 't1', date: '2026-09-11', done: true }),
      completion({ taskId: 't1', date: '2026-09-12', done: true }),
    ];
    expect(findFreezeCandidates([task], completions, '2026-09-13')).toEqual([]);
  });

  it('ignores tasks not due yesterday', () => {
    const task = makeTask({ schedule: { kind: 'weekly', daysOfWeek: [1] } }); // só segunda
    const completions = [completion({ taskId: 't1', date: '2026-09-07', done: true })]; // segunda anterior
    // 2026-09-12 (ontem) é sábado, não devido
    expect(findFreezeCandidates([task], completions, '2026-09-13')).toEqual([]);
  });

  it('skips archived tasks', () => {
    const task = makeTask({ archivedAt: '2026-09-12T00:00:00.000Z' });
    const completions = [completion({ taskId: 't1', date: '2026-09-11', done: true })];
    expect(findFreezeCandidates([task], completions, '2026-09-13')).toEqual([]);
  });
});

describe('freezesUsedInMonth / freezesRemaining', () => {
  it('counts only frozen completions within the given month', () => {
    const completions = [
      completion({ taskId: 't1', date: '2026-09-05', frozen: true }),
      completion({ taskId: 't2', date: '2026-08-20', frozen: true }), // mês passado
      completion({ taskId: 't3', date: '2026-09-06', done: true }), // não é freeze
    ];
    expect(freezesUsedInMonth(completions, '2026-09-13')).toBe(1);
    expect(freezesRemaining(completions, '2026-09-13')).toBe(MONTHLY_FREEZE_QUOTA - 1);
  });

  it('never returns negative remaining', () => {
    const completions = Array.from({ length: MONTHLY_FREEZE_QUOTA + 5 }, (_, i) =>
      completion({ taskId: `t${i}`, date: '2026-09-05', frozen: true }),
    );
    expect(freezesRemaining(completions, '2026-09-13')).toBe(0);
  });
});
