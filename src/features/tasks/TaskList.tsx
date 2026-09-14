import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import type { Task } from '../../domain/types';
import { isDueOn, isUndated, isScheduledFuture } from '../../domain/schedule';
import { isTaskDone } from '../../domain/completions';
import { TaskRow } from './TaskRow';
import { SortableList } from '../../ui/SortableList';
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
  const reorderTasks = useAppStore((s) => s.reorderTasks);

  const isDone = (t: Task) => isTaskDone(t.id, day, completions);
  const byOrder = (a: Task, b: Task) => a.order - b.order;

  const dueToday = tasks.filter((t) => isDueOn(t, day, completions) && !isDone(t)).sort(byOrder);
  const doneToday = tasks.filter((t) => isDueOn(t, day, completions) && isDone(t)).sort(byOrder);
  const scheduled = tasks.filter((t) => isScheduledFuture(t, day)).sort(byOrder);
  const undated = tasks
    .filter((t) => isUndated(t) && !dueToday.includes(t) && !doneToday.includes(t) && !scheduled.includes(t))
    .sort(byOrder);

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
          <SortableList
            items={list}
            getId={(task) => task.id}
            onReorder={reorderTasks}
            renderItem={(task, drag) => (
              <TaskRow
                task={task}
                day={day}
                completions={completions}
                onToggle={() => toggleCompletion(task.id, day)}
                onOpen={() => openTask(task.id)}
                drag={drag}
              />
            )}
          />
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
