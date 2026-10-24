import { create } from 'zustand';
import { newId } from '../lib/ids';
import { validateSavedComponent } from '../persistence/schema';
import { safeGet, safeSet } from '../persistence/storage';
import type { SavedComponent } from './types';

/**
 * The user's own components (a component or section saved for reuse). Like saved templates they live
 * in browser storage, outside the document, and travel with `.mockup.json` files. Not part of undo:
 * deleting one asks first.
 */
interface SavedComponentsState {
  components: SavedComponent[];
  load: () => Promise<void>;
  add: (component: Omit<SavedComponent, 'id' | 'createdAt'>) => SavedComponent;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  /** Add components from an opened file, skipping ones already here. */
  merge: (incoming: SavedComponent[]) => number;
}

const KEY = 'components';

export const useSavedComponents = create<SavedComponentsState>((set, get) => {
  const persist = (components: SavedComponent[]) => {
    set({ components });
    void safeSet(KEY, components);
  };
  return {
    components: [],
    load: async () => {
      const raw = await safeGet<unknown[]>(KEY);
      if (!Array.isArray(raw)) return;
      const ok: SavedComponent[] = [];
      for (const r of raw) {
        try {
          ok.push(validateSavedComponent(r));
        } catch {
          /* drop a damaged component */
        }
      }
      set({ components: ok });
    },
    add: (component) => {
      const saved: SavedComponent = { ...component, id: newId('cmp'), createdAt: Date.now() };
      persist([saved, ...get().components]);
      return saved;
    },
    rename: (id, name) => {
      const next = name.trim().slice(0, 200);
      if (!next) return;
      persist(get().components.map((c) => (c.id === id ? { ...c, name: next } : c)));
    },
    remove: (id) => persist(get().components.filter((c) => c.id !== id)),
    merge: (incoming) => {
      const have = new Set(get().components.map((c) => c.id));
      const fresh = incoming.filter((c) => !have.has(c.id));
      if (fresh.length) persist([...fresh, ...get().components]);
      return fresh.length;
    },
  };
});
