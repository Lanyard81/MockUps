import { useState } from 'react';
import { downloadBlob, slug, uniqueNames } from '../export/download';
import { buildViewerFile } from '../export/viewer';
import { ExportError, addPinsToPng, renderFramePng } from '../export/png';
import { commentsOf } from '../lib/comments';
import { exportHtmlFiles, type HtmlMode } from '../export/page';
import { createZip } from '../export/zip';
import { useStore } from '../store/store';
import { Modal } from './Modal';

type Format = 'png' | 'html' | 'viewer';

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
  const [pins, setPins] = useState(true);
  const [withNotes, setWithNotes] = useState(true);
  const [busy, setBusy] = useState(false);
  const st = useStore.getState;
  const close = () => st().setDialog(null);

  const frames = scope === 'all' ? doc.frames : frame ? [frame] : [];
  const many = frames.length > 1;

  const run = async () => {
    setBusy(true);
    try {
      const base = slug(doc.name);
      if (format === 'viewer') {
        const file = `${base}-viewer.html`;
        downloadBlob(await buildViewerFile(doc, { comments: withNotes }), file, 'text/html');
      } else if (format === 'png') {
        const blobs = [];
        for (const f of frames) {
          const png = await renderFramePng(f.id, scale);
          const marks = pins
            ? commentsOf(doc)
                .map((c, i) => ({ c, n: i + 1 }))
                .filter(({ c }) => c.frameId === f.id && !c.resolved)
                .map(({ c, n }) => ({ x: c.x, y: c.y, n }))
            : [];
          blobs.push({ f, blob: await addPinsToPng(png, marks, scale) });
        }
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
      <fieldset className="field-group" hidden={format === 'viewer'}>
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
        {radio(
          'format',
          'viewer',
          format,
          setFormat,
          'Viewer file (to share)',
          'The whole mockup in one read-only file, with links between frames and your comments.',
        )}
      </fieldset>
      {format === 'viewer' ? (
        <fieldset className="field-group">
          <legend>Viewer file</legend>
          <p className="modal__note">
            One HTML file with every frame in this mockup, the links between frames working, and no
            editing. Send it by email or put it on any web page; it needs no internet connection to
            open.
          </p>
          {commentsOf(doc).length > 0 && (
            <label className="prop-toggle">
              <input
                type="checkbox"
                checked={withNotes}
                onChange={(e) => setWithNotes(e.target.checked)}
              />
              <span>Include comments</span>
            </label>
          )}
        </fieldset>
      ) : format === 'png' ? (
        <fieldset className="field-group">
          <legend>Size</legend>
          {radio('scale', 1, scale, setScale, '1× (normal)')}
          {radio('scale', 2, scale, setScale, '2× (sharper, for retina screens and slides)')}
          {commentsOf(doc).some((c) => !c.resolved) && (
            <label className="prop-toggle" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={pins} onChange={(e) => setPins(e.target.checked)} />
              <span>Mark open comments on the image</span>
            </label>
          )}
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
