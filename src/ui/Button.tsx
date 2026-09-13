import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  full?: boolean;
}

export function Button({ variant = 'ghost', full, className, ...rest }: ButtonProps) {
  const cls = [styles.btn, styles[variant], full ? styles.full : '', className].filter(Boolean).join(' ');
  return <button type="button" className={cls} {...rest} />;
}
