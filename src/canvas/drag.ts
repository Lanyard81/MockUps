import { useStore } from '../store/store';
import type { DragPayload, DropTarget } from '../store/types';
import { isOverCanvas, screenToWorld, templateAsNewFrame, templateOnFrame } from '../templates/use';
import { computeDropTarget, frameAtPoint } from './dropTarget';
import { FREE_NO_LAYOUT, isFreeFrame } from '../layout/free';
import { kitMismatchMessage } from '../layout/kitGuard';
import { frameScale } from './registry';

/** Pixels the pointer must travel before a press becomes a drag. */
export const DRAG_THRESHOLD = 4;

let ghostEl: HTMLElement | null = null;
export const registerGhost = (el: HTMLElement | null) => {
  ghostEl = el;
};
const placeGhost = (x: number, y: number) => {
  if (ghostEl) ghostEl.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
};

let justDragged = false;
/** True just after a drag ends, so the click that follows it can be ignored. */
export const consumeDragClick = (): boolean => {
  const was = justDragged;
  justDragged = false;
  return was;
};

const sameTarget = (a: DropTarget | null, b: DropTarget | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.frameId === b.frameId &&
    a.parentId === b.parentId &&
    a.index === b.index &&
    a.chainFrom === b.chainFrom &&
    a.indicator.kind === b.indicator.kind &&
    JSON.stringify(a.indicator.rect) === JSON.stringify(b.indicator.rect));

/**
 * Run a drag from a pointer position until it ends. Listens on the window, so it works over
 * the rest of the editor. A drag that began inside a frame is passed as `from`: the browser keeps
 * sending that gesture's events to the frame until release, so the frame's document is listened
 * to as well, with coordinates converted back to screen space.
 *
 * Nothing in the document changes while dragging. The drop target is recalculated at most once
 * per animation frame, and on release one store action makes the whole drag a single undo step.
 */
/** How close to the canvas edge (px) the pointer must be to scroll it, and the fastest scroll (px per frame). */
const EDGE_ZONE = 56;
const EDGE_SPEED = 18;
/** The pointer must stay in the edge zone this long (ms) before the canvas starts to scroll. */
const EDGE_DWELL = 300;

export function startDrag(
  payload: DragPayload,
  start: { clientX: number; clientY: number },
  from?: HTMLIFrameElement,
) {
  const store = useStore.getState();
  store.setDrag(payload);
  document.body.classList.add('is-dragging');

  let latest = { x: start.clientX, y: start.clientY };
  let raf = 0;
  placeGhost(latest.x, latest.y);

  const update = () => {
    raf = 0;
    const s = useStore.getState();
    if (payload.kind === 'template') {
      // A template goes onto a frame (replacing its content) or onto empty canvas (a new frame).
      const hit = frameAtPoint(s.doc, latest.x, latest.y);
      const next = hit
        ? { frameId: hit.frame.id }
        : isOverCanvas(latest.x, latest.y)
          ? { frameId: null }
          : null;
      if (
        s.templateDrop?.frameId !== next?.frameId ||
        (s.templateDrop === null) !== (next === null)
      )
        s.setTemplateDrop(next);
      return;
    }
    const next = computeDropTarget(payload, s.doc, latest.x, latest.y);
    if (!sameTarget(s.dropTarget, next)) s.setDropTarget(next);
  };
  // Holding the pointer near an edge of the canvas scrolls it, so a long page can be dropped below the fold.
  let scrollRaf = 0;
  let edgeSince = 0;
  const autoScroll = () => {
    scrollRaf = requestAnimationFrame(autoScroll);
    const rect = document.getElementById('canvas')?.getBoundingClientRect();
    if (!rect || payload.kind === 'template') return;
    const { x, y } = latest;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
    const push = (distance: number) =>
      distance < EDGE_ZONE ? Math.round(EDGE_SPEED * (1 - Math.max(distance, 0) / EDGE_ZONE)) : 0;
    const dx = push(x - rect.left) - push(rect.right - x);
    const dy = push(y - rect.top) - push(rect.bottom - y);
    if (!dx && !dy) {
      edgeSince = 0;
      return;
    }
    // Only a pointer that stays near the edge scrolls; passing by on the way to a drop spot does not.
    edgeSince ||= performance.now();
    if (performance.now() - edgeSince < EDGE_DWELL) return;
    const view = useStore.getState().doc.view;
    useStore.getState().setView({ ...view, x: view.x + dx, y: view.y + dy });
    // What is under the pointer changed although the pointer did not move.
    if (!raf) raf = requestAnimationFrame(update);
  };
  scrollRaf = requestAnimationFrame(autoScroll);
  const fromDoc = from?.contentDocument ?? null;
  const toScreen = (e: PointerEvent) => {
    // Events from inside the frame carry frame coordinates.
    if (!from || e.view === window) return { x: e.clientX, y: e.clientY };
    const r = from.getBoundingClientRect();
    const k = frameScale(from);
    return { x: r.left + e.clientX * k, y: r.top + e.clientY * k };
  };
  const onMove = (e: PointerEvent) => {
    latest = toScreen(e);
    placeGhost(latest.x, latest.y);
    if (!raf) raf = requestAnimationFrame(update);
  };

  let done = false;
  const targets: (Window | Document)[] = fromDoc ? [window, fromDoc] : [window];
  const finish = (commit: boolean) => {
    if (done) return;
    done = true;
    for (const t of targets) {
      t.removeEventListener('pointermove', onMove as EventListener);
      t.removeEventListener('pointerup', onUp);
      t.removeEventListener('pointercancel', onCancel);
      t.removeEventListener('keydown', onKey as EventListener, true);
    }
    window.removeEventListener('blur', onCancel);
    cancelAnimationFrame(raf);
    cancelAnimationFrame(scrollRaf);
    document.body.classList.remove('is-dragging');
    justDragged = true;
    setTimeout(() => (justDragged = false), 0);

    const s = useStore.getState();
    if (payload.kind === 'template') {
      const hit = commit ? frameAtPoint(s.doc, latest.x, latest.y) : null;
      const overCanvas = commit && isOverCanvas(latest.x, latest.y);
      s.setDrag(null);
      const ref = { source: payload.source, templateId: payload.templateId };
      if (hit) templateOnFrame(ref, hit.frame.id);
      else if (overCanvas) templateAsNewFrame(ref, screenToWorld(latest.x, latest.y));
      return;
    }
    // Recalculate at the release position so the drop matches what the pointer is over.
    const target = commit ? computeDropTarget(payload, s.doc, latest.x, latest.y) : null;
    s.setDrag(null);
    if (!target) {
      // Released over a frame of another kit: say why nothing happened.
      const over = commit ? frameAtPoint(s.doc, latest.x, latest.y) : null;
      if (
        over &&
        isFreeFrame(over.frame) &&
        payload.kind !== 'new-component' &&
        payload.kind !== 'saved'
      )
        s.setNotice(FREE_NO_LAYOUT);
      else if (
        over &&
        (payload.kind === 'new-component' ||
          payload.kind === 'new-layout' ||
          payload.kind === 'saved')
      )
        s.setNotice(kitMismatchMessage(over.frame.kitId));
      return;
    }
    if (payload.kind === 'move') s.moveNode(payload.nodeId, target);
    else s.dropNew(payload, target);
  };
  const onUp = (e?: Event) => {
    // The pointer may be released over the frame: use its last position.
    if (e instanceof PointerEvent) latest = toScreen(e);
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
    t.addEventListener('pointerup', onUp);
    t.addEventListener('pointercancel', onCancel);
    t.addEventListener('keydown', onKey as EventListener, true);
  }
  window.addEventListener('blur', onCancel);
  update();
}

/**
 * Press-and-drag for something outside a frame (a library tile). A press that doesn't move is
 * left alone, so the tile's own click still works.
 */
export function beginPendingDrag(e: React.PointerEvent, payload: DragPayload) {
  if (e.button !== 0) return;
  const origin = { x: e.clientX, y: e.clientY };
  const move = (ev: PointerEvent) => {
    if (Math.hypot(ev.clientX - origin.x, ev.clientY - origin.y) < DRAG_THRESHOLD) return;
    stop();
    startDrag(payload, ev);
  };
  const stop = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
    window.removeEventListener('pointercancel', stop);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', stop);
  window.addEventListener('pointercancel', stop);
}
