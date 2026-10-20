import { create } from 'zustand';
import nswPkg from 'nsw-design-system/package.json';
import { getComponent } from '../catalogue';
import { newId } from '../lib/ids';
import { clampZoom, fitView, unionRects, type View } from '../lib/geometry';
import {
  appendChild,
  buildContainer,
  buildGrid,
  buildSection,
  cloneSubtrees,
  findAppendColumn,
  lastOfType,
  removeSubtrees,
} from '../layout/tree';
import { DEVICES, type DeviceId, type Frame, type MockupDoc } from './types';

const HISTORY_LIMIT = 100;
const FRAME_GAP = 80;

export type Mode = 'edit' | 'preview';

export function createDoc(): MockupDoc {
  return {
    version: 1,
    id: newId('doc'),
    name: 'Untitled mockup',
    nswVersion: nswPkg.version,
    view: { x: 80, y: 80, zoom: 1 },
    frames: [{ id: newId('f'), name: 'Home', device: 'iphone', width: 393, x: 0, y: 0, root: [] }],
    nodes: {},
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
  /** Add a catalogue component to a frame, stacking it under the previous content. */
  addComponent: (frameId: string, componentId: string, variantId?: string) => void;
  /** Add a layout block: a section, a container, or a grid of 1–4 columns. */
  addLayoutBlock: (
    frameId: string,
    kind: 'section' | 'container' | 'grid',
    columns?: number,
  ) => void;

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

  addComponent: (frameId, componentId, variantId) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      const comp = getComponent(componentId);
      if (!frame || !comp) return s;
      const id = newId('n');
      let nodes: MockupDoc['nodes'] = {
        ...s.doc.nodes,
        [id]: {
          id,
          type: 'component',
          componentId,
          variant: variantId ?? comp.defaultVariant,
          props: {},
          text: {},
          textFit: {},
          hidden: false,
        },
      };
      let root = frame.root;
      const column = comp.fullWidth ? undefined : findAppendColumn(nodes, root);
      if (comp.fullWidth) {
        root = [...root, id];
      } else if (column) {
        nodes = appendChild(nodes, column, id);
      } else {
        const built = buildSection(newId);
        const container = lastOfType(built.nodes, built.nodes[built.rootId]?.children, 'container');
        const grid = lastOfType(
          built.nodes,
          container ? built.nodes[container]?.children : undefined,
          'grid',
        );
        const colId = lastOfType(
          built.nodes,
          grid ? built.nodes[grid]?.children : undefined,
          'column',
        );
        nodes = appendChild({ ...nodes, ...built.nodes }, colId!, id);
        root = [...root, built.rootId];
      }
      return {
        ...commit(s, { ...updateFrame(s.doc, frameId, { root }), nodes }),
        selectedFrameId: frameId,
      };
    }),

  addLayoutBlock: (frameId, kind, columns = 1) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const count = Math.min(4, Math.max(1, columns));
      let nodes = s.doc.nodes;
      let root = frame.root;
      const lastRoot = root[root.length - 1];
      const section = lastRoot && nodes[lastRoot]?.type === 'section' ? lastRoot : undefined;
      if (kind === 'container' && section) {
        const built = buildContainer(newId);
        nodes = appendChild({ ...nodes, ...built.nodes }, section, built.rootId);
      } else if (kind === 'grid' && section) {
        const container = lastOfType(nodes, nodes[section]?.children, 'container');
        const built = buildGrid(newId, count);
        if (container) {
          nodes = appendChild({ ...nodes, ...built.nodes }, container, built.rootId);
        } else {
          const c = newId('n');
          nodes = appendChild(
            {
              ...nodes,
              ...built.nodes,
              [c]: { id: c, type: 'container', children: [built.rootId] },
            },
            section,
            c,
          );
        }
      } else {
        // A section, or no section to put the block in yet: start a new one, so a beginner
        // never has to think about sections.
        const spans = kind === 'grid' ? Array<number>(count).fill(12 / count) : [12];
        const built = buildSection(newId, 'white', spans);
        nodes = { ...nodes, ...built.nodes };
        root = [...root, built.rootId];
      }
      return {
        ...commit(s, { ...updateFrame(s.doc, frameId, { root }), nodes }),
        selectedFrameId: frameId,
      };
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
