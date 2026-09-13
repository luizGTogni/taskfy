import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { GroupList } from './features/groups/GroupList';
import { GroupDetail } from './features/groups/GroupDetail';

export default function App() {
  const loaded = useAppStore((s) => s.loaded);
  const loadAll = useAppStore((s) => s.loadAll);
  const openGroupId = useAppStore((s) => s.openGroupId);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (!loaded) {
    return <div className="app-shell">Carregando…</div>;
  }

  return <div className="app-shell">{openGroupId ? <GroupDetail groupId={openGroupId} /> : <GroupList />}</div>;
}
