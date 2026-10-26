import type { KitShell } from '../types';
import { SIMPLE_CSS } from './styles';

/** Editor plumbing only (never restyles a component): same affordances as every kit's frames. */
const FRAME_CSS = `html{overflow:hidden}body{margin:0}#root{display:flow-root}
body[data-mode="edit"] [data-empty]{min-height:64px;outline:1px dashed #8a8f98;outline-offset:-1px}
body[data-mode="edit"]{user-select:none;-webkit-user-select:none}
body[data-mode="edit"] [contenteditable]{user-select:text;-webkit-user-select:text;cursor:text;outline:2px solid #1f5fd1;outline-offset:2px}
body[data-mode="edit"] [data-edit]:not([contenteditable]){cursor:default}
body[data-mode="edit"] a::after{pointer-events:none}
body[data-mode="edit"] [data-empty]::before{content:attr(data-empty);display:block;padding:8px 12px;color:#6d675c;font:12px/1.4 system-ui,sans-serif}`;

export const SIMPLE_FRAME_SHELL = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${SIMPLE_CSS}</style><style>${FRAME_CSS}</style></head>
<body><div id="root"></div></body></html>`;

export const simpleShell: KitShell = {
  css: SIMPLE_CSS,
  js: '',
  // System fonts only: nothing is bundled or embedded.
  fontCss: () => '',
  fonts: [],
  frameCss: FRAME_CSS,
  document: SIMPLE_FRAME_SHELL,
  init: () => {},
};
