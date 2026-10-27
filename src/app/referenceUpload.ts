import { ImageError, prepareReference } from '../persistence/images';
import { suggestFrameWidth } from '../lib/reference';
import { useStore } from '../store/store';

/** True for a pasted or dropped file we can use as a screenshot. */
export const isReferenceFile = (f: File) =>
  f.type.startsWith('image/') && f.type !== 'image/svg+xml';

/**
 * Put an image file on a frame as its reference layer, and offer to match the frame to the
 * screenshot's width (a 2× screenshot is halved first). Problems are reported to the user.
 */
export async function addReferenceFromFile(frameId: string, file: File): Promise<void> {
  try {
    const image = await prepareReference(file);
    const st = useStore.getState();
    const frame = st.doc.frames.find((f) => f.id === frameId);
    if (!frame) return;
    const suggested = suggestFrameWidth(image.originalWidth);
    st.setFrameReference(frameId, image, suggested.pixelRatio / image.storedScale);
    if (suggested.width === frame.width) return;
    const label = suggested.device === 'custom' ? '' : ` (${suggested.device})`;
    st.requestConfirm({
      title: 'Match the page to the screenshot?',
      body: `The screenshot is ${image.originalWidth}px wide${
        suggested.pixelRatio === 2 ? ', which looks like a 2× capture' : ''
      }. Set this frame’s width to ${suggested.width}px${label}? It is now ${frame.width}px.`,
      confirmLabel: `Set width to ${suggested.width}px`,
      onConfirm: () => {
        const s = useStore.getState();
        if (suggested.device === 'custom') s.setFrameWidth(frameId, suggested.width);
        else s.setFrameDevice(frameId, suggested.device);
      },
    });
  } catch (err) {
    useStore
      .getState()
      .setNotice(err instanceof ImageError ? err.message : 'That image could not be used.');
  }
}
