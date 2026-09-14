import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { AuthScreen } from './features/auth/AuthScreen';
import { GroupList } from './features/groups/GroupList';
import { GroupDetail } from './features/groups/GroupDetail';

export default function App() {
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);
  const initAuth = useAuthStore((s) => s.init);

  const loaded = useAppStore((s) => s.loaded);
  const loadAll = useAppStore((s) => s.loadAll);
  const resetApp = useAppStore((s) => s.reset);
  const openGroupId = useAppStore((s) => s.openGroupId);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (authStatus === 'signedIn' && userId) loadAll(userId);
    if (authStatus === 'signedOut') resetApp();
  }, [authStatus, userId, loadAll, resetApp]);

  if (authStatus === 'loading') {
    return <div className="app-shell">Carregando…</div>;
  }

  if (authStatus === 'signedOut') {
    return (
      <div className="app-shell">
        <AuthScreen />
      </div>
    );
  }

  if (!loaded) {
    return <div className="app-shell">Carregando seus grupos…</div>;
  }

  return <div className="app-shell">{openGroupId ? <GroupDetail groupId={openGroupId} /> : <GroupList />}</div>;
}
