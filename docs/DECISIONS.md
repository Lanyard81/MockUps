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

`nsw-design-system@3.28.1` ships SCSS, compiled CSS and JS only. The component templates (Handlebars and JSON) in `src/components/<slug>/` are not in the package. See `NSW-DESIGN-SYSTEM.md` for the options. **Decided:** hand-written markup (see 010).

## 010: Hand-written catalogue markup, validated against the package

Markup lives in `src/catalogue/sources/*.ts`, written from the package's class names and JavaScript hooks. Variants are real NSW markup with two markers: `data-edit="key"` (editable text, `data-multiline` where line breaks are allowed), `data-optional="key"` (a part that can be hidden), and `data-image="key"` (a replaceable image). `scripts/generate-catalogue.ts` fails if any CSS class is not defined in the installed `main.css`, if a `js-` hook is unknown to the package JavaScript, or if ids and `data-edit` keys clash. The first run caught several wrong guesses (`nsw-link`, `nsw-card__link` and others do not exist). Markup that can't be verified from the package (nesting, ARIA, optional parts) was written from memory and checked by eye, so it should be compared with the docs-site demos.

## 011: Generated catalogue is committed

`src/catalogue/generated/catalogue.json` is committed and regenerated by `npm run build`, `npm run build:single` and `npm run catalogue`. CI runs `catalogue:check`, which fails if the committed file is stale. Overrides (`overrides.ts`) hold category, keywords, optional-part labels and the default variant.

## 012: Frame root can hold components, and "click to add" stacks content

Full-width components (masthead, header, main navigation, footer, hero banner, global alert) sit directly under the frame root rather than inside a section. Other components are appended to the last column of the last section, or a new section is created, so content stacks like a page. Columns carry `props.span` (the span from the md breakpoint up; they are always full width on small screens).

## 013: Thumbnails by html-to-image in a hidden frame

Each variant is rendered once in a hidden iframe using the same shell as real frames, converted to a PNG with `html-to-image` (fonts embedded as data URIs), and cached in memory and IndexedDB keyed by a hash of the markup. Renders are queued one at a time and start only when a tile scrolls into view. If a thumbnail fails, the tile shows the component name.

## 014: Edit-mode hints for empty layout blocks

Empty sections, containers, grids and columns get a dashed outline and label in Edit mode only (`FRAME_CSS`, keyed on `body[data-mode="edit"]` and `data-empty`). It is not applied to NSW components, and not in Preview or exports.

## 015: Known limits of the markup

- Duplicate element ids: several form components use fixed ids (`f-text`, `main-nav` and so on). Adding the same component twice repeats an id. To be made unique at render time (Milestone 4).
- Only the first `#main-nav` is wired by the NSW script.
- The NSW Government waratah logo is not in the package: the header uses a labelled placeholder.

## 016: Layered tree with explicit depths

Every node has a depth (section 1, container 2, grid 3, column 4, component 5; full-width components are 1). A node's parent is always one level shallower, so `canContain` is one comparison. New content that lands on a shallower level gets the missing layers created around it (`buildChain`), which is how "drop on empty space makes a section" works. All of this is pure code in `src/layout/ops.ts`.

## 017: Where new content goes (click, paste)

`resolveInsertion` takes an anchor (the selection, else the last thing in the frame). If the anchor is as deep as the new node or deeper, the new node goes after the ancestor at its level. If shallower, it goes into the last child at each level down. Click-to-add and paste therefore stack content like a page, and follow the selection.

## 018: Drag is pointer events on the window, with a drop target computed from geometry

`canvas/drag.ts` runs one drag loop: pointer moves update a ghost label directly and recalculate the drop target at most once per animation frame (`canvas/dropTarget.ts`, which hit-tests inside the frame with `elementFromPoint` and compares sibling rectangles). The document is not touched until release, when a single store action (`dropNew` or `moveNode`) makes the drag one undo step. While dragging, frames ignore the pointer.

**Browser behaviour to remember:** a press that begins inside an iframe keeps sending moves and the release to that iframe's document, even after the pointer leaves it. A drag started in a frame therefore listens on the frame's document as well as the window (converting coordinates back to screen space).

## 019: Selection chrome is drawn outside the frame

Hover, selection and drop indicators are absolutely positioned elements in the editor document over each frame (`FrameOverlay`). They never touch frame content, so they can't change how a mockup looks. Boxes are placed straight on the DOM (no React re-render per move). The selection label sits inside the box's top-left corner so it never covers a neighbour; only its grip is a drag handle.

## 020: Sanitising only when document nodes change

`renderFrameHtml` (which runs DOMPurify) is memoised on `doc.nodes` and the frame's `root`, so hover, selection and drag updates cause no re-sanitising or DOM writes inside frames. An edit still re-sanitises every frame; the unchanged ones skip the DOM write because their HTML string is identical. A per-frame subtree cache is the next step if this shows up with 10+ big frames.

## 021: Edit-mode press = select, move = drag

In Edit mode a press inside a frame records the item under the pointer. Release without moving selects it. Moving more than 4px picks it up, or picks up the current selection if the press was inside it (so a section chosen from the breadcrumb can be dragged by grabbing inside it). Columns are selectable but not draggable. Deleting a column only empties it, because a grid keeps its columns.
