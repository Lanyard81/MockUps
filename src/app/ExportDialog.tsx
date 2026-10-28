import { useState } from 'react';
import { downloadBlob, slug, uniqueNames } from '../export/download';
import { buildViewerFile } from '../export/viewer';
import { buildPdf, pngToJpegPages } from '../export/pdf';
import { buildNotesFor } from '../export/buildNotes';
import { copyText } from '../export/copy';
import { getKit } from '../kits';
import { isFreeFrame } from '../layout/free';
import { framesToSpecText } from '../pagespec';
import { ExportError, addPinsToPng, renderFramePng } from '../export/png';
import { commentsOf } from '../lib/comments';
import { exportHtmlFiles, type HtmlMode } from '../export/page';
import { createZip } from '../export/zip';
import { useStore } from '../store/store';
import { Modal } from './Modal';

type Format = 'png' | 'pdf' | 'html' | 'viewer' | 'spec' | 'notes';

/** Share and export: every way to get a page out, each with what it is for. */
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
  const [withNotes, setWithNotes] = useState(false);
  const [sheet, setSheet] = useState<'page' | 'a4'>('page');
  const [busy, setBusy] = useState(false);
  const st = useStore.getState;
  const close = () => st().setDialog(null);

  const frames = scope === 'all' ? doc.frames : frame ? [frame] : [];
  const many = frames.length > 1;
  const kit = getKit(frame?.kitId);
  const withCdn = frames.length > 0 && frames.every((f) => getKit(f.kitId).export.cdn);
  const anyFree = frames.some((f) => isFreeFrame(f));
  const notesKit = !!frame && !!kit.buildNotes;

  /** The page description or build notes as text, with the file name to save it as. */
  const textOutput = (): { text: string; file: string; type: string } | null => {
    const base = slug(doc.name);
    if (format === 'spec') {
      const out = framesToSpecText(
        doc,
        frames.map((f) => f.id),
      );
      return out
        ? {
            text: out.text,
            file: many ? `${base}.page.json` : `${slug(frame!.name, 'page')}.page.json`,
            type: 'application/json',
          }
        : null;
    }
    const notes = frame ? buildNotesFor(frame.id) : null;
    return notes ? { text: notes.text, file: notes.file, type: 'text/markdown' } : null;
  };
  const copyIt = async () => {
    const out = textOutput();
    if (!out) return st().setNotice('That can’t be made for this page.');
    st().setNotice(
      (await copyText(out.text))
        ? 'Copied. Paste it into a chat, a document or a ticket.'
        : 'The browser blocked copying. Allow clipboard access and try again.',
    );
    close();
  };

  const run = async () => {
    setBusy(true);
    try {
      const base = slug(doc.name);
      if (format === 'viewer') {
        const file = `${base}-viewer.html`;
        downloadBlob(await buildViewerFile(doc, { comments: withNotes }), file, 'text/html');
      } else if (format === 'spec' || format === 'notes') {
        const out = textOutput();
        if (!out) throw new ExportError('That can’t be made for this page.');
        downloadBlob(out.text, out.file, out.type);
      } else if (format === 'pdf') {
        const pages = [];
        for (const f of frames)
          pages.push(...(await pngToJpegPages(await renderFramePng(f.id, 1), sheet === 'a4')));
        downloadBlob(
          buildPdf(pages),
          many ? `${base}.pdf` : `${base}-${slug(frame!.name, 'frame')}.pdf`,
          'application/pdf',
        );
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
    /** Why it can't be chosen now (it is shown instead of the hint). */
    unavailable?: string,
  ) => (
    <label className="choice">
      <input
        type="radio"
        name={name}
        checked={current === value}
        disabled={!!unavailable}
        onChange={() => set(value)}
      />
      <span>
        {label}
        {(unavailable ?? hint) && <small>{unavailable ?? hint}</small>}
      </span>
    </label>
  );

  return (
    <Modal
      title="Share and export"
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={close}>
            Cancel
          </button>
          {(format === 'spec' || format === 'notes') && (
            <button
              className="btn"
              disabled={busy || frames.length === 0}
              onClick={() => void copyIt()}
            >
              Copy instead
            </button>
          )}
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
      <fieldset className="field-group" hidden={format === 'viewer' || format === 'notes'}>
        <legend>What to export</legend>
        {radio(
          'scope',
          'selected',
          scope,
          setScope,
          frame ? `Page “${frame.name}”` : 'No page',
          'The page you have selected, or the first one.',
        )}
        {radio(
          'scope',
          'all',
          scope,
          setScope,
          `All pages (${doc.frames.length})`,
          'Downloaded together: a zip file, or one PDF with a page for each of your pages.',
        )}
      </fieldset>
      <fieldset className="field-group">
        <legend>What do you need?</legend>
        <p className="choice-group">A picture or a document</p>
        {radio(
          'format',
          'png',
          format,
          setFormat,
          'Image (PNG)',
          'The full height of the page, as it looks on the canvas. For slides and emails.',
        )}
        {radio(
          'format',
          'pdf',
          format,
          setFormat,
          'PDF document',
          'A PDF with one page for each of your pages. Good for printing or sharing a whole flow.',
        )}
        <p className="choice-group">A web page</p>
        {radio(
          'format',
          'html',
          format,
          setFormat,
          'Web page (HTML)',
          `A real, clickable web page that looks like ${kit.shortLabel === 'NSW' ? 'an NSW Government page' : kit.shortLabel === 'SharePoint' ? 'a SharePoint page' : 'your mockup'}, for a developer to start from.`,
        )}
        {radio(
          'format',
          'viewer',
          format,
          setFormat,
          'Shareable viewer (one read-only file)',
          'The whole mockup in one file you can email: people click through the pages and can’t change anything.',
        )}
        <p className="choice-group">For a builder or an AI assistant</p>
        {notesKit &&
          radio(
            'format',
            'notes',
            format,
            setFormat,
            `${kit.buildNotes!.label} (Markdown)`,
            'A plain-English list a site owner can follow to build this page: settings, then each section and web part.',
            anyFree
              ? 'Not available for free-layout pages yet.'
              : many
                ? 'Choose one page: build notes are written for a single page.'
                : undefined,
          )}
        {radio(
          'format',
          'spec',
          format,
          setFormat,
          'Page description (.page.json)',
          'The page as text that an AI assistant can read and change, and PageWright can import again.',
          anyFree ? 'Not available for free-layout pages yet.' : undefined,
        )}
      </fieldset>
      {format === 'pdf' && (
        <fieldset className="field-group">
          <legend>PDF page size</legend>
          {radio(
            'sheet',
            'page',
            sheet,
            setSheet,
            'The size of each page',
            'Each PDF page is as tall as your page: no cuts.',
          )}
          {radio(
            'sheet',
            'a4',
            sheet,
            setSheet,
            'A4 sheets',
            'Pages are scaled to the width of an A4 sheet; long pages continue on the next sheet.',
          )}
        </fieldset>
      )}
      {format === 'viewer' ? (
        <fieldset className="field-group">
          <legend>Viewer file</legend>
          <p className="modal__note">
            One HTML file with every page in this mockup, the links between pages working, and no
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
              <span>Include comments (anyone with the file can read them)</span>
            </label>
          )}
        </fieldset>
      ) : format === 'spec' || format === 'notes' ? null : format === 'pdf' ? null : format ===
        'png' ? (
        <fieldset className="field-group">
          <legend>Size</legend>
          {radio('scale', 1, scale, setScale, '1× (normal)')}
          {radio(
            'scale',
            2,
            scale,
            setScale,
            '2× (sharper, best for slides and high-resolution screens)',
          )}
          {commentsOf(doc).some((c) => !c.resolved) && (
            <label className="prop-toggle" style={{ marginTop: 8 }}>
              <input type="checkbox" checked={pins} onChange={(e) => setPins(e.target.checked)} />
              <span>Mark open comments on the image</span>
            </label>
          )}
        </fieldset>
      ) : format === 'html' ? (
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
          {withCdn &&
            radio(
              'mode',
              'cdn',
              mode,
              setMode,
              'Link to NSW from the internet',
              'Small files. The page needs an internet connection to look right.',
            )}
        </fieldset>
      ) : null}
      {many && format === 'html' && (
        <p className="modal__note">
          The zip has a web page for each of your pages and an index linking them all.
        </p>
      )}
    </Modal>
  );
}
