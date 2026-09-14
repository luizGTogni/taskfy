import { create } from 'zustand';

export interface ContextMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

interface ContextMenuState {
  position: { x: number; y: number } | null;
  items: ContextMenuItem[];
  open: (x: number, y: number, items: ContextMenuItem[]) => void;
  close: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  position: null,
  items: [],
  open: (x, y, items) => set({ position: { x, y }, items }),
  close: () => set({ position: null, items: [] }),
}));
