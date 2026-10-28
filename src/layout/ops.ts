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

/** Can `parent` (null means the page root) hold `child`? */
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

/** The component ids a kit puts at the top of a page (masthead, header) and at the bottom (footer). */
export function pagePartIds(kitId: string): { top: Set<string>; bottom: Set<string> } {
  const parts = getKit(kitId).pageParts;
  const ids = (position: 'top' | 'bottom') =>
    new Set(
      parts.filter((p) => p.position === position).flatMap((p) => p.components.map((c) => c[0])),
    );
  return { top: ids('top'), bottom: ids('bottom') };
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

  // Content belongs between the page's top parts (masthead, header) and its bottom parts (footer),
  // whatever happens to be selected or last: a footer stays last and a header stays first.
  const part = pagePartIds(frame.kitId);
  const componentOf = (id: string) => doc.nodes[id]?.componentId ?? '';
  const isTop = (id: string) => part.top.has(componentOf(id));
  const isBottom = (id: string) => part.bottom.has(componentOf(id));
  const leafIsPart =
    part.top.has(leaf.componentId ?? '') || part.bottom.has(leaf.componentId ?? '');
  if (!leafIsPart) {
    const root = frame.root;
    const inRoot = anchor ? pathTo(doc, anchor)[0] : null;
    if (!anchor || (inRoot && isBottom(inRoot) && anchor === inRoot)) {
      // Nothing selected, or the footer: the end of the content, above the footer.
      let last = root.length - 1;
      while (last >= 0 && isBottom(root[last]!)) last--;
      if (last < 0) return { parentId: null, index: 0, chainFrom: leafDepth > 1 ? 1 : null };
      anchor = root[last]!;
    }
    if (anchor && isTop(anchor)) {
      // On a masthead or header: after the last of the run of top parts at the start.
      let last = 0;
      while (last + 1 < root.length && isTop(root[last + 1]!)) last++;
      anchor = root[last]!;
    }
  }
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

/**
 * Change how many columns a node has (1–`max`). Columns that go away give their content to the last
 * column that stays, so nothing is lost: going from three columns to two moves the third column's
 * content below the second's, and going to one stacks everything in the first.
 */
export function setColumnCount<T extends Doc>(
  doc: T,
  parentId: string,
  count: number,
  makeId: MakeId,
  max = 6,
): T {
  const parent = doc.nodes[parentId];
  if (!parent || parent.type === 'component') return doc;
  const target = Math.min(max, Math.max(1, Math.round(count)));
  const columns = [...(parent.children ?? [])];
  if (target === columns.length) return doc;
  const nodes = { ...doc.nodes };

  if (target > columns.length) {
    while (columns.length < target) {
      const id = makeId('n');
      nodes[id] = { id, type: 'column', children: [] };
      columns.push(id);
    }
  } else {
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
  nodes[parentId] = { ...parent, children: columns };
  return { ...doc, nodes };
}

/**
 * Put a component and the items after it in its column side by side in a row of up to `n`: each goes
 * in its own column, starting at the column it is in. Adds columns when the row has too few (a grid
 * up to 6, a section up to its kit's layouts), keeps everything else where it was, and returns the
 * document unchanged when it can't be done.
 */
export function arrangeInRow<T extends Doc>(doc: T, nodeId: string, n: number, makeId: MakeId): T {
  const where = parentOf(doc, nodeId);
  const col = where?.parentId ? doc.nodes[where.parentId] : undefined;
  if (!where || !col || col.type !== 'column') return doc;
  const rowLoc = parentOf(doc, col.id);
  const row = rowLoc?.parentId ? doc.nodes[rowLoc.parentId] : undefined;
  if (!rowLoc || !row || (row.type !== 'grid' && row.type !== 'section')) return doc;
  const frameId = frameOfNode(doc, nodeId);
  if (!frameId) return doc;
  const schema = schemaOfFrame(doc, frameId);
  const layouts = schema.sectionLayouts;
  const rowMax = row.type === 'grid' ? 6 : layouts ? 3 : (schema.maxChildren?.section ?? 6);
  const group = (col.children ?? []).slice(where.index, where.index + Math.max(1, Math.round(n)));
  const start = rowLoc.index;
  const size = Math.min(group.length, rowMax - start);
  if (size < 2) return doc;
  const needed = start + size;
  let next: T = doc;
  const have = row.children?.length ?? 0;
  if (needed > have) {
    if (row.type === 'grid') next = setGridColumnCount(next, row.id, needed, makeId);
    else {
      const id = { 1: 'one-column', 2: 'two-columns', 3: 'three-columns' }[needed];
      if (layouts && !(id && layouts.some((l) => l.id === id && l.columns === needed))) return doc;
      next = setColumnCount(next, row.id, needed, makeId, rowMax);
      if (id)
        next = {
          ...next,
          nodes: {
            ...next.nodes,
            [row.id]: {
              ...next.nodes[row.id]!,
              props: { ...next.nodes[row.id]!.props, layout: id },
            },
          },
        };
    }
  }
  const columns = next.nodes[row.id]!.children ?? [];
  // The first stays; the rest move one column to the right each.
  group.slice(1, size).forEach((id, i) => {
    next = insertNode(detachNode(next, id), frameId, columns[start + 1 + i]!, 0, id);
  });
  return next;
}

/** The row sizes `arrangeInRow` could make for this item now: 2 up to as many items as follow it (and fit). */
export function sideBySideChoices(doc: Doc, nodeId: string): number[] {
  const out: number[] = [];
  for (let n = 2; n <= 4; n++) {
    // Only sizes it can fill exactly: enough items after this one, and room in the row.
    const loc = parentOf(doc, nodeId);
    const col = loc?.parentId ? doc.nodes[loc.parentId] : undefined;
    const enough = (col?.children?.length ?? 0) - (loc?.index ?? 0) >= n;
    if (enough && arrangeInRow(doc, nodeId, n, (p) => `${p}_probe`) !== doc) out.push(n);
  }
  return out;
}

/** In words, where click-to-add would put a new item now (for the Library): "after “Heading”", "at the end of the page". */
export function describeInsertion(
  doc: Doc,
  frameId: string,
  anchorId: string | null,
  label: (n: DocNode) => string,
): string {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) return '';
  const probe: DocNode = { id: '_probe', type: 'component', componentId: '_probe' };
  const ins = resolveInsertion(
    { ...doc, nodes: { ...doc.nodes, _probe: probe } },
    frameId,
    anchorId,
    probe,
  );
  if (ins.chainFrom !== null && ins.parentId === null && frame.root.length === 0)
    return 'at the top of the page';
  const siblings = ins.parentId ? (doc.nodes[ins.parentId]?.children ?? []) : frame.root;
  const prev = ins.index > 0 ? doc.nodes[siblings[ins.index - 1]!] : undefined;
  if (ins.chainFrom !== null)
    return prev ? `in a new section after “${label(prev)}”` : 'at the top of the page';
  if (prev) return `after “${label(prev)}”`;
  return ins.parentId ? 'at the start of that column' : 'at the top of the page';
}
