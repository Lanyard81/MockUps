import { KITS, getKit } from '../kits';
import { renderFrameOf } from '../layout/render';
import { commentsOf } from '../lib/comments';
import { getFontEmbedCss } from '../lib/fontData';
import { useStore } from '../store/store';
import type { Frame, MockupDoc } from '../store/types';
import { cleanForExport } from './clean';
import { VIEWER_CSS, VIEWER_JS } from './viewerScript';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** JSON safe to put inside a <script> element: no way to close it early or open a comment. */
const safeJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(new RegExp('\\u2028', 'g'), '\\u2028')
    .replace(new RegExp('\\u2029', 'g'), '\\u2029');

/** Keep each link's transition in a form the viewer reads (`data-transition` is an editor marker and is stripped). */
function carryTransitions(html: string): string {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  for (const el of tpl.content.querySelectorAll('[data-goto][data-transition]'))
    el.setAttribute('data-mm-t', el.getAttribute('data-transition')!);
  return tpl.innerHTML;
}

export interface ViewerOptions {
  /** Carry the open notes (and done ones, marked) into the file. */
  comments: boolean;
}

/**
 * One self-contained, read-only HTML file for a whole mockup: every frame, with the links between them
 * working, the kits' styles and scripts and fonts embedded once, and (optionally) the notes. It makes no
 * network requests, so it can be emailed, opened from disk or put on any web server.
 */
export async function buildViewerFile(
  doc: MockupDoc,
  options: ViewerOptions = { comments: true },
): Promise<string> {
  const used = KITS.filter((k) => doc.frames.some((f) => getKit(f.kitId).id === k.id));
  const kits: Record<string, { css: string; js: string; init: string }> = {};
  for (const kit of used)
    kits[kit.id] = {
      css: `${await getFontEmbedCss(kit.id)}\n${kit.shell.css}`,
      js: kit.shell.js,
      init: kit.export.init,
    };

  const links = Object.fromEntries(doc.frames.map((f) => [f.id, `#goto:${f.id}`]));
  const heights = useStore.getState().frameHeights;
  const all = commentsOf(doc);
  const frames = doc.frames.map((frame: Frame) => ({
    id: frame.id,
    name: frame.name,
    width: frame.width,
    height: heights[frame.id],
    kit: getKit(frame.kitId).id,
    html: cleanForExport(carryTransitions(renderFrameOf(doc, frame, heights[frame.id])), { links }),
    comments: options.comments
      ? all
          .map((c, i) => ({ c, n: i + 1 }))
          .filter(({ c }) => c.frameId === frame.id)
          .map(({ c, n }) => ({ id: c.id, n, x: c.x, y: c.y, text: c.text, done: c.resolved }))
      : [],
  }));
  const data = {
    kits,
    frames,
    start: doc.frames.find((f) => f.id === doc.startFrameId)?.id ?? doc.frames[0]?.id,
    comments: options.comments ? all : [],
  };

  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.name)}</title>
<style>${VIEWER_CSS}</style>
</head>
<body>
<header class="v-bar">
  <span class="v-title">${esc(doc.name)}</span>
  <nav class="v-tabs" id="mm-tabs" aria-label="Frames"></nav>
  <span class="v-spacer"></span>
  <button class="v-btn" id="mm-back" disabled>Back</button>
  <button class="v-btn" id="mm-notes-btn" aria-pressed="false" hidden>Comments</button>
</header>
<div class="v-main">
  <main class="v-stage" id="mm-stage"></main>
  <aside class="v-notes" id="mm-notes" aria-label="Comments" hidden></aside>
</div>
<script type="application/json" id="mm-data">${safeJson(data)}</script>
<script>${VIEWER_JS.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>
`;
}
