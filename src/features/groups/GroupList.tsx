import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { groupProgressFor, tasksDueOn } from '../../domain/progress';
import { isTaskDone } from '../../domain/completions';
import { freezesRemaining } from '../../domain/streakFreeze';
import { todayKey } from '../../domain/dates';
import { GroupCard } from './GroupCard';
import { GroupForm } from './GroupForm';
import { Button } from '../../ui/Button';
import { DayNav } from '../../ui/DayNav';
import { SortableList } from '../../ui/SortableList';
import { Confetti } from '../../ui/Confetti';
import styles from './GroupList.module.css';

function celebratedKey(userId: string, day: string): string {
  return `taskfy:celebrated:${userId}:${day}`;
}

export function GroupList() {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
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
  const userId = useAuthStore((s) => s.userId);
  const signOut = useAuthStore((s) => s.signOut);

  const dueToday = tasksDueOn(tasks, selectedDay, completions);
  const doneToday = dueToday.filter((t) => isTaskDone(t.id, selectedDay, completions)).length;
  const allDoneToday = dueToday.length > 0 && doneToday === dueToday.length;
  const remainingFreezes = freezesRemaining(completions, todayKey());

  // Celebra a primeira vez, no dia, em que todas as tarefas devidas de hoje ficam concluídas.
  useEffect(() => {
    if (!userId || selectedDay !== todayKey() || !allDoneToday) return;
    const key = celebratedKey(userId, selectedDay);
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      // localStorage indisponível (modo privado etc.) — celebra mesmo assim, só não persiste
    }
    setCelebrating(true);
    const timer = setTimeout(() => setCelebrating(false), 3000);
    return () => clearTimeout(timer);
  }, [allDoneToday, selectedDay, userId]);

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Taskfy</h1>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          + Novo grupo
        </Button>
      </div>

      {celebrating && <Confetti message="🎉 Você concluiu todas as tarefas de hoje!" />}

      <div className={styles.account}>
        <span>{email}</span>
        <div className={styles.accountRight}>
          <span className={styles.freezeBadge} title="Freezes de streak restantes este mês">
            🧊 {remainingFreezes}
          </span>
          <button className={styles.signOutBtn} onClick={() => signOut()}>
            Sair
          </button>
        </div>
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
