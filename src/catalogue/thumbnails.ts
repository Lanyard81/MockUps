import { toPng } from 'html-to-image';
import { get, set } from 'idb-keyval';
import { DEFAULT_KIT_ID, getKit } from '../kits';
import type { KitId } from '../kits/types';
import { getFontEmbedCss } from '../lib/fontData';
import type { CatalogueVariant } from './types';

/**
 * Library thumbnails: each variant is rendered once in a hidden frame (same shell as the real
 * frames, so it uses the real NSW CSS), turned into an image, then cached in memory and in
 * IndexedDB. Requests are queued so only one render runs at a time.
 */

const memory = new Map<string, string>();
const hosts = new Map<KitId, Promise<HTMLIFrameElement>>();
let queue: Promise<unknown> = Promise.resolve();

const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

/** A hidden frame per kit, using that kit's own shell, so thumbnails use the kit's real CSS. */
function getHost(kitId: KitId): Promise<HTMLIFrameElement> {
  const existing = hosts.get(kitId);
  if (existing) return existing;
  const promise = new Promise<HTMLIFrameElement>((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Thumbnail renderer';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;left:-10000px;top:0;width:360px;height:900px;border:0;visibility:hidden;pointer-events:none';
    iframe.addEventListener('load', () => resolve(iframe), { once: true });
    iframe.srcdoc = getKit(kitId).shell.document;
    document.body.appendChild(iframe);
  });
  hosts.set(kitId, promise);
  return promise;
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

async function render(variant: CatalogueVariant, wide: boolean, kitId: KitId): Promise<string> {
  const host = await getHost(kitId);
  const doc = host.contentDocument!;
  host.style.width = wide ? '1100px' : '360px';
  const kit = getKit(kitId);
  const inner =
    variant.previewBg && kit.previewOnDark ? kit.previewOnDark(variant.html) : variant.html;
  const root = doc.getElementById('root')!;
  root.innerHTML = `<div id="thumb" style="background:#fff;padding:${variant.previewBg || wide ? 0 : 12}px">${inner}</div>`;
  await doc.fonts.ready;
  await nextFrame();
  await nextFrame();
  const el = doc.getElementById('thumb')!;
  return toPng(el, {
    pixelRatio: 1,
    backgroundColor: '#ffffff',
    fontEmbedCSS: await getFontEmbedCss(kitId),
    width: el.offsetWidth,
    height: el.offsetHeight,
  });
}

/** Resolves to an image data URL, or null if the thumbnail couldn't be made. */
export function getThumbnail(
  componentId: string,
  variant: CatalogueVariant,
  wide: boolean,
  kitId: KitId = DEFAULT_KIT_ID,
): Promise<string | null> {
  const key = `thumb:${componentId}/${variant.id}:${wide ? 'w' : 'n'}:${hash(variant.html)}`;
  const hit = memory.get(key);
  if (hit) return Promise.resolve(hit);

  const job = queue.then(async () => {
    const again = memory.get(key);
    if (again) return again;
    try {
      const stored = await get<string>(key);
      if (stored) {
        memory.set(key, stored);
        return stored;
      }
    } catch {
      /* storage unavailable: render instead */
    }
    try {
      const url = await render(variant, wide, kitId);
      memory.set(key, url);
      try {
        await set(key, url);
      } catch {
        /* storage unavailable: keep the in-memory copy */
      }
      return url;
    } catch (err) {
      console.warn('Thumbnail failed', key, err);
      return null;
    }
  });
  queue = job.catch(() => undefined);
  return job;
}

const htmlMemory = new Map<string, string>();

/**
 * A thumbnail of a whole page (a template), rendered at `width` px wide in the hidden frame, cropped
 * to `maxHeight`, and cached by `key` (which should change when the markup does).
 */
export function getPageThumbnail(
  key: string,
  html: string,
  width: number,
  maxHeight = 900,
  kitId: KitId = DEFAULT_KIT_ID,
): Promise<string | null> {
  const full = `page:${key}:${width}:${hash(html)}`;
  const hit = htmlMemory.get(full);
  if (hit) return Promise.resolve(hit);

  const job = queue.then(async () => {
    const again = htmlMemory.get(full);
    if (again) return again;
    try {
      const stored = await get<string>(full);
      if (stored) {
        htmlMemory.set(full, stored);
        return stored;
      }
    } catch {
      /* storage unavailable: render instead */
    }
    try {
      const host = await getHost(kitId);
      const doc = host.contentDocument!;
      host.style.width = `${width}px`;
      doc.getElementById('root')!.innerHTML =
        `<div id="thumb" style="background:#fff">${html}</div>`;
      await doc.fonts.ready;
      await nextFrame();
      await nextFrame();
      const el = doc.getElementById('thumb')!;
      const url = await toPng(el, {
        pixelRatio: Math.min(1, 640 / width),
        backgroundColor: '#ffffff',
        fontEmbedCSS: await getFontEmbedCss(kitId),
        width: el.offsetWidth,
        height: Math.min(el.offsetHeight, maxHeight),
      });
      htmlMemory.set(full, url);
      try {
        await set(full, url);
      } catch {
        /* keep the in-memory copy */
      }
      return url;
    } catch (err) {
      console.warn('Page thumbnail failed', key, err);
      return null;
    }
  });
  queue = job.catch(() => undefined);
  return job;
}
