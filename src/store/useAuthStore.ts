import { create } from 'zustand';
import { supabase } from '../data/supabaseClient';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  error: string | null;

  init: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  userId: null,
  email: null,
  error: null,

  init: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        set({ status: user ? 'signedIn' : 'signedOut', userId: user?.id ?? null, email: user?.email ?? null });
      })
      .catch((err) => {
        // config errada / sem rede: não trava em "Carregando…" para sempre
        set({ status: 'signedOut', error: `Não foi possível conectar ao Supabase: ${err.message ?? err}` });
      });

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      set({ status: user ? 'signedIn' : 'signedOut', userId: user?.id ?? null, email: user?.email ?? null });
    });
  },

  signUp: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) set({ error: error.message });
  },

  signIn: async (email, password) => {
    set({ error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) set({ error: error.message });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  clearError: () => set({ error: null }),
}));
