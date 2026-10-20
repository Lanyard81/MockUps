import { create } from 'zustand';
import { DEFAULT_KIT_ID, getKit } from '../kits';
import { patchAtPath } from '../lib/settingsPath';
import { convertFrame as runConversion, type ConversionReport } from '../layout/convert';
import { settingContextFor } from '../layout/kitContext';
import { componentFitsKit, kitMismatchMessage, subtreesFitKit } from '../layout/kitGuard';
import type { KitId } from '../kits/types';
import { getComponent, hasVariant } from '../catalogue';
import { readSpans, type BreakpointId } from '../kits/nsw/spans';
import type { FitWarning } from '../lib/textFit';
import { newId } from '../lib/ids';
import { clampZoom, fitView, unionRects, type View } from '../lib/geometry';
import {
  applyInsertion,
  clearChildren,
  detachNode,
  extractSubtree,
  frameOfNode,
  isDraggable,
  moveAmongSiblings,
  parentOf,
  canMoveInto,
  removeNode,
  resolveInsertion,
  setColumnCount,
  setGridColumnCount,
  type Insertion,
} from '../layout/ops';
import { cloneSubtrees, removeSubtrees } from '../layout/tree';
import {
  DEVICES,
  type Clipboard,
  type DeviceId,
  type DocNode,
  type DragPayload,
  type ConfirmRequest,
  type ContextMenuState,
  type DropTarget,
  type Placement,
  type Frame,
  type MockupDoc,
} from './types';
import type { InstantiatedTemplate } from '../templates/types';

const HISTORY_LIMIT = 100;
const FRAME_GAP = 80;

export type Mode = 'edit' | 'preview';

/** The design-system version of each kit in use, recorded in the document. */
export function kitVersionsFor(ids: KitId[]): Record<KitId, string> {
  return Object.fromEntries(ids.map((id) => [id, getKit(id).version]));
}

const LAST_KIT_KEY = 'nswmb.lastKit';

/** The kit used for the last new frame. Browser storage can be blocked, so every access is guarded. */
function readLastKit(): KitId {
  try {
    const id = localStorage.getItem(LAST_KIT_KEY);
    return id ? getKit(id).id : DEFAULT_KIT_ID;
  } catch {
    return DEFAULT_KIT_ID;
  }
}

function writeLastKit(id: KitId) {
  try {
    localStorage.setItem(LAST_KIT_KEY, id);
  } catch {
    /* storage blocked: the choice just isn't remembered */
  }
}

export function createDoc(kitId: KitId = DEFAULT_KIT_ID): MockupDoc {
  return {
    version: 2,
    id: newId('doc'),
    name: 'Untitled mockup',
    defaultKitId: kitId,
    kitVersions: kitVersionsFor([kitId]),
    kitSettings: {},
    view: { x: 80, y: 80, zoom: 1 },
    frames: [
      {
        id: newId('f'),
        name: 'Home',
        kitId,
        device: 'iphone',
        width: 393,
        x: 0,
        y: 0,
        root: [],
      },
    ],
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
  /** The selected node inside `selectedFrameId`, or null when only the frame is selected. */
  selectedNodeId: string | null;
  /** Node under the pointer in Edit mode (for the hover outline). */
  hover: { frameId: string; nodeId: string } | null;
  /** What is being dragged, and where it would drop. Null when no drag is in progress. */
  drag: DragPayload | null;
  dropTarget: DropTarget | null;
  /** The text region being edited in place, if any (so overlays can get out of the way). */
  editing: { frameId: string; nodeId: string | null; key: string } | null;
  /** Text elements per frame that are truncated by "shrink to fit" (UI only). */
  fitWarnings: Record<string, FitWarning[]>;
  contextMenu: ContextMenuState | null;
  /** Autosave progress, shown beside the document name. */
  saveState: 'saved' | 'saving' | 'error';
  /** Can this page keep data between visits? Null until checked. */
  storageOk: boolean | null;
  /** The open dialog, if any. */
  dialog: 'mockups' | 'export' | 'saveTemplate' | null;
  /** The frame a dialog is about (Save as template). */
  dialogFrameId: string | null;
  /** Which tab of the left panel is showing. */
  leftTab: 'library' | 'layers' | 'templates';
  /** The kit chosen for the next new frame; remembered between visits (UI preference, not in the document). */
  newFrameKitId: KitId;
  /** The summary of the last frame conversion, shown until dismissed (UI only). */
  conversionReport: (ConversionReport & { newFrameName: string }) | null;
  /** A kit the user switched the library to for one frame (otherwise the library follows the selected frame's kit). */
  libraryKit: { kitId: KitId; frameId: string | null } | null;
  /** While dragging a template: the frame it is over (it would replace its content), or just the canvas. */
  templateDrop: { frameId: string | null } | null;
  confirm: ConfirmRequest | null;
  /** Zoom to fit as soon as every frame has been measured (after opening a mockup). */
  fitRequested: boolean;
  /** The keyboard shortcuts sheet is open. */
  helpOpen: boolean;
  /** Preview's click-through: the frames visited, last is showing. Null when closed. UI-only. */
  prototype: string[] | null;
  /** A short message for the user (errors from uploads and the like). */
  notice: string | null;
  /** Copied subtree, shared between frames. */
  clipboard: Clipboard | null;
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
  selectNode: (frameId: string, nodeId: string | null) => void;
  /** Esc: select the parent, then the frame, then nothing. */
  selectParent: () => void;
  setHover: (hover: { frameId: string; nodeId: string } | null) => void;
  setDrag: (drag: DragPayload | null) => void;
  setDropTarget: (target: DropTarget | null) => void;
  setEditing: (editing: State['editing']) => void;
  setNotice: (notice: string | null) => void;
  openContextMenu: (menu: ContextMenuState | null) => void;
  setSaveState: (state: State['saveState']) => void;
  setStorageOk: (ok: boolean) => void;
  setDialog: (dialog: State['dialog'], frameId?: string) => void;
  setLeftTab: (tab: State['leftTab']) => void;
  setNewFrameKit: (kitId: KitId) => void;
  /** Convert a frame into another kit as a new frame beside it (one undo step; the original is untouched). */
  convertFrame: (frameId: string, targetKitId: KitId) => void;
  dismissConversionReport: () => void;
  setLibraryKit: (kitId: KitId | null) => void;
  setTemplateDrop: (drop: State['templateDrop']) => void;
  /** Put a template on the canvas as a new frame (undoable). Returns the frame's id. */
  addFrameFromTemplate: (template: InstantiatedTemplate, at?: { x: number; y: number }) => string;
  /** Replace everything in a frame with a template (undoable). */
  replaceFrameWithTemplate: (frameId: string, template: InstantiatedTemplate) => void;
  requestConfirm: (request: ConfirmRequest | null) => void;
  clearFitRequest: () => void;
  /** Replace the whole document (opening a mockup or file). Starts a fresh undo history. */
  loadDoc: (doc: MockupDoc) => void;
  newDoc: () => void;
  renameDoc: (name: string) => void;
  setHelpOpen: (open: boolean) => void;
  /** Open the click-through viewer on a frame, step to another, go back, or close. */
  openPrototype: (frameId: string) => void;
  prototypeGo: (frameId: string) => void;
  prototypeBack: () => void;
  closePrototype: () => void;
  setFitWarnings: (frameId: string, warnings: FitWarning[]) => void;
  setFrameHeight: (id: string, height: number) => void;
  setViewport: (width: number, height: number) => void;
  setPanning: (panning: boolean) => void;
  markFitted: () => void;
  requestRename: (id: string | null) => void;

  setView: (view: View) => void;
  zoomToFit: () => void;

  addFrame: (device: DeviceId, kitId?: KitId) => void;
  duplicateFrame: (id: string) => void;
  deleteFrame: (id: string) => void;
  renameFrame: (id: string, name: string) => void;
  setFrameDevice: (id: string, device: DeviceId) => void;
  setFrameWidth: (id: string, width: number) => void;
  /** Add a catalogue component next to the selection (or at the end of the frame). */
  addComponent: (frameId: string, componentId: string, variantId?: string) => void;
  /** Add a layout block: a section, a container, or a grid of 1–4 columns. */
  addLayoutBlock: (frameId: string, kind: string, columns?: number) => void;
  /** Drop a new component or layout block at an exact position. */
  dropNew: (payload: DragPayload, target: DropTarget) => void;
  /** Move an existing node to an exact position, possibly in another frame. */
  moveNode: (nodeId: string, target: Placement) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  copyNode: (nodeId: string) => void;
  pasteClipboard: () => void;
  /** Set one editable text region. One call is one undo step (an edit session commits once). */
  setText: (nodeId: string, key: string, text: string) => void;
  /** Switch a component's variant. Its text is kept, keyed by region name. */
  setVariant: (nodeId: string, variantId: string) => void;
  /** Merge into a node's props. A value of undefined removes the prop. */
  setNodeProps: (nodeId: string, patch: Record<string, unknown>) => void;
  /** Turn "shrink to fit" on or off for a text region. `box` is the element's size when switched on. */
  setTextFit: (
    nodeId: string,
    key: string,
    mode: 'natural' | 'shrink',
    box?: { width: number; height: number },
  ) => void;
  /** Set a column's width at a breakpoint (null removes the override). */
  setColumnSpan: (columnId: string, bp: BreakpointId, span: number | null) => void;
  setGridColumns: (gridId: string, count: number) => void;
  /** Change a section's layout (SharePoint: one, two, three columns, one-third left...), moving content as the kit says. */
  setSectionLayout: (sectionId: string, layoutId: string) => void;
  /** Use an uploaded image (already stored under `image.id`) for an image slot of a component. */
  setImage: (
    nodeId: string,
    key: string,
    image: { id: string; dataUrl: string; name?: string },
  ) => void;
  setImageAlt: (nodeId: string, key: string, alt: string) => void;
  /** Put the original placeholder image back. */
  clearImage: (nodeId: string, key: string) => void;
  /** Rename a layer. An empty name goes back to the default label. */
  setNodeName: (nodeId: string, name: string) => void;
  /** Hide or show a layer on the canvas and in exports (Layers panel). */
  setHidden: (nodeId: string, hidden: boolean) => void;
  /** Quick page parts: the masthead and header at the top of a frame, or a footer at the bottom. */
  addPageParts: (frameId: string, part: string) => void;
  /** Change a frame's kit settings (a value of `undefined` clears one). One undo step. */
  setFrameSettings: (frameId: string, patch: Record<string, unknown>) => void;
  /** Use an uploaded image for a frame setting (a header picture, a logo). The image is stored with the document. One undo step. */
  setFrameImage: (
    frameId: string,
    key: string,
    image: { id: string; dataUrl: string; name?: string },
  ) => void;
  /** Set one value inside a frame's settings by path (e.g. `navItems.1.label`); the kit's defaults fill in a list not changed yet. One undo step. */
  setFrameSettingAt: (frameId: string, path: string, value: unknown) => void;
  /** Change a kit's document-wide settings, such as the SharePoint theme. One undo step. */
  setKitSettings: (kitId: KitId, patch: Record<string, unknown>) => void;
  /** Alt+↑ / Alt+↓: swap with the previous or next sibling. */
  moveSelected: (dir: -1 | 1) => void;

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

/** After undo or redo, drop a selection that no longer exists in the restored document. */
function validSelection(doc: MockupDoc, s: Store) {
  const frameOk = doc.frames.some((f) => f.id === s.selectedFrameId);
  const nodeOk = !!s.selectedNodeId && !!doc.nodes[s.selectedNodeId];
  return {
    selectedFrameId: frameOk ? s.selectedFrameId : null,
    selectedNodeId: frameOk && nodeOk ? s.selectedNodeId : null,
  };
}

const replaceNode = <T extends Pick<MockupDoc, 'nodes'>>(doc: T, node: DocNode): T => ({
  ...doc,
  nodes: { ...doc.nodes, [node.id]: node },
});

function newComponentNode(componentId: string, variant: string): DocNode {
  return {
    id: newId('n'),
    type: 'component',
    componentId,
    variant,
    props: {},
    text: {},
    textFit: {},
    hidden: false,
  };
}

/** Why a layout block can't be added to a frame right now (a kit rule), or null. */
export function blockUnavailable(
  doc: MockupDoc,
  frameId: string,
  kind: string,
  columns?: number,
): string | null {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) return null;
  const blocks = getKit(frame.kitId).layoutBlocks;
  const block =
    blocks.find((b) => b.kind === kind && b.columns === columns) ??
    blocks.find((b) => b.kind === kind);
  return block?.unavailable?.(settingContextFor(doc, frameId)) ?? null;
}

/** Build a layout block of the frame's kit (a section, a column grid...). Null if the kit has no such block. */
function buildLayoutBlock(kitId: KitId | undefined, kind: string, columns: number) {
  const blocks = getKit(kitId).layoutBlocks;
  const block =
    blocks.find((b) => b.kind === kind && b.columns === columns) ??
    blocks.find((b) => b.kind === kind && b.columns === Math.min(4, Math.max(1, columns))) ??
    blocks.find((b) => b.kind === kind);
  return block ? block.build(newId) : null;
}

/** Merge a patch into a settings object; keys whose value is `undefined` are removed. */
function applyPatch(
  current: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const next = { ...current, ...patch };
  for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
  return Object.keys(next).length > 0 ? next : undefined;
}

const withKitVersion = (doc: MockupDoc, kitId: KitId): MockupDoc =>
  doc.kitVersions[kitId]
    ? doc
    : { ...doc, kitVersions: { ...doc.kitVersions, [kitId]: getKit(kitId).version } };

/** Add a new leaf next to the current selection (or the end of the frame) and select it. */
function insertLeaf(s: Store, frameId: string, nodes: Record<string, DocNode>, leafId: string) {
  const doc0 = { ...s.doc, nodes: { ...s.doc.nodes, ...nodes } };
  const anchor = s.selectedFrameId === frameId ? s.selectedNodeId : null;
  const ins: Insertion = resolveInsertion(doc0, frameId, anchor, doc0.nodes[leafId]!);
  return {
    ...commit(s, applyInsertion(doc0, frameId, ins, leafId, newId)),
    selectedFrameId: frameId,
    selectedNodeId: leafId,
  };
}

export const useStore = create<Store>((set, get) => ({
  doc: createDoc(),
  past: [],
  future: [],
  mode: 'edit',
  selectedFrameId: null,
  selectedNodeId: null,
  hover: null,
  drag: null,
  dropTarget: null,
  editing: null,
  notice: null,
  contextMenu: null,
  saveState: 'saved',
  storageOk: null,
  dialog: null,
  dialogFrameId: null,
  leftTab: 'library',
  newFrameKitId: readLastKit(),
  libraryKit: null,
  conversionReport: null,
  templateDrop: null,
  confirm: null,
  fitRequested: true,
  helpOpen: false,
  prototype: null,
  fitWarnings: {},
  clipboard: null,
  frameHeights: {},
  viewport: { width: 1000, height: 700 },
  panning: false,
  fitted: false,
  renameRequest: null,

  setMode: (mode) => set({ mode, prototype: null }),
  selectFrame: (id) => set({ selectedFrameId: id, selectedNodeId: null }),
  selectNode: (frameId, nodeId) => set({ selectedFrameId: frameId, selectedNodeId: nodeId }),
  selectParent: () =>
    set((s) => {
      if (s.selectedNodeId) {
        const p = parentOf(s.doc, s.selectedNodeId);
        return { selectedNodeId: p?.parentId ?? null };
      }
      return { selectedFrameId: null };
    }),
  setHover: (hover) =>
    set((s) =>
      s.hover?.nodeId === hover?.nodeId && s.hover?.frameId === hover?.frameId ? s : { hover },
    ),
  setDrag: (drag) => set({ drag, dropTarget: null, templateDrop: null, hover: null }),
  setDropTarget: (dropTarget) => set({ dropTarget }),
  setEditing: (editing) => set({ editing }),
  setNotice: (notice) => set({ notice }),
  openContextMenu: (contextMenu) => set({ contextMenu }),
  setSaveState: (saveState) => set({ saveState }),
  setStorageOk: (storageOk) => set({ storageOk }),
  setDialog: (dialog, frameId) => set({ dialog, dialogFrameId: frameId ?? null }),
  setLeftTab: (leftTab) => set({ leftTab }),
  convertFrame: (frameId, targetKitId) =>
    set((s) => {
      const result = runConversion(s.doc, frameId, targetKitId, newId);
      if (!result) return { notice: 'That frame can’t be converted to that style kit.' };
      const { frame, nodes, report } = result;
      return {
        ...commit(s, {
          ...withKitVersion(s.doc, frame.kitId),
          frames: [...s.doc.frames, frame],
          nodes: { ...s.doc.nodes, ...nodes },
        }),
        selectedFrameId: frame.id,
        selectedNodeId: null,
        conversionReport: { ...report, newFrameName: frame.name },
      };
    }),
  dismissConversionReport: () => set({ conversionReport: null }),
  setNewFrameKit: (kitId) => {
    const id = getKit(kitId).id;
    writeLastKit(id);
    set({ newFrameKitId: id });
  },
  setLibraryKit: (kitId) =>
    set((s) => ({
      libraryKit: kitId
        ? { kitId, frameId: s.selectedFrameId ?? s.doc.frames[0]?.id ?? null }
        : null,
    })),
  setTemplateDrop: (templateDrop) => set({ templateDrop }),
  addFrameFromTemplate: (template, at) => {
    const id = newId('f');
    set((s) => {
      const right = Math.max(-FRAME_GAP, ...s.doc.frames.map((f) => f.x + f.width));
      const frame: Frame = {
        id,
        name: template.name,
        kitId: template.kitId,
        ...(template.settings ? { settings: template.settings } : {}),
        device: template.device,
        width: template.width,
        x: Math.round(at?.x ?? right + FRAME_GAP),
        y: Math.round(at?.y ?? s.doc.frames[0]?.y ?? 0),
        root: template.root,
      };
      return {
        ...commit(s, {
          ...withKitVersion(s.doc, template.kitId),
          frames: [...s.doc.frames, frame],
          nodes: { ...s.doc.nodes, ...template.nodes },
          images: { ...s.doc.images, ...template.images },
        }),
        selectedFrameId: id,
        selectedNodeId: null,
        fitRequested: s.doc.frames.length === 0,
      };
    });
    return id;
  },
  replaceFrameWithTemplate: (frameId, template) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const kept = removeSubtrees(s.doc.nodes, frame.root);
      return {
        ...commit(s, {
          ...withKitVersion(
            updateFrame(s.doc, frameId, {
              root: template.root,
              kitId: template.kitId,
              settings: template.settings,
            }),
            template.kitId,
          ),
          nodes: { ...kept, ...template.nodes },
          images: { ...s.doc.images, ...template.images },
        }),
        selectedFrameId: frameId,
        selectedNodeId: null,
      };
    }),
  requestConfirm: (confirm) => set({ confirm }),
  clearFitRequest: () => set({ fitRequested: false }),
  loadDoc: (doc) =>
    set({
      doc,
      past: [],
      future: [],
      selectedFrameId: null,
      selectedNodeId: null,
      hover: null,
      drag: null,
      dropTarget: null,
      editing: null,
      contextMenu: null,
      clipboard: null,
      fitWarnings: {},
      fitRequested: true,
      saveState: 'saved',
    }),
  // A new mockup starts in the kit used for the last new frame.
  newDoc: () => get().loadDoc(createDoc(get().newFrameKitId)),
  renameDoc: (name) =>
    set((s) => {
      const next = name.trim().slice(0, 200);
      return next && next !== s.doc.name ? commit(s, { ...s.doc, name: next }) : s;
    }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  openPrototype: (frameId) =>
    set((s) => (s.doc.frames.some((f) => f.id === frameId) ? { prototype: [frameId] } : s)),
  prototypeGo: (frameId) =>
    set((s) =>
      s.prototype && s.doc.frames.some((f) => f.id === frameId)
        ? { prototype: [...s.prototype, frameId] }
        : s,
    ),
  prototypeBack: () =>
    set((s) =>
      s.prototype && s.prototype.length > 1 ? { prototype: s.prototype.slice(0, -1) } : s,
    ),
  closePrototype: () => set({ prototype: null }),
  setFitWarnings: (frameId, warnings) =>
    set((s) => {
      const prev = s.fitWarnings[frameId] ?? [];
      const same =
        prev.length === warnings.length &&
        prev.every((w, i) => w.nodeId === warnings[i]!.nodeId && w.key === warnings[i]!.key);
      return same ? s : { fitWarnings: { ...s.fitWarnings, [frameId]: warnings } };
    }),
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

  addFrame: (device, kitId) =>
    set((s) => {
      const preset = DEVICES[device];
      const kit = getKit(kitId ?? s.doc.defaultKitId).id;
      const right = Math.max(-FRAME_GAP, ...s.doc.frames.map((f) => f.x + f.width));
      const frame: Frame = {
        id: newId('f'),
        name: `${preset.label} ${s.doc.frames.length + 1}`,
        kitId: kit,
        device,
        width: preset.width,
        x: right + FRAME_GAP,
        y: s.doc.frames[0]?.y ?? 0,
        root: [],
      };
      return {
        ...commit(s, { ...withKitVersion(s.doc, kit), frames: [...s.doc.frames, frame] }),
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
        selectedNodeId: s.selectedFrameId === id ? null : s.selectedNodeId,
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
      const comp = getComponent(componentId);
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame || !comp) return s;
      if (!componentFitsKit(componentId, frame.kitId))
        return { notice: kitMismatchMessage(frame.kitId) };
      const leaf = newComponentNode(componentId, variantId ?? comp.defaultVariant);
      return insertLeaf(s, frameId, { [leaf.id]: leaf }, leaf.id);
    }),

  addLayoutBlock: (frameId, kind, columns = 1) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const reason = blockUnavailable(s.doc, frame.id, kind, columns);
      if (reason) return { notice: reason };
      const built = buildLayoutBlock(frame.kitId, kind, columns);
      if (!built) return s;
      return insertLeaf(s, frameId, built.nodes, built.rootId);
    }),

  dropNew: (payload, target) =>
    set((s) => {
      if (payload.kind === 'move' || payload.kind === 'template') return s;
      const targetFrame = s.doc.frames.find((f) => f.id === target.frameId);
      if (
        targetFrame &&
        ((payload.kind === 'new-component' &&
          !componentFitsKit(payload.componentId, targetFrame.kitId)) ||
          (payload.kind === 'new-layout' &&
            getKit(payload.kitId).id !== getKit(targetFrame.kitId).id))
      )
        return { notice: kitMismatchMessage(targetFrame.kitId) };
      let nodes: Record<string, DocNode>;
      let leafId: string;
      if (payload.kind === 'new-component') {
        const comp = getComponent(payload.componentId);
        if (!comp) return s;
        const leaf = newComponentNode(payload.componentId, payload.variantId);
        nodes = { [leaf.id]: leaf };
        leafId = leaf.id;
      } else {
        const reason = blockUnavailable(s.doc, target.frameId, payload.block, payload.columns);
        if (reason) return { notice: reason };
        const built = buildLayoutBlock(
          s.doc.frames.find((f) => f.id === target.frameId)?.kitId,
          payload.block,
          payload.columns ?? 1,
        );
        if (!built) return s;
        nodes = built.nodes;
        leafId = built.rootId;
      }
      const doc = applyInsertion(
        { ...s.doc, nodes: { ...s.doc.nodes, ...nodes } },
        target.frameId,
        target,
        leafId,
        newId,
      );
      return { ...commit(s, doc), selectedFrameId: target.frameId, selectedNodeId: leafId };
    }),

  moveNode: (nodeId, target) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node || !isDraggable(node)) return s;
      // A drop that lands where the node already is changes nothing, so it makes no history entry.
      const from = parentOf(s.doc, nodeId);
      if (
        from &&
        from.parentId === target.parentId &&
        from.index === target.index &&
        target.chainFrom === null &&
        frameOfNode(s.doc, nodeId) === target.frameId
      )
        return s;
      if (target.parentId !== null && !canMoveInto(s.doc, nodeId, target.parentId)) return s;
      // Kits don't mix inside a frame, and layout nodes belong to the kit they were made in.
      const fromFrame = frameOfNode(s.doc, nodeId);
      const toFrame = s.doc.frames.find((f) => f.id === target.frameId);
      const fromKit = s.doc.frames.find((f) => f.id === fromFrame)?.kitId;
      if (toFrame && fromKit && getKit(fromKit).id !== getKit(toFrame.kitId).id)
        return { notice: kitMismatchMessage(toFrame.kitId) };
      const doc = applyInsertion(detachNode(s.doc, nodeId), target.frameId, target, nodeId, newId);
      return { ...commit(s, doc), selectedFrameId: target.frameId, selectedNodeId: nodeId };
    }),

  deleteNode: (nodeId) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node) return s;
      const parent = parentOf(s.doc, nodeId);
      // Deleting a column would break its grid, so it just empties the column.
      const doc = node.type === 'column' ? clearChildren(s.doc, nodeId) : removeNode(s.doc, nodeId);
      if (doc === s.doc) return s;
      return {
        ...commit(s, doc),
        selectedNodeId: node.type === 'column' ? nodeId : (parent?.parentId ?? null),
      };
    }),

  duplicateNode: (nodeId) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      const loc = parentOf(s.doc, nodeId);
      const frameId = frameOfNode(s.doc, nodeId);
      if (!node || !loc || !frameId || !isDraggable(node)) return s;
      const copy = cloneSubtrees(s.doc.nodes, [nodeId], newId);
      const doc = applyInsertion(
        { ...s.doc, nodes: { ...s.doc.nodes, ...copy.nodes } },
        frameId,
        { parentId: loc.parentId, index: loc.index + 1, chainFrom: null },
        copy.roots[0]!,
        newId,
      );
      return { ...commit(s, doc), selectedNodeId: copy.roots[0]! };
    }),

  copyNode: (nodeId) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node || !isDraggable(node)) return s;
      const frameId = frameOfNode(s.doc, nodeId);
      const kitId = s.doc.frames.find((f) => f.id === frameId)?.kitId;
      return { clipboard: { ...extractSubtree(s.doc, nodeId), ...(kitId ? { kitId } : {}) } };
    }),

  pasteClipboard: () =>
    set((s) => {
      const clip = s.clipboard;
      const frameId = s.selectedFrameId ?? s.doc.frames[0]?.id;
      if (!clip || !frameId) return s;
      const targetFrame = s.doc.frames.find((f) => f.id === frameId);
      // Layout nodes belong to the kit they were copied from, so the whole paste has to match.
      if (
        targetFrame &&
        ((clip.kitId && getKit(clip.kitId).id !== getKit(targetFrame.kitId).id) ||
          !subtreesFitKit(clip.nodes, [clip.rootId], targetFrame.kitId))
      )
        return { notice: kitMismatchMessage(targetFrame.kitId) };
      const copy = cloneSubtrees(clip.nodes, [clip.rootId], newId);
      const leafId = copy.roots[0]!;
      const doc0 = { ...s.doc, nodes: { ...s.doc.nodes, ...copy.nodes } };
      const ins = resolveInsertion(doc0, frameId, s.selectedNodeId, doc0.nodes[leafId]!);
      return {
        ...commit(s, applyInsertion(doc0, frameId, ins, leafId, newId)),
        selectedFrameId: frameId,
        selectedNodeId: leafId,
      };
    }),

  setText: (nodeId, key, text) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node) return s;
      // Components hold text. A layout node does only if its kit says so (a collapsible section's title).
      if (node.type !== 'component') {
        const frame = s.doc.frames.find((f) => f.id === frameOfNode(s.doc, nodeId));
        const defs = getKit(frame?.kitId).settings.node[node.type] ?? [];
        if (!defs.some((d) => d.store === 'text' && d.key === key)) return s;
      }
      if ((node.text?.[key] ?? null) === text) return s;
      return commit(s, replaceNode(s.doc, { ...node, text: { ...node.text, [key]: text } }));
    }),

  setVariant: (nodeId, variantId) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node || node.type !== 'component' || node.variant === variantId) return s;
      if (!node.componentId || !hasVariant(node.componentId, variantId)) return s;
      return commit(s, replaceNode(s.doc, { ...node, variant: variantId }));
    }),

  setNodeProps: (nodeId, patch) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node) return s;
      const props = { ...node.props };
      let changed = false;
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) {
          if (k in props) {
            delete props[k];
            changed = true;
          }
        } else if (JSON.stringify(props[k]) !== JSON.stringify(v)) {
          props[k] = v;
          changed = true;
        }
      }
      return changed ? commit(s, replaceNode(s.doc, { ...node, props })) : s;
    }),

  setTextFit: (nodeId, key, mode, box) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node || node.type !== 'component') return s;
      const props = { ...node.props };
      const boxes = { ...((props.fitBoxes as Record<string, unknown> | undefined) ?? {}) };
      if (mode === 'shrink') {
        if (!box) return s;
        boxes[key] = { width: Math.round(box.width), height: Math.round(box.height) };
      } else {
        delete boxes[key];
      }
      if (Object.keys(boxes).length) props.fitBoxes = boxes;
      else delete props.fitBoxes;
      return commit(
        s,
        replaceNode(s.doc, { ...node, props, textFit: { ...node.textFit, [key]: mode } }),
      );
    }),

  setColumnSpan: (columnId, bp, span) =>
    set((s) => {
      const node = s.doc.nodes[columnId];
      if (!node || node.type !== 'column') return s;
      const spans = { ...readSpans(node.props) };
      if (span === null) delete spans[bp];
      else spans[bp] = Math.min(12, Math.max(1, Math.round(span)));
      spans.base ??= 12;
      if (JSON.stringify(spans) === JSON.stringify(readSpans(node.props))) return s;
      return commit(s, replaceNode(s.doc, { ...node, props: { ...node.props, spans } }));
    }),

  setGridColumns: (gridId, count) =>
    set((s) => {
      const doc = setGridColumnCount(s.doc, gridId, count, newId);
      return doc === s.doc ? s : commit(s, doc);
    }),

  setImage: (nodeId, key, image) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node) return s;
      const images = { ...((node.props?.images as Record<string, unknown> | undefined) ?? {}) };
      const prev = (images[key] as { alt?: string } | undefined) ?? {};
      images[key] = { imageId: image.id, alt: prev.alt ?? '' };
      const doc = replaceNode(
        {
          ...s.doc,
          images: { ...s.doc.images, [image.id]: { dataUrl: image.dataUrl, name: image.name } },
        },
        { ...node, props: { ...node.props, images } },
      );
      return commit(s, doc);
    }),

  setImageAlt: (nodeId, key, alt) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node) return s;
      const images = { ...((node.props?.images as Record<string, unknown> | undefined) ?? {}) };
      const prev = (images[key] as { imageId?: string; alt?: string } | undefined) ?? {};
      if ((prev.alt ?? '') === alt) return s;
      images[key] = { ...prev, alt };
      return commit(s, replaceNode(s.doc, { ...node, props: { ...node.props, images } }));
    }),

  clearImage: (nodeId, key) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node) return s;
      const images = { ...((node.props?.images as Record<string, unknown> | undefined) ?? {}) };
      const prev = images[key] as { imageId?: string; alt?: string } | undefined;
      if (!prev?.imageId) return s;
      images[key] = { alt: prev.alt ?? '' };
      return commit(s, replaceNode(s.doc, { ...node, props: { ...node.props, images } }));
    }),

  setNodeName: (nodeId, name) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      const next = name.trim();
      if (!node || (node.name ?? '') === next) return s;
      const { name: _old, ...rest } = node;
      void _old;
      return commit(s, replaceNode(s.doc, next ? { ...rest, name: next } : rest));
    }),

  setHidden: (nodeId, hidden) =>
    set((s) => {
      const node = s.doc.nodes[nodeId];
      if (!node || (node.hidden ?? false) === hidden) return s;
      return commit(s, replaceNode(s.doc, { ...node, hidden }));
    }),

  setSectionLayout: (sectionId, layoutId) =>
    set((s) => {
      const section = s.doc.nodes[sectionId];
      const frameId = frameOfNode(s.doc, sectionId);
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!section || section.type !== 'section' || !frame) return s;
      const layouts = getKit(frame.kitId).schema.sectionLayouts;
      const layout = layouts?.find((l) => l.id === layoutId);
      if (!layout || section.props?.layout === layoutId) return s;
      const reason = layout.unavailable?.({
        values: section.props ?? {},
        ...settingContextFor(s.doc, frame.id, sectionId),
      });
      if (reason) return { notice: reason };
      const resized = setColumnCount(s.doc, sectionId, layout.columns, newId, 3);
      const node = resized.nodes[sectionId]!;
      return {
        ...commit(s, replaceNode(resized, { ...node, props: { ...node.props, layout: layoutId } })),
        selectedFrameId: frame.id,
        selectedNodeId: sectionId,
      };
    }),

  setFrameSettings: (frameId, patch) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const settings = applyPatch(frame.settings, patch);
      return commit(s, updateFrame(s.doc, frameId, { settings }));
    }),

  setFrameImage: (frameId, key, image) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const doc = {
        ...s.doc,
        images: { ...s.doc.images, [image.id]: { dataUrl: image.dataUrl, name: image.name } },
      };
      return commit(
        s,
        updateFrame(doc, frameId, { settings: applyPatch(frame.settings, { [key]: image.id }) }),
      );
    }),

  setFrameSettingAt: (frameId, path, value) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const patch = patchAtPath(
        frame.settings,
        getKit(frame.kitId).frameDefaults?.(frame.settings) ?? {},
        path,
        value,
      );
      if (!patch) return s;
      return commit(
        s,
        updateFrame(s.doc, frameId, { settings: applyPatch(frame.settings, patch) }),
      );
    }),

  setKitSettings: (kitId, patch) =>
    set((s) => {
      const next = applyPatch(s.doc.kitSettings[kitId], patch);
      return commit(s, { ...s.doc, kitSettings: { ...s.doc.kitSettings, [kitId]: next ?? {} } });
    }),

  addPageParts: (frameId, part) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const def = getKit(frame.kitId).pageParts.find((p) => p.id === part);
      if (!def) return s;
      const specs = def.components;
      const atTop = def.position === 'top';
      let doc: MockupDoc = s.doc;
      const added: string[] = [];
      specs.forEach(([componentId, variant], i) => {
        const node = newComponentNode(componentId!, variant!);
        added.push(node.id);
        doc = applyInsertion(
          { ...doc, nodes: { ...doc.nodes, [node.id]: node } },
          frameId,
          { parentId: null, index: atTop ? i : frame.root.length + i, chainFrom: null },
          node.id,
          newId,
        );
      });
      return { ...commit(s, doc), selectedFrameId: frameId, selectedNodeId: added[0]! };
    }),

  moveSelected: (dir) =>
    set((s) => {
      if (!s.selectedNodeId) return s;
      const doc = moveAmongSiblings(s.doc, s.selectedNodeId, dir);
      return doc === s.doc ? s : commit(s, doc);
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
        ...validSelection(prev, s),
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
