import nswCss from 'nsw-design-system/dist/css/main.css?raw';
import nswJs from 'nsw-design-system/dist/js/main.js?raw';
import publicSans400 from '@fontsource/public-sans/files/public-sans-latin-400-normal.woff2?url';
import publicSans400i from '@fontsource/public-sans/files/public-sans-latin-400-italic.woff2?url';
import publicSans700 from '@fontsource/public-sans/files/public-sans-latin-700-normal.woff2?url';
import materialIcons from 'material-icons/iconfont/material-icons.woff2?url';

// Font URLs are inlined as data URIs in the single-file build, so no network is needed.
const FONT_CSS = `
@font-face{font-family:"Public Sans";font-style:normal;font-weight:400;font-display:block;src:url(${publicSans400}) format("woff2")}
@font-face{font-family:"Public Sans";font-style:italic;font-weight:400;font-display:block;src:url(${publicSans400i}) format("woff2")}
@font-face{font-family:"Public Sans";font-style:normal;font-weight:700;font-display:block;src:url(${publicSans700}) format("woff2")}
@font-face{font-family:"Material Icons";font-style:normal;font-weight:400;font-display:block;src:url(${materialIcons}) format("woff2")}
.material-icons{font-family:"Material Icons";font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;font-feature-settings:"liga"}
`;

// Only frame plumbing lives here. No NSW component is restyled.
const FRAME_CSS = `html{overflow:hidden}body{margin:0}#root{display:flow-root}`;

/**
 * The document every frame loads. Built once and shared as `srcdoc`, so the NSW CSS, fonts and
 * JavaScript run in each frame exactly as they would on a real site.
 */
export const FRAME_SHELL = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${FONT_CSS}</style><style>${nswCss}</style><style>${FRAME_CSS}</style></head>
<body><div id="root"></div><script>${nswJs.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
