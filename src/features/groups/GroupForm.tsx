import { useState } from 'react';
import { Button } from '../../ui/Button';
import { EmojiPicker } from '../../ui/EmojiPicker';
import styles from './GroupForm.module.css';

interface GroupFormProps {
  onSubmit: (title: string, description: string, emoji?: string) => void;
  onCancel: () => void;
}

export function GroupForm({ onSubmit, onCancel }: GroupFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState<string | undefined>(undefined);

  function submit() {
    if (!title.trim()) return;
    onSubmit(title.trim(), description.trim(), emoji);
  }

  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input
          className={styles.input}
          placeholder="Nome do grupo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <input
        className={styles.input}
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <div className={styles.actions}>
        <Button variant="primary" onClick={submit}>
          Criar grupo
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
