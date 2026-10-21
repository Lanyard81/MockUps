import { FREE_MIN_WIDTH, clampBox, readBox } from '../layout/free';
import { useStore } from '../store/store';
import type { FreeBox } from '../store/types';
import { DRAG_THRESHOLD } from './drag';
import { frameScale, getFrameElement } from './registry';

/** Fired while a freeform item is being moved or resized, so the selection box follows it. */
export const OVERLAY_REFRESH = 'mockup:overlay-refresh';
const refresh = () => window.dispatchEvent(new Event(OVERLAY_REFRESH));

export type FreeGesture = 'move' | 'e' | 'w';

/**
 * Move or resize one item of a freeform frame. The item is moved by styling its element directly, so
 * nothing re-renders while the pointer travels; on release one store action commits the new box as a
 * single undo step. Escape puts it back. Holding Shift locks a move to one axis.
 *
 * `fromFrame` is true when the press began inside the frame's iframe: the browser then keeps sending
 * the gesture's events to the frame until release, so its document is listened to as well, with
 * coordinates converted back to screen space (as `startDrag` does).
 */
export function startFreeGesture(
  frameId: string,
  nodeId: string,
  mode: FreeGesture,
  start: { x: number; y: number },
  fromFrame: boolean,
): void {
  const iframe = getFrameElement(frameId);
  const idoc = iframe?.contentDocument;
  const el = idoc?.querySelector<HTMLElement>(`[data-node="${nodeId}"]`);
  const s0 = useStore.getState();
  const frame = s0.doc.frames.find((f) => f.id === frameId);
  const node = s0.doc.nodes[nodeId];
  if (!iframe || !idoc || !el || !frame || !node) return;

  const box0 = readBox(node, frame.width);
  const k = () => frameScale(iframe) || 1;
  const toScreen = (e: PointerEvent) => {
    if (!fromFrame || e.view === window) return { x: e.clientX, y: e.clientY };
    const r = iframe.getBoundingClientRect();
    return { x: r.left + e.clientX * k(), y: r.top + e.clientY * k() };
  };

  let box: FreeBox = box0;
  let moved = false;
  const apply = (b: FreeBox) => {
    el.style.left = `${b.x}px`;
    el.style.top = `${b.y}px`;
    el.style.width = `${b.width}px`;
    refresh();
  };

  const onMove = (e: PointerEvent) => {
    const p = toScreen(e);
    const dx = (p.x - start.x) / k();
    const dy = (p.y - start.y) / k();
    if (!moved && Math.hypot(dx * k(), dy * k()) < DRAG_THRESHOLD) return;
    moved = true;
    if (mode === 'move') {
      const lockX = e.shiftKey && Math.abs(dy) > Math.abs(dx);
      const lockY = e.shiftKey && !lockX;
      box = clampBox({ ...box0, x: box0.x + (lockX ? 0 : dx), y: box0.y + (lockY ? 0 : dy) });
    } else if (mode === 'e') {
      box = clampBox({ ...box0, width: Math.max(FREE_MIN_WIDTH, box0.width + dx) });
    } else {
      const width = Math.max(FREE_MIN_WIDTH, box0.width - dx);
      box = clampBox({ ...box0, x: box0.x + box0.width - width, width });
    }
    apply(box);
  };

  let done = false;
  const targets: (Window | Document)[] = fromFrame ? [window, idoc] : [window];
  const finish = (commit: boolean) => {
    if (done) return;
    done = true;
    for (const t of targets) {
      t.removeEventListener('pointermove', onMove as EventListener);
      t.removeEventListener('pointerup', onUp as EventListener);
      t.removeEventListener('pointercancel', onCancel);
      t.removeEventListener('keydown', onKey as EventListener, true);
    }
    window.removeEventListener('blur', onCancel);
    document.body.classList.remove('is-dragging', 'is-free-gesture');
    if (moved && commit) useStore.getState().setFreeBox(nodeId, box);
    else if (moved) {
      apply(box0); // cancelled: put it back
    }
  };
  const onUp = (e: PointerEvent) => {
    onMove(e);
    finish(true);
  };
  const onCancel = () => finish(false);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      finish(false);
    }
  };
  for (const t of targets) {
    t.addEventListener('pointermove', onMove as EventListener);
    t.addEventListener('pointerup', onUp as EventListener);
    t.addEventListener('pointercancel', onCancel);
    t.addEventListener('keydown', onKey as EventListener, true);
  }
  window.addEventListener('blur', onCancel);
  document.body.classList.add('is-dragging');
  // A resize starts on the editor's own handle: frames must not take the pointer from it mid-gesture.
  if (!fromFrame) document.body.classList.add('is-free-gesture');
}
