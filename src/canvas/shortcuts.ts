import { useStore } from '../store/store';
import { zoomAt, type View } from '../lib/geometry';
import { startFirstTextEdit } from './textEdit';

const isTyping = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null;
  if (!el?.tagName) return false;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable;
};

/** Things that Space (or Enter) should activate rather than start a pan. */
const isActivatable = (t: EventTarget | null): boolean =>
  !!(t as HTMLElement | null)?.closest?.(
    'button, a[href], summary, [role="button"], [role="tab"], [role="menuitem"], [role="treeitem"], [role="option"], input, select, textarea',
  );

let spaceHeld = false;

export function handleKeyDown(e: KeyboardEvent) {
  // The command palette opens from anywhere, even while typing.
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const st = useStore.getState();
    st.setPaletteOpen(!st.paletteOpen);
    return;
  }
  if (isTyping(e.target)) return;
  const s = useStore.getState();
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key.toLowerCase();

  if (e.code === 'Space') {
    // On a button, tab, menu item or tree row Space does its normal job (activate it).
    if (isActivatable(e.target)) return;
    e.preventDefault();
    if (!spaceHeld) {
      spaceHeld = true;
      s.setPanning(true);
    }
    return;
  }
  if ((e.key === ']' || e.key === '[') && !mod && !e.altKey) {
    // Step through every page and item in reading order: the keyboard route to anything on a page.
    e.preventDefault();
    s.selectStep(e.key === ']' ? 1 : -1);
    return;
  }
  if (key === 'h' && !mod && !e.altKey && !e.shiftKey) {
    e.preventDefault();
    s.setHandTool(!s.handTool);
    return;
  }
  if (e.key === '?' && !mod) {
    e.preventDefault();
    s.setHelpOpen(!s.helpOpen);
    return;
  }
  if (key === 'escape' && (s.commentTool || s.activeCommentId)) {
    // Put the comment tool away, or close the open note, before anything else.
    s.setCommentTool(false);
    s.setActiveComment(null);
    return;
  }
  if (mod && e.shiftKey && key === 'r' && s.selectedFrameId) {
    // Show or hide the selected frame's reference image.
    const reference = s.doc.frames.find((f) => f.id === s.selectedFrameId)?.reference;
    e.preventDefault();
    if (reference) s.updateFrameReference(s.selectedFrameId, { visible: !reference.visible });
    return;
  }
  // Arrow keys nudge the selected item on a freeform frame (Shift: 10 pixels).
  if (
    !mod &&
    !e.altKey &&
    s.mode === 'edit' &&
    s.selectedNodeId &&
    /^Arrow(Up|Down|Left|Right)$/.test(e.key)
  ) {
    const frame = s.doc.frames.find((f) => f.root.includes(s.selectedNodeId!));
    if (frame?.layout === 'free') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      s.nudgeFree(
        s.selectedNodeId,
        e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,
        e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0,
      );
      return;
    }
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
  } else if (mod && key === 'x' && s.selectedNodeId) {
    e.preventDefault();
    s.copyNode(s.selectedNodeId);
    s.deleteNode(s.selectedNodeId);
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
