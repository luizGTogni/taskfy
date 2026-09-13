import type { Group } from '../../domain/types';
import { ProgressBar } from '../../ui/ProgressBar';
import styles from './GroupCard.module.css';

interface GroupCardProps {
  group: Group;
  progress: { done: number; total: number };
  onOpen: () => void;
}

export function GroupCard({ group, progress, onOpen }: GroupCardProps) {
  return (
    <div className={styles.card} onClick={onOpen}>
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
  );
}
