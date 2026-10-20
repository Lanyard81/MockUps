import { ImageError, prepareImage } from '../persistence/images';
import { useStore } from '../store/store';

/** Use an image file for a component's image slot, reporting problems to the user. */
export async function setImageFromFile(nodeId: string, key: string, file: File): Promise<void> {
  try {
    const image = await prepareImage(file);
    useStore.getState().setImage(nodeId, key, image);
  } catch (err) {
    useStore
      .getState()
      .setNotice(err instanceof ImageError ? err.message : 'That image could not be used.');
  }
}

/** Use an image file for a frame setting (a header picture or logo), reporting problems to the user. */
export async function setFrameImageFromFile(
  frameId: string,
  key: string,
  file: File,
): Promise<void> {
  try {
    const image = await prepareImage(file);
    useStore.getState().setFrameImage(frameId, key, image);
  } catch (err) {
    useStore
      .getState()
      .setNotice(err instanceof ImageError ? err.message : 'That image could not be used.');
  }
}
