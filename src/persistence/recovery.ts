import type { MockupDoc } from '../store/types';
import { FileError, validateDoc } from './schema';

/**
 * A last-moment copy of the open mockup, written synchronously when the page is being left while a
 * save is still waiting, because storage written asynchronously may not finish before a reload. It
 * is a backup for small mockups only (browser local storage is small); the normal save is IndexedDB.
 */
const KEY = 'pagewright.recovery';
const MAX_CHARS = 1_500_000;

interface Recovery {
  id: string;
  at: number;
  json: string;
}

export function writeRecovery(doc: MockupDoc): void {
  try {
    const json = JSON.stringify(doc);
    if (json.length > MAX_CHARS) return;
    localStorage.setItem(
      KEY,
      JSON.stringify({ id: doc.id, at: Date.now(), json } satisfies Recovery),
    );
  } catch {
    /* storage is full or blocked: the normal save is all there is */
  }
}

export function clearRecovery(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** The recovery copy and when it was made, if there is a usable one. */
export function readRecovery(): { doc: MockupDoc; at: number } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as Recovery;
    return { doc: validateDoc(JSON.parse(r.json)), at: r.at };
  } catch (err) {
    if (!(err instanceof FileError) && !(err instanceof SyntaxError)) throw err;
    return null;
  }
}
