import nswCss from 'nsw-design-system/dist/css/main.css?raw';
import nswJs from 'nsw-design-system/dist/js/main.js?raw';
import publicSans400 from '@fontsource/public-sans/files/public-sans-latin-400-normal.woff2?url';
import publicSans400i from '@fontsource/public-sans/files/public-sans-latin-400-italic.woff2?url';
import publicSans700 from '@fontsource/public-sans/files/public-sans-latin-700-normal.woff2?url';
import materialIcons from 'material-icons/iconfont/material-icons.woff2?url';

/** Every font the frames use. URLs are data URIs in the single-file build. */
export const FONT_FACES = [
  { family: 'Public Sans', style: 'normal', weight: 400, url: publicSans400 },
  { family: 'Public Sans', style: 'italic', weight: 400, url: publicSans400i },
  { family: 'Public Sans', style: 'normal', weight: 700, url: publicSans700 },
  { family: 'Material Icons', style: 'normal', weight: 400, url: materialIcons },
];

export const fontCss = (resolveUrl: (url: string) => string = (u) => u) =>
  FONT_FACES.map(
    (f) =>
      `@font-face{font-family:"${f.family}";font-style:${f.style};font-weight:${f.weight};font-display:block;src:url(${resolveUrl(f.url)}) format("woff2")}`,
  ).join('\n') +
  `\n.material-icons{font-family:"Material Icons";font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;font-feature-settings:"liga"}`;

const FONT_CSS = fontCss();

// Only frame plumbing lives here. No NSW component is restyled.
const FRAME_CSS = `html{overflow:hidden}body{margin:0}#root{display:flow-root}
body[data-mode="edit"] [data-empty]{min-height:64px;outline:1px dashed #8a8f98;outline-offset:-1px}
body[data-mode="edit"]{user-select:none;-webkit-user-select:none}
body[data-mode="edit"] [contenteditable]{user-select:text;-webkit-user-select:text;cursor:text;outline:2px solid #1f5fd1;outline-offset:2px}
body[data-mode="edit"] [data-edit]:not([contenteditable]){cursor:default}
/* NSW cards stretch their link over the whole card; in Edit mode that must not swallow clicks meant for text inside. */
body[data-mode="edit"] a::after{pointer-events:none}
body[data-mode="edit"] [data-empty]::before{content:attr(data-empty);display:block;padding:8px 12px;color:#6d675c;font:12px/1.4 system-ui,sans-serif}`;

/**
 * The document every frame loads. Built once and shared as `srcdoc`, so the NSW CSS, fonts and
 * JavaScript run in each frame exactly as they would on a real site.
 */
export const FRAME_SHELL = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${FONT_CSS}</style><style>${nswCss}</style><style>${FRAME_CSS}</style></head>
<body><div id="root"></div><script>${nswJs.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
