import { DEVICES, type DeviceId, type FrameReference } from '../store/types';

/** How close (as a fraction) a width must be to a device preset to count as that device. */
const PRESET_TOLERANCE = 0.05;
const PRESETS = (['iphone', 'android', 'tablet', 'desktop'] as const).map((id) => ({
  id,
  width: DEVICES[id].width,
}));

export const DEFAULT_REFERENCE: Omit<FrameReference, 'imageId' | 'pixelRatio'> = {
  opacity: 0.4,
  placement: 'over',
  fit: 'width',
  offsetX: 0,
  offsetY: 0,
  visible: true,
};

const nearestPreset = (width: number) => {
  let best = PRESETS[0]!;
  for (const p of PRESETS) if (Math.abs(p.width - width) < Math.abs(best.width - width)) best = p;
  const error = Math.abs(best.width - width) / best.width;
  return error <= PRESET_TOLERANCE ? { ...best, error } : null;
};

export interface SuggestedWidth {
  /** The frame width to offer, in CSS pixels. */
  width: number;
  /** The device preset it matches (within 5%), or 'custom'. */
  device: DeviceId;
  /** Pixels in the screenshot per CSS pixel: 2 when it looks like a 2× (retina) capture. */
  pixelRatio: 1 | 2;
}

/**
 * What frame width a screenshot suggests. Screenshots are often taken at 2×, so a width that is
 * close to double a device preset (and no closer to a preset itself) is halved. A width within 5%
 * of a preset snaps to it.
 */
export function suggestFrameWidth(imageWidth: number): SuggestedWidth {
  const direct = nearestPreset(imageWidth);
  const half = nearestPreset(imageWidth / 2);
  // A 2× phone (786, 824) is near the tablet width too: take whichever reading fits more closely.
  if (half && (!direct || half.error < direct.error))
    return { width: half.width, device: half.id, pixelRatio: 2 };
  if (direct) return { width: direct.width, device: direct.id, pixelRatio: 1 };
  return {
    width: Math.round(Math.min(3000, Math.max(240, imageWidth))),
    device: 'custom',
    pixelRatio: 1,
  };
}

/** Where to draw the reference, in the frame's own pixels. */
export function referenceBox(
  ref: Pick<FrameReference, 'fit' | 'pixelRatio' | 'offsetX' | 'offsetY'>,
  frameWidth: number,
  image: { width: number; height: number },
): { left: number; top: number; width: number; height: number } {
  const width = ref.fit === 'width' ? frameWidth : image.width / ref.pixelRatio;
  const height = image.width > 0 ? (image.height * width) / image.width : 0;
  return { left: ref.offsetX, top: ref.offsetY, width, height };
}
