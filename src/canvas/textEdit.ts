import { readElementText, setElementText } from '../layout/component';
import { useStore } from '../store/store';
import { getFrameElement } from './registry';

/**
 * In-place text editing inside a frame. One session edits one `data-edit` region:
 *
 * - Enter commits. Shift+Enter adds a line break, but only where the region allows several lines.
 * - Esc cancels. Tab commits and moves to the next text region in the same component.
 * - Paste is plain text only. Leaving the region (blur) commits.
 *
 * The document is not touched until the session ends, and then by a single `setText`, so a whole
 * session is one undo step. (Browser undo works inside the field while typing.)
 */

const textEl = (doc: Document, nodeId: string, key: string) =>
  doc.querySelector<HTMLElement>(`[data-node="${nodeId}"] [data-edit="${key}"]`);

/** Value typed by the user, normalised for storage. */
function readValue(el: HTMLElement, multiline: boolean): string {
  const raw = el.innerText ?? readElementText(el);
  return multiline
    ? raw.replace(/\r/g, '').replace(/\n+$/, '')
    : raw.replace(/\s*\n+\s*/g, ' ').trim();
}

let active: { finish: (commit: boolean) => void } | null = null;

/** End any session in progress (committing it). */
export function endTextEdit() {
  active?.finish(true);
}

export function startTextEdit(frameId: string, nodeId: string, key: string): boolean {
  endTextEdit();
  const iframe = getFrameElement(frameId);
  const doc = iframe?.contentDocument;
  const el = doc ? textEl(doc, nodeId, key) : null;
  if (!doc || !el) return false;

  const multiline = el.hasAttribute('data-multiline');
  const original = readElementText(el);
  const store = useStore.getState();
  store.selectNode(frameId, nodeId);
  store.setEditing({ frameId, nodeId, key });

  el.contentEditable = 'plaintext-only';
  if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
  el.setAttribute('data-editing', '');
  if (multiline) el.style.whiteSpace = 'pre-wrap';
  el.focus();
  const range = doc.createRange();
  range.selectNodeContents(el);
  const sel = doc.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);

  let finished = false;
  const finish = (commit: boolean): string | null => {
    if (finished) return null;
    finished = true;
    active = null;
    el.removeEventListener('keydown', onKey);
    el.removeEventListener('keyup', onKeyUp);
    el.removeEventListener('paste', onPaste);
    el.removeEventListener('blur', onBlur);
    const value = commit ? readValue(el, multiline) : original;
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-editing');
    el.style.whiteSpace = '';
    // Put the DOM back as it was; a changed value re-renders the frame from the document anyway.
    setElementText(el, original);
    useStore.getState().setEditing(null);
    // An emptied field would leave a region nobody can click, so it counts as a cancel.
    if (commit && value !== '' && value !== original) {
      useStore.getState().setText(nodeId, key, value);
      return value;
    }
    return null;
  };
  active = { finish };

  const moveTo = (dir: 1 | -1, changed: boolean) => {
    const host = doc.querySelector(`[data-node="${nodeId}"]`);
    const all = host ? Array.from(host.querySelectorAll<HTMLElement>('[data-edit]')) : [];
    const keys = all.map((e) => e.getAttribute('data-edit')!);
    const next = keys[keys.indexOf(key) + dir];
    if (!next) return;
    // After a change the frame re-renders from the document; wait for that before starting again.
    const go = () => startTextEdit(frameId, nodeId, next);
    if (changed) requestAnimationFrame(() => requestAnimationFrame(go));
    else go();
  };

  function onKey(e: KeyboardEvent) {
    // Keys typed into the field are never canvas shortcuts. (Enter committing must not bubble on to
    // the "Enter starts editing" shortcut, which would reopen the field.)
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        if (multiline) doc!.execCommand('insertText', false, '\n');
        return;
      }
      finish(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const changed = finish(true) !== null;
      moveTo(e.shiftKey ? -1 : 1, changed);
    }
  }
  // Space activates buttons and summaries on key release: keep that from toggling the component.
  function onKeyUp(e: KeyboardEvent) {
    if (e.key === ' ') e.preventDefault();
  }
  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    let text = e.clipboardData?.getData('text/plain') ?? '';
    if (!multiline) text = text.replace(/\s*\n+\s*/g, ' ');
    doc!.execCommand('insertText', false, text);
  }
  function onBlur() {
    finish(true);
  }

  el.addEventListener('keydown', onKey);
  el.addEventListener('keyup', onKeyUp);
  el.addEventListener('paste', onPaste);
  el.addEventListener('blur', onBlur);
  return true;
}

/** Start editing the first text region of a component (Enter or F2 on a selection). */
export function startFirstTextEdit(frameId: string, nodeId: string): boolean {
  const doc = getFrameElement(frameId)?.contentDocument;
  const first = doc
    ?.querySelector(`[data-node="${nodeId}"] [data-edit]`)
    ?.getAttribute('data-edit');
  return first ? startTextEdit(frameId, nodeId, first) : false;
}
