import { isDraggable, isWithin } from '../layout/ops';
import { nodeLabel } from '../layout/labels';
import { useStore } from '../store/store';
import { DRAG_THRESHOLD, startDrag } from './drag';
import { handleKeyDown, handleKeyUp } from './shortcuts';

export interface ForwardedWheel {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
  metaKey: boolean;
  clientX: number;
  clientY: number;
}

interface CanvasHandlers {
  wheel: (e: ForwardedWheel) => void;
  middleDown: () => void;
}

let handlers: CanvasHandlers | null = null;
export const setCanvasHandlers = (h: CanvasHandlers | null) => {
  handlers = h;
};

/**
 * Frames are iframes, so their events never reach the editor. Wire the ones the canvas needs
 * (wheel, middle-mouse pan, keyboard) and decide what clicks mean in Edit and Preview modes.
 */
export function attachFrameInput(doc: Document, iframe: HTMLIFrameElement | null, frameId: string) {
  if (!iframe) return;
  // The iframe is scaled by the canvas zoom, so convert its inner coordinates to screen ones.
  const toScreen = (x: number, y: number) => {
    const rect = iframe.getBoundingClientRect();
    const scale = iframe.offsetWidth ? rect.width / iframe.offsetWidth : 1;
    return { x: rect.left + x * scale, y: rect.top + y * scale };
  };

  doc.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const p = toScreen(e.clientX, e.clientY);
      handlers?.wheel({
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        clientX: p.x,
        clientY: p.y,
      });
    },
    { passive: false },
  );

  doc.addEventListener('pointerdown', (e) => {
    if (e.button === 1) {
      e.preventDefault();
      handlers?.middleDown();
    }
  });

  const nodeIdAt = (target: EventTarget | null) =>
    (target as Element | null)?.closest?.('[data-node]')?.getAttribute('data-node') ?? null;

  // Edit mode: hover outlines.
  doc.addEventListener('pointermove', (e) => {
    const s = useStore.getState();
    if (s.mode !== 'edit' || s.drag) return;
    const id = nodeIdAt(e.target);
    s.setHover(id ? { frameId, nodeId: id } : null);
  });
  doc.documentElement.addEventListener('pointerleave', () => useStore.getState().setHover(null));

  // Edit mode: press selects; press and move picks the thing up.
  doc.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const s0 = useStore.getState();
    if (s0.mode !== 'edit') return;
    e.preventDefault();
    // preventDefault also stops the usual blur, so release keyboard focus from any editor input.
    (iframe.ownerDocument.activeElement as HTMLElement | null)?.blur?.();
    iframe.ownerDocument.defaultView?.focus();
    const id = nodeIdAt(e.target);
    const origin = toScreen(e.clientX, e.clientY);

    // Grabbing inside the selected item moves the selection (so a section can be dragged once picked
    // from the breadcrumb); otherwise the innermost item under the pointer moves.
    const sel = s0.selectedFrameId === frameId ? s0.selectedNodeId : null;
    const dragId = id && sel && isWithin(s0.doc, id, sel) ? sel : id;
    const node = dragId ? s0.doc.nodes[dragId] : undefined;
    const canDrag = !!node && isDraggable(node);

    let started = false;
    const cleanup = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      doc.removeEventListener('pointercancel', cleanup);
    };
    const move = (ev: PointerEvent) => {
      const p = toScreen(ev.clientX, ev.clientY);
      if (started || !canDrag || Math.hypot(p.x - origin.x, p.y - origin.y) < DRAG_THRESHOLD)
        return;
      started = true;
      cleanup();

      useStore.getState().selectNode(frameId, dragId);
      startDrag(
        { kind: 'move', nodeId: dragId!, label: nodeLabel(node) },
        { clientX: p.x, clientY: p.y },
        iframe,
      );
    };
    const up = () => {
      cleanup();
      if (!started) useStore.getState().selectNode(frameId, id);
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
    doc.addEventListener('pointercancel', cleanup);
  });

  doc.addEventListener(
    'click',
    (e) => {
      const store = useStore.getState();
      if (store.mode === 'edit') {
        // Edit mode: nothing in the mockup runs. Selection is handled on pointer down.
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Preview mode: components are live, but links must not navigate the frame away.
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (a && !a.getAttribute('href')?.startsWith('#')) e.preventDefault();
    },
    true,
  );

  doc.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
    },
    true,
  );

  doc.addEventListener('keydown', handleKeyDown);
  doc.addEventListener('keyup', handleKeyUp);
}
