import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Task } from '../../domain/types';
import { isDueOn, isUndated, isScheduledFuture } from '../../domain/schedule';
import { isTaskDone } from '../../domain/completions';
import { TaskRow } from './TaskRow';
import styles from './TaskList.module.css';

interface TaskListProps {
  groupId: string;
}

export function TaskList({ groupId }: TaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const tasks = useAppStore(
    useShallow((s) => s.tasks.filter((t) => t.groupId === groupId && !t.archivedAt)),
  );
  const completions = useAppStore((s) => s.completions);
  const day = useAppStore((s) => s.selectedDay);
  const toggleCompletion = useAppStore((s) => s.toggleCompletion);
  const openTask = useAppStore((s) => s.openTask);
  const createTask = useAppStore((s) => s.createTask);

  const isDone = (t: Task) => isTaskDone(t.id, day, completions);

  const dueToday = tasks.filter((t) => isDueOn(t, day, completions) && !isDone(t));
  const doneToday = tasks.filter((t) => isDueOn(t, day, completions) && isDone(t));
  const scheduled = tasks.filter((t) => isScheduledFuture(t, day));
  const undated = tasks.filter((t) => isUndated(t) && !dueToday.includes(t) && !doneToday.includes(t) && !scheduled.includes(t));

  function submitNew() {
    if (!newTitle.trim()) return;
    createTask(groupId, newTitle.trim());
    setNewTitle('');
  }

  function renderSection(label: string, list: Task[]) {
    if (list.length === 0) return null;
    return (
      <div className={styles.section}>
        <p className={styles.sectionTitle}>{label}</p>
        <div className={styles.rows}>
          {list.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              day={day}
              completions={completions}
              onToggle={() => toggleCompletion(task.id, day)}
              onOpen={() => openTask(task.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderSection('Hoje', dueToday)}
      {renderSection('Agendadas', scheduled)}
      {renderSection('Sem data', undated)}
      {renderSection('Concluídas', doneToday)}

      {tasks.length === 0 && <p className={styles.empty}>Nenhuma tarefa neste grupo ainda.</p>}

      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          placeholder="Adicionar tarefa…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitNew()}
        />
      </div>
    </div>
  );
}
