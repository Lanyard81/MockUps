import { downloadBlob, slug } from '../export/download';
import { newId } from '../lib/ids';
import { useStore } from '../store/store';
import { useTemplates } from '../store/templates';
import { KITS } from '../kits';
import { looksLikePageSpec } from '../pagespec';
import { FileError, parseMockupFile, serialiseMockupFile } from './schema';

/** Save the open mockup (images embedded) and the user's templates as one portable file. */
export function saveToFile() {
  const { doc } = useStore.getState();
  const text = serialiseMockupFile(doc, useTemplates.getState().templates);
  downloadBlob(text, `${slug(doc.name)}.mockup.json`, 'application/json');
  useStore.getState().setNotice(`Saved ${slug(doc.name)}.mockup.json to your downloads.`);
}

/**
 * Open a `.mockup.json`. It becomes a new mockup (a fresh id), so opening a file never overwrites
 * something already saved in the browser. Problems are reported in words, never thrown at the user.
 */
export async function openMockupFile(file: File): Promise<boolean> {
  const s = useStore.getState();
  try {
    const text = await file.text();
    // A page spec (.page.json) isn't a mockup: it becomes new frames in the current one.
    if (looksLikePageSpec(text)) return s.importPageSpecText(text);
    const { doc, templates } = parseMockupFile(text);
    s.loadDoc({ ...doc, id: newId('doc') });
    const added = useTemplates.getState().merge(templates);
    s.setNotice(
      `Opened “${doc.name}”${added ? ` and added ${added} template${added > 1 ? 's' : ''}` : ''}.`,
    );
    return true;
  } catch (err) {
    s.setNotice(err instanceof FileError ? err.message : 'That file could not be opened.');
    return false;
  }
}

/** Ask for a file with the browser's file picker. */
export function pickMockupFile(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.mockup.json,application/json';
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void openMockupFile(file);
  });
  input.click();
}

/** Open one of the built-in sample mockups as a new mockup (the same path as opening a file). */
export function loadSample(id: string): void {
  const def = KITS.flatMap((k) => k.samples).find((d) => d.id === id);
  if (!def) return;
  const s = useStore.getState();
  const { doc } = parseMockupFile(serialiseMockupFile(def.build()));
  s.loadDoc({ ...doc, id: newId('doc') });
  s.setNotice(`Opened the “${def.name}” sample. Switch to Preview to click through it.`);
}
