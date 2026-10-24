import { newId } from '../lib/ids';
import type { MockupDoc } from '../store/types';
import { FileError, validateDoc } from './schema';
import { deleteAllVersions } from './versions';
import { safeDel, safeGet, safeSet } from './storage';

/** The user's saved mockups: one record per mockup plus a small index for the list. */
export interface MockupMeta {
  id: string;
  name: string;
  updatedAt: number;
  frames: number;
  thumbnail?: string;
}

const INDEX = 'mockups';
const LAST = 'lastMockup';
const docKey = (id: string) => `mockup:${id}`;

export async function listMockups(): Promise<MockupMeta[]> {
  const index = (await safeGet<MockupMeta[]>(INDEX)) ?? [];
  return [...index].sort((a, b) => b.updatedAt - a.updatedAt);
}

async function writeIndex(update: (list: MockupMeta[]) => MockupMeta[]): Promise<boolean> {
  const list = (await safeGet<MockupMeta[]>(INDEX)) ?? [];
  return safeSet(INDEX, update(list));
}

/** Save a mockup (and note it as the one to reopen next time). Resolves false if storage refused. */
export async function saveMockup(doc: MockupDoc, thumbnail?: string): Promise<boolean> {
  const ok = await safeSet(docKey(doc.id), doc);
  if (!ok) return false;
  await writeIndex((list) => {
    const prev = list.find((m) => m.id === doc.id);
    const meta: MockupMeta = {
      id: doc.id,
      name: doc.name,
      updatedAt: Date.now(),
      frames: doc.frames.length,
      thumbnail: thumbnail ?? prev?.thumbnail,
    };
    return [meta, ...list.filter((m) => m.id !== doc.id)];
  });
  return safeSet(LAST, doc.id);
}

/** Load a stored mockup. Stored data is validated like a file, because it could be old or damaged. */
export async function loadMockup(id: string): Promise<MockupDoc | null> {
  const raw = await safeGet<unknown>(docKey(id));
  if (!raw) return null;
  try {
    return validateDoc(raw);
  } catch (err) {
    if (err instanceof FileError) return null;
    throw err;
  }
}

export const lastMockupId = () => safeGet<string>(LAST);
export const rememberLastMockup = (id: string) => safeSet(LAST, id);

/** Store a refreshed thumbnail without touching the document or its "last saved" time. */
export async function setMockupThumbnail(id: string, thumbnail: string): Promise<void> {
  await writeIndex((list) => list.map((m) => (m.id === id ? { ...m, thumbnail } : m)));
}

export async function deleteMockup(id: string): Promise<void> {
  await safeDel(docKey(id));
  await deleteAllVersions(id);
  await writeIndex((list) => list.filter((m) => m.id !== id));
  if ((await safeGet<string>(LAST)) === id) await safeDel(LAST);
}

export async function renameMockup(id: string, name: string): Promise<void> {
  const doc = await loadMockup(id);
  if (!doc) return;
  await saveMockup({ ...doc, name });
}

/** A copy under a new id, named "… copy". Returns the new doc. */
export async function duplicateMockup(id: string): Promise<MockupDoc | null> {
  const doc = await loadMockup(id);
  if (!doc) return null;
  const copy: MockupDoc = { ...doc, id: newId('doc'), name: `${doc.name} copy` };
  const meta = (await safeGet<MockupMeta[]>(INDEX))?.find((m) => m.id === id);
  await saveMockup(copy, meta?.thumbnail);
  // Saving marks it as the one to reopen; keep the original instead.
  await rememberLastMockup(id);
  return copy;
}
