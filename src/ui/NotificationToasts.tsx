import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import styles from './NotificationToasts.module.css';

const AUTO_DISMISS_MS = 6000;

export function NotificationToasts() {
  const notifications = useAppStore((s) => s.notifications);
  const dismiss = useAppStore((s) => s.dismissNotification);

  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) => setTimeout(() => dismiss(n.id), AUTO_DISMISS_MS));
    return () => timers.forEach(clearTimeout);
  }, [notifications, dismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className={styles.stack}>
      {notifications.map((n) => (
        <div key={n.id} className={styles.toast}>
          <span>{n.message}</span>
          <button className={styles.closeBtn} onClick={() => dismiss(n.id)} aria-label="Dispensar">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
