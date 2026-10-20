import { useState } from 'react';
import { downloadBlob, slug, uniqueNames } from '../export/download';
import { ExportError, renderFramePng } from '../export/png';
import { exportHtmlFiles, type HtmlMode } from '../export/page';
import { createZip } from '../export/zip';
import { useStore } from '../store/store';
import { Modal } from './Modal';

type Format = 'png' | 'html';

/** Export frames as PNG images or clickable HTML pages. */
export function ExportDialog() {
  const open = useStore((s) => s.dialog === 'export');
  if (!open) return null;
  return <Inner />;
}

function Inner() {
  const doc = useStore((s) => s.doc);
  const selectedId = useStore((s) => s.selectedFrameId);
  const frame = doc.frames.find((f) => f.id === selectedId) ?? doc.frames[0];
  const [format, setFormat] = useState<Format>('png');
  const [scope, setScope] = useState<'selected' | 'all'>(
    doc.frames.length > 1 && !selectedId ? 'all' : 'selected',
  );
  const [scale, setScale] = useState<1 | 2>(2);
  const [mode, setMode] = useState<Exclude<HtmlMode, 'shared'>>('inline');
  const [busy, setBusy] = useState(false);
  const st = useStore.getState;
  const close = () => st().setDialog(null);

  const frames = scope === 'all' ? doc.frames : frame ? [frame] : [];
  const many = frames.length > 1;

  const run = async () => {
    setBusy(true);
    try {
      const base = slug(doc.name);
      if (format === 'png') {
        const blobs = [];
        for (const f of frames) blobs.push({ f, blob: await renderFramePng(f.id, scale) });
        const suffix = scale === 2 ? '@2x' : '';
        if (!many)
          downloadBlob(
            blobs[0]!.blob,
            `${base}-${slug(frame!.name, 'frame')}${suffix}.png`,
            'image/png',
          );
        else {
          const names = uniqueNames(
            blobs.map((b) => `${slug(b.f.name, 'frame')}${suffix}`),
            'png',
          );
          const entries = await Promise.all(
            blobs.map(async (b, i) => ({
              name: names[i]!,
              data: new Uint8Array(await b.blob.arrayBuffer()),
            })),
          );
          downloadBlob(createZip(entries), `${base}-png.zip`, 'application/zip');
        }
      } else {
        const files = await exportHtmlFiles(
          doc,
          frames,
          many && mode === 'inline' ? 'shared' : mode,
        );
        if (!many) downloadBlob(files[0]!.data, files[0]!.name, 'text/html');
        else downloadBlob(createZip(files), `${base}-html.zip`, 'application/zip');
      }
      st().setNotice(many ? `Exported ${frames.length} frames.` : `Exported “${frame!.name}”.`);
      close();
    } catch (err) {
      st().setNotice(
        err instanceof ExportError ? err.message : 'The export failed. Please try again.',
      );
      setBusy(false);
    }
  };

  const radio = <T extends string | number>(
    name: string,
    value: T,
    current: T,
    set: (v: T) => void,
    label: string,
    hint?: string,
  ) => (
    <label className="choice">
      <input type="radio" name={name} checked={current === value} onChange={() => set(value)} />
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );

  return (
    <Modal
      title="Export"
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={close}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            disabled={busy || frames.length === 0}
            onClick={() => void run()}
          >
            {busy ? 'Exporting…' : 'Export'}
          </button>
        </>
      }
    >
      <fieldset className="field-group">
        <legend>What to export</legend>
        {radio(
          'scope',
          'selected',
          scope,
          setScope,
          frame ? `Frame “${frame.name}”` : 'No frame',
          'The frame you have selected, or the first one.',
        )}
        {radio(
          'scope',
          'all',
          scope,
          setScope,
          `All frames (${doc.frames.length})`,
          'Downloaded together as a zip file.',
        )}
      </fieldset>
      <fieldset className="field-group">
        <legend>Format</legend>
        {radio(
          'format',
          'png',
          format,
          setFormat,
          'PNG image',
          'The full height of the page, as it looks on the canvas.',
        )}
        {radio(
          'format',
          'html',
          format,
          setFormat,
          'HTML page',
          'A real, clickable web page built with the NSW Design System.',
        )}
      </fieldset>
      {format === 'png' ? (
        <fieldset className="field-group">
          <legend>Size</legend>
          {radio('scale', 1, scale, setScale, '1× (normal)')}
          {radio('scale', 2, scale, setScale, '2× (sharper, for retina screens and slides)')}
        </fieldset>
      ) : (
        <fieldset className="field-group">
          <legend>Styles and scripts</legend>
          {radio(
            'mode',
            'inline',
            mode,
            setMode,
            'Fully self-contained',
            'Works offline, anywhere. Bigger files (about 1 MB each, or shared in a zip).',
          )}
          {radio(
            'mode',
            'cdn',
            mode,
            setMode,
            'Link to NSW from the internet',
            'Small files. The page needs an internet connection to look right.',
          )}
        </fieldset>
      )}
      {many && format === 'html' && (
        <p className="modal__note">
          The zip has a page for each frame and an index page linking them all.
        </p>
      )}
    </Modal>
  );
}
