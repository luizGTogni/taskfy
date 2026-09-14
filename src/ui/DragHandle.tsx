import type { DragHandleProps } from './SortableList';
import styles from './DragHandle.module.css';

export function DragHandle({ attributes, listeners, setActivatorNodeRef }: DragHandleProps) {
  return (
    <button
      ref={setActivatorNodeRef}
      className={styles.handle}
      aria-label="Arrastar para reordenar"
      onClick={(e) => e.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="3" r="1.4" />
        <circle cx="11" cy="3" r="1.4" />
        <circle cx="5" cy="8" r="1.4" />
        <circle cx="11" cy="8" r="1.4" />
        <circle cx="5" cy="13" r="1.4" />
        <circle cx="11" cy="13" r="1.4" />
      </svg>
    </button>
  );
}
