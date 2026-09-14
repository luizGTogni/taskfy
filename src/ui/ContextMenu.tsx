import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { useContextMenuStore, type ContextMenuItem } from '../store/useContextMenuStore';
import styles from './ContextMenu.module.css';

const MARGIN = 8;

/** Menu de contexto único, montado uma vez no topo do app (veja App.tsx). */
export function ContextMenuOverlay() {
  const position = useContextMenuStore((s) => s.position);
  const items = useContextMenuStore((s) => s.items);
  const close = useContextMenuStore((s) => s.close);
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // mantém o menu dentro da viewport, ajustando a posição depois de medir o tamanho real
  useLayoutEffect(() => {
    if (!position || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const left = Math.min(position.x, window.innerWidth - rect.width - MARGIN);
    const top = Math.min(position.y, window.innerHeight - rect.height - MARGIN);
    setStyle({ left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) });
  }, [position]);

  useEffect(() => {
    if (!position) return;
    function onDocMouseDown(e: globalThis.MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    function onScroll() {
      close();
    }
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [position, close]);

  if (!position) return null;

  return (
    <div className={styles.menu} style={style} ref={menuRef}>
      {items.map((item, i) => (
        <button
          key={i}
          className={`${styles.item} ${item.danger ? styles.danger : ''}`}
          onClick={() => {
            item.onSelect();
            close();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** Handler pronto para `onContextMenu`: abre o menu com os itens dados na posição do clique. */
export function useContextMenu(getItems: () => ContextMenuItem[]) {
  const open = useContextMenuStore((s) => s.open);
  return (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    open(e.clientX, e.clientY, getItems());
  };
}
