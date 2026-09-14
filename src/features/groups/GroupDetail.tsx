import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DayNav } from '../../ui/DayNav';
import { Button } from '../../ui/Button';
import { TaskList } from '../tasks/TaskList';
import { TaskDetailPanel } from '../tasks/TaskDetailPanel';
import styles from './GroupDetail.module.css';

interface GroupDetailProps {
  groupId: string;
}

export function GroupDetail({ groupId }: GroupDetailProps) {
  const group = useAppStore((s) => s.groups.find((g) => g.id === groupId));
  const openTaskId = useAppStore((s) => s.openTaskId);
  const selectedDay = useAppStore((s) => s.selectedDay);
  const shiftDay = useAppStore((s) => s.shiftDay);
  const goToday = useAppStore((s) => s.goToday);
  const openGroup = useAppStore((s) => s.openGroup);
  const updateGroup = useAppStore((s) => s.updateGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const duplicateGroup = useAppStore((s) => s.duplicateGroup);
  const archiveGroup = useAppStore((s) => s.archiveGroup);

  const [title, setTitle] = useState(group?.title ?? '');
  const [description, setDescription] = useState(group?.description ?? '');

  if (!group) return null;

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== group!.title) updateGroup(group!.id, { title: trimmed });
    else setTitle(group!.title);
  }

  function commitDescription() {
    if (description !== group!.description) updateGroup(group!.id, { description });
  }

  return (
    <div>
      <button className={styles.backBtn} onClick={() => openGroup(null)}>
        ← Grupos
      </button>

      <div className={styles.header}>
        <div className={styles.titleRow} style={{ flex: 1 }}>
          {group.emoji && <span className={styles.emoji}>{group.emoji}</span>}
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            onClick={async () => {
              const copy = await duplicateGroup(group.id);
              openGroup(copy.id);
            }}
          >
            Duplicar
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              archiveGroup(group.id);
              openGroup(null);
            }}
          >
            Arquivar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm(`Excluir o grupo "${group.title}" e todas as suas tarefas?`)) deleteGroup(group.id);
            }}
          >
            Excluir
          </Button>
        </div>
      </div>

      <textarea
        className={styles.descriptionInput}
        placeholder="Adicionar descrição…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={commitDescription}
        rows={2}
      />

      <DayNav day={selectedDay} onShift={shiftDay} onToday={goToday} />

      <TaskList groupId={group.id} />

      <TaskDetailPanel key={openTaskId ?? 'none'} />
    </div>
  );
}
