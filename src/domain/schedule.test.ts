import { describe, it, expect } from 'vitest';
import { isDueOn, isUndated, nextOccurrence } from './schedule';
import type { Task } from './types';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    groupId: 'g1',
    title: 'Test',
    details: '',
    schedule: { kind: 'daily' },
    checklist: [],
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isDueOn', () => {
  it('daily is always due', () => {
    const task = makeTask({ schedule: { kind: 'daily' } });
    expect(isDueOn(task, '2026-09-13')).toBe(true);
    expect(isDueOn(task, '2026-09-14')).toBe(true);
  });

  it('weekly is due only on configured weekdays', () => {
    // 2026-09-13 is a Sunday (0)
    const task = makeTask({ schedule: { kind: 'weekly', daysOfWeek: [1, 3, 5] } }); // seg/qua/sex
    expect(isDueOn(task, '2026-09-13')).toBe(false); // domingo
    expect(isDueOn(task, '2026-09-14')).toBe(true); // segunda
    expect(isDueOn(task, '2026-09-16')).toBe(true); // quarta
  });

  it('once with date is due only on that date', () => {
    const task = makeTask({ schedule: { kind: 'once', date: '2026-09-20' } });
    expect(isDueOn(task, '2026-09-20')).toBe(true);
    expect(isDueOn(task, '2026-09-21')).toBe(false);
  });

  it('once without date is due until completed', () => {
    const task = makeTask({ schedule: { kind: 'once' } });
    expect(isDueOn(task, '2026-09-13', [])).toBe(true);
    const completions = [
      { id: 't1:2026-09-13', taskId: 't1', date: '2026-09-13', done: true, completedAt: '', checkedItems: [] },
    ];
    expect(isDueOn(task, '2026-09-14', completions)).toBe(false);
  });

  it('none is never due', () => {
    const task = makeTask({ schedule: { kind: 'none' } });
    expect(isDueOn(task, '2026-09-13')).toBe(false);
  });
});

describe('isUndated', () => {
  it('flags none and dateless once', () => {
    expect(isUndated(makeTask({ schedule: { kind: 'none' } }))).toBe(true);
    expect(isUndated(makeTask({ schedule: { kind: 'once' } }))).toBe(true);
    expect(isUndated(makeTask({ schedule: { kind: 'once', date: '2026-09-20' } }))).toBe(false);
    expect(isUndated(makeTask({ schedule: { kind: 'daily' } }))).toBe(false);
  });
});

describe('nextOccurrence', () => {
  it('finds the next matching weekday', () => {
    const task = makeTask({ schedule: { kind: 'weekly', daysOfWeek: [2] } }); // terça
    // from domingo 2026-09-13 -> next terça is 2026-09-15
    expect(nextOccurrence(task, '2026-09-13')).toBe('2026-09-15');
  });
});
