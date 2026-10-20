import { FONT_FACES, fontCss } from '../canvas/nswAssets';

let promise: Promise<string> | null = null;

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
export function getFontEmbedCss(): Promise<string> {
  promise ??= (async () => {
    const dataUrls = new Map<string, string>();
    await Promise.all(
      FONT_FACES.map(async (f) => {
        dataUrls.set(
          f.url,
          f.url.startsWith('data:') ? f.url : await toDataUrl(await (await fetch(f.url)).blob()),
        );
      }),
    );
    return fontCss((u) => dataUrls.get(u) ?? u);
  })().catch((err) => {
    promise = null; // let a later attempt try again
    throw err;
  });
  return promise;
}
