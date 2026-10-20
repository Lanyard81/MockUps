import { useState } from 'react';
import { referenceBox } from '../lib/reference';
import { useStore } from '../store/store';
import type { Frame } from '../store/types';

/**
 * A frame's reference screenshot, drawn in the editor document (never inside the frame), with
 * pointer events off so selecting and dropping go straight through it. Edit mode only; nothing
 * here reaches Preview, thumbnails, PNG or HTML export, build notes or templates.
 */
export function ReferenceLayer({ frame }: { frame: Frame }) {
  const reference = frame.reference;
  const image = useStore((s) => (reference ? s.doc.images[reference.imageId] : undefined));
  const [size, setSize] = useState<{ src: string; width: number; height: number } | null>(null);
  if (!reference || !image) return null;
  const natural = size?.src === image.dataUrl ? size : null;
  const box = natural ? referenceBox(reference, frame.width, natural) : null;
  const beside = reference.placement === 'beside';
  return (
    <div
      className={`frame__ref frame__ref--${reference.placement}`}
      data-testid="frame-reference"
      data-placement={reference.placement}
      aria-hidden="true"
    >
      {beside && <span className="frame__ref-label">Reference</span>}
      <img
        src={image.dataUrl}
        alt=""
        draggable={false}
        onLoad={(e) =>
          setSize({
            src: image.dataUrl,
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight,
          })
        }
        style={{
          left: beside ? 0 : reference.offsetX,
          top: beside ? 0 : reference.offsetY,
          width: box?.width,
          opacity: beside ? 1 : reference.opacity,
          visibility: box ? 'visible' : 'hidden',
        }}
      />
    </div>
  );
}
