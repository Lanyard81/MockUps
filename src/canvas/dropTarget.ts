import { getComponent } from '../catalogue';
import { getKit } from '../kits';
import type { KitSchema } from '../kits/types';
import { depthOf, isWithin, parentOf, schemaOfFrame, type Doc } from '../layout/ops';
import type { DragPayload, DropTarget, IndicatorRect } from '../store/types';
import { getFrameElement, nodeRect, toFramePoint } from './registry';

const EDGE = 12; // px from a section's top or bottom edge that counts as "between sections"
const LINE = 4;

/**
 * Depth of what is being dragged in a frame of this kit, and a node to leave out of sibling lists.
 * Null when it can't go in that kit's frames (a component from another kit, a block it doesn't have).
 */
function leafInfo(
  payload: DragPayload,
  doc: Doc,
  kitId: string,
  schema: KitSchema,
): { depth: number; exclude?: string } | null {
  switch (payload.kind) {
    case 'new-component': {
      const comp = getComponent(payload.componentId);
      if (!comp || !getKit(kitId).catalogue.components.some((c) => c.id === comp.id)) return null;
      return { depth: comp.fullWidth ? 1 : schema.layers.length + 1 };
    }
    case 'new-layout': {
      const block = getKit(kitId).layoutBlocks.find(
        (b) =>
          b.kind === payload.block &&
          (payload.columns === undefined || b.columns === payload.columns),
      );
      return block ? { depth: schema.layers.indexOf(block.layer) + 1 } : null;
    }
    case 'move': {
      const node = doc.nodes[payload.nodeId];
      return node ? { depth: depthOf(node, schema), exclude: node.id } : null;
    }
    case 'template':
      return null; // templates drop onto whole frames or the canvas: see `frameAtPoint`
  }
}

/** The frame under a screen point, with its iframe. */
export function frameAtPoint(
  doc: Doc,
  clientX: number,
  clientY: number,
): { frame: Doc['frames'][number]; iframe: HTMLIFrameElement } | null {
  for (const frame of doc.frames) {
    const iframe = getFrameElement(frame.id);
    if (!iframe) continue;
    const r = iframe.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom)
      return { frame, iframe };
  }
  return null;
}

const toRect = (r: DOMRect): IndicatorRect => ({
  x: r.left,
  y: r.top,
  width: r.width,
  height: r.height,
});

/**
 * Decide where in `list` (ids) a pointer at `y` would insert, ignoring `exclude`. Returns the
 * index in the list without the excluded node, and the y of the line to draw.
 */
function indexByY(idoc: Document, list: string[], exclude: string | undefined, y: number) {
  const items = list.filter((id) => id !== exclude);
  let prevBottom: number | null = null;
  for (let i = 0; i < items.length; i++) {
    const r = nodeRect(idoc, items[i]!);
    if (!r) continue;
    if (y < r.top + r.height / 2) {
      return { index: i, lineY: prevBottom === null ? r.top : (prevBottom + r.top) / 2 };
    }
    prevBottom = r.bottom;
  }
  return { index: items.length, lineY: prevBottom };
}

function ancestorsAndSelf(doc: Doc, id: string | null): string[] {
  const out: string[] = [];
  let cur = id;
  while (cur) {
    out.push(cur);
    cur = parentOf(doc, cur)?.parentId ?? null;
  }
  return out;
}

/** Nearest descendant of `rootId` at `depth`, by distance from the pointer to its box. */
function nearestDescendant(
  doc: Doc,
  schema: KitSchema,
  idoc: Document,
  rootId: string,
  depth: number,
  exclude: string | undefined,
  x: number,
  y: number,
): string | null {
  let best: { id: string; dist: number } | null = null;
  const walk = (id: string) => {
    if (id === exclude) return;
    const node = doc.nodes[id];
    if (!node) return;
    if (depthOf(node, schema) === depth && node.type !== 'component') {
      const r = nodeRect(idoc, id);
      if (r) {
        const dx = Math.max(r.left - x, 0, x - r.right);
        const dy = Math.max(r.top - y, 0, y - r.bottom);
        const dist = Math.hypot(dx, dy);
        if (!best || dist < best.dist) best = { id, dist };
      }
      return;
    }
    node.children?.forEach(walk);
  };
  doc.nodes[rootId]?.children?.forEach(walk);
  return best ? (best as { id: string }).id : null;
}

/**
 * Work out what a drop at a screen position would do, and where to draw the indicator.
 * Pure geometry plus the document: it never changes either. Returns null when the pointer is
 * not over a frame.
 */
export function computeDropTarget(
  payload: DragPayload,
  doc: Doc,
  clientX: number,
  clientY: number,
): DropTarget | null {
  // Which frame is under the pointer?
  const hit = frameAtPoint(doc, clientX, clientY);
  const frame = hit?.frame;
  const iframe = hit?.iframe;
  const idoc = iframe?.contentDocument;
  if (!frame || !iframe || !idoc) return null;
  const schema = schemaOfFrame(doc, frame.id);
  const leaf = leafInfo(payload, doc, frame.kitId, schema);
  if (!leaf) return null;

  const { x, y } = toFramePoint(iframe, clientX, clientY);
  const frameWidth = iframe.offsetWidth;
  const exclude = leaf.exclude;

  let hitId: string | null =
    (idoc.elementFromPoint(x, y) as Element | null)
      ?.closest('[data-node]')
      ?.getAttribute('data-node') ?? null;
  // Hovering over the thing being dragged counts as hovering over what contains it.
  while (hitId && exclude && isWithin(doc, hitId, exclude))
    hitId = parentOf(doc, hitId)?.parentId ?? null;

  /** New layers will be created from the section down. */
  const wrapAtRoot = (): DropTarget => {
    const { index, lineY } = indexByY(idoc, frame.root, exclude, y);
    const rect: IndicatorRect =
      lineY === null
        ? { x: 0, y: 0, width: frameWidth, height: Math.min(iframe.offsetHeight, 400) }
        : { x: 0, y: lineY - LINE / 2, width: frameWidth, height: LINE };
    return {
      frameId: frame.id,
      parentId: null,
      index,
      chainFrom: leaf.depth > 1 ? 1 : null,
      indicator: { kind: lineY === null ? 'box' : 'line', rect },
    };
  };

  // Things that live in the frame root: sections and full-width components.
  if (leaf.depth === 1) {
    const { index, lineY } = indexByY(idoc, frame.root, exclude, y);
    const rect: IndicatorRect =
      lineY === null
        ? { x: 0, y: 0, width: frameWidth, height: Math.min(iframe.offsetHeight, 400) }
        : { x: 0, y: lineY - LINE / 2, width: frameWidth, height: LINE };
    return {
      frameId: frame.id,
      parentId: null,
      index,
      chainFrom: null,
      indicator: { kind: lineY === null ? 'box' : 'line', rect },
    };
  }

  // Near a section's top or bottom edge: a new section between sections.
  if (hitId && doc.nodes[hitId]?.type === 'section') {
    const r = nodeRect(idoc, hitId);
    if (r && (y - r.top < EDGE || r.bottom - y < EDGE)) return wrapAtRoot();
  }

  // The container that will hold the dragged thing: one level shallower than it.
  let parentId: string | null =
    ancestorsAndSelf(doc, hitId).find((id) => {
      const n = doc.nodes[id];
      return !!n && n.type !== 'component' && depthOf(n, schema) === leaf.depth - 1;
    }) ?? null;

  // The pointer is over something shallower (a section, a grid, the gap between columns):
  // pick the nearest container inside it.
  if (!parentId && hitId) {
    const hit = doc.nodes[hitId];
    if (hit && hit.type !== 'component' && depthOf(hit, schema) < leaf.depth - 1) {
      parentId = nearestDescendant(doc, schema, idoc, hitId, leaf.depth - 1, exclude, x, y);
    }
  }
  if (!parentId) return wrapAtRoot();

  const parent = doc.nodes[parentId]!;
  const parentRect = nodeRect(idoc, parentId);
  if (!parentRect) return wrapAtRoot();
  const siblings = (parent.children ?? []).filter((id) => id !== exclude);
  const { index, lineY } = indexByY(idoc, parent.children ?? [], exclude, y);
  const pr = toRect(parentRect);

  if (siblings.length === 0 || lineY === null) {
    return {
      frameId: frame.id,
      parentId,
      index,
      chainFrom: null,
      indicator: { kind: 'box', rect: pr, parent: pr },
    };
  }
  return {
    frameId: frame.id,
    parentId,
    index,
    chainFrom: null,
    indicator: {
      kind: 'line',
      rect: { x: pr.x, y: lineY - LINE / 2, width: pr.width, height: LINE },
      parent: pr,
    },
  };
}
