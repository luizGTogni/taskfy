import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { groupProgressFor } from '../../domain/progress';
import { GroupCard } from './GroupCard';
import { GroupForm } from './GroupForm';
import { Button } from '../../ui/Button';
import { DayNav } from '../../ui/DayNav';
import styles from './GroupList.module.css';

export function GroupList() {
  const [showForm, setShowForm] = useState(false);
  const groups = useAppStore(useShallow((s) => s.groups.filter((g) => !g.archivedAt)));
  const tasks = useAppStore((s) => s.tasks);
  const completions = useAppStore((s) => s.completions);
  const selectedDay = useAppStore((s) => s.selectedDay);
  const shiftDay = useAppStore((s) => s.shiftDay);
  const goToday = useAppStore((s) => s.goToday);
  const openGroup = useAppStore((s) => s.openGroup);
  const createGroup = useAppStore((s) => s.createGroup);

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Taskfy</h1>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          + Novo grupo
        </Button>
      </div>

      <DayNav day={selectedDay} onShift={shiftDay} onToday={goToday} />

      {showForm && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <GroupForm
            onSubmit={(title, description, emoji) => {
              createGroup(title, description, emoji);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {groups.length === 0 ? (
        <p className={styles.empty}>Nenhum grupo ainda. Crie o primeiro!</p>
      ) : (
        <div className={styles.list}>
          {groups.map((group) => {
            const groupTasks = tasks.filter((t) => t.groupId === group.id && !t.archivedAt);
            const progress = groupProgressFor(group, groupTasks, completions, selectedDay);
            return (
              <GroupCard
                key={group.id}
                group={group}
                progress={progress}
                onOpen={() => openGroup(group.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
