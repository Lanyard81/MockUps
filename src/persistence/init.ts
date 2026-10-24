import { useSavedComponents } from '../store/savedComponents';
import { useStore } from '../store/store';
import { useTemplates } from '../store/templates';
import { startAutosave } from './autosave';
import { lastMockupId, loadMockup } from './library';
import { probeStorage } from './storage';

/** Check storage, reopen the last mockup and the saved templates, then start autosaving. */
export async function initPersistence(): Promise<void> {
  const ok = await probeStorage();
  const s = useStore.getState();
  s.setStorageOk(ok);
  if (ok) {
    const id = await lastMockupId();
    const doc = id ? await loadMockup(id) : null;
    if (doc) s.loadDoc(doc);
    await useTemplates.getState().load();
    await useSavedComponents.getState().load();
  }
  startAutosave();
}
