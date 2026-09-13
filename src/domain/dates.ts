import type { DayKey } from './types';

/** Converte um Date para uma chave de dia local (yyyy-MM-dd), sem passar por UTC. */
export function toDayKey(date: Date): DayKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): DayKey {
  return toDayKey(new Date());
}

/** Faz parse de uma DayKey como data local (evita o shift de fuso de `new Date(string)`). */
export function parseDayKey(day: DayKey): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(day: DayKey, amount: number): DayKey {
  const date = parseDayKey(day);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

/** 0 = domingo .. 6 = sábado, calculado em fuso local. */
export function dayOfWeek(day: DayKey): number {
  return parseDayKey(day).getDay();
}

export function compareDayKeys(a: DayKey, b: DayKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function weekdayLabel(index: number): string {
  return WEEKDAY_LABELS[index] ?? '';
}

export function formatDayKey(day: DayKey): string {
  const date = parseDayKey(day);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
