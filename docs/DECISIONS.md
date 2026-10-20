# Architecture decisions

Newest at the bottom. Format: decision, reason, consequences.

## Dependencies

| Package                                                                                                       | Why                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `react`, `react-dom`                                                                                          | UI framework for the editor (the brief specifies React).                                     |
| `zustand`                                                                                                     | Small store with simple snapshot-based undo.                                                 |
| `nsw-design-system` (v3)                                                                                      | Source of the real NSW CSS and JavaScript. Upgrading it upgrades every mockup.               |
| `@fontsource/public-sans`                                                                                     | Public Sans woff2 files, so fonts work offline. Only latin 400, 400 italic and 700 are used. |
| `material-icons`                                                                                              | Material Icons font file, bundled for offline use.                                           |
| `dompurify`                                                                                                   | Sanitises untrusted markup before it reaches a frame.                                        |
| `idb-keyval`                                                                                                  | Tiny IndexedDB wrapper for autosave and images (Milestone 6).                                |
| `html-to-image`                                                                                               | PNG export (Milestone 6).                                                                    |
| `vite`, `@vitejs/plugin-react`                                                                                | Build tooling.                                                                               |
| `vite-plugin-singlefile`                                                                                      | Inlines everything into one HTML file.                                                       |
| `typescript`, `typescript-eslint`, `eslint`, `eslint-plugin-react-hooks`, `globals`, `@eslint/js`, `prettier` | Type-checking, linting, formatting.                                                          |
| `vitest`, `jsdom`                                                                                             | Unit tests.                                                                                  |
| `@playwright/test`                                                                                            | End-to-end tests.                                                                            |
| `tsx`                                                                                                         | Runs the catalogue generation script (Milestone 2).                                          |
| `@types/*`                                                                                                    | Types for React and Node.                                                                    |

`idb-keyval` and `html-to-image` were listed in the brief; they are not imported until Milestone 6 but are installed now so the single-file size budget is visible early.

## 001: Each frame is an iframe with `srcdoc`

Frames need the real NSW CSS, responsive breakpoints and JavaScript. An iframe gives each frame its own viewport width, so NSW media queries respond to the frame width and not the editor window. `srcdoc` documents are same-origin, so the editor reaches in directly. The shell document (`FRAME_SHELL`) is built once and shared by all frames.

Consequences: events inside frames never reach the editor, so `canvas/input.ts` forwards wheel, middle-mouse and keyboard events and decides what clicks mean. Scaled iframes (canvas zoom) need coordinate conversion.

## 002: Fonts as `?url` assets with our own `@font-face`

`@fontsource` and `material-icons` CSS lists several formats and subsets. We write our own `@font-face` rules with woff2 only. In the single-file build `assetsInlineLimit` is raised so fonts become data URIs; in the Pages build they are normal hashed assets. `srcdoc` iframes inherit the parent's base URL, so both resolve.

## 003: NSW JavaScript is inlined in the frame shell

`nsw-design-system/dist/js/main.js` (UMD) is imported with `?raw` and put in a `<script>` in the shell. `window.NSW.initSite()` is called after each content render. Known limitation: `initSite()` rebinds document-level listeners on every call, because it is written for page load. Content is replaced wholesale (new elements each time), so component behaviour is correct, but this should be revisited when edits become frequent (Milestone 3/4), for example by calling only the per-component initialisers on changed subtrees.

## 004: Snapshot undo, view excluded

History is a stack of immutable `MockupDoc` references (cap 100). All updates are structural-sharing immutable edits written by hand, with no immer dependency. `view` (pan and zoom) lives on the doc so it is saved, but changes to it bypass history, and undo/redo keep the current view.

## 005: Edit mode blocks clicks in frames by capture listener

In Edit mode a capture-phase `click` listener in each frame prevents default and stops propagation, so nothing in the mockup runs. In Preview mode components behave live, but links whose `href` doesn't start with `#` are blocked so the frame can't navigate away.

## 006: Frames have a minimum height equal to the device screen height

An empty or short frame looks like a device screen. The fold line only appears once content passes that height.

## 007: Single-file build is a mode of the same Vite config

`SINGLE=1` switches `base` to `./`, enables `vite-plugin-singlefile`, disables `publicDir`, and writes to `dist-single/`. `scripts/finish-single.mjs` renames the output and fails if the file loads anything external. Samples in `public/samples/` will be embedded in Milestone 7, since `fetch` doesn't work from `file://`.

## 008: Playwright browser path

The cloud sandbox has Chromium at `/opt/pw-browsers/chromium` and can't download browsers. `playwright.config.ts` reads `PW_CHROMIUM` so the same config works locally, in the sandbox and in CI (which runs `playwright install`).

## 009: The npm package has no component markup (affects Milestone 2)

`nsw-design-system@3.28.1` ships SCSS, compiled CSS and JS only. The component templates (Handlebars and JSON) in `src/components/<slug>/` are not in the package. See `NSW-DESIGN-SYSTEM.md` for the options. This decision is pending the user's choice.
