import { DEFAULT_KIT_ID, KITS, getKit } from '../kits';
import type { Kit } from '../kits/types';
import { renderFrameOf } from '../layout/render';
import { getFontEmbedCss } from '../lib/fontData';
import type { Frame, MockupDoc } from '../store/types';
import { useStore } from '../store/store';
import { cleanForExport } from './clean';
import { slug, uniqueNames } from './download';

/** How the exported page gets the kit's styles, scripts and fonts. */
export type HtmlMode = 'cdn' | 'inline' | 'shared';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const safeStyle = (css: string) => css.replace(/<\/style/gi, '<\\/style');
const safeScript = (js: string) => js.replace(/<\/script/gi, '<\\/script');

/** The tags that load a kit's CSS, fonts and scripts for a mode. A kit with no CDN version falls back to inline. */
async function assets(mode: HtmlMode, kit: Kit): Promise<{ head: string; foot: string }> {
  const init = kit.export.init ? `\n<script>${kit.export.init}</script>` : '';
  if (mode === 'cdn' && kit.export.cdn) {
    return { head: kit.export.cdn.head, foot: kit.export.cdn.foot + init };
  }
  if (mode === 'shared') {
    return {
      head: `<link rel="stylesheet" href="assets/${kit.id}.css">`,
      foot: `<script src="assets/${kit.id}.js"></script>${init}`,
    };
  }
  const fonts = await getFontEmbedCss(kit.id);
  return {
    head: `<style>${safeStyle(fonts)}</style>\n<style>${safeStyle(kit.shell.css)}</style>`,
    foot: `<script>${safeScript(kit.shell.js)}</script>${init}`,
  };
}

/** The files that `shared` pages load, for the kits the pages use. */
export async function sharedAssets(
  kitIds: string[] = [DEFAULT_KIT_ID],
): Promise<{ name: string; data: string }[]> {
  const files: { name: string; data: string }[] = [];
  for (const kit of KITS.filter((k) => kitIds.includes(k.id))) {
    files.push(
      { name: `assets/${kit.id}.css`, data: `${await getFontEmbedCss(kit.id)}\n${kit.shell.css}` },
      { name: `assets/${kit.id}.js`, data: kit.shell.js },
    );
  }
  return files;
}

function shell(title: string, head: string, body: string, foot: string): string {
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${head}
</head>
<body>
${body}
${foot}
</body>
</html>
`;
}

/** A standalone, clickable page for one frame. `links` maps frame ids to the pages they were exported as. */
export async function buildFramePage(
  doc: MockupDoc,
  frame: Frame,
  mode: HtmlMode,
  links: Record<string, string> = {},
): Promise<string> {
  const kit = getKit(frame.kitId);
  const { head, foot } = await assets(mode, kit);
  // A freeform page is as tall as the editor measured it (or an estimate when it hasn't).
  const body = cleanForExport(
    renderFrameOf(doc, frame, useStore.getState().frameHeights[frame.id]),
    { links },
  );
  return shell(`${doc.name} – ${frame.name}`, head, body, foot);
}

/** An index page that links every frame page (uses real NSW markup). */
export async function buildIndexPage(
  doc: MockupDoc,
  files: { frame: Frame; file: string }[],
  mode: HtmlMode,
): Promise<string> {
  const { head, foot } = await assets(mode, getKit(DEFAULT_KIT_ID));
  const items = files
    .map(
      ({ frame, file }) =>
        `<li><a href="${esc(file)}">${esc(frame.name)}</a> <span class="nsw-small">(${frame.width}px)</span></li>`,
    )
    .join('\n');
  const body = `<main class="nsw-section nsw-section--off-white"><div class="nsw-container"><h1>${esc(doc.name)}</h1><p class="nsw-intro">Open a page to click through it.</p><ul>\n${items}\n</ul></div></main>`;
  return shell(doc.name, head, body, foot);
}

export interface ExportedFile {
  name: string;
  data: string;
}

/**
 * HTML for the given frames. One frame gives one page. Several give a page each plus an index page
 * (and, for `shared`, the CSS and JavaScript they share), ready to zip.
 */
export async function exportHtmlFiles(
  doc: MockupDoc,
  frames: Frame[],
  mode: HtmlMode,
): Promise<ExportedFile[]> {
  const names = uniqueNames(
    frames.map((f) => slug(f.name, 'frame')),
    'html',
  );
  const links = Object.fromEntries(frames.map((f, i) => [f.id, names[i]!]));
  const pages: ExportedFile[] = [];
  for (let i = 0; i < frames.length; i++) {
    pages.push({ name: names[i]!, data: await buildFramePage(doc, frames[i]!, mode, links) });
  }
  if (frames.length === 1) return pages;
  const index = await buildIndexPage(
    doc,
    frames.map((frame, i) => ({ frame, file: names[i]! })),
    mode,
  );
  return [
    { name: 'index.html', data: index },
    ...pages,
    ...(mode === 'shared'
      ? await sharedAssets([DEFAULT_KIT_ID, ...frames.map((f) => getKit(f.kitId).id)])
      : []),
  ];
}
