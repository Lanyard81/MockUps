import { NSW_CSS, NSW_JS } from '../canvas/nswAssets';
import { catalogue } from '../catalogue';
import { renderFrameHtml } from '../layout/render';
import { getFontEmbedCss } from '../lib/fontData';
import type { Frame, MockupDoc } from '../store/types';
import { cleanForExport } from './clean';
import { slug, uniqueNames } from './download';

/** How the exported page gets the NSW styles, scripts and fonts. */
export type HtmlMode = 'cdn' | 'inline' | 'shared';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const safeStyle = (css: string) => css.replace(/<\/style/gi, '<\\/style');
const safeScript = (js: string) => js.replace(/<\/script/gi, '<\\/script');

const CDN = `https://cdn.jsdelivr.net/npm/nsw-design-system@${catalogue.nswVersion}`;

/** The tags that load NSW CSS, fonts and scripts for a mode. */
async function assets(mode: HtmlMode): Promise<{ head: string; foot: string }> {
  if (mode === 'cdn') {
    return {
      head: [
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">',
        `<link rel="stylesheet" href="${CDN}/dist/css/main.css">`,
      ].join('\n'),
      foot: `<script src="${CDN}/dist/js/main.js"></script>\n<script>window.NSW.initSite()</script>`,
    };
  }
  if (mode === 'shared') {
    return {
      head: '<link rel="stylesheet" href="assets/nsw.css">',
      foot: '<script src="assets/nsw.js"></script>\n<script>window.NSW.initSite()</script>',
    };
  }
  const fonts = await getFontEmbedCss();
  return {
    head: `<style>${safeStyle(fonts)}</style>\n<style>${safeStyle(NSW_CSS)}</style>`,
    foot: `<script>${safeScript(NSW_JS)}</script>\n<script>window.NSW.initSite()</script>`,
  };
}

/** The files that `shared` pages load. */
export async function sharedAssets(): Promise<{ name: string; data: string }[]> {
  return [
    { name: 'assets/nsw.css', data: `${await getFontEmbedCss()}\n${NSW_CSS}` },
    { name: 'assets/nsw.js', data: NSW_JS },
  ];
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
  const { head, foot } = await assets(mode);
  const body = cleanForExport(renderFrameHtml(doc.nodes, frame.root, doc.images), { links });
  return shell(`${doc.name} – ${frame.name}`, head, body, foot);
}

/** An index page that links every frame page (uses real NSW markup). */
export async function buildIndexPage(
  doc: MockupDoc,
  files: { frame: Frame; file: string }[],
  mode: HtmlMode,
): Promise<string> {
  const { head, foot } = await assets(mode);
  const items = files
    .map(
      ({ frame, file }) =>
        `<li><a href="${esc(file)}">${esc(frame.name)}</a> <span class="nsw-small">(${frame.width}px)</span></li>`,
    )
    .join('\n');
  const body = `<main class="nsw-section nsw-section--off-white"><div class="nsw-container"><h1>${esc(doc.name)}</h1><p class="nsw-intro">Open a screen to click through it.</p><ul>\n${items}\n</ul></div></main>`;
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
    ...(mode === 'shared' ? await sharedAssets() : []),
  ];
}
