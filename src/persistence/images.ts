import { get, set } from 'idb-keyval';

/**
 * Uploaded images: validated, downscaled, given a content-derived id (so the same picture used
 * twice is stored once) and mirrored into IndexedDB. The data URL also stays in the document, so
 * saved files are portable.
 */
export const MAX_IMAGE_SIDE = 1600;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export interface PreparedImage {
  id: string;
  dataUrl: string;
  name: string;
}

export class ImageError extends Error {}

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new ImageError('That file could not be read.'));
    r.readAsDataURL(blob);
  });

/** Stable id from the image bytes: `img_` plus 16 hex characters of a SHA-256 (or a simple hash if unavailable). */
export async function imageId(dataUrl: string): Promise<string> {
  try {
    const bytes = new TextEncoder().encode(dataUrl);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return `img_${[...new Uint8Array(digest)]
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  } catch {
    let h = 5381;
    for (let i = 0; i < dataUrl.length; i++) h = ((h << 5) + h + dataUrl.charCodeAt(i)) | 0;
    return `img_${(h >>> 0).toString(16).padStart(8, '0')}${dataUrl.length.toString(16)}`;
  }
}

/** Scale `w`×`h` down so the longest side is at most `max`. Never scales up. */
export function fitWithin(
  w: number,
  h: number,
  max = MAX_IMAGE_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/'))
    throw new ImageError('Choose an image file (PNG, JPEG, GIF, WebP or SVG).');
  if (file.size > MAX_IMAGE_BYTES) throw new ImageError('That image is larger than 15 MB.');

  let dataUrl: string;
  if (file.type === 'image/svg+xml') {
    dataUrl = await readAsDataUrl(file);
  } else {
    const bitmap = await createImageBitmap(file).catch(() => {
      throw new ImageError('That image could not be opened.');
    });
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    if (width === bitmap.width && height === bitmap.height && file.type !== 'image/webp') {
      dataUrl = await readAsDataUrl(file);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
      const jpeg = file.type === 'image/jpeg';
      dataUrl = canvas.toDataURL(jpeg ? 'image/jpeg' : 'image/png', 0.85);
    }
    bitmap.close();
  }

  const id = await imageId(dataUrl);
  try {
    if ((await get<string>(`image:${id}`)) === undefined) await set(`image:${id}`, dataUrl);
  } catch {
    /* storage unavailable: the image still lives in the document */
  }
  return { id, dataUrl, name: file.name };
}
