import { useState } from 'react';
import type { Task, DayKey, Completion } from '../../domain/types';
import { Checkbox } from '../../ui/Checkbox';
import { findCompletion } from '../../domain/completions';
import { useAppStore } from '../../store/useAppStore';
import styles from './Checklist.module.css';

interface ChecklistProps {
  task: Task;
  day: DayKey;
  completions: Completion[];
}

export function Checklist({ task, day, completions }: ChecklistProps) {
  const [newText, setNewText] = useState('');
  const toggleChecklistItem = useAppStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useAppStore((s) => s.addChecklistItem);
  const removeChecklistItem = useAppStore((s) => s.removeChecklistItem);

  const checkedItems = findCompletion(task.id, day, completions)?.checkedItems ?? [];

  function submitNew() {
    if (!newText.trim()) return;
    addChecklistItem(task.id, newText.trim());
    setNewText('');
  }

  return (
    <div>
      <div className={styles.list}>
        {task.checklist.map((item) => {
          const checked = checkedItems.includes(item.id);
          return (
            <div className={styles.item} key={item.id}>
              <Checkbox checked={checked} onChange={() => toggleChecklistItem(task.id, day, item.id)} />
              <span className={`${styles.text} ${checked ? styles.checkedText : ''}`}>{item.text}</span>
              <button className={styles.removeBtn} onClick={() => removeChecklistItem(task.id, item.id)}>
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          placeholder="Adicionar item…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitNew()}
        />
      </div>
    </div>
  );
}
