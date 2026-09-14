import type { Task, Completion, DayKey } from '../../domain/types';
import { Checkbox } from '../../ui/Checkbox';
import { Chip } from '../../ui/Chip';
import { DragHandle } from '../../ui/DragHandle';
import type { DragHandleProps } from '../../ui/SortableList';
import { currentStreak } from '../../domain/streak';
import { isTaskDone, findCompletion } from '../../domain/completions';
import { weekdayLabel, formatDayKey } from '../../domain/dates';
import styles from './TaskRow.module.css';

interface TaskRowProps {
  task: Task;
  day: DayKey;
  completions: Completion[];
  onToggle: () => void;
  onOpen: () => void;
  drag: DragHandleProps;
}

function scheduleLabel(task: Task): string | null {
  switch (task.schedule.kind) {
    case 'daily':
      return 'Todo dia';
    case 'weekly':
      return task.schedule.daysOfWeek.map(weekdayLabel).join('/');
    case 'once':
      return task.schedule.date ? formatDayKey(task.schedule.date) : null;
    case 'none':
      return null;
  }
}

export function TaskRow({ task, day, completions, onToggle, onOpen, drag }: TaskRowProps) {
  const done = isTaskDone(task.id, day, completions);
  const streak = currentStreak(task, completions, day);
  const label = scheduleLabel(task);
  const time = task.schedule.kind !== 'none' ? task.schedule.time : undefined;
  const checklistDone = findCompletion(task.id, day, completions)?.checkedItems.length ?? 0;

  return (
    <div className={`${styles.row} ${done ? styles.done : ''}`} onClick={onOpen}>
      <DragHandle {...drag} />
      <Checkbox checked={done} onChange={onToggle} aria-label={`Concluir ${task.title}`} />
      <div className={styles.body}>
        <span className={styles.title}>{task.title}</span>
        <div className={styles.chips}>
          {label && <Chip>{label}</Chip>}
          {time && <Chip>{time}</Chip>}
          {task.checklist.length > 0 && (
            <Chip>
              {checklistDone}/{task.checklist.length}
            </Chip>
          )}
          {streak > 0 && <Chip>🔥 {streak}</Chip>}
        </div>
      </div>
    </div>
  );
}
