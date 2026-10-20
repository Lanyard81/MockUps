import { useRef, useState } from 'react';
import { useStore } from '../../store/store';
import { setImageFromFile } from '../imageUpload';
import { CommitInput } from './controls';

/** One replaceable image: upload or drop a file, edit alt text, or put the placeholder back. */
export function ImageField({
  nodeId,
  imageKey,
  label,
}: {
  nodeId: string;
  imageKey: string;
  label: string;
}) {
  const entry = useStore(
    (s) =>
      (
        s.doc.nodes[nodeId]?.props?.images as
          Record<string, { imageId?: string; alt?: string }> | undefined
      )?.[imageKey],
  );
  const stored = useStore((s) => (entry?.imageId ? s.doc.images[entry.imageId] : undefined));
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const st = useStore.getState;

  const take = (file: File | undefined) => {
    if (file) void setImageFromFile(nodeId, imageKey, file);
  };

  return (
    <div className="image-field">
      <div
        className={`image-field__drop${over ? ' is-over' : ''}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files[0]);
        }}
      >
        {stored ? <img src={stored.dataUrl} alt="" /> : <span>Placeholder image</span>}
        <span className="image-field__hint">Drop an image here</span>
      </div>
      <div className="image-field__actions">
        <button className="btn" onClick={() => input.current?.click()}>
          {stored ? 'Replace image…' : 'Upload image…'}
        </button>
        {stored && (
          <button className="btn" onClick={() => st().clearImage(nodeId, imageKey)}>
            Use placeholder
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          aria-label={`Upload image for ${label}`}
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <div className="prop-field">
        <label className="prop-field__label">Alt text</label>
        <CommitInput
          label={`Alt text for ${label}`}
          value={entry?.alt ?? ''}
          placeholder="Describe the image for people who can't see it"
          onCommit={(v) => st().setImageAlt(nodeId, imageKey, v)}
        />
      </div>
    </div>
  );
}
