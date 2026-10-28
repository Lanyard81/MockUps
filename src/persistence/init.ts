import { useSavedComponents } from '../store/savedComponents';
import { useStore } from '../store/store';
import { useTemplates } from '../store/templates';
import { startAutosave } from './autosave';
import { lastMockupId, listMockups, loadMockup, saveMockup } from './library';
import { clearRecovery, readRecovery } from './recovery';
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
    // The page was left while a save was waiting: a copy written at that moment may be newer.
    const recovery = readRecovery();
    if (recovery) {
      const meta = (await listMockups()).find((m) => m.id === recovery.doc.id);
      if (!meta || recovery.at > meta.updatedAt) {
        s.loadDoc(recovery.doc);
        await saveMockup(recovery.doc);
        s.setNotice('Restored your last changes from just before the page closed.');
      }
      clearRecovery();
    }
    await useTemplates.getState().load();
    await useSavedComponents.getState().load();
  }
  startAutosave();
  // Tests (and anything else that must not edit before saving is running) can wait for this.
  document.documentElement.dataset.persistence = 'ready';
}
