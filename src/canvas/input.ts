import { useStore } from '../store/store';
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

  doc.addEventListener(
    'click',
    (e) => {
      const store = useStore.getState();
      if (store.mode === 'edit') {
        // Edit mode: nothing in the mockup runs; clicks select.
        e.preventDefault();
        e.stopPropagation();
        store.selectFrame(frameId);
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
