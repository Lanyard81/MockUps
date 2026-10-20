import { toPng } from 'html-to-image';
import { get, set } from 'idb-keyval';
import { FONT_FACES, FRAME_SHELL, fontCss } from '../canvas/nswAssets';
import type { CatalogueVariant } from './types';

/**
 * Library thumbnails: each variant is rendered once in a hidden frame (same shell as the real
 * frames, so it uses the real NSW CSS), turned into an image, then cached in memory and in
 * IndexedDB. Requests are queued so only one render runs at a time.
 */

const memory = new Map<string, string>();
let hostPromise: Promise<HTMLIFrameElement> | null = null;
let fontCssPromise: Promise<string> | null = null;
let queue: Promise<unknown> = Promise.resolve();

const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

function getHost(): Promise<HTMLIFrameElement> {
  hostPromise ??= new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Thumbnail renderer';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;left:-10000px;top:0;width:360px;height:900px;border:0;visibility:hidden;pointer-events:none';
    iframe.addEventListener('load', () => resolve(iframe), { once: true });
    iframe.srcdoc = FRAME_SHELL;
    document.body.appendChild(iframe);
  });
  return hostPromise;
}

/** Fonts as data URIs, so the image is self-contained (html-to-image can't reach frame fonts itself). */
function getFontCss(): Promise<string> {
  fontCssPromise ??= (async () => {
    const dataUrls = new Map<string, string>();
    await Promise.all(
      FONT_FACES.map(async (f) => {
        const blob = await (await fetch(f.url)).blob();
        const url = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.readAsDataURL(blob);
        });
        dataUrls.set(f.url, url);
      }),
    );
    return fontCss((u) => dataUrls.get(u) ?? u);
  })();
  return fontCssPromise;
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

async function render(variant: CatalogueVariant, wide: boolean): Promise<string> {
  const host = await getHost();
  const doc = host.contentDocument!;
  host.style.width = wide ? '1100px' : '360px';
  const inner = variant.previewBg
    ? `<div class="nsw-section nsw-section--brand-dark nsw-section--invert" style="padding:16px 12px">${variant.html}</div>`
    : variant.html;
  const root = doc.getElementById('root')!;
  root.innerHTML = `<div id="thumb" style="background:#fff;padding:${variant.previewBg || wide ? 0 : 12}px">${inner}</div>`;
  await doc.fonts.ready;
  await nextFrame();
  await nextFrame();
  const el = doc.getElementById('thumb')!;
  return toPng(el, {
    pixelRatio: 1,
    backgroundColor: '#ffffff',
    fontEmbedCSS: await getFontCss(),
    width: el.offsetWidth,
    height: el.offsetHeight,
  });
}

/** Resolves to an image data URL, or null if the thumbnail couldn't be made. */
export function getThumbnail(
  componentId: string,
  variant: CatalogueVariant,
  wide: boolean,
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
      const url = await render(variant, wide);
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
