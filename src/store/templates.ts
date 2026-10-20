import { create } from 'zustand';
import { newId } from '../lib/ids';
import { validateTemplate } from '../persistence/schema';
import { safeGet, safeSet } from '../persistence/storage';
import type { SavedTemplate } from './types';

/**
 * The user's own templates (frames saved for reuse). They live outside the document, in browser
 * storage, and travel with `.mockup.json` files. Changes here are not part of undo: deleting one
 * asks first.
 */
interface TemplatesState {
  templates: SavedTemplate[];
  load: () => Promise<void>;
  add: (template: Omit<SavedTemplate, 'id' | 'createdAt'>) => SavedTemplate;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  /** Add templates from an opened file, skipping ones already here. */
  merge: (incoming: SavedTemplate[]) => number;
}

const KEY = 'templates';

export const useTemplates = create<TemplatesState>((set, get) => {
  const persist = (templates: SavedTemplate[]) => {
    set({ templates });
    void safeSet(KEY, templates);
  };
  return {
    templates: [],
    load: async () => {
      const raw = await safeGet<unknown[]>(KEY);
      if (!Array.isArray(raw)) return;
      const ok: SavedTemplate[] = [];
      for (const r of raw) {
        try {
          ok.push(validateTemplate(r));
        } catch {
          /* drop a damaged template */
        }
      }
      set({ templates: ok });
    },
    add: (template) => {
      const saved: SavedTemplate = { ...template, id: newId('tpl'), createdAt: Date.now() };
      persist([saved, ...get().templates]);
      return saved;
    },
    rename: (id, name) => {
      const next = name.trim().slice(0, 200);
      if (!next) return;
      persist(get().templates.map((t) => (t.id === id ? { ...t, name: next } : t)));
    },
    remove: (id) => persist(get().templates.filter((t) => t.id !== id)),
    merge: (incoming) => {
      const have = new Set(get().templates.map((t) => t.id));
      const fresh = incoming.filter((t) => !have.has(t.id));
      if (fresh.length) persist([...fresh, ...get().templates]);
      return fresh.length;
    },
  };
});
