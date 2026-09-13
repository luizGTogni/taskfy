import styles from './DayNav.module.css';
import { formatDayKey, todayKey } from '../domain/dates';

interface DayNavProps {
  day: string;
  onShift: (delta: number) => void;
  onToday: () => void;
}

export function DayNav({ day, onShift, onToday }: DayNavProps) {
  const isToday = day === todayKey();
  return (
    <div className={styles.nav}>
      <button className={styles.navBtn} onClick={() => onShift(-1)} aria-label="Dia anterior">
        ←
      </button>
      <span className={styles.label}>{isToday ? 'Hoje' : formatDayKey(day)}</span>
      {!isToday && (
        <button className={styles.todayBtn} onClick={onToday}>
          Hoje
        </button>
      )}
      <button className={styles.navBtn} onClick={() => onShift(1)} aria-label="Próximo dia">
        →
      </button>
    </div>
  );
}
