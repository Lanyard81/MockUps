import { getComponent } from '../catalogue';
import { equalSpans } from '../kits/nsw/spans';
import { DEFAULT_KIT_ID, getKit } from '../kits';
import type { KitSchema } from '../kits/types';
import type { DocNode, Frame, MockupDoc } from '../store/types';
import { collectIds, removeSubtrees } from './tree';

/**
 * Pure operations on the document tree. Nothing here touches the store or the DOM, so every
 * rule about what may go where is unit-tested in tests/ops.test.ts.
 *
 * The tree is strictly layered. Each node type has a depth, and a node's parent is always one
 * level shallower. Which layers exist comes from the frame's kit (`KitSchema.layers`); for NSW:
 *
 *   root (frame) 0 > section 1 > container 2 > grid 3 > column 4 > component 5
 *
 * Full-width components (masthead, header, footer, hero banner...) are the exception: they
 * have depth 1 and sit in the frame root beside sections.
 *
 * Functions that take a `schema` default to the NSW kit's; ones that take a document and a frame
 * look the schema up from the frame.
 */
export type Doc = Pick<MockupDoc, 'frames' | 'nodes'>;
export type MakeId = (prefix: string) => string;

export const isFullWidth = (n: DocNode): boolean =>
  n.type === 'component' && !!n.componentId && !!getComponent(n.componentId)?.fullWidth;

const nswSchema = (): KitSchema => getKit(DEFAULT_KIT_ID).schema;

/** The layout rules of a kit (NSW when the id is missing or unknown). */
export const schemaOfKit = (kitId?: string | null): KitSchema => getKit(kitId).schema;

/** The layout rules for a frame, from its kit (NSW when the frame has none). */
export function schemaOfFrame(doc: Doc, frameId: string): KitSchema {
  return getKit(doc.frames.find((f) => f.id === frameId)?.kitId).schema;
}

/** The layout rules that apply to a node already in the tree (0 layers if it isn't in one). */
export function schemaOfNode(doc: Doc, id: string): KitSchema {
  const frameId = frameOfNode(doc, id);
  return frameId ? schemaOfFrame(doc, frameId) : nswSchema();
}

/** How deep a node sits: 0 is the frame root, then one per layer, and components below the last. */
export function depthOf(n: DocNode, schema: KitSchema = nswSchema()): number {
  if (n.type === 'component') return isFullWidth(n) ? 1 : schema.layers.length + 1;
  const i = schema.layers.indexOf(n.type);
  return i < 0 ? -1 : i + 1;
}

/** Can `parent` (null means the frame root) hold `child`? */
export function canContain(
  parent: DocNode | null,
  child: DocNode,
  schema: KitSchema = nswSchema(),
): boolean {
  const childDepth = depthOf(child, schema);
  if (childDepth < 1) return false;
  if (!parent) return childDepth === 1;
  if (parent.type === 'component') return false;
  const parentDepth = depthOf(parent, schema);
  return parentDepth > 0 && parentDepth === childDepth - 1;
}

/** Only these can be picked up and moved. Columns belong to their grid. */
export const isDraggable = (n: DocNode): boolean => n.type !== 'column';

export interface Loc {
  frameId: string;
  /** Null when the node is directly in the frame root. */
  parentId: string | null;
  index: number;
}

/** Parent and position of a node, or undefined if it isn't in the tree. */
export function parentOf(
  doc: Doc,
  id: string,
): { parentId: string | null; index: number } | undefined {
  for (const f of doc.frames) {
    const i = f.root.indexOf(id);
    if (i >= 0) return { parentId: null, index: i };
  }
  for (const n of Object.values(doc.nodes)) {
    const i = n.children?.indexOf(id) ?? -1;
    if (i >= 0) return { parentId: n.id, index: i };
  }
  return undefined;
}

export function frameOfNode(doc: Doc, id: string): string | undefined {
  let cur = id;
  for (let guard = 0; guard < 16; guard++) {
    const p = parentOf(doc, cur);
    if (!p) return undefined;
    if (p.parentId === null) return doc.frames.find((f) => f.root.includes(cur))?.id;
    cur = p.parentId;
  }
  return undefined;
}

export function locate(doc: Doc, id: string): Loc | undefined {
  const p = parentOf(doc, id);
  const frameId = p && frameOfNode(doc, id);
  return p && frameId ? { frameId, ...p } : undefined;
}

/** Ids from the top of the frame down to `id` (inclusive). */
export function pathTo(doc: Doc, id: string): string[] {
  const path: string[] = [];
  let cur: string | null = id;
  while (cur) {
    path.unshift(cur);
    cur = parentOf(doc, cur)?.parentId ?? null;
  }
  return path;
}

export function isWithin(doc: Doc, id: string, ancestorId: string): boolean {
  return pathTo(doc, id).includes(ancestorId);
}

const splice = (list: string[], index: number, id: string) => {
  const i = Math.min(Math.max(index, 0), list.length);
  return [...list.slice(0, i), id, ...list.slice(i)];
};

const mapFrame = (doc: Doc, frameId: string, fn: (f: Frame) => Frame): Doc['frames'] =>
  doc.frames.map((f) => (f.id === frameId ? fn(f) : f));

/** Put an existing node into a parent's children (or a frame root) at `index`. */
export function insertNode<T extends Doc>(
  doc: T,
  frameId: string,
  parentId: string | null,
  index: number,
  id: string,
): T {
  if (parentId === null) {
    return {
      ...doc,
      frames: mapFrame(doc, frameId, (f) => ({ ...f, root: splice(f.root, index, id) })),
    };
  }
  const parent = doc.nodes[parentId];
  if (!parent) throw new Error(`Missing node ${parentId}`);
  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [parentId]: { ...parent, children: splice(parent.children ?? [], index, id) },
    },
  };
}

/** Take a node out of its parent's list without deleting it. */
export function detachNode<T extends Doc>(doc: T, id: string): T {
  const p = parentOf(doc, id);
  if (!p) return doc;
  if (p.parentId === null) {
    return {
      ...doc,
      frames: doc.frames.map((f) =>
        f.root.includes(id) ? { ...f, root: f.root.filter((r) => r !== id) } : f,
      ),
    };
  }
  const parent = doc.nodes[p.parentId]!;
  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [parent.id]: { ...parent, children: (parent.children ?? []).filter((c) => c !== id) },
    },
  };
}

/** Delete a node and everything inside it. */
export function removeNode<T extends Doc>(doc: T, id: string): T {
  const detached = detachNode(doc, id);
  return { ...detached, nodes: removeSubtrees(detached.nodes, [id]) };
}

/** Delete everything inside a node but keep the node (used for columns). */
export function clearChildren<T extends Doc>(doc: T, id: string): T {
  const node = doc.nodes[id];
  if (!node?.children?.length) return doc;
  const nodes = removeSubtrees(doc.nodes, node.children);
  return { ...doc, nodes: { ...nodes, [id]: { ...node, children: [] } } };
}

/** Swap a node with its previous (-1) or next (+1) sibling. Returns the same doc at the ends. */
export function moveAmongSiblings<T extends Doc>(doc: T, id: string, dir: -1 | 1): T {
  const p = parentOf(doc, id);
  if (!p) return doc;
  const frameId = frameOfNode(doc, id)!;
  const parent = p.parentId === null ? null : doc.nodes[p.parentId]!;
  const list = parent ? (parent.children ?? []) : doc.frames.find((f) => f.id === frameId)!.root;
  const target = p.index + dir;
  if (target < 0 || target >= list.length) return doc;
  const next = [...list];
  [next[p.index], next[target]] = [next[target]!, next[p.index]!];
  if (!parent) return { ...doc, frames: mapFrame(doc, frameId, (f) => ({ ...f, root: next })) };
  return { ...doc, nodes: { ...doc.nodes, [parent.id]: { ...parent, children: next } } };
}

/**
 * Create the missing layers between a start depth and a leaf, so a component dropped on empty
 * space gets a section, container, grid and column of its own. The leaf must already be in `nodes`
 * (or be added by the caller). Returns the new layer nodes and the id of the topmost node.
 */
export function buildChain(
  makeId: MakeId,
  leaf: DocNode,
  startDepth: number,
  schema: KitSchema = nswSchema(),
): { nodes: Record<string, DocNode>; topId: string } {
  const leafDepth = depthOf(leaf, schema);
  const nodes: Record<string, DocNode> = {};
  let childId = leaf.id;
  for (let depth = leafDepth - 1; depth >= startDepth; depth--) {
    const type = schema.layers[depth - 1]!;
    const id = makeId('n');
    const props = schema.defaultProps(type);
    nodes[id] = { id, type, children: [childId], ...(props ? { props } : {}) };
    childId = id;
  }
  return { nodes, topId: childId };
}

/** Where something should go: a parent (null = frame root), a position, and layers to create. */
export interface Insertion {
  parentId: string | null;
  index: number;
  /** When set, create layers from this depth down to the leaf, and insert the top one. */
  chainFrom: number | null;
}

/**
 * Choose a sensible spot for a new node of `leaf`'s kind, relative to an anchor (usually the
 * current selection). Used by click-to-add and paste. If nothing is selected, the anchor is the
 * last thing in the frame, so content stacks like a page.
 */
export function resolveInsertion(
  doc: Doc,
  frameId: string,
  anchorId: string | null,
  leaf: DocNode,
): Insertion {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) throw new Error(`Missing frame ${frameId}`);
  const schema = schemaOfFrame(doc, frameId);
  const leafDepth = depthOf(leaf, schema);
  let anchor = anchorId && frameOfNode(doc, anchorId) === frameId ? anchorId : null;
  anchor ??= frame.root[frame.root.length - 1] ?? null;
  if (!anchor) return { parentId: null, index: 0, chainFrom: leafDepth > 1 ? 1 : null };

  // Anchor is as deep as the leaf or deeper: go up to the leaf's level and insert after it.
  let cur = anchor;
  if (depthOf(doc.nodes[cur]!, schema) >= leafDepth) {
    while (depthOf(doc.nodes[cur]!, schema) > leafDepth) cur = parentOf(doc, cur)!.parentId!;
    const p = parentOf(doc, cur)!;
    return { parentId: p.parentId, index: p.index + 1, chainFrom: null };
  }

  // Anchor is shallower: go down through last children until we reach the leaf's parent level.
  while (depthOf(doc.nodes[cur]!, schema) < leafDepth - 1) {
    const node = doc.nodes[cur]!;
    const last = node.children?.[node.children.length - 1];
    if (!last) {
      if (node.type === 'component') {
        // A full-width component can't hold anything: start a new section after it.
        const p = parentOf(doc, cur)!;
        return { parentId: null, index: p.index + 1, chainFrom: 1 };
      }
      return { parentId: cur, index: 0, chainFrom: depthOf(node, schema) + 1 };
    }
    cur = last;
  }
  return { parentId: cur, index: doc.nodes[cur]!.children?.length ?? 0, chainFrom: null };
}

/**
 * Apply an insertion for a leaf that is already in `doc.nodes` (but not yet in the tree).
 * Creates any missing layers.
 */
export function applyInsertion<T extends Doc>(
  doc: T,
  frameId: string,
  ins: Insertion,
  leafId: string,
  makeId: MakeId,
): T {
  const leaf = doc.nodes[leafId];
  if (!leaf) throw new Error(`Missing node ${leafId}`);
  const schema = schemaOfFrame(doc, frameId);
  if (ins.chainFrom !== null && ins.chainFrom < depthOf(leaf, schema)) {
    const chain = buildChain(makeId, leaf, ins.chainFrom, schema);
    const withChain = { ...doc, nodes: { ...doc.nodes, ...chain.nodes } };
    return insertNode(withChain, frameId, ins.parentId, ins.index, chain.topId);
  }
  return insertNode(doc, frameId, ins.parentId, ins.index, leafId);
}

/** Copy a subtree out of the document, for the clipboard. */
export function extractSubtree(
  doc: Doc,
  id: string,
): { nodes: Record<string, DocNode>; rootId: string } {
  const ids = collectIds(doc.nodes, [id]);
  return {
    rootId: id,
    nodes: Object.fromEntries(ids.map((i) => [i, structuredClone(doc.nodes[i]!)])),
  };
}

/** Is it legal to move `id` into `parentId`? (Not into itself, not into its own descendants.) */
export function canMoveInto(
  doc: Doc,
  id: string,
  parentId: string | null,
  /** The frame the move ends in; needed when `parentId` is null (the frame root). */
  frameId?: string,
): boolean {
  const node = doc.nodes[id];
  if (!node || !isDraggable(node)) return false;
  const targetFrame =
    parentId !== null ? frameOfNode(doc, parentId) : (frameId ?? frameOfNode(doc, id));
  const schema = targetFrame ? schemaOfFrame(doc, targetFrame) : nswSchema();
  if (parentId !== null) {
    if (isWithin(doc, parentId, id)) return false;
    return canContain(doc.nodes[parentId] ?? null, node, schema);
  }
  return canContain(null, node, schema);
}

/**
 * Change how many columns a grid has (1–6). Widths are reset to equal. Columns that go away give
 * their content to the last column that stays, so nothing is lost.
 */
export function setGridColumnCount<T extends Doc>(
  doc: T,
  gridId: string,
  count: number,
  makeId: MakeId,
): T {
  const grid = doc.nodes[gridId];
  if (!grid || grid.type !== 'grid') return doc;
  const target = Math.min(6, Math.max(1, Math.round(count)));
  const columns = [...(grid.children ?? [])];
  const spans = equalSpans(target);
  const nodes = { ...doc.nodes };

  if (target > columns.length) {
    while (columns.length < target) {
      const id = makeId('n');
      nodes[id] = { id, type: 'column', props: { spans }, children: [] };
      columns.push(id);
    }
  } else if (target < columns.length) {
    const keep = columns.slice(0, target);
    const last = nodes[keep[keep.length - 1]!]!;
    let moved = [...(last.children ?? [])];
    for (const gone of columns.slice(target)) {
      moved = [...moved, ...(nodes[gone]?.children ?? [])];
      delete nodes[gone];
    }
    nodes[last.id] = { ...last, children: moved };
    columns.length = 0;
    columns.push(...keep);
  }

  for (const id of columns) {
    const col = nodes[id]!;
    nodes[id] = { ...col, props: { ...col.props, spans } };
  }
  nodes[gridId] = { ...grid, children: columns };
  return { ...doc, nodes };
}
