import { create } from 'zustand';
import nswPkg from 'nsw-design-system/package.json';
import { demoNodes } from '../catalogue/demo';
import { newId } from '../lib/ids';
import { clampZoom, fitView, unionRects, type View } from '../lib/geometry';
import { cloneSubtrees, removeSubtrees } from '../layout/tree';
import { DEVICES, type DeviceId, type Frame, type MockupDoc } from './types';

const HISTORY_LIMIT = 100;
const FRAME_GAP = 80;

export type Mode = 'edit' | 'preview';

export function createDoc(): MockupDoc {
  const { nodes, root } = demoNodes(newId);
  return {
    version: 1,
    id: newId('doc'),
    name: 'Untitled mockup',
    nswVersion: nswPkg.version,
    view: { x: 80, y: 80, zoom: 1 },
    frames: [{ id: newId('f'), name: 'Home', device: 'iphone', width: 393, x: 0, y: 0, root }],
    nodes,
    images: {},
  };
}

interface State {
  doc: MockupDoc;
  past: MockupDoc[];
  future: MockupDoc[];
  mode: Mode;
  selectedFrameId: string | null;
  /** Measured content heights per frame (UI only, not saved). */
  frameHeights: Record<string, number>;
  /** Viewport size, used by "Zoom to fit". */
  viewport: { width: number; height: number };
  /** True while the canvas is being panned (space held or middle mouse), so frames ignore the pointer. */
  panning: boolean;
  /** True once the initial "zoom to fit" has run. */
  fitted: boolean;
  /** Frame id whose name label should switch to rename mode. */
  renameRequest: string | null;
}

interface Actions {
  setMode: (mode: Mode) => void;
  selectFrame: (id: string | null) => void;
  setFrameHeight: (id: string, height: number) => void;
  setViewport: (width: number, height: number) => void;
  setPanning: (panning: boolean) => void;
  markFitted: () => void;
  requestRename: (id: string | null) => void;

  setView: (view: View) => void;
  zoomToFit: () => void;

  addFrame: (device: DeviceId) => void;
  duplicateFrame: (id: string) => void;
  deleteFrame: (id: string) => void;
  renameFrame: (id: string, name: string) => void;
  setFrameDevice: (id: string, device: DeviceId) => void;
  setFrameWidth: (id: string, width: number) => void;
  addDemoContent: (id: string) => void;

  /** Call once at the start of a continuous gesture (e.g. a drag) so it is one undo entry. */
  beginGesture: () => void;
  moveFrameLive: (id: string, x: number, y: number) => void;

  undo: () => void;
  redo: () => void;
}

export type Store = State & Actions;

/** Apply a document change as a single undoable history entry. */
function commit(s: Store, next: MockupDoc): Partial<Store> {
  return { doc: next, past: [...s.past, s.doc].slice(-HISTORY_LIMIT), future: [] };
}

const updateFrame = (doc: MockupDoc, id: string, patch: Partial<Frame>): MockupDoc => ({
  ...doc,
  frames: doc.frames.map((f) => (f.id === id ? { ...f, ...patch } : f)),
});

export const useStore = create<Store>((set, get) => ({
  doc: createDoc(),
  past: [],
  future: [],
  mode: 'edit',
  selectedFrameId: null,
  frameHeights: {},
  viewport: { width: 1000, height: 700 },
  panning: false,
  fitted: false,
  renameRequest: null,

  setMode: (mode) => set({ mode }),
  selectFrame: (id) => set({ selectedFrameId: id }),
  setFrameHeight: (id, height) =>
    set((s) =>
      s.frameHeights[id] === height ? s : { frameHeights: { ...s.frameHeights, [id]: height } },
    ),
  setViewport: (width, height) => set({ viewport: { width, height } }),
  setPanning: (panning) => set({ panning }),
  markFitted: () => set({ fitted: true }),
  requestRename: (id) => set({ renameRequest: id }),

  // View changes are not undoable: panning and zooming should never eat history.
  setView: (view) =>
    set((s) => ({ doc: { ...s.doc, view: { ...view, zoom: clampZoom(view.zoom) } } })),
  zoomToFit: () => {
    const { doc, frameHeights, viewport } = get();
    const bounds = unionRects(
      doc.frames.map((f) => ({
        x: f.x,
        y: f.y - 28,
        width: f.width,
        height: (frameHeights[f.id] ?? 400) + 28,
      })),
    );
    if (!bounds) return;
    get().setView(fitView(bounds, viewport.width, viewport.height));
  },

  addFrame: (device) =>
    set((s) => {
      const preset = DEVICES[device];
      const right = Math.max(-FRAME_GAP, ...s.doc.frames.map((f) => f.x + f.width));
      const frame: Frame = {
        id: newId('f'),
        name: `${preset.label} ${s.doc.frames.length + 1}`,
        device,
        width: preset.width,
        x: right + FRAME_GAP,
        y: s.doc.frames[0]?.y ?? 0,
        root: [],
      };
      return {
        ...commit(s, { ...s.doc, frames: [...s.doc.frames, frame] }),
        selectedFrameId: frame.id,
      };
    }),

  duplicateFrame: (id) =>
    set((s) => {
      const src = s.doc.frames.find((f) => f.id === id);
      if (!src) return s;
      const cloned = cloneSubtrees(s.doc.nodes, src.root, newId);
      const frame: Frame = {
        ...src,
        id: newId('f'),
        name: `${src.name} copy`,
        x: src.x + src.width + FRAME_GAP,
        root: cloned.roots,
      };
      return {
        ...commit(s, {
          ...s.doc,
          frames: [...s.doc.frames, frame],
          nodes: { ...s.doc.nodes, ...cloned.nodes },
        }),
        selectedFrameId: frame.id,
      };
    }),

  deleteFrame: (id) =>
    set((s) => {
      const src = s.doc.frames.find((f) => f.id === id);
      if (!src) return s;
      return {
        ...commit(s, {
          ...s.doc,
          frames: s.doc.frames.filter((f) => f.id !== id),
          nodes: removeSubtrees(s.doc.nodes, src.root),
        }),
        selectedFrameId: s.selectedFrameId === id ? null : s.selectedFrameId,
      };
    }),

  renameFrame: (id, name) =>
    set((s) => {
      const trimmed = name.trim();
      const frame = s.doc.frames.find((f) => f.id === id);
      if (!frame || !trimmed || trimmed === frame.name) return s;
      return commit(s, updateFrame(s.doc, id, { name: trimmed }));
    }),

  setFrameDevice: (id, device) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === id);
      if (!frame || frame.device === device) return s;
      const width = device === 'custom' ? frame.width : DEVICES[device].width;
      return commit(s, updateFrame(s.doc, id, { device, width }));
    }),

  setFrameWidth: (id, width) =>
    set((s) => {
      const w = Math.round(Math.min(3000, Math.max(240, width)));
      const frame = s.doc.frames.find((f) => f.id === id);
      if (!frame || frame.width === w) return s;
      return commit(s, updateFrame(s.doc, id, { width: w, device: 'custom' }));
    }),

  addDemoContent: (id) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === id);
      if (!frame) return s;
      const { nodes, root } = demoNodes(newId);
      return commit(s, {
        ...updateFrame(s.doc, id, { root: [...frame.root, ...root] }),
        nodes: { ...s.doc.nodes, ...nodes },
      });
    }),

  beginGesture: () => set((s) => commit(s, s.doc)),
  moveFrameLive: (id, x, y) =>
    set((s) => ({ doc: updateFrame(s.doc, id, { x: Math.round(x), y: Math.round(y) }) })),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      // Keep the current view: undo should not move the camera.
      return {
        doc: { ...prev, view: s.doc.view },
        past: s.past.slice(0, -1),
        future: [s.doc, ...s.future],
        selectedFrameId: prev.frames.some((f) => f.id === s.selectedFrameId)
          ? s.selectedFrameId
          : null,
      };
    }),
  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return {
        doc: { ...next, view: s.doc.view },
        past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
      };
    }),
}));
