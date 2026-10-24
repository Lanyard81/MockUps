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
import { imagesUsedBy } from '../layout/imagesUsed';
import { useSavedComponents } from './savedComponents';
import {
  FREE_NO_CONVERT,
  FREE_NO_LAYOUT,
  defaultWidth,
  flowToFree,
  freeToFlow,
  isFreeFrame,
  moveToFree,
  nextPosition,
  placeFree,
  readBox,
  reorder,
  setBox,
  withoutBox,
} from '../layout/free';
import {
  importPageSpec,
  type ImportedPage,
  type ImportSummary,
  type PageImportReport,
} from '../pagespec';
import { DEFAULT_REFERENCE } from '../lib/reference';
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
  type Comment,
  type Frame,
  type FrameReference,
  type FreeBox,
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
    version: 6,
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
  dialog: 'mockups' | 'export' | 'saveTemplate' | 'saveComponent' | 'importSpec' | null;
  /** The frame a dialog is about (Save as template). */
  dialogFrameId: string | null;
  /** The node a dialog is about (Save as component). */
  dialogNodeId: string | null;
  /** Which tab of the left panel is showing. */
  leftTab: 'library' | 'layers' | 'templates' | 'comments';
  /** The kit chosen for the next new frame; remembered between visits (UI preference, not in the document). */
  newFrameKitId: KitId;
  /** The summary of the last frame conversion, shown until dismissed (UI only). */
  /** The command palette (⌘K) is open. */
  paletteOpen: boolean;
  /** The comment tool is on: a click on a frame pins a note there. */
  commentTool: boolean;
  /** The comment whose note is open. */
  activeCommentId: string | null;
  /** The layout a frame added from the toolbar starts with. */
  newFrameLayout: 'flow' | 'free';
  conversionReport: (ConversionReport & { newFrameName: string }) | null;
  /** What each imported frame's page spec did, until dismissed (not saved). */
  importReports: Record<string, PageImportReport>;
  /** The report of the import just done, shown once. */
  importSummary: ImportSummary | null;
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
  setDialog: (dialog: State['dialog'], frameId?: string, nodeId?: string) => void;
  setLeftTab: (tab: State['leftTab']) => void;
  setNewFrameKit: (kitId: KitId) => void;
  setNewFrameLayout: (layout: 'flow' | 'free') => void;
  setPaletteOpen: (open: boolean) => void;
  setCommentTool: (on: boolean) => void;
  setActiveComment: (id: string | null) => void;
  /** Pin a new, empty note at a point on a frame (frame pixels) and open it. One undo step. Returns its id. */
  addComment: (frameId: string, x: number, y: number) => string | null;
  /** Change a note's text, or resolve or reopen it. One undo step. */
  updateComment: (id: string, patch: { text?: string; resolved?: boolean }) => void;
  deleteComment: (id: string) => void;
  /** Convert a frame into another kit as a new frame beside it (one undo step; the original is untouched). */
  convertFrame: (frameId: string, targetKitId: KitId) => void;
  dismissConversionReport: () => void;
  /** Add the pages of a page spec (a `.page.json` or pasted JSON) as new frames, in one undo step. False, with a notice, if it can't be read. */
  importPageSpecText: (text: string) => boolean;
  dismissImportReport: (frameId: string) => void;
  dismissImportSummary: () => void;
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

  addFrame: (device: DeviceId, kitId?: KitId, layout?: 'flow' | 'free') => void;
  /** Move or resize an item on a freeform frame. One undo step. */
  setFreeBox: (nodeId: string, patch: Partial<FreeBox>) => void;
  /** Nudge an item on a freeform frame by whole pixels. One undo step. */
  nudgeFree: (nodeId: string, dx: number, dy: number) => void;
  /** Bring an item to the front, or send it to the back, of a freeform frame. */
  reorderFree: (nodeId: string, to: 'front' | 'back') => void;
  /** Grid and snapping for a freeform frame. One undo step. */
  setFrameFree: (frameId: string, patch: { freeGrid?: number | null; freeSnap?: boolean }) => void;
  /** Switch a frame between flow and freeform. `boxes` are the positions to give a flow frame's components (measured on screen). One undo step. */
  setFrameLayout: (
    frameId: string,
    layout: 'flow' | 'free',
    boxes?: Record<string, FreeBox>,
  ) => void;
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
  /** Save a component, or a section of a flow frame, for reuse. Returns false (with a notice) if it can't be. */
  saveAsComponent: (nodeId: string, name: string) => boolean;
  /** Put a saved component into a frame, next to the selection (or at a freeform frame's next spot). One undo step. */
  insertSaved: (frameId: string, savedId: string) => void;
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
  /** Put a screenshot on a frame as its reference layer (keeps the current look when replacing). One undo step. */
  setFrameReference: (
    frameId: string,
    image: { id: string; dataUrl: string; name?: string },
    pixelRatio: number,
  ) => void;
  /** Change the reference layer. One undo step. */
  updateFrameReference: (frameId: string, patch: ReferencePatch) => void;
  /** Change it as part of a gesture (a slider drag): call `beginGesture()` first; no history entry of its own. */
  updateFrameReferenceLive: (frameId: string, patch: ReferencePatch) => void;
  removeFrameReference: (frameId: string) => void;
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

export type ReferencePatch = Partial<Omit<FrameReference, 'imageId'>>;

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

/**
 * Put a copied or saved subtree into a frame with fresh ids: next to the selection on a flow frame
 * (creating the layers it needs), or at the next spot on a freeform frame. Kits must match.
 */
function pasteInto(
  s: Store,
  frameId: string,
  clip: Clipboard,
  images?: MockupDoc['images'],
): Partial<Store> {
  const targetFrame = s.doc.frames.find((f) => f.id === frameId);
  if (!targetFrame) return s;
  // Layout nodes belong to the kit they were copied from, so the whole paste has to match.
  if (
    (clip.kitId && getKit(clip.kitId).id !== getKit(targetFrame.kitId).id) ||
    !subtreesFitKit(clip.nodes, [clip.rootId], targetFrame.kitId)
  )
    return { notice: kitMismatchMessage(targetFrame.kitId) };
  const copy = cloneSubtrees(clip.nodes, [clip.rootId], newId);
  const leafId = copy.roots[0]!;
  const doc0 = {
    ...s.doc,
    images: images ? { ...s.doc.images, ...images } : s.doc.images,
    nodes: { ...s.doc.nodes, ...copy.nodes },
  };
  if (isFreeFrame(targetFrame)) {
    const leaf = doc0.nodes[leafId]!;
    if (leaf.type !== 'component') return { notice: FREE_NO_LAYOUT };
    const at = leaf.free ? { x: leaf.free.x + 24, y: leaf.free.y + 24 } : nextPosition(targetFrame);
    const box = {
      ...at,
      width: leaf.free?.width ?? defaultWidth(leaf.componentId, targetFrame.width),
    };
    return {
      ...commit(s, placeFree(doc0, frameId, leafId, box)),
      selectedFrameId: frameId,
      selectedNodeId: leafId,
    };
  }
  // A position on a freeform frame means nothing on a flow frame.
  const leaf = doc0.nodes[leafId]!;
  if (leaf.free) doc0.nodes[leafId] = withoutBox(leaf);
  const anchor = s.selectedFrameId === frameId ? s.selectedNodeId : null;
  const ins = resolveInsertion(doc0, frameId, anchor, doc0.nodes[leafId]!);
  return {
    ...commit(s, applyInsertion(doc0, frameId, ins, leafId, newId)),
    selectedFrameId: frameId,
    selectedNodeId: leafId,
  };
}

/** Drop a saved component at an exact position. */
function dropSaved(s: Store, savedId: string, target: DropTarget): Partial<Store> {
  const saved = useSavedComponents.getState().components.find((c) => c.id === savedId);
  const frame = s.doc.frames.find((f) => f.id === target.frameId);
  if (!saved || !frame) return s;
  if (getKit(saved.kitId).id !== getKit(frame.kitId).id)
    return { notice: kitMismatchMessage(frame.kitId) };
  const copy = cloneSubtrees(saved.nodes, [saved.rootId], newId);
  const leafId = copy.roots[0]!;
  const withNodes = {
    ...s.doc,
    images: { ...s.doc.images, ...saved.images },
    nodes: { ...s.doc.nodes, ...copy.nodes },
  };
  const leaf = withNodes.nodes[leafId]!;
  if (isFreeFrame(frame)) {
    if (leaf.type !== 'component') return { notice: FREE_NO_LAYOUT };
    const width = leaf.free?.width ?? defaultWidth(leaf.componentId, frame.width);
    const at = target.free ?? nextPosition(frame);
    const box = {
      x: target.free ? at.x - width / 2 : at.x,
      y: target.free ? at.y - 16 : at.y,
      width,
    };
    return {
      ...commit(s, placeFree(withNodes, frame.id, leafId, box)),
      selectedFrameId: frame.id,
      selectedNodeId: leafId,
    };
  }
  if (leaf.free) withNodes.nodes[leafId] = withoutBox(leaf);
  const doc = applyInsertion(withNodes, target.frameId, target, leafId, newId);
  return { ...commit(s, doc), selectedFrameId: target.frameId, selectedNodeId: leafId };
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
  dialogNodeId: null,
  leftTab: 'library',
  newFrameKitId: readLastKit(),
  libraryKit: null,
  newFrameLayout: 'flow',
  paletteOpen: false,
  commentTool: false,
  activeCommentId: null,
  conversionReport: null,
  importReports: {},
  importSummary: null,
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
  setDialog: (dialog, frameId, nodeId) =>
    set({ dialog, dialogFrameId: frameId ?? null, dialogNodeId: nodeId ?? null }),
  setLeftTab: (leftTab) => set({ leftTab }),
  convertFrame: (frameId, targetKitId) =>
    set((s) => {
      if (isFreeFrame(s.doc.frames.find((f) => f.id === frameId)))
        return { notice: FREE_NO_CONVERT };
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
  importPageSpecText: (text) => {
    let pages: ImportedPage[];
    try {
      pages = importPageSpec(text, get().doc.defaultKitId);
    } catch (err) {
      set({ notice: err instanceof Error ? err.message : 'That page spec could not be imported.' });
      return false;
    }
    set((s) => {
      let x = Math.max(-FRAME_GAP, ...s.doc.frames.map((f) => f.x + f.width)) + FRAME_GAP;
      const y = s.doc.frames[0]?.y ?? 0;
      const frames: Frame[] = [];
      const reports: Record<string, PageImportReport> = {};
      const summary: ImportSummary = { pages: [] };
      let doc = s.doc;
      let nodes = s.doc.nodes;
      const taken = new Set(s.doc.frames.map((f) => f.name));
      for (const p of pages) {
        // Frame names identify frames to people, so an imported page never reuses one.
        let name = p.name;
        for (let n = 2; taken.has(name); n++) name = `${p.name} ${n}`;
        taken.add(name);
        const frame: Frame = {
          id: newId('f'),
          name,
          kitId: p.kitId,
          ...(p.settings ? { settings: p.settings } : {}),
          device: p.device,
          width: p.width,
          x: Math.round(x),
          y: Math.round(y),
          root: p.root,
        };
        x += p.width + FRAME_GAP;
        frames.push(frame);
        nodes = { ...nodes, ...p.nodes };
        reports[frame.id] = { ...p.report, frameName: name };
        summary.pages.push({ ...p.report, frameName: name, frameId: frame.id });
        doc = withKitVersion(doc, p.kitId);
      }
      return {
        ...commit(s, { ...doc, frames: [...s.doc.frames, ...frames], nodes }),
        selectedFrameId: frames[frames.length - 1]?.id ?? s.selectedFrameId,
        selectedNodeId: null,
        importReports: { ...s.importReports, ...reports },
        importSummary: summary,
        fitRequested: true,
      };
    });
    return true;
  },
  dismissImportReport: (frameId) =>
    set((s) => {
      const { [frameId]: _gone, ...rest } = s.importReports; // eslint-disable-line @typescript-eslint/no-unused-vars
      return { importReports: rest };
    }),
  dismissImportSummary: () => set({ importSummary: null }),
  setNewFrameLayout: (newFrameLayout) => set({ newFrameLayout }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen, contextMenu: null }),
  setCommentTool: (commentTool) => set({ commentTool }),
  setActiveComment: (activeCommentId) => set({ activeCommentId }),
  addComment: (frameId, x, y) => {
    const s = get();
    if (!s.doc.frames.some((f) => f.id === frameId)) return null;
    const id = newId('c');
    const comment: Comment = {
      id,
      frameId,
      x: Math.round(x),
      y: Math.round(y),
      text: '',
      resolved: false,
      createdAt: Date.now(),
    };
    set({
      ...commit(s, { ...s.doc, comments: [...(s.doc.comments ?? []), comment] }),
      activeCommentId: id,
      commentTool: false,
    });
    return id;
  },
  updateComment: (id, patch) =>
    set((s) => {
      const list = s.doc.comments ?? [];
      const c = list.find((x) => x.id === id);
      if (!c) return s;
      const next = {
        ...c,
        ...(patch.text !== undefined ? { text: patch.text.slice(0, 2000) } : {}),
        ...(patch.resolved !== undefined ? { resolved: patch.resolved } : {}),
      };
      if (next.text === c.text && next.resolved === c.resolved) return s;
      return commit(s, { ...s.doc, comments: list.map((x) => (x.id === id ? next : x)) });
    }),
  deleteComment: (id) =>
    set((s) => {
      const list = s.doc.comments ?? [];
      if (!list.some((x) => x.id === id)) return s;
      return {
        ...commit(s, { ...s.doc, comments: list.filter((x) => x.id !== id) }),
        activeCommentId: s.activeCommentId === id ? null : s.activeCommentId,
      };
    }),
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

  addFrame: (device, kitId, layout) =>
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
        ...(layout === 'free' ? { layout: 'free' as const } : {}),
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
          ...(s.doc.comments?.some((c) => c.frameId === id)
            ? { comments: s.doc.comments.filter((c) => c.frameId !== id) }
            : {}),
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

  setFreeBox: (nodeId, patch) =>
    set((s) => {
      const doc = setBox(s.doc, nodeId, patch);
      return doc === s.doc ? s : commit(s, doc);
    }),

  nudgeFree: (nodeId, dx, dy) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.root.includes(nodeId));
      if (!isFreeFrame(frame)) return s;
      const box = readBox(s.doc.nodes[nodeId], frame!.width);
      const doc = setBox(s.doc, nodeId, { x: box.x + dx, y: box.y + dy });
      return doc === s.doc ? s : commit(s, doc);
    }),

  setFrameFree: (frameId, patch) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!isFreeFrame(frame)) return s;
      const next = { ...frame! };
      if (patch.freeGrid !== undefined) {
        if (patch.freeGrid && [8, 16, 24].includes(patch.freeGrid)) next.freeGrid = patch.freeGrid;
        else delete next.freeGrid;
      }
      if (patch.freeSnap !== undefined) {
        if (patch.freeSnap) next.freeSnap = true;
        else delete next.freeSnap;
      }
      if (next.freeGrid === frame!.freeGrid && next.freeSnap === frame!.freeSnap) return s;
      return commit(s, {
        ...s.doc,
        frames: s.doc.frames.map((f) => (f.id === frameId ? next : f)),
      });
    }),

  reorderFree: (nodeId, to) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.root.includes(nodeId));
      if (!isFreeFrame(frame)) return s;
      const doc = reorder(s.doc, nodeId, to);
      return doc === s.doc ? s : commit(s, doc);
    }),

  setFrameLayout: (frameId, layout, boxes = {}) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame || isFreeFrame(frame) === (layout === 'free')) return s;
      const doc =
        layout === 'free' ? flowToFree(s.doc, frameId, boxes) : freeToFlow(s.doc, frameId, newId);
      return { ...commit(s, doc), selectedFrameId: frameId, selectedNodeId: null };
    }),

  addComponent: (frameId, componentId, variantId) =>
    set((s) => {
      const comp = getComponent(componentId);
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame || !comp) return s;
      if (!componentFitsKit(componentId, frame.kitId))
        return { notice: kitMismatchMessage(frame.kitId) };
      const leaf = newComponentNode(componentId, variantId ?? comp.defaultVariant);
      if (isFreeFrame(frame)) {
        const at = nextPosition(frame);
        const doc = placeFree(
          { ...s.doc, nodes: { ...s.doc.nodes, [leaf.id]: leaf } },
          frameId,
          leaf.id,
          { ...at, width: defaultWidth(componentId, frame.width) },
        );
        return { ...commit(s, doc), selectedFrameId: frameId, selectedNodeId: leaf.id };
      }
      return insertLeaf(s, frameId, { [leaf.id]: leaf }, leaf.id);
    }),

  addLayoutBlock: (frameId, kind, columns = 1) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      if (isFreeFrame(frame)) return { notice: FREE_NO_LAYOUT };
      const reason = blockUnavailable(s.doc, frame.id, kind, columns);
      if (reason) return { notice: reason };
      const built = buildLayoutBlock(frame.kitId, kind, columns);
      if (!built) return s;
      return insertLeaf(s, frameId, built.nodes, built.rootId);
    }),

  dropNew: (payload, target) =>
    set((s) => {
      if (payload.kind === 'move' || payload.kind === 'template') return s;
      if (payload.kind === 'saved') return dropSaved(s, payload.savedId, target);
      const targetFrame = s.doc.frames.find((f) => f.id === target.frameId);
      if (
        targetFrame &&
        ((payload.kind === 'new-component' &&
          !componentFitsKit(payload.componentId, targetFrame.kitId)) ||
          (payload.kind === 'new-layout' &&
            getKit(payload.kitId).id !== getKit(targetFrame.kitId).id))
      )
        return { notice: kitMismatchMessage(targetFrame.kitId) };
      if (isFreeFrame(targetFrame) && payload.kind === 'new-layout')
        return { notice: FREE_NO_LAYOUT };
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
      const withNodes = { ...s.doc, nodes: { ...s.doc.nodes, ...nodes } };
      if (targetFrame && isFreeFrame(targetFrame)) {
        const at = target.free ?? nextPosition(targetFrame);
        const width = defaultWidth(
          payload.kind === 'new-component' ? payload.componentId : undefined,
          targetFrame.width,
        );
        const box = {
          x: target.free ? at.x - width / 2 : at.x,
          y: target.free ? at.y - 16 : at.y,
          width,
        };
        return {
          ...commit(s, placeFree(withNodes, target.frameId, leafId, box)),
          selectedFrameId: target.frameId,
          selectedNodeId: leafId,
        };
      }
      const doc = applyInsertion(withNodes, target.frameId, target, leafId, newId);
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
      if (toFrame && isFreeFrame(toFrame)) {
        // Onto a freeform frame: only components, placed where the pointer is (or kept, when reordered in the Layers panel).
        if (node.type !== 'component') return { notice: FREE_NO_LAYOUT };
        const width = node.free?.width ?? defaultWidth(node.componentId, toFrame.width);
        const box = target.free
          ? { x: target.free.x - width / 2, y: target.free.y - 16, width }
          : readBox(node, toFrame.width);
        const index = target.free ? undefined : target.index;
        return {
          ...commit(s, moveToFree(s.doc, nodeId, toFrame.id, box, index)),
          selectedFrameId: toFrame.id,
          selectedNodeId: nodeId,
        };
      }
      const moved = applyInsertion(
        detachNode(s.doc, nodeId),
        target.frameId,
        target,
        nodeId,
        newId,
      );
      // Leaving a freeform frame: the node forgets its position.
      const out = moved.nodes[nodeId]?.free
        ? { ...moved, nodes: { ...moved.nodes, [nodeId]: withoutBox(moved.nodes[nodeId]!) } }
        : moved;
      return { ...commit(s, out), selectedFrameId: target.frameId, selectedNodeId: nodeId };
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
      const withCopy = { ...s.doc, nodes: { ...s.doc.nodes, ...copy.nodes } };
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (frame && isFreeFrame(frame)) {
        // A copy on a freeform frame sits just down and to the right, on top.
        const box = readBox(node, frame.width);
        const doc = placeFree(withCopy, frameId, copy.roots[0]!, {
          ...box,
          x: box.x + 24,
          y: box.y + 24,
        });
        return { ...commit(s, doc), selectedNodeId: copy.roots[0]! };
      }
      const doc = applyInsertion(
        withCopy,
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
      return pasteInto(s, frameId, clip);
    }),

  saveAsComponent: (nodeId, name) => {
    const s = get();
    const node = s.doc.nodes[nodeId];
    const frameId = frameOfNode(s.doc, nodeId);
    const frame = s.doc.frames.find((f) => f.id === frameId);
    const label = name.trim();
    if (!node || !frame || !label) return false;
    if (node.type !== 'component' && node.type !== 'section') {
      set({ notice: 'Select a component or a section to save it for reuse.' });
      return false;
    }
    const { nodes, rootId } = extractSubtree(s.doc, nodeId);
    useSavedComponents.getState().add({
      name: label,
      kitId: frame.kitId,
      rootId,
      nodes,
      images: imagesUsedBy(nodes, s.doc.images),
    });
    set({
      leftTab: 'library',
      notice: `Saved “${label}”. It’s in the Library, under My components.`,
    });
    return true;
  },

  insertSaved: (frameId, savedId) =>
    set((s) => {
      const saved = useSavedComponents.getState().components.find((c) => c.id === savedId);
      if (!saved) return { notice: 'That saved component isn’t available any more.' };
      return pasteInto(
        s,
        frameId,
        { nodes: saved.nodes, rootId: saved.rootId, kitId: saved.kitId },
        saved.images,
      );
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

  setFrameReference: (frameId, image, pixelRatio) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame) return s;
      const doc = {
        ...s.doc,
        images: { ...s.doc.images, [image.id]: { dataUrl: image.dataUrl, name: image.name } },
      };
      const reference: FrameReference = {
        ...DEFAULT_REFERENCE,
        ...frame.reference,
        visible: true,
        imageId: image.id,
        pixelRatio,
      };
      return commit(s, updateFrame(doc, frameId, { reference }));
    }),

  updateFrameReference: (frameId, patch) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame?.reference) return s;
      return commit(
        s,
        updateFrame(s.doc, frameId, { reference: { ...frame.reference, ...patch } }),
      );
    }),

  updateFrameReferenceLive: (frameId, patch) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame?.reference) return s;
      return { doc: updateFrame(s.doc, frameId, { reference: { ...frame.reference, ...patch } }) };
    }),

  removeFrameReference: (frameId) =>
    set((s) => {
      const frame = s.doc.frames.find((f) => f.id === frameId);
      if (!frame?.reference) return s;
      const { reference: _gone, ...rest } = frame; // eslint-disable-line @typescript-eslint/no-unused-vars
      return commit(s, {
        ...s.doc,
        frames: s.doc.frames.map((f) => (f.id === frameId ? rest : f)),
      });
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
      if (isFreeFrame(frame))
        return { notice: 'Page parts need a Flow frame. Switch this frame to Flow first.' };
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
      // On a freeform frame "up" means forward (towards the front), which is later in the root list.
      const free = isFreeFrame(s.doc.frames.find((f) => f.root.includes(s.selectedNodeId!)));
      const doc = moveAmongSiblings(s.doc, s.selectedNodeId, free ? (-dir as -1 | 1) : dir);
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
        importReports: Object.fromEntries(
          Object.entries(s.importReports).filter(([id]) => prev.frames.some((f) => f.id === id)),
        ),
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
