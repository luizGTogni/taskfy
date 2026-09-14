import { useMemo } from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#4f46e5', '#16a34a', '#f59e0b', '#dc2626', '#0ea5e9', '#db2777'];
const PIECE_COUNT = 60;

interface ConfettiProps {
  message: string;
}

/** Celebração leve (CSS puro, sem dependência) ao zerar todas as tarefas do dia. */
export function Confetti({ message }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        duration: 2.2 + Math.random() * 1.4,
        delay: Math.random() * 0.4,
      })),
    [],
  );

  return (
    <>
      <div className={styles.overlay}>
        {pieces.map((p) => (
          <span
            key={p.id}
            className={styles.piece}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.4,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.banner}>{message}</div>
    </>
  );
}
