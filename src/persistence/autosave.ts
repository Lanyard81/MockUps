import { renderThumbnail } from '../export/png';
import { useStore } from '../store/store';
import { loadMockup, saveMockup, setMockupThumbnail } from './library';

const SAVE_DELAY = 700;
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

  const save = async () => {
    saveTimer = undefined;
    const { doc } = useStore.getState();
    const ok = await saveMockup(doc);
    const s = useStore.getState();
    s.setSaveState(ok ? 'saved' : 'error');
    if (!ok) s.setStorageOk(false);
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

  // Leaving the page: save now rather than waiting for the timer.
  const flush = () => {
    if (document.visibilityState === 'hidden' && saveTimer) {
      clearTimeout(saveTimer);
      void save();
    }
  };
  document.addEventListener('visibilitychange', flush);

  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', flush);
    clearTimeout(saveTimer);
    clearTimeout(thumbTimer);
  };
}

export { loadMockup };
