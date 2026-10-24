import { newId } from '../lib/ids';
import type { MockupDoc } from '../store/types';
import { validateDoc } from './schema';
import { safeDel, safeGet, safeSet } from './storage';

/**
 * Named snapshots of a mockup (Milestone G7): "v2 for review". They are kept per mockup in browser
 * storage, apart from the mockup itself, so they cost nothing in the file and survive undo history.
 */
export interface Version {
  id: string;
  name: string;
  createdAt: number;
  /** The whole mockup as it was (images included). */
  doc: MockupDoc;
}

/** Newest first; the oldest are dropped past this many. */
export const MAX_VERSIONS = 30;
const key = (docId: string) => `versions:${docId}`;

export async function listVersions(docId: string): Promise<Version[]> {
  const raw = await safeGet<unknown[]>(key(docId));
  if (!Array.isArray(raw)) return [];
  const out: Version[] = [];
  for (const r of raw) {
    try {
      const v = r as Partial<Version>;
      if (typeof v.id !== 'string' || typeof v.name !== 'string') continue;
      out.push({
        id: v.id,
        name: v.name.slice(0, 200),
        createdAt: typeof v.createdAt === 'number' ? v.createdAt : 0,
        doc: validateDoc(v.doc),
      });
    } catch {
      /* skip a damaged snapshot */
    }
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

/** Keep a snapshot of the mockup under a name. Resolves false if storage refused. */
export async function saveVersion(doc: MockupDoc, name: string): Promise<Version | null> {
  const label = name.trim().slice(0, 200);
  if (!label) return null;
  const version: Version = {
    id: newId('ver'),
    name: label,
    createdAt: Date.now(),
    doc: structuredClone(doc),
  };
  const next = [version, ...(await listVersions(doc.id))].slice(0, MAX_VERSIONS);
  return (await safeSet(key(doc.id), next)) ? version : null;
}

export async function deleteVersion(docId: string, id: string): Promise<void> {
  const rest = (await listVersions(docId)).filter((v) => v.id !== id);
  if (rest.length) await safeSet(key(docId), rest);
  else await safeDel(key(docId));
}

/** Remove every snapshot of a mockup (when the mockup itself is deleted). */
export const deleteAllVersions = (docId: string): Promise<boolean> => safeDel(key(docId));
