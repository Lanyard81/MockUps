import { getKit } from '../kits';
import type { KitId } from '../kits/types';

const promises = new Map<KitId, Promise<string>>();

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/**
 * The editor's fonts as `@font-face` rules with the font files inlined as data URIs, so images and
 * self-contained exports don't depend on any URL. (In the single-file build they already are data
 * URIs; on the web build they are fetched once.)
 */
export function getFontEmbedCss(kitId?: KitId): Promise<string> {
  const { shell, id } = getKit(kitId);
  const existing = promises.get(id);
  if (existing) return existing;
  const promise = (async () => {
    const dataUrls = new Map<string, string>();
    await Promise.all(
      shell.fonts.map(async (f) => {
        dataUrls.set(
          f.url,
          f.url.startsWith('data:') ? f.url : await toDataUrl(await (await fetch(f.url)).blob()),
        );
      }),
    );
    return shell.fontCss((u) => dataUrls.get(u) ?? u);
  })().catch((err) => {
    promises.delete(id); // let a later attempt try again
    throw err;
  });
  promises.set(id, promise);
  return promise;
}
