import type { Placement } from '../store/types';
import { canContain, frameOfNode, isDraggable, isWithin, parentOf, type Doc } from './ops';

/** Where on a Layers row the pointer is: above the middle, below it, or in the middle (drop inside). */
export type RowZone = 'before' | 'inside' | 'after';

/** Which zone a pointer at `y` is in, for a row spanning `top`..`top + height`. */
export function zoneForPointer(y: number, top: number, height: number): RowZone {
  const f = (y - top) / Math.max(1, height);
  return f < 0.28 ? 'before' : f > 0.72 ? 'after' : 'inside';
}

/**
 * Where dropping `draggedId` on a Layers row would put it, or null if the tree rules don't allow
 * it. Indexes are for the list without the dragged node, as `moveNode` expects. An "inside" drop
 * on a row that can't hold the node falls back to above or below it.
 */
export function placementForRow(
  doc: Doc,
  draggedId: string,
  rowId: string,
  zone: RowZone,
  pointerFraction = 0.5,
): Placement | null {
  const dragged = doc.nodes[draggedId];
  if (!dragged || !isDraggable(dragged) || isWithin(doc, rowId, draggedId)) return null;
  const row = doc.nodes[rowId];
  if (!row) return null;

  if (zone === 'inside') {
    if (canContain(row, dragged)) {
      const frameId = frameOfNode(doc, rowId);
      if (!frameId) return null;
      const kids = (row.children ?? []).filter((c) => c !== draggedId);
      return { frameId, parentId: rowId, index: kids.length, chainFrom: null };
    }
    zone = pointerFraction < 0.5 ? 'before' : 'after';
  }

  const loc = parentOf(doc, rowId);
  const frameId = frameOfNode(doc, rowId);
  if (!loc || !frameId) return null;
  const parent = loc.parentId ? (doc.nodes[loc.parentId] ?? null) : null;
  if (!canContain(parent, dragged)) return null;
  const list = parent
    ? (parent.children ?? [])
    : (doc.frames.find((f) => f.id === frameId)?.root ?? []);
  const siblings = list.filter((c) => c !== draggedId);
  const at = siblings.indexOf(rowId);
  return {
    frameId,
    parentId: loc.parentId,
    index: zone === 'before' ? at : at + 1,
    chainFrom: null,
  };
}

/** Dropping on a frame's own row puts the node at the end of the frame, if it belongs in the root. */
export function placementForFrame(doc: Doc, draggedId: string, frameId: string): Placement | null {
  const dragged = doc.nodes[draggedId];
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!dragged || !frame || !isDraggable(dragged) || !canContain(null, dragged)) return null;
  return {
    frameId,
    parentId: null,
    index: frame.root.filter((c) => c !== draggedId).length,
    chainFrom: null,
  };
}
