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

- Duplicate element ids: fixed in Milestone 5 (see 030). Only `main-nav` keeps its name.
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

## 022: Text edits touch the document once, when the session ends

While a text region is being edited, the document does not change: the field is the real element, made editable (`contenteditable="plaintext-only"`). Enter, Tab or leaving the field commits through one `setText` call (one history entry); Esc restores the original. An emptied field counts as a cancel, because an empty region can't be clicked again. Keys typed in the field stop propagating, so they can never fire canvas shortcuts (the first version let Enter bubble on to the "Enter starts editing" shortcut and reopened the field).

## 023: Text, options and images are applied to the variant's markup at render time

`layout/component.ts` takes the variant HTML, then applies options, hidden parts, text and images, and caches the result per node object (nodes are immutable). Text is always set with `textContent`, never as HTML. Editable regions are marked in the markup (`data-edit`), so the node's `text` map is keyed by region name and survives a variant change. Line breaks are stored as `\n` and rendered as `<br>`.

## 024: Component options are data

`overrides.ts` declares options per component (`toggleClass`, `toggleAttr`, `href`, `headingLevel`, `icon`) with a CSS selector into the markup. The generator rejects an option whose selector matches nothing in the default variant. The panel builds its controls from this data, and rendering applies it, so adding an option for another component is a few lines of data. An `href` on a button turns it into an `<a>` (a button can't link).

## 025: Shrink to fit keeps a frozen box

Switching it on records the element's box (measured as an inline-block, because an inline element's own box is shorter than its line). From then on the element is rendered at that size and the font shrinks in half-pixel steps, found by binary search, down to `max(12px, 75%)`. If it still doesn't fit, it is clipped with an ellipsis (a line clamp for multi-line text) and flagged. Boxes live in `props.fitBoxes`, the mode in `textFit`. Fitting re-runs after every render and when fonts load.

## 026: Images

Uploads are validated (images only, 15 MB), downscaled to 1600px on the long side, given an id from a SHA-256 of their content (so the same picture is stored once) and mirrored into IndexedDB. The data URL also stays in `doc.images` so saved files are portable. Alt text belongs to the use of an image (`props.images[key].alt`), not to the shared image. A file dropped on a picture in a frame replaces it; a file dropped anywhere else in the editor is ignored, because the browser would otherwise navigate away and lose unsaved work.

## 027: Properties panel replaces the frame bar

Everything about the selection lives in one right-hand panel. The tree is selected with the breadcrumb and Esc, so the panel follows. Number and text fields commit once (on Enter or leaving the field) and stop keys propagating.

## 028: Zustand selectors must return stable values

A selector that builds a new array or object each call (`?? []`) makes React re-render forever ("Maximum update depth", React error 185) and the whole app stops. Use module-level empty constants (`NO_KEYS`, `NO_IDS`) or derive in the component. This was found by the end-to-end tests the first time a component was added.

## 029: NSW cards stretch their link in Edit mode too, so Edit mode switches that off

The NSW card makes its title link cover the whole card (a pseudo-element). In Edit mode that would swallow clicks on the card's other text, so `FRAME_CSS` sets `pointer-events: none` on link pseudo-elements in Edit mode only. It changes nothing visually and doesn't apply in Preview or exports.

## 030: Ids are made unique per component at render time

Variant markup uses fixed ids (`f-text`, `tab-panel-1`, `popover-demo`...). `uniquifyIds` (in `layout/component.ts`) suffixes every id with the node's id (`f-text--n_abc`) and rewrites everything that refers to them: `for`, `aria-labelledby`/`describedby`/`controls`/`owns`/`activedescendant`, `list`, `form`, `#fragment` links (tabs) and `data-popover-id`. Results are stable per node (the node id never changes), cached with the rest of the render, and cloned nodes get new ids from their new node id. The one exception is `main-nav`, which the NSW script finds by exact name, so two main navigations in one frame still share it. Thumbnails render raw markup in a separate document, so they don't need it.

## 031: Layers use the same tree rules as the canvas

A Layers drop is converted to a `Placement` by `layout/layers.ts` using `canContain` and `isWithin`, so a layer can only land somewhere the canvas would also allow (a component cannot go into the frame root, columns can't move, nothing goes into itself). The pointer's position on a row decides before, inside or after; "inside" falls back to before or after if the row can't hold the node. The store's `moveNode` is shared with canvas drags, so one layer drag is one undo step. The path to the selection is always expanded so the selected layer is visible.

## 032: Right-click menu is one component for the canvas, layers and frames

The menu is host UI (`ContextMenu`) driven by a store field (`contextMenu`), opened from the frame's own document on `contextmenu` in Edit mode (the press selects the item first, and closes any open menu). Actions are the same store actions as the shortcuts, with the shortcut shown beside each. Disabled items stay visible, so the menu always has the same shape.

## 033: First-run tour is remembered in localStorage

The tour stores `nswmb.tourDone` in `localStorage` (wrapped in try/catch). If storage is blocked it can't be remembered, so it only stays closed for that visit. Tests start with it already dismissed (`storageState` in `playwright.config.ts`); `tests/e2e/tour.spec.ts` starts with empty storage.

## 034: `name` and `hidden` are on every node

A layer's custom name (`name`) is used everywhere a node is labelled (Layers, breadcrumb, selection label, drag ghost). `hidden` removes a node from the canvas and from exports but keeps it in Layers. Hidden nodes still count for positions when dropping, because their place in the list is unchanged.

## 035: What is saved where

Each mockup is one IndexedDB record (`mockup:<id>`: the whole document, images included) plus a small index (`mockups`: name, time, frame count, thumbnail) and a pointer to the one to reopen (`lastMockup`). Autosave runs 700ms after the last change and also when the tab is hidden; the thumbnail is refreshed after 2.5s of quiet. Stored mockups are validated again on load, because stored data can be old or damaged. The app waits (at most 1.5s) for the last mockup before the first paint, so a reload doesn't flash an empty frame.

## 036: Opening a file always makes a new mockup

A file gets a fresh id when opened, so opening it never overwrites a mockup of the same name already saved in the browser. The price is that opening the same file twice makes two copies.

## 037: Files and stored data are untrusted

`persistence/schema.ts` rebuilds a document field by field from whatever it is given: size and count limits, a reviver that refuses `__proto__`/`constructor`/`prototype` at any depth, only real `data:image/…` URLs for images, clamped numbers, and the tree rules from `layout/ops.ts` (a layout that breaks them is refused with a message, not repaired, because a repair could hide data loss). Layers nothing refers to are dropped. Text is only ever set as text, and the rendered markup goes through DOMPurify (an unsafe `javascript:` link is removed). Unknown components are kept and shown as placeholders, so files from newer versions of the catalogue still open.

## 038: Export

- **PNG** captures the live frame (so it matches the canvas, including shrink-to-fit) with the editor's hints switched off, at its full height. Very large captures (over 16,000px a side or 120 megapixels) are refused with a message rather than failing silently.
- **HTML** is rendered from the document, not from the live frame, so the NSW script starts clean. Editor markers are removed. Self-contained pages inline the NSW CSS, JavaScript and fonts (about 1 MB). Several frames become a zip: a page each, an index page, and (self-contained) shared `assets/nsw.css` and `assets/nsw.js`. The CDN version is pinned to the installed NSW version. Shrink-to-fit is not part of HTML export (it is a design aid, measured in the editor).
- **Copy HTML** unwraps the editor's wrapper divs and indents the result. Page exports keep the wrappers, so spacing is identical to the canvas.
- A small ZIP writer (no compression, `export/zip.ts`) avoids a dependency.

## 039: Startup bugs found by the end-to-end tests

The first version of "fit on load and after opening a mockup" zoomed inside a store subscriber before clearing its own request, so each zoom re-entered the subscriber until the stack overflowed and the page stayed blank. Rule: a store subscriber that changes the store must make its own condition false first.

## 040: Templates and samples

- **Official templates are built from catalogue components** (`src/templates/build.ts`, `official.ts`): a small DSL (`c`, `row`, `sec`, `page`) that produces the same section > container > grid > column > component tree as hand-built pages, so they pass the tree rules and render with real NSW markup. The NSW docs site isn't reachable from the build sandbox, so the 22 templates follow the published template layouts from knowledge. Easy Read is approximated with content blocks and the map templates use a media placeholder. Both are listed as limitations.
- **Using a template** makes a new frame (click, or drop on empty canvas) or replaces a frame's content (drop on a frame, with a confirmation when the frame isn't empty). Each is one undo step. Templates always get fresh ids.
- **My templates** are stored in browser storage (not in undo) and travel inside `.mockup.json` files. Deleting one asks first. Thumbnails come from the same hidden-frame renderer as the library.
- **Samples** are built by code (`templates/samples.ts`, deterministic ids) and also written to `public/samples/*.mockup.json` by `npm run samples`; CI fails if the committed files differ. The File menu opens them from code, so they work offline from a single file.

## 041: Single-file check ignores script bodies

`finish-single.mjs` now blanks the contents of `<script>` elements before looking for external `<link>`, `<script>`, `<img>` and `url()` references. The app's own code contains markup strings (the CDN HTML export writes Google Fonts links into exported pages) that are never loaded by the app itself. Tags in the page, script `src` attributes and CSS `url()` are still checked, and the e2e test opens the file from disk offline.

## 042: Click-through prototypes

- **A link's destination** is `props.goto` (a frame id) on any component with a link option. It is rendered as a real `<a href="#" data-goto="…">`, so the markup is still official NSW. Setting it is the same undoable property change as any other. A link to a frame that has been deleted does nothing in Preview and exports as `#`.
- **Preview** shows a full-window viewer (`PrototypeViewer`) when a `data-goto` link is clicked: the target frame at full height (scaled down to the window width), with Back along the path taken, Close and Esc. Its state is UI-only (`prototype` in the store) and never enters history; leaving Preview closes it.
- **HTML export** turns `data-goto` into relative links between the exported pages (already in `export/clean.ts`).
- **Minimum zoom is now 10%** (was 25%) so a row of three desktop frames, as in the samples, fits on screen.

## 043: Style kits (Milestone S1)

- **A kit is a folder under `src/kits/`** and one line in `src/kits/index.ts`. It implements `Kit` (`src/kits/types.ts`): the frame shell (CSS, JavaScript, fonts, `init` hook), catalogue, categories, layout schema, layout renderer, layout blocks and page parts, settings (data-driven, like component options), templates, samples, and how it is exported. The editor core only talks to that interface.
- **Layout rules are data.** `KitSchema.layers` lists the layout node types from the frame root down (NSW: section, container, grid, column; SharePoint: section, column), with components below. `layout/ops.ts` still applies the rules; functions take a `schema` (defaulting to NSW's, so old callers and tests are unchanged) or look it up from the frame's kit.
- **Component ids are unique across kits** (the SharePoint kit prefixes its own with `sp-`), so a node's `componentId` finds its component whichever frame it is in, and `getComponent` needs no kit.
- **Kits hold no UI or store imports** (that creates import cycles). Custom Properties panels that data can't express (the NSW grid's column widths) live in `app/kitPanels.ts`.
- **Version 2 document, with a migration.** A frame that names a kit this build doesn't have is refused with a message rather than shown with the wrong styles.
- **Scripts that import the app** (`npm run samples`) run through Vite (`scripts/vite-run.mjs`) so `?raw` CSS and `?url` fonts resolve; the catalogue generator imports only sources and overrides, so it uses plain `tsx`.
- **`scripts/finish-single.mjs` ignores script bodies** (decision 041), so kit data containing CDN links for exported pages doesn't trip it.

## 044: Switching between kits (Milestone S2)

- **Kits never mix inside a frame.** Components, layout blocks, moves and pastes are checked against the frame's kit (`layout/kitGuard.ts`) in the store actions, and refused with one message naming the frame's kit. Layout nodes (sections, columns) belong to the kit they were made in, so they can't cross either, even when empty. Dragging is also refused at the drop (`computeDropTarget` returns no target) and says why.
- **The library follows the target frame** (the selected frame, else the first). The switcher can browse the other kit for that frame; selecting another frame goes back to following. While the library shows the wrong kit for the frame, its tiles are disabled and a warning explains.
- **The last kit chosen for a new frame is remembered** in `localStorage` (`nswmb.lastKit`, guarded: storage can be blocked) and also starts a new mockup. It is a UI preference, not part of the document or history.
- **Converting a frame** is Milestone S6; until then the message says "or convert the frame" because that is the intended way out.

## 045: The SharePoint kit's foundations (Milestone S3)

- **Theme generation is ported, not depended on.** `@fluentui/react` is the full component library, far too heavy for HTML frames. The colour and shade logic that turns one colour into the Fluent UI theme slots (`themePrimary`, `themeLighter`, ... `neutralDark`) is ported into `kits/sharepoint/color.ts` (MIT, © Microsoft, credited in the file). A test checks one tint by hand. Blue uses Microsoft's hand-tuned default slots, because generating from the same main colour gives slightly different tints.
- **Icons: Fluent System Icons (MIT), via a dev dependency.** `@fluentui/svg-icons` is only read by `scripts/generate-sp-icons.ts`, which writes the curated icons into `icons.generated.ts` (committed, checked by `catalogue:check`). Nothing from it ships at runtime except those paths, so the app stays small and offline. The Fabric MDL2 icon font is not used (its licence restricts it to Microsoft products).
- **Site settings live on the frame** (`frame.settings`), so different frames can show different sites. Defaults are not stored; they come from `readSite()`. Lists a user edits in place (menu items) are materialised from the kit's defaults on the first edit (`Kit.frameDefaults`, `setFrameSettingAt`).
- **Rules are data, shown with reasons.** Setting options carry `unavailable(ctx)`: a team site's footer is disabled with "Footers are only available on communication sites", not hidden. The same functions guard the store actions, so a rule can't be bypassed by dragging or by pasting.
- **Section layouts change structure through one action** (`setSectionLayout` → `setColumnCount` in `layout/ops.ts`, tested), so content moves exactly one way: removed columns' content joins the last column that stays.
- **Text in page chrome is editable in place** through `data-setting-edit="<settings path>"` (`canvas/textEdit.ts` `startSettingEdit`), committing once through `setFrameSettingAt`. A collapsible section's title is ordinary node text (`data-edit`), allowed on a layout node only where the kit declares it.
- **Breakpoints are assumptions** (1024 px for the vertical section, 640 px for stacking and the mobile menu), recorded in `SHAREPOINT-OOB.md` for checking against a real site.

## 046: SharePoint web parts (Milestone S4)

- **Web parts are catalogue components** with `sp-` ids, hand-written markup validated against the kit's CSS (`npm run catalogue`), `data-edit` text, `data-optional` parts and `data-image` pictures, exactly like the NSW ones. The generator takes a kit's CSS classes from `styles.ts`, so a web part can't use a class the kit doesn't define.
- **Two new option kinds, as data**: `choice` (the chosen option's class is added, the others' removed: alignment, aspect ratio, table style) and `iconSlot` (an icon from the kit's own set, rendered by `Kit.icons.render`, so core code never imports SharePoint code).
- **An option may belong to some variants only** (a table's style). The generator now requires each option's selector to match _some_ variant, and the panel shows an option only when it matches the chosen one (`optionsForVariant`), so nothing is offered that does nothing. NSW's options all match their default variant, so its data is unchanged.
- **Sample content is made up and generated**: pictures are gradient SVGs made in code (no photo is bundled), people and headlines are invented. This keeps the single file small and avoids using anyone's likeness or text.
- **Counts are show/hide, not new variants**: a hero's 1 to 5 items, quick links, news stories and list rows are `data-optional` parts, labelled "Item 3", "Link 4" and so on.
- **Behaviour in Preview** is one delegated listener in the kit's script (carousel slides and dots, filmstrip scrolling, menus, collapsible sections); in Edit nothing runs, and carousels show the first slide.

## 047: More web parts, templates and build notes (Milestone S5)

- **Static previews are first-class and honest.** A web part that needs live data or a service is built as a believable static preview, marked `static` with a note ("A static preview. In SharePoint ..."), so the library shows a "Static" badge and the build notes repeat it. Their text is editable so a mockup reads correctly.
- **Charts are drawn from data, not stored as pictures.** `Kit.enhanceComponent` (a hook called after a component's options are applied) redraws the chart from `props.chart`; the variant markup carries default data so thumbnails and the library work without a node. Data is cleaned on every read (at most eight points, finite non-negative numbers, short labels) and all text is escaped.
- **Templates are data built with a small DSL** (`templateDsl.ts`) from real web parts, and a test checks every template against the kit's own rules (a page never has a full-width and a vertical section; a team site has no full-width section). That test caught a mistake in the first intranet template.
- **Build notes take the catalogue as a parameter** (`BuildNotesTools`) so a kit file imports no app code; the app passes the tools in (`export/buildNotes.ts`). The text is plain English with SharePoint's names and is deterministic, so it can be diffed.
- **Menus follow the kit.** The frame menu's page parts come from `Kit.pageParts`, and the build-notes entries appear only for kits that have them.

## 048: Converting a frame between kits (Milestone S6)

- **Never destructive.** A conversion adds a new frame beside the original (`Home (SharePoint)`) in one history entry; the original's nodes are not touched (a test compares them before and after), and Undo removes the copy.
- **Mapping tables live in the kit that receives the page** (`Kit.conversions`, each with the kit it converts `from`), so adding a kit adds its conversions with it. Each table says what an element becomes; the kit also owns how page structure maps (columns and spans to a section layout, and back).
- **Kits stay independent.** A conversion gets everything it needs about the source through a small `ConversionSource` (the nodes, text with defaults filled in, the variant, the component's name, and the page furniture in kit-neutral form from `Kit.readChrome`), so neither converter imports the other kit.
- **No silent loss.** Anything without an equivalent becomes a labelled placeholder (a SharePoint Placeholder web part saying "Not converted"; an NSW in-page alert "Not converted: Name") and is counted by original name in a summary the person sees. Lossy decisions (extra columns merged, rows stacked, collapsible sections flattened to a heading, a vertical section moved to the end, a background picture dropped) are listed as notes.
- **Rules are respected.** Converted SharePoint pages never contain a vertical section, so a full-width section (a hero) is always allowed; the result is an ordinary document that passes the same validation as any other.

## 049: Reference images on frames (Milestone R1)

- **Drawn in the editor, not in the frame.** The screenshot is an `<img>` in the editor document with pointer events off, so it can never reach Preview, PNG export (which captures the frame's own content), HTML export, build notes or templates, and selection and drops go straight through it. A test compares PNG exports with and without a reference byte for byte.
- **Behind** is done by making the frame's page background transparent while the reference is behind (one editor-only `<style id="ref-behind">`, removed afterwards); sections with their own background still cover it, which is what "behind the content" means. No kit CSS is touched.
- **Schema v3.** `frame.reference` is optional; the migration only bumps the version. `pixelRatio` is an addition to the brief's shape: it records stored pixels per CSS pixel so "Actual size" is right for a 2× screenshot and for one that had to be shrunk to be stored (width over 3000px or height over 12000px; large PNGs are stored as JPEG).
- **Width suggestion.** A width within 5% of a device preset snaps to it. A width within 5% of double a preset is halved (a 2× capture). When both fit (a 786px-wide 2× iPhone is also near the 820px tablet) the closer reading wins. It is offered in a confirmation, never applied silently.
- **Undo.** Adding, replacing, removing and each setting are one history entry. An opacity drag or a run of arrow-key presses is one entry (`beginGesture` once, then live updates); each separate key press after the key is released starts a new entry.
- **Shortcut.** Show or hide is ⌘/Ctrl+Shift+R, as suggested in the brief. It overrides the browser's hard reload while the editor is focused (work is autosaved either way).

## 050: Static calendar and an eight-item menu (work dashboard template)

- **Calendar** is the Design System's own date-picker calendar markup (`nsw-date-picker`, its title, week, dates and button group classes, all checked against `main.css`), shown open and in place. The only addition is `style="position:static"` on the pop-up, which the Design System positions absolutely and hides until opened; it positions the box and does not restyle it. The Cancel/OK buttons are an optional part. Dates are not clickable and the month is fixed (August 2026, with the 12th as today); the month label is editable.
- **Main navigation** gains an "Eight items" variant (the same markup with two more `<li>`), so a menu like Agency administration and Administration fits. The default variant is unchanged.

## 051: Page specs (Milestone R2)

- **One converter per kit, shared with templates.** A kit's `pageSpec` (`kits/*/pageSpec.ts`) turns the spec's `page` list into nodes using the same builders its templates use (`buildTree` for NSW, `buildPage` for SharePoint), so the two cannot drift; the generic parts (reading JSON, checking components and settings, the report, export) are in `src/pagespec/`.
- **Checked against the catalogue and the settings definitions, not against a separate schema.** A component's variant, text keys, options and optional parts are read from its markup and option list, and frame and section settings from the kit's `SettingDef`s, so the importer accepts exactly what the Properties panel offers and the generated reference cannot go stale (`docs/PAGE-SPEC.md` is generated from the same data, and a unit test and CI fail if it is out of date).
- **Repair, don't refuse.** Only text that isn't a page spec at all, or names a kit the app doesn't have, is refused. Everything else is repaired and counted: placeholders (the NSW in-page alert / the SharePoint Placeholder web part, as in conversions), unknown variants, dropped keys, and moves. Moves: a full-width NSW component inside a section goes just after it; a loose component gets a section; extra columns are merged into the last; a SharePoint layout the page's rules refuse becomes one column, with the rule's reason in the report.
- **Limits:** 2 million characters, 20 pages, 1000 components, 6 columns in an NSW row, names 100 characters, text 5000. Text has control characters removed; links must be web, mail, phone, in-page or relative; the document is still sanitised when rendered.
- **Pictures are not carried** (they would be data URLs): export leaves them out and says so. Text fit, hidden state and layer names are carried. Frame names stay unique, so importing the same page twice gives "Name" and "Name 2".
- **Reports are not saved.** They live in the session (one summary after import, and per frame in Properties until dismissed).

## 052: Freeform frames (Milestone F1)

- **A frame mode, not a new kind of thing.** A freeform frame is an ordinary frame with `layout: 'free'`: its root holds components (each with a `free` box) and nothing else. Selection, text editing, undo, copy and paste, Layers, Preview and exports all keep working because they work on nodes and the root list. Layout rules (`ops.ts`) are untouched: freeform logic is in `layout/free.ts` and the few store actions that need it branch on the frame.
- **Back to front is the root order.** Later items are in front. Bring to front and Send to back reorder the root; Alt+↑/↓ steps one place (up means forward, so it is the reverse of the root order).
- **Nothing re-renders while dragging.** A move or resize styles the item's element directly and commits one `setFreeBox` on release (one history entry); Escape puts it back. A resize starts on an editor handle, so it captures the pointer on the handle (a frame under the pointer would otherwise take the events).
- **Dropping from the library** goes through the existing drag and drop code: `computeDropTarget` returns the pointer position in frame pixels for a freeform frame, `dropNew` and `moveNode` place the node there. The new item is centred on the pointer, a little above it.
- **Leaving a freeform frame** drops the box; **entering** one keeps the current position when switching a flow frame (measured from the screen) and uses the drop point otherwise. Switching back orders components by position and wraps each in its own section, the way a drop on empty space does.
- **Height.** An item's height is its content's. The board is as tall as the lowest item plus 240 px of room, measured in the editor; HTML export uses the measured height (or an estimate when the editor hasn't measured).
- **Left out, on purpose.** Alignment guides and an optional grid were considered and not built (the point is no snapping; Shift locks an axis and arrow keys nudge precisely). Converting, page specs, build notes and templates need section structure, so they are refused on freeform frames with a message. The SharePoint kit's site header, menu and footer are part of its page chrome and are not drawn on a freeform frame.

## 053: DevDan Startup look for the editor

- **Source.** The "DevDan Startup" design system (frosted glass over an aurora backdrop, Apple-style type, one blue accent). Its tokens are copied into `src/styles/theme.css` as `--dd-*` and mapped onto the existing `--ed-*` tokens, so the editor's rules did not change; `src/styles/devdan.css` adds the glass, pill and mono-label treatment on top of `app.css`.
- **Editor only.** Frames, the NSW and SharePoint kits, library thumbnails and exports are untouched: a frame's surface is a mockup and stays white in both themes, and what the editor draws on it (empty-frame message, fold line, selection) keeps light-on-white colours.
- **Dark first, with a light theme.** Dark is the default (as the system says); the toolbar button switches to light and remembers it per browser (`localStorage`, not part of a mockup). `prefers-reduced-motion` switches transitions off; `prefers-reduced-transparency` and browsers without `backdrop-filter` get solid panels.
- **Popups are near solid** (`--dd-pop`, 94% opaque) rather than plain `glass-strong`. A menu or dialog often sits over a white mockup, where light text on 14% white glass would fail contrast; the system's own rule ("body text goes on glass-strong or bg") is kept for the main panels and toolbar. Light-theme controls get a visible border because the system's white glass rim vanishes on a light backdrop.
- **Fonts are bundled, not loaded from Google** (the single file must work offline, rule 6): `@fontsource/inter` (400, 500, 600, 700, Latin) as the web fallback after SF Pro, and `@fontsource/jetbrains-mono` (400, 500, Latin) for the uppercase mono labels. Both are SIL OFL fonts, a few tens of kilobytes each.
- **Blur is spent where it shows.** Only the toolbar pill and transient popups use `backdrop-filter`. The side panels sit on the static aurora, where a blur is invisible, and blurring them made a drag over a 40-component page miss the "no long tasks" test (every repaint of a panel recomputed the blur), so they use the glass fill and border without it. The pills over the live canvas (hint, breadcrumb, drag ghost) use the near-solid popup fill for the same reason.
- **Layout.** The toolbar becomes a floating pill and the panels and canvas rounded glass cards (24px) with 12px gaps; the toolbar sits above the panels (`z-index`) so its menus open over them. Radii follow the system (10, 16, 24, 32px, pill); buttons and inputs are pill-like at the editor's 32px control height.
- **Brand.** The wordmark is "PageWright" in the toolbar, with an inline SVG favicon (glass over an aurora) and a dark `theme-color`.

## 054: Freeform guides, grid and position (Milestone G1)

- **Hints first.** Guides appear when an item is within 1 px of a line; snapping (to guides, within 6 px) is a per-frame opt-in, off by default, because the point of Freeform is no forced snapping. With a grid set, the item snaps to the grid instead and guides still show. Alt ignores snapping for one drag.
- **Measured from the frame.** Other items' boxes and the frame's height are read from the frame's DOM when a drag starts; the maths (`layout/guides.ts`) is pure. Guides are drawn by the overlay from an event, so nothing re-renders in the frame.
- **Multi-select and "distribute evenly" are not built.** Selection is one item at a time everywhere in the app; adding multi-select touches every action, so alignment is to the frame and to other items by guides.

## 055: My components (Milestone G2)

- **Same storage story as templates.** Saved components live in browser storage (`store/savedComponents.ts`), outside the document and outside undo, and are written into `.mockup.json` as an optional `components` list (an older file has none; damaged entries are skipped). No schema bump: the mockup document itself is unchanged.
- **One insertion path.** Paste and "add saved component" share `pasteInto` in the store, so kit checks, layer creation, freeform placement and images behave the same; a drag uses a `saved` drag payload and the same drop targets as a library component.
- **What can be saved.** A component, or a section of a flow frame (with everything inside it): the units that stand on their own under the layout rules. A container, grid or column can't stand alone, so they're refused with a message. A position from a freeform frame is dropped when the component goes on a flow frame.
- **No rename in the list yet.** The store supports it; the list offers add and delete only.

## 056: Comments (Milestone G3)

- **Pinned to a frame position, not to a component.** A note is `{frameId, x, y}` in the frame's pixels, so it stays where it was put if the content changes around it; moving content under a pin is the person's call. (Anchoring to a component would be lost when it is deleted or moved between frames.)
- **Editor only.** Pins are drawn in the editor over a frame, like the selection, so Preview, PNG (unless the option is on) and HTML export never include them. The PNG option draws numbered dots with canvas after the image is made.
- **Stored in the document**, so they travel with the file and undo like everything else. Orphans (a note whose frame is gone) are dropped on load. Version 6.
- **No authors, replies or live sync.** There is one person and no server; a note is plain text and a Done flag. The shareable viewer (G4) carries notes read-only.

## 057: Sharing as a viewer file, not a hosted link (Milestone G4)

- **Why a file.** A shareable link needs somewhere to host the mockup and (for comments) somewhere to keep them, so a server, accounts and a privacy decision about where people's mockups live. PageWright is built to run offline from one file, so it doesn't have any of that. The viewer file gives the same result for the common cases: it opens in any browser from an email attachment, a shared drive or any web server, including the GitHub Pages site.
- **What it is.** A static page with the viewer's own small script and the mockup embedded as JSON: each frame's cleaned export markup, plus each kit's CSS (fonts inlined), JavaScript and initialiser once. A frame is shown in an iframe built from that data, so components work (menus, accordions); links to other frames are rewritten to `#goto:<id>` and passed up by `postMessage`.
- **Read-only, and comments are a snapshot.** People can't change the mockup or reply to notes; they see the notes as they were when the file was made. Two-way comments would need the server.
- **Safe to embed.** The data is JSON with `<`, `>` and `&` escaped, so nothing in a frame name, text or note can close the script or start a tag.
- **Not built:** a hosted link, live comments, access control. If a server is ever added, this file's data is the format it would serve.

## 058: Command palette (Milestone G5)

- **Built from the app's own data when it opens.** The items come from the same sources as the panels (the kit catalogue, templates, saved components, frames, comments), so there is no second list to keep up to date; each item runs the same store action a button would, after the palette closes.
- **Current kit.** Components and templates are those of the selected frame's kit (or the first frame's), because the others couldn't be added anyway.
- **Ranking is deliberately small:** every word must appear; the label starting with a word beats a word inside it beats the group or hidden keywords; shorter labels win ties. No fuzzy matching, so results are predictable.

## 059: Start frame and transitions (Milestone G6)

- **Start frame is document data** (`startFrameId`, validated against the frames); unset means the first frame, so older mockups behave as before. Deleting that frame clears it.
- **Transitions belong to the link** (`props.transition`, one of `fade`, `slide`, `rise`), because that is what a person is designing: how this click moves on. It becomes a `data-transition` attribute next to `data-goto`; unknown values are ignored. The Play viewer animates the incoming frame with CSS (opacity and translate only, off under reduced motion); the viewer file does the same.
- **Hover and tab states were not added as features:** in Preview and Play the real kit scripts run, so hover, focus, tabs, menus and accordions already behave as they would on a site. Making a different frame appear _on_ hover would be a separate interaction model; it is not built.

## 060: Version history (Milestone G7)

- **Whole-document snapshots, in browser storage, per mockup.** A version is a copy of the whole mockup (images included) under `versions:<mockup id>`, at most 30, oldest dropped. It is simple, always restores exactly, and needs no merge logic. The cost is size, which is why they stay out of the `.mockup.json` file and are capped.
- **Restore is an ordinary edit.** It replaces the document's content in one history entry (keeping the mockup's id, name and canvas view), so Undo undoes it; and before it runs, the current state is saved as a "Before restoring…" version so nothing is lost even if the page is then closed.
- **Compare is by ids.** Frames and components keep their ids for as long as they live, so a changed text is "edited", not "removed and added". The comparison is a short summary and per-frame phrases, not a visual diff.
- **No automatic versions.** Autosave already keeps the latest state; automatic snapshots would need rules (when, how many) that people didn't ask for. Named versions are the person's decision.

## 061: Responsive preview (Milestone G8)

- **Real rendering, measured.** Each width is an ordinary frame iframe with the kit's own styles and scripts, rendered at that width, so the NSW grid and the SharePoint breakpoints do what they would on a device. The checks read the result (an element's contents reaching past the right edge, a button's size), not the document, so they catch what a person would see.
- **Two checks, on purpose.** Sideways overflow and small touch targets (24px, the WCAG 2.2 AA minimum) are the failures that are objectively wrong and that this tool can measure reliably. Judging "looks cramped" or "text too small" is subjective and is left to the eye; the three panes are there for that.
- **Names components, not layout boxes.** A problem is attributed to the component whose content sticks out (a section that merely contains it isn't blamed), so the list says what to fix.
- **Freeform frames are excluded**: they have a fixed width by design.

## 062. Accessibility checks are our own, not axe-core

The checks (`src/lib/a11y.ts`) are about 200 lines over a rendered copy of the frame. Adding axe-core would be a large dependency for a handful of rules, and it would flag the NSW components themselves. Contrast is judged from computed colours; text over a picture or gradient is skipped because a colour can't judge it. Results are advice, not a certificate.

## 063. PDF export is a small writer, not a dependency

A PDF can carry a JPEG untouched, so `export/pdf.ts` (about 60 lines) writes one page per frame picture. The pages are images, so text isn't selectable; for selectable text use the HTML export. Duplicate-at-another-width keeps the page content and only changes the width, so it is a way to eyeball a layout, not to design a separate mobile version.

## 064. The app is called PageWright

Renamed from MockMaker for the name shown to people (toolbar, page title, README, docs). Technical identifiers are unchanged on purpose, so nothing saved or bookmarked breaks: the GitHub Pages address (`/MockUps/`), the single file name (`mockmaker.html`), saved-file formats and browser storage keys.

## 065. The Simple kit is a third kit, not a mode of an existing one

Kits are self-contained (rule 3a), so "generic" parts live in their own `src/kits/simple/` folder with their own CSS (`sk-` classes, checked by `npm run catalogue`) and nothing shared with NSW or SharePoint. It uses the same section > column layout as SharePoint so the tree rules, layers and drag and drop work unchanged. System fonts only; the accent is validated as a hex colour before it reaches CSS. No conversions to or from other kits yet: pages are rebuilt rather than mapped, which keeps the kit small.

## 066. Technical names follow the new name too

With nobody using the app yet, decision 064's caution isn't needed: the single file is `pagewright.html`, saved files say `"app": "pagewright"`, browser storage keys start `pagewright.`, and the package is `pagewright`. Files saved as `mockmaker` or `nsw-mockup-builder` still open. The Pages address still follows the GitHub repository name (`/MockUps/`), which only renaming the repository changes.

## 067. The repository is PageWright, so the site address is /PageWright/

Vite's `base`, the Playwright config and the docs now use `/PageWright/` (case-sensitive), matching the renamed GitHub repository.

## 068. Responsive on large screens

The side panels grow with the window from 1700px up (clamped), the canvas refits when the window is resized until the person pans or zooms themselves (`autoFit`), and the click-through scales a wide page up to fill the window (a phone-sized page fills the height), to at most 2.5×. The visible name is PageWright (capital W); file and storage names stay lower case.

## 069. The glossary (review Q1)

The editor says **page** for what was a frame or screen (the saved document is still a **mockup**), **Stacked** and **Free** for the two layouts, **Preview** (in the canvas) and **Present** (full screen), **prototype links**, and **page description** for the page-spec JSON. Internal names (`frame`, `flow`/`free`, `.page.json`, `mockup-page-spec`) do not change, so saved files, page descriptions and code are unaffected. `docs/review/REVIEW.md` has the full proposed glossary.

## 070. axe-core as a dev dependency

`axe-core` (MPL-2.0, test-only, not bundled) runs inside Playwright to check the editor for accessibility problems (colour contrast now, more rules in the keyboard milestone). It is the standard engine for this, and writing our own checks for ARIA and contrast would be larger and less trustworthy. The app's own accessibility checker (for mockup content) stays separate and dependency-free (decision 062).
