import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../ui/Button';
import styles from './AuthScreen.module.css';

export function AuthScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const clearError = useAuthStore((s) => s.clearError);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (mode === 'signIn') await signIn(email, password);
    else await signUp(email, password);
    setSubmitting(false);
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Taskfy</h1>
      <p className={styles.subtitle}>
        {mode === 'signIn' ? 'Entre para ver seus grupos e tarefas.' : 'Crie sua conta para começar.'}
      </p>

      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          minLength={6}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" variant="primary" full disabled={submitting}>
          {mode === 'signIn' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>

      <p className={styles.switchRow}>
        {mode === 'signIn' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
        <button
          className={styles.switchBtn}
          onClick={() => {
            clearError();
            setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
          }}
        >
          {mode === 'signIn' ? 'Criar conta' : 'Entrar'}
        </button>
      </p>
    </div>
  );
}
