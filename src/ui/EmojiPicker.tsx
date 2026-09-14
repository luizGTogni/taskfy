import { useEffect, useRef, useState } from 'react';
import styles from './EmojiPicker.module.css';

const CATEGORIES: Array<{ label: string; emojis: string[] }> = [
  {
    label: 'Estudo',
    emojis: ['📚', '✍️', '🎓', '🧠', '🗣️', '🇬🇧', '💻', '🔬', '🎨', '🎵', '📐', '🧮'],
  },
  {
    label: 'Saúde e fitness',
    emojis: ['🏃', '🏋️', '🧘', '🚴', '⚽', '🥗', '💧', '😴', '🩺', '🦷', '🧴', '💊'],
  },
  {
    label: 'Casa e rotina',
    emojis: ['🏠', '🧹', '🧺', '🍳', '🛒', '🌱', '🐶', '🐱', '👶', '🧾', '💰', '📦'],
  },
  {
    label: 'Trabalho',
    emojis: ['💼', '📈', '📅', '✅', '📞', '📧', '🖥️', '🗂️', '🤝', '🚀', '🛠️', '📝'],
  },
  {
    label: 'Lazer',
    emojis: ['🎮', '📖', '🎬', '✈️', '🎉', '🏖️', '📷', '🎸', '⛺', '🧩', '🍿', '☕'],
  },
];

interface EmojiPickerProps {
  value?: string;
  onChange: (emoji: string | undefined) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(value ?? '');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustom(value ?? '');
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  function commitCustom() {
    const trimmed = custom.trim();
    onChange(trimmed || undefined);
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Escolher emoji"
      >
        {value ?? '＋'}
      </button>

      {open && (
        <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
          {CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className={styles.categoryLabel}>{cat.label}</p>
              <div className={styles.grid}>
                {cat.emojis.map((emoji) => (
                  <button key={emoji} type="button" className={styles.cell} onClick={() => pick(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.customRow}>
            <input
              className={styles.customInput}
              placeholder="ou digite um emoji…"
              value={custom}
              maxLength={4}
              onChange={(e) => setCustom(e.target.value)}
              onBlur={commitCustom}
              onKeyDown={(e) => e.key === 'Enter' && commitCustom()}
            />
            <button type="button" className={styles.clearBtn} onClick={() => pick('')}>
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
