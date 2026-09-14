import type { Group } from '../../domain/types';
import { useAppStore } from '../../store/useAppStore';
import { ProgressBar } from '../../ui/ProgressBar';
import { DragHandle } from '../../ui/DragHandle';
import type { DragHandleProps } from '../../ui/SortableList';
import { useContextMenu } from '../../ui/ContextMenu';
import styles from './GroupCard.module.css';

interface GroupCardProps {
  group: Group;
  progress: { done: number; total: number };
  onOpen: () => void;
  drag: DragHandleProps;
}

export function GroupCard({ group, progress, onOpen, drag }: GroupCardProps) {
  const duplicateGroup = useAppStore((s) => s.duplicateGroup);
  const archiveGroup = useAppStore((s) => s.archiveGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const openGroup = useAppStore((s) => s.openGroup);

  const onContextMenu = useContextMenu(() => [
    { label: 'Abrir', onSelect: onOpen },
    { label: 'Duplicar', onSelect: () => duplicateGroup(group.id).then((copy) => openGroup(copy.id)) },
    { label: 'Arquivar', onSelect: () => archiveGroup(group.id) },
    {
      label: 'Excluir',
      danger: true,
      onSelect: () => {
        if (confirm(`Excluir o grupo "${group.title}" e todas as suas tarefas?`)) deleteGroup(group.id);
      },
    },
  ]);

  return (
    <div className={styles.card} onClick={onOpen} onContextMenu={onContextMenu}>
      <DragHandle {...drag} />
      <div className={styles.body}>
        <div className={styles.top}>
          {group.emoji && <span className={styles.emoji}>{group.emoji}</span>}
          <h3 className={styles.title}>{group.title}</h3>
        </div>
        {group.description && <p className={styles.description}>{group.description}</p>}
        <div className={styles.footer}>
          <ProgressBar done={progress.done} total={progress.total} />
          <span className={styles.count}>
            {progress.done}/{progress.total}
          </span>
        </div>
      </div>
    </div>
  );
}
