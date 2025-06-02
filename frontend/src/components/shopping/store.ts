import { create } from "zustand";

interface Item { id:number; name:string; unit:string; qty:number }

interface State {
  items: Item[];
  add: (p:any, qty:number) => void;
  remove: (id:number) => void;
  clear: () => void;
}

export const useShoppingStore = create<State>(set => ({
  items: [],
  add: (p, qty) =>
    set(s => {
      const exists = s.items.find(i => i.id === p.id);
      if (exists) {
        exists.qty += qty;
        return { items:[...s.items] };
      }
      return { items:[...s.items, { ...p, qty }] };
    }),
  remove: id => set(s => ({ items: s.items.filter(i => i.id !== id) })),
  clear: () => set({ items: [] })
}));