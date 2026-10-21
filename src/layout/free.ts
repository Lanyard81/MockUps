import { getComponent } from '../catalogue';
import type { DocNode, Frame, FreeBox, MockupDoc } from '../store/types';
import { buildChain, detachNode, insertNode, isFullWidth, schemaOfFrame, type MakeId } from './ops';

/**
 * Freeform frames (Milestone F1): components placed anywhere on the frame, with no sections, grids or
 * snapping. Pure functions on the document, tested in tests/free.test.ts.
 *
 * A freeform frame's `root` holds components only, back to front (later is on top). Each has a
 * `free` box: `x`, `y` and `width` in the frame's pixels; its height follows its content.
 */
type Doc = Pick<MockupDoc, 'frames' | 'nodes'>;

export const FREE_NO_LAYOUT =
  'A freeform frame holds components, not sections or grids. Switch the frame to Flow to use them.';

export const FREE_NO_CONVERT =
  'Freeform frames can’t be converted, exported as a page spec or saved as a template yet. Switch the frame to Flow first.';

export const FREE_DEFAULT_WIDTH = 360;
export const FREE_MIN_WIDTH = 48;
export const FREE_MAX_WIDTH = 4000;
const FREE_RANGE = 10_000;
/** How far each new item cascades from the last when added without a position. */
const CASCADE = 28;

export const isFreeFrame = (f: Pick<Frame, 'layout'> | undefined | null): boolean =>
  f?.layout === 'free';

const finite = (n: unknown, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? n : fallback;

/** A box with whole numbers, a usable width, and a position within sane limits. */
export function clampBox(box: FreeBox): FreeBox {
  const c = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));
  return {
    x: c(finite(box.x, 0), -FREE_RANGE, FREE_RANGE),
    y: c(finite(box.y, 0), -FREE_RANGE, FREE_RANGE),
    width: c(finite(box.width, FREE_DEFAULT_WIDTH), FREE_MIN_WIDTH, FREE_MAX_WIDTH),
  };
}

/** A component's width when first placed: the whole frame for page-wide pieces, else a card-sized column. */
export function defaultWidth(componentId: string | undefined, frameWidth: number): number {
  const comp = componentId ? getComponent(componentId) : undefined;
  if (comp?.fullWidth) return frameWidth;
  return Math.min(FREE_DEFAULT_WIDTH, Math.max(FREE_MIN_WIDTH, frameWidth - 48));
}

/** Where a node is: its box, or the default one if it has none (a freeform frame from an older or edited file). */
export function readBox(node: DocNode | undefined, frameWidth: number): FreeBox {
  return clampBox({
    x: node?.free?.x ?? 0,
    y: node?.free?.y ?? 0,
    width: node?.free?.width ?? defaultWidth(node?.componentId, frameWidth),
  });
}

/** A board height to use when nothing has measured the real one: room below the lowest item. */
export function estimateBoardHeight(nodes: Record<string, DocNode>, root: string[]): number {
  let lowest = 0;
  for (const id of root) lowest = Math.max(lowest, nodes[id]?.free?.y ?? 0);
  return Math.max(900, lowest + 500);
}

/** A spot for something added without a position: cascading down and across from the last item. */
export function nextPosition(frame: Pick<Frame, 'root' | 'width'>): { x: number; y: number } {
  const n = frame.root.length;
  const step = n % 12;
  return { x: 32 + step * CASCADE, y: 32 + step * CASCADE };
}

/** Put a node (already in `doc.nodes`, not in any list) on a freeform frame, on top unless `index` says otherwise. */
export function placeFree<T extends Doc>(
  doc: T,
  frameId: string,
  nodeId: string,
  box: FreeBox,
  index?: number,
): T {
  const node = doc.nodes[nodeId];
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!node || !frame) return doc;
  const withBox = { ...doc, nodes: { ...doc.nodes, [nodeId]: { ...node, free: clampBox(box) } } };
  return insertNode(withBox, frameId, null, index ?? frame.root.length, nodeId);
}

/** Change a node's box (a move or resize). */
export function setBox<T extends Doc>(doc: T, nodeId: string, patch: Partial<FreeBox>): T {
  const node = doc.nodes[nodeId];
  if (!node) return doc;
  const frameId = doc.frames.find((f) => f.root.includes(nodeId))?.id;
  const frame = doc.frames.find((f) => f.id === frameId);
  const next = clampBox({ ...readBox(node, frame?.width ?? 1440), ...patch });
  const prev = node.free;
  if (prev && prev.x === next.x && prev.y === next.y && prev.width === next.width) return doc;
  return { ...doc, nodes: { ...doc.nodes, [nodeId]: { ...node, free: next } } };
}

/** Bring a node to the front or send it to the back (its place in the frame's root). */
export function reorder<T extends Doc>(doc: T, nodeId: string, to: 'front' | 'back'): T {
  const frame = doc.frames.find((f) => f.root.includes(nodeId));
  if (!frame) return doc;
  const rest = frame.root.filter((id) => id !== nodeId);
  const root = to === 'front' ? [...rest, nodeId] : [nodeId, ...rest];
  if (root.every((id, i) => id === frame.root[i])) return doc;
  return { ...doc, frames: doc.frames.map((f) => (f.id === frame.id ? { ...f, root } : f)) };
}

/** A node without its freeform box (when it moves to a flow frame). */
export function withoutBox(node: DocNode): DocNode {
  const { free: _free, ...rest } = node; // eslint-disable-line @typescript-eslint/no-unused-vars
  return rest;
}

/**
 * Turn a flow frame into a freeform one. Each top-level component, and each component inside a section,
 * becomes a free item at the position `boxes` gives it (measured on screen by the caller); layout nodes
 * (sections, containers, grids, columns) are dropped. Items are stacked in reading order.
 */
export function flowToFree<T extends Doc>(
  doc: T,
  frameId: string,
  boxes: Record<string, FreeBox>,
): T {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) return doc;
  const nodes: Record<string, DocNode> = { ...doc.nodes };
  const comps: string[] = [];
  const layout: string[] = [];
  const walk = (id: string) => {
    const n = nodes[id];
    if (!n) return;
    if (n.type === 'component') comps.push(id);
    else {
      layout.push(id);
      n.children?.forEach(walk);
    }
  };
  frame.root.forEach(walk);
  for (const id of comps)
    nodes[id] = { ...nodes[id]!, free: clampBox(boxes[id] ?? readBox(undefined, frame.width)) };
  for (const id of layout) delete nodes[id];
  return {
    ...doc,
    nodes,
    frames: doc.frames.map((f) => (f.id === frameId ? { ...f, layout: 'free', root: comps } : f)),
  };
}

/**
 * Turn a freeform frame back into a flow one: components in reading order (top to bottom, then left
 * to right), each given its own section the way a drop on empty space does.
 */
export function freeToFlow<T extends Doc>(doc: T, frameId: string, makeId: MakeId): T {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) return doc;
  const schema = schemaOfFrame(doc, frameId);
  const ordered = [...frame.root].sort((a, b) => {
    const A = doc.nodes[a]?.free;
    const B = doc.nodes[b]?.free;
    return (A?.y ?? 0) - (B?.y ?? 0) || (A?.x ?? 0) - (B?.x ?? 0);
  });
  let nodes: Record<string, DocNode> = { ...doc.nodes };
  const root: string[] = [];
  for (const id of ordered) {
    const node = nodes[id];
    if (!node) continue;
    nodes[id] = withoutBox(node);
    if (isFullWidth(nodes[id]!)) root.push(id);
    else {
      const chain = buildChain(makeId, nodes[id]!, 1, schema);
      nodes = { ...nodes, ...chain.nodes };
      root.push(chain.topId);
    }
  }
  const { layout: _layout, ...frameRest } = frame; // eslint-disable-line @typescript-eslint/no-unused-vars
  return {
    ...doc,
    nodes,
    frames: doc.frames.map((f) => (f.id === frameId ? { ...frameRest, root } : f)),
  };
}

/** Detach a node from wherever it is and put it on a freeform frame. Used when moving between frames. */
export function moveToFree<T extends Doc>(
  doc: T,
  nodeId: string,
  frameId: string,
  box: FreeBox,
  index?: number,
): T {
  return placeFree(detachNode(doc, nodeId), frameId, nodeId, box, index);
}
