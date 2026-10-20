import { useStore } from '../store/store';
import { zoomAt, type View } from '../lib/geometry';
import { startFirstTextEdit } from './textEdit';

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
  if (e.key === '?' && !mod) {
    e.preventDefault();
    s.setHelpOpen(!s.helpOpen);
    return;
  }
  if (mod && e.shiftKey && key === 'r' && s.selectedFrameId) {
    // Show or hide the selected frame's reference image.
    const reference = s.doc.frames.find((f) => f.id === s.selectedFrameId)?.reference;
    e.preventDefault();
    if (reference) s.updateFrameReference(s.selectedFrameId, { visible: !reference.visible });
    return;
  }
  if (mod && key === 'z') {
    e.preventDefault();
    if (e.shiftKey) s.redo();
    else s.undo();
  } else if (mod && key === 'y') {
    e.preventDefault();
    s.redo();
  } else if (mod && key === 'd' && (s.selectedNodeId || s.selectedFrameId)) {
    e.preventDefault();
    if (s.selectedNodeId) s.duplicateNode(s.selectedNodeId);
    else if (s.selectedFrameId) s.duplicateFrame(s.selectedFrameId);
  } else if (mod && key === 'c' && s.selectedNodeId) {
    e.preventDefault();
    s.copyNode(s.selectedNodeId);
  } else if (mod && key === 'v' && s.clipboard) {
    e.preventDefault();
    s.pasteClipboard();
  } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && s.selectedNodeId) {
    e.preventDefault();
    s.moveSelected(e.key === 'ArrowUp' ? -1 : 1);
  } else if (mod && (key === '=' || key === '+')) {
    e.preventDefault();
    s.setView(zoomStep(s.doc.view, 1.25, s.viewport));
  } else if (mod && key === '-') {
    e.preventDefault();
    s.setView(zoomStep(s.doc.view, 0.8, s.viewport));
  } else if (mod && key === '0') {
    e.preventDefault();
    s.zoomToFit();
  } else if ((key === 'delete' || key === 'backspace') && (s.selectedNodeId || s.selectedFrameId)) {
    e.preventDefault();
    if (s.selectedNodeId) s.deleteNode(s.selectedNodeId);
    else if (s.selectedFrameId) s.deleteFrame(s.selectedFrameId);
  } else if (
    (key === 'enter' || key === 'f2') &&
    s.selectedFrameId &&
    s.selectedNodeId &&
    s.mode === 'edit'
  ) {
    if (startFirstTextEdit(s.selectedFrameId, s.selectedNodeId)) e.preventDefault();
  } else if (key === 'escape') {
    s.selectParent();
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
