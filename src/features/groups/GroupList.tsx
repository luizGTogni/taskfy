import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { groupProgressFor } from '../../domain/progress';
import { GroupCard } from './GroupCard';
import { GroupForm } from './GroupForm';
import { Button } from '../../ui/Button';
import { DayNav } from '../../ui/DayNav';
import { SortableList } from '../../ui/SortableList';
import styles from './GroupList.module.css';

export function GroupList() {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const groups = useAppStore(
    useShallow((s) => s.groups.filter((g) => !g.archivedAt).sort((a, b) => a.order - b.order)),
  );
  const archivedGroups = useAppStore(useShallow((s) => s.groups.filter((g) => g.archivedAt)));
  const tasks = useAppStore((s) => s.tasks);
  const completions = useAppStore((s) => s.completions);
  const selectedDay = useAppStore((s) => s.selectedDay);
  const shiftDay = useAppStore((s) => s.shiftDay);
  const goToday = useAppStore((s) => s.goToday);
  const openGroup = useAppStore((s) => s.openGroup);
  const createGroup = useAppStore((s) => s.createGroup);
  const reorderGroups = useAppStore((s) => s.reorderGroups);
  const unarchiveGroup = useAppStore((s) => s.unarchiveGroup);
  const email = useAuthStore((s) => s.email);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Taskfy</h1>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          + Novo grupo
        </Button>
      </div>

      <div className={styles.account}>
        <span>{email}</span>
        <button className={styles.signOutBtn} onClick={() => signOut()}>
          Sair
        </button>
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
          <SortableList
            items={groups}
            getId={(group) => group.id}
            onReorder={reorderGroups}
            renderItem={(group, drag) => {
              const groupTasks = tasks.filter((t) => t.groupId === group.id && !t.archivedAt);
              const progress = groupProgressFor(group, groupTasks, completions, selectedDay);
              return (
                <GroupCard group={group} progress={progress} onOpen={() => openGroup(group.id)} drag={drag} />
              );
            }}
          />
        </div>
      )}

      {archivedGroups.length > 0 && (
        <div className={styles.archivedSection}>
          <button className={styles.archivedToggle} onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? '▾' : '▸'} Grupos arquivados ({archivedGroups.length})
          </button>
          {showArchived && (
            <div className={styles.archivedList}>
              {archivedGroups.map((group) => (
                <div key={group.id} className={styles.archivedRow}>
                  <span>
                    {group.emoji} {group.title}
                  </span>
                  <button className={styles.restoreBtn} onClick={() => unarchiveGroup(group.id)}>
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
