/**
 * Upgrades a mockup document from an earlier version to the current one, before it is validated.
 * Each step takes the raw (untrusted) object and returns a new one; nothing here trusts its shape.
 *
 *   v1 -> v2 (style kits): frames get a `kitId` ("nsw", as every earlier frame was), the document
 *   gets `defaultKitId`, `kitVersions` (from `nswVersion`) and `kitSettings`.
 *
 *   v2 -> v3 (reference images): frames may have a `reference`. Nothing to convert; older frames
 *   simply have none.
 */
export const DOC_VERSION = 3;

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

function v1ToV2(doc: Record<string, unknown>): Record<string, unknown> {
  const { nswVersion, ...rest } = doc;
  return {
    ...rest,
    version: 2,
    defaultKitId: 'nsw',
    kitVersions: { nsw: typeof nswVersion === 'string' ? nswVersion.slice(0, 40) : '' },
    kitSettings: {},
    frames: Array.isArray(doc.frames)
      ? doc.frames.map((f) => (isObject(f) ? { ...f, kitId: 'nsw' } : f))
      : doc.frames,
  };
}

/** Bring a document up to `DOC_VERSION`. Anything that isn't an object, or has no known version, is returned as is. */
export function migrateDoc(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  let doc = raw;
  if (doc.version === 1) doc = v1ToV2(doc);
  if (doc.version === 2) doc = { ...doc, version: 3 };
  return doc;
}
