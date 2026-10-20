import { useStore } from '../store/store';
import { zoomAt, type View } from '../lib/geometry';

const isTyping = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  if (!el?.tagName) return false;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable;
};

let spaceHeld = false;

export function handleKeyDown(e: KeyboardEvent) {
  if (isTyping(e.target)) return;
  const s = useStore.getState();
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key.toLowerCase();

  if (e.code === 'Space') {
    e.preventDefault();
    if (!spaceHeld) {
      spaceHeld = true;
      s.setPanning(true);
    }
    return;
  }
  if (mod && key === 'z') {
    e.preventDefault();
    if (e.shiftKey) s.redo();
    else s.undo();
  } else if (mod && key === 'y') {
    e.preventDefault();
    s.redo();
  } else if (mod && key === 'd' && s.selectedFrameId) {
    e.preventDefault();
    s.duplicateFrame(s.selectedFrameId);
  } else if (mod && (key === '=' || key === '+')) {
    e.preventDefault();
    s.setView(zoomStep(s.doc.view, 1.25, s.viewport));
  } else if (mod && key === '-') {
    e.preventDefault();
    s.setView(zoomStep(s.doc.view, 0.8, s.viewport));
  } else if (mod && key === '0') {
    e.preventDefault();
    s.zoomToFit();
  } else if ((key === 'delete' || key === 'backspace') && s.selectedFrameId) {
    e.preventDefault();
    s.deleteFrame(s.selectedFrameId);
  } else if (key === 'escape') {
    s.selectFrame(null);
  }
}

export function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    spaceHeld = false;
    useStore.getState().setPanning(false);
  }
}

/** Zoom about the centre of the viewport. */
export function zoomStep(view: View, factor: number, vp: { width: number; height: number }): View {
  return zoomAt(view, view.zoom * factor, vp.width / 2, vp.height / 2);
}
