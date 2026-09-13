import type { Schedule } from '../../domain/types';
import { weekdayLabel } from '../../domain/dates';
import styles from './ScheduleEditor.module.css';

interface ScheduleEditorProps {
  schedule: Schedule;
  onChange: (schedule: Schedule) => void;
}

const KINDS: Array<{ kind: Schedule['kind']; label: string }> = [
  { kind: 'once', label: 'Uma vez' },
  { kind: 'daily', label: 'Todo dia' },
  { kind: 'weekly', label: 'Dias da semana' },
  { kind: 'none', label: 'Sem data' },
];

export function ScheduleEditor({ schedule, onChange }: ScheduleEditorProps) {
  function setKind(kind: Schedule['kind']) {
    if (kind === 'daily') onChange({ kind: 'daily', time: schedule.kind !== 'none' ? schedule.time : undefined });
    else if (kind === 'none') onChange({ kind: 'none' });
    else if (kind === 'once')
      onChange({ kind: 'once', date: undefined, time: schedule.kind !== 'none' ? schedule.time : undefined });
    else if (kind === 'weekly')
      onChange({ kind: 'weekly', daysOfWeek: [], time: schedule.kind !== 'none' ? schedule.time : undefined });
  }

  function toggleWeekday(day: number) {
    if (schedule.kind !== 'weekly') return;
    const has = schedule.daysOfWeek.includes(day);
    const daysOfWeek = has ? schedule.daysOfWeek.filter((d) => d !== day) : [...schedule.daysOfWeek, day].sort();
    onChange({ ...schedule, daysOfWeek });
  }

  const time = schedule.kind !== 'none' ? schedule.time ?? '' : '';

  return (
    <div>
      <div className={styles.segmented}>
        {KINDS.map(({ kind, label }) => (
          <button
            key={kind}
            className={`${styles.segment} ${schedule.kind === kind ? styles.segmentActive : ''}`}
            onClick={() => setKind(kind)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.extra}>
        {schedule.kind === 'weekly' && (
          <div className={styles.weekdays}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                className={`${styles.weekdayBtn} ${schedule.daysOfWeek.includes(d) ? styles.weekdayBtnActive : ''}`}
                onClick={() => toggleWeekday(d)}
              >
                {weekdayLabel(d)}
              </button>
            ))}
          </div>
        )}

        {schedule.kind === 'once' && (
          <input
            type="date"
            className={styles.field}
            value={schedule.date ?? ''}
            onChange={(e) => onChange({ ...schedule, date: e.target.value || undefined })}
          />
        )}

        {schedule.kind !== 'none' && (
          <input
            type="time"
            className={styles.field}
            value={time}
            onChange={(e) => onChange({ ...schedule, time: e.target.value || undefined } as Schedule)}
          />
        )}
      </div>
    </div>
  );
}
