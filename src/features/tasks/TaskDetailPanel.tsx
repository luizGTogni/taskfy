import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { ScheduleEditor } from './ScheduleEditor';
import { Checklist } from './Checklist';
import { currentStreak, longestStreak } from '../../domain/streak';
import { addDays, todayKey } from '../../domain/dates';
import styles from './TaskDetailPanel.module.css';

export function TaskDetailPanel() {
  const openTaskId = useAppStore((s) => s.openTaskId);
  const task = useAppStore((s) => s.tasks.find((t) => t.id === openTaskId));
  const completions = useAppStore((s) => s.completions);
  const day = useAppStore((s) => s.selectedDay);
  const closeTask = useAppStore((s) => s.openTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [title, setTitle] = useState(task?.title ?? '');
  const [details, setDetails] = useState(task?.details ?? '');

  if (!task) return null;

  const taskCompletions = completions.filter((c) => c.taskId === task.id && c.done);
  const streak = currentStreak(task, completions, day);
  const best = longestStreak(task, completions);

  const today = todayKey();
  const heatDays = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task!.title) updateTask(task!.id, { title: trimmed });
    else setTitle(task!.title);
  }

  function commitDetails() {
    if (details !== task!.details) updateTask(task!.id, { details });
  }

  return (
    <Drawer onClose={() => closeTask(null)}>
      <input
        className={styles.titleInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Detalhes</p>
        <textarea
          className={styles.details}
          placeholder="Sem detalhes"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          onBlur={commitDetails}
        />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Agendamento</p>
        <ScheduleEditor schedule={task.schedule} onChange={(schedule) => updateTask(task.id, { schedule })} />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Checklist</p>
        <Checklist task={task} day={day} completions={completions} />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Progresso</p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>🔥 {streak}</span>
            <span className={styles.statLabel}>streak atual</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{best}</span>
            <span className={styles.statLabel}>recorde</span>
          </div>
        </div>
        <div className={styles.heatmap}>
          {heatDays.map((d) => (
            <div
              key={d}
              title={d}
              className={`${styles.heatCell} ${taskCompletions.some((c) => c.date === d) ? styles.heatCellDone : ''}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="danger" onClick={() => deleteTask(task.id)}>
          Excluir tarefa
        </Button>
      </div>
    </Drawer>
  );
}
