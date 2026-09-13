import type { Group, Task } from '../domain/types';

const now = () => new Date().toISOString();

export function buildSeedData(): { group: Group; tasks: Task[] } {
  const groupId = crypto.randomUUID();
  const createdAt = now();

  const group: Group = {
    id: groupId,
    title: 'English',
    description: 'Rotina diária de estudo de inglês: prática, vocabulário e imersão.',
    emoji: '🇬🇧',
    order: 0,
    createdAt,
  };

  const taskDefs: Array<Pick<Task, 'title' | 'schedule'>> = [
    { title: 'Duolingo', schedule: { kind: 'daily' } },
    { title: 'Vocabulário', schedule: { kind: 'daily' } },
    { title: 'Curso', schedule: { kind: 'weekly', daysOfWeek: [2, 4] } }, // ter/qui
    { title: 'Imersão', schedule: { kind: 'daily' } },
    { title: 'Prática de Fala', schedule: { kind: 'weekly', daysOfWeek: [6] } }, // sáb
  ];

  const tasks: Task[] = taskDefs.map((def, index) => ({
    id: crypto.randomUUID(),
    groupId,
    title: def.title,
    details: '',
    schedule: def.schedule,
    checklist: [],
    order: index,
    createdAt,
  }));

  return { group, tasks };
}
