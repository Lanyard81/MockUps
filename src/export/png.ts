import { toBlob, toPng } from 'html-to-image';
import { getFrameElement } from '../canvas/registry';
import { getFontEmbedCss } from '../lib/fontData';
import { useStore } from '../store/store';
import { DEVICES } from '../store/types';

const MAX_SIDE = 16000;
const MAX_PIXELS = 120_000_000;

export class ExportError extends Error {}

/**
 * Render one frame, full height, as a PNG. It captures the live frame (so it matches what is on the
 * canvas, including "shrink to fit"), with the editor's hints switched off for the moment.
 */
export async function renderFramePng(frameId: string, scale: 1 | 2): Promise<Blob> {
  const { doc, frameHeights } = useStore.getState();
  const frame = doc.frames.find((f) => f.id === frameId);
  const iframe = getFrameElement(frameId);
  const idoc = iframe?.contentDocument;
  const root = idoc?.getElementById('root');
  if (!frame || !idoc || !root) throw new ExportError('That frame isn’t ready yet.');

  const height = Math.ceil(
    Math.max(frameHeights[frameId] ?? 0, root.offsetHeight, DEVICES[frame.device].screenHeight),
  );
  const width = frame.width;
  if (
    width * scale > MAX_SIDE ||
    height * scale > MAX_SIDE ||
    width * height * scale * scale > MAX_PIXELS
  ) {
    throw new ExportError(`“${frame.name}” is too big to export at ${scale}×. Try 1×.`);
  }

  const mode = idoc.body.dataset.mode;
  idoc.body.dataset.mode = 'export'; // no dashed hints for empty blocks, no edit cursors
  try {
    await idoc.fonts.ready;
    const blob = await toBlob(root, {
      pixelRatio: scale,
      width,
      height,
      backgroundColor: '#ffffff',
      fontEmbedCSS: await getFontEmbedCss(frame.kitId),
    });
    if (!blob) throw new ExportError(`“${frame.name}” could not be rendered.`);
    return blob;
  } finally {
    if (mode === undefined) delete idoc.body.dataset.mode;
    else idoc.body.dataset.mode = mode;
  }
}

/** A small PNG of a frame's top, for lists (My mockups, My templates). Null if it can't be made. */
export async function renderThumbnail(frameId: string, targetWidth = 240): Promise<string | null> {
  const { doc } = useStore.getState();
  const frame = doc.frames.find((f) => f.id === frameId);
  const idoc = getFrameElement(frameId)?.contentDocument;
  const root = idoc?.getElementById('root');
  if (!frame || !idoc || !root || root.offsetHeight < 4) return null;
  const mode = idoc.body.dataset.mode;
  idoc.body.dataset.mode = 'export';
  try {
    const url = await toPng(root, {
      pixelRatio: targetWidth / frame.width,
      width: frame.width,
      height: Math.min(Math.ceil(root.offsetHeight), Math.round(frame.width * 1.1)),
      backgroundColor: '#ffffff',
      fontEmbedCSS: await getFontEmbedCss(frame.kitId),
    });
    return url;
  } catch {
    return null;
  } finally {
    if (mode === undefined) delete idoc.body.dataset.mode;
    else idoc.body.dataset.mode = mode;
  }
}
