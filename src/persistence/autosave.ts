import { renderThumbnail } from '../export/png';
import { useStore } from '../store/store';
import { loadMockup, saveMockup, setMockupThumbnail } from './library';
import { clearRecovery, writeRecovery } from './recovery';
import { announceSave, listenForOtherSaves } from './tabs';

const SAVE_DELAY = 400;
const THUMB_DELAY = 2500;

/**
 * Keep the open mockup saved in the browser. Changes are saved a moment after the last one (so
 * typing and dragging don't hammer storage), the camera position included. A small thumbnail for
 * "My mockups" is refreshed once things have been quiet for a bit.
 */
export function startAutosave(): () => void {
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let thumbTimer: ReturnType<typeof setTimeout> | undefined;
  let last = useStore.getState().doc;
  // The newest document known to be stored. A save that has started but not finished doesn't count.
  let stored = last;

  const save = async () => {
    saveTimer = undefined;
    // Another tab saved this mockup since it was opened here: saving from here would overwrite it.
    if (useStore.getState().conflict) return;
    const { doc } = useStore.getState();
    const ok = await saveMockup(doc);
    const s = useStore.getState();
    // A change made while this save was running has its own save queued: don't say "Saved" yet.
    if (s.doc === doc || ok === false) s.setSaveState(ok ? 'saved' : 'error');
    if (ok) {
      stored = doc;
      if (s.doc === doc) clearRecovery();
      announceSave(doc.id);
    }
  };

  const refreshThumbnail = async () => {
    thumbTimer = undefined;
    const { doc } = useStore.getState();
    const first = doc.frames[0];
    if (!first) return;
    const url = await renderThumbnail(first.id);
    if (url && useStore.getState().doc.id === doc.id) await setMockupThumbnail(doc.id, url);
  };

  const unsubscribe = useStore.subscribe((state) => {
    if (state.doc === last) return;
    const prev = last;
    last = state.doc;
    // Switching to another mockup (opening a file, New mockup) while a save was waiting: save the one
    // being left first, so its last changes aren't dropped.
    if (prev.id !== state.doc.id && saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
      void saveMockup(prev);
    }
    state.setSaveState('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, SAVE_DELAY);
    const contentChanged =
      prev.id !== state.doc.id ||
      prev.nodes !== state.doc.nodes ||
      prev.frames !== state.doc.frames ||
      prev.images !== state.doc.images;
    if (contentChanged) {
      clearTimeout(thumbTimer);
      thumbTimer = setTimeout(refreshThumbnail, THUMB_DELAY);
    }
  });

  // Leaving the page (a reload, closing the tab, switching away): save now rather than waiting for the
  // timer, and keep a synchronous copy in case the storage write doesn't finish in time.
  const flush = () => {
    // Also when the timer has fired but its write hasn't finished: a reload can cut that write short.
    if (useStore.getState().conflict || useStore.getState().doc === stored) return;
    clearTimeout(saveTimer);
    writeRecovery(useStore.getState().doc);
    void save();
  };
  const flushIfHidden = () => document.visibilityState === 'hidden' && flush();
  document.addEventListener('visibilitychange', flushIfHidden);
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);

  // Another tab saved the same mockup.
  const stopListening = listenForOtherSaves((docId) => {
    if (docId === useStore.getState().doc.id) useStore.getState().setConflict(true);
  });

  return () => {
    unsubscribe();
    stopListening();
    document.removeEventListener('visibilitychange', flushIfHidden);
    window.removeEventListener('pagehide', flush);
    window.removeEventListener('beforeunload', flush);
    clearTimeout(saveTimer);
    clearTimeout(thumbTimer);
  };
}

export { loadMockup };
