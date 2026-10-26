# Build: Pagewright

You are building a browser-based mockup tool, and it will live in a GitHub repository. I use it to make screen mockups from the **official NSW Government Design System**: I drag real NSW components onto device frames, edit their text and options, and save and share the screens. Ease of use is the top priority: everything should feel obvious without a manual.

The design system is open source (MIT), published on npm as `nsw-design-system` (v3). Read `docs/NSW-DESIGN-SYSTEM.md` before starting: it lists all 46 components, the 21 official templates, install details, fonts and tokens. Treat the package source and the docs site (https://designsystem.nsw.gov.au) as the source of truth wherever they differ from that file.

## Repository

- **Repo**: https://github.com/Lanyard81/MockUps (public, default branch `main`). It currently holds a placeholder `README.md`, plus `docs/NSW-DESIGN-SYSTEM.md` and `docs/BUILD-PROMPT.md` (this prompt; keep it unchanged as the original brief).
- **GitHub Pages URL**: https://lanyard81.github.io/MockUps/ — so Vite's `base` is `/MockUps/` (case-sensitive).
- Pages is not yet enabled. Deploy with the official `actions/upload-pages-artifact` and `actions/deploy-pages` actions. If the first deploy fails because Pages is off, tell me to go to **Settings → Pages → Build and deployment → Source: GitHub Actions**, then re-run the workflow.

Work in **milestones**. After each milestone: update the docs, commit with a clear message, push, and **stop and summarise what to test before continuing**. Don't start the next milestone until I confirm.

---

## Constraints

- **Stack**: Vite + React + TypeScript (strict mode), with Zustand for state. Keep dependencies few and purposeful, and record each one and why in `docs/DECISIONS.md`. Expected ones: `nsw-design-system`, `@fontsource/public-sans`, `material-icons` (or the equivalent npm package for Material Icons), `dompurify`, `idb-keyval`, `html-to-image`, `vite-plugin-singlefile`. Write the drag-and-drop with plain pointer events rather than a drag-and-drop library, so it behaves exactly as described below.
- **Two build outputs**, both produced by CI on every push to `main`:
  1. **GitHub Pages site**: deployed by a GitHub Actions workflow to https://lanyard81.github.io/MockUps/, with Vite's `base` set to `/MockUps/` so asset paths work on Pages.
  2. **Single self-contained file**: `npm run build:single` produces `dist-single/mockmaker.html`, with the app, NSW CSS and JS, fonts, icons and component catalogue all inlined. It must work when opened directly from disk (`file://`) with no internet connection. CI uploads it as a build artifact and attaches it to GitHub Releases when a version tag is pushed.
- **Real NSW components only**: use the official NSW markup and CSS classes unchanged. Never restyle or recreate NSW components with custom CSS. Upgrading the `nsw-design-system` package should update the library.
- **Editor styling is separate from NSW styling**: the editor's own UI (panels, toolbars) is warm and flat: soft neutral background, clear hierarchy, generous spacing, subtle borders, with no glassmorphism or heavy shadows. Define its colours, radii and spacing as CSS custom properties on `:root`. NSW CSS must never leak into the editor UI, and editor CSS must never leak into the mockups.
- **Quality**: ESLint + Prettier, Vitest for unit tests, and Playwright for end-to-end tests (listed per milestone). CI runs lint, type-check and tests before deploying.
- Use Australian English in the UI and docs (colour, organise, centre).
- Desktop-first (mouse and trackpad), but it must not break on tablet.
- **Security**: content loaded from saved files or pasted in is untrusted. Sanitise it with DOMPurify before rendering. Only the official NSW JavaScript and the app's own code may run inside frames.

---

## Milestone 0: Repository, tooling and documentation scaffolding

Set up the project with this structure (adjust if there's a better reason, and log it):

```
src/
  app/          App shell, layout, panels
  canvas/       Viewport, device frames (iframes), selection, drop indicators
  catalogue/    Generated component catalogue + curated overrides
  store/        Zustand store, actions, undo history
  layout/       Document tree operations (insert, move, remove, wrap)
  persistence/  Autosave, IndexedDB, file save/open
  export/       PNG, HTML and JSON export
  lib/          Geometry, ids, text fitting
  styles/       Editor theme tokens and global styles
scripts/        Catalogue generation script
public/samples/ Sample mockups
tests/          Vitest unit tests; e2e/ for Playwright
```

Also add the lint, format, test and `build:single` scripts, and the GitHub Actions workflow that runs checks, deploys to Pages and uploads the single-file build (placeholders are fine at this stage, so the pipeline is proven early).

Create:
- `README.md` (replace the placeholder): what it is, how to run it locally (`npm install`, `npm run dev`), how to use the single-file version, how to deploy, how to update the NSW Design System version, and the GitHub Pages link.
- `CLAUDE.md`: project conventions for future sessions. Cover the folder structure, the rule that all document changes go through store actions (never mutate state in components), the "real NSW markup only" rule, naming conventions, the document model, the testing expectations, the milestone workflow, and "never break undo".
- `docs/MILESTONES.md`: all milestones below as checklists, ticked as completed.
- `docs/DECISIONS.md`: a short architecture decision log.
- `docs/DATA-MODEL.md`: the document JSON schema.
- `docs/NSW-DESIGN-SYSTEM.md`: already in the repo; keep it updated with anything you learn from the package.
- `.gitignore`, and `LICENSE` (MIT, crediting the NSW Design System as MIT-licensed third-party code).

---

## Milestone 1: Canvas and device frames

- Infinite canvas with pan (space + drag, middle mouse, trackpad scroll) and zoom (Ctrl/⌘ + scroll, pinch, and a zoom control with 25–400% plus "Zoom to fit").
- Device frames from presets: iPhone (393 wide), Android (412), Tablet (820), Desktop (1440), and Custom. Frames have a name label, can be moved and renamed, and can be added, duplicated and deleted.
- **Each frame is an iframe** (using `srcdoc`) that loads the NSW CSS, fonts and icons and runs the NSW JavaScript, so components render exactly as on a real site and the frame width triggers the real NSW responsive behaviour. The editor talks to the frame directly (same origin).
- Frame height grows with the content. Show a dashed "fold" line at the device's screen height.
- **Edit / Preview toggle**: in Edit mode, clicks select things; in Preview mode, components behave live (accordions open, tabs switch, links are clickable inside the mockup). Re-run `window.NSW.initSite()` (or the relevant component initialisers) after content changes so interactive components work.

## Milestone 2: Component catalogue and library

- **Generate the catalogue at build time** with a script in `scripts/` that reads the `nsw-design-system` package source (`src/components/<slug>/`). Inspect how the markup is stored (for example Handlebars templates with JSON data) and render it to plain HTML. Output a catalogue JSON with, for each component and variant: id, name, category, variant options, HTML, which parts hold editable text, which parts are optional, default properties, and whether it needs JavaScript.
- Keep a hand-curated `catalogue/overrides.ts` for anything the generator can't infer (variant labels, categories, editable regions). Document how to regenerate after upgrading the package.
- Check every component renders correctly by comparing it with its demo page on the docs site. List any component that can't be generated, with the reason, in `docs/NSW-DESIGN-SYSTEM.md`.
- **Library panel** on the left: categories (Layout, Navigation, Content, Forms, Feedback, Media), a search box with instant filtering, and live-rendered thumbnails (render once and cache them). Each component shows its variants (e.g. Buttons: Brand Dark, Brand Dark Outline, Brand Light, White, Danger and so on).
- Include **layout blocks** in the library: Section (full width, with NSW background options), Container (`nsw-container`), and Grid (1–4 columns using the NSW grid classes).

## Milestone 3: Drag, drop and the layout model

Mockups use a **stacked layout**, like a real web page, rather than free positioning:

- A frame contains **sections** stacked top to bottom. Sections contain containers and grids; grid columns and containers hold components. Store this as a tree (see the data model).
- Drag a component or layout block from the library into a frame. While dragging, show a ghost preview and a clear **drop indicator** (a coloured line between items, or a highlighted empty column). Dropping into empty space at the bottom of a frame creates a new section automatically, so a beginner never has to think about sections.
- Drag existing items to reorder them, move them between columns and sections, or move them to another frame.
- Select by clicking (hover outlines show what will be selected; a breadcrumb at the top shows Frame › Section › Grid › Column › Component, and clicking a crumb selects that level). Esc selects the parent, then deselects.
- Delete/Backspace removes; ⌘/Ctrl+D duplicates; copy and paste work within the app and between frames. Alt/Option+↑/↓ moves the selected item up or down.
- **Undo/redo** (⌘/Ctrl+Z, ⌘/Ctrl+Shift+Z) using a state snapshot stack, capped at 100. Every change must be undoable, and one drag counts as one history entry.

## Milestone 4: Editing text and properties

### Inline text editing
- Double-click any editable text (headings, paragraphs, button labels, link text, card titles, list items) to edit it in place. Enter commits single-line text, Shift+Enter adds a line break where allowed, Esc cancels, and Tab moves to the next editable text in the same component. Paste as plain text only. One edit session counts as one undo entry.
- Text naturally grows its component (a longer button label makes a wider button), as on a real site.
- **Shrink text to fit** (optional, per text element in the properties panel): keep the element's current size and reduce the font size until the text fits, down to 75% of the original or 12 px, whichever is larger. If it still doesn't fit, truncate with an ellipsis and show a small warning badge on the element and in the panel. Re-run when the text, the frame width or the fonts change.

### Properties panel (right side, contextual to the selection)
- **Variant switcher**: change a component's variant in place (e.g. a Brand Dark button to Outline) without losing its text.
- **Component options** from the catalogue: e.g. full width, disabled, icon (with a searchable Material Icons picker and before/after position), show or hide optional parts (card image, tag, date), heading level, link URL.
- **Images**: replace any image by uploading or dropping a file. Store images in IndexedDB, deduplicated, and keep alt text editable alongside.
- **Sections**: background (white, off-white, NSW brand dark, brand light and the other NSW theming options), padding size.
- **Grids**: number of columns and column widths per breakpoint.
- **Frames**: name, device preset, width.
- Add unit tests for tree operations and text fitting, and an end-to-end test that drags a button into a frame, edits its label on the canvas, switches its variant, and undoes each step.

## Milestone 5: Layers, shortcuts and polish

- **Layers panel** (a tab beside the library): the document tree for each frame, with drag to reorder, rename, hide/show, and click to select.
- **Quick page parts**: one-click "Add masthead + header", "Add footer" for a frame.
- **Keyboard shortcuts sheet** (press `?`), and a short first-run tour (three or four tips, dismissible, never shown again once closed).
- Right-click menu on canvas items with the common actions.

## Milestone 6: Saving, export and the single-file build

- **Autosave** each mockup to IndexedDB (debounced), and restore on load. Wrap all storage in try/catch.
- **My mockups**: a list of saved mockups with thumbnails, plus new, rename, duplicate and delete (with confirmation).
- **Save and open files** as `.mockup.json`, embedding the images so files are portable between computers.
- **Export**:
  - **PNG** of the selected frame or all frames, at 1× and 2×, capturing the full height.
  - **HTML page**: a standalone, clickable page per frame (or one page linking all frames), using the real NSW CSS and JS. Offer "link to NSW from CDN" (small file) or "fully self-contained" (works offline).
  - **Copy HTML** of a selected component or section, for handing to developers.
- **Single-file version**: confirm `dist-single/mockmaker.html` works fully offline from disk, including saving. Test browser storage under `file://` in Chrome, Edge and Safari; where it isn't available, show a clear banner explaining that work must be saved as a file. Add a Playwright test that opens the single file from disk offline and builds and saves a simple screen.
- Confirm the Pages deployment at https://lanyard81.github.io/MockUps/ works end to end, and put the live link in the README.

## Milestone 7: Templates

- A **Templates** tab in the library, with large thumbnails and search.
- **Official templates**: recreate the NSW templates listed in `docs/NSW-DESIGN-SYSTEM.md` (homepage, content, search, maps, theming and landing pages), using their pages on the docs site as reference. Build each one from catalogue components in the document tree, not as pasted raw HTML, so every part stays editable. Where a template relies on something that can't be reproduced (e.g. a live map), use a clearly labelled placeholder.
- Drag a template onto empty canvas to create a new frame, or onto an existing frame (confirm before replacing its contents).
- **Save as template**: save any frame as my own template, with a name and thumbnail. My templates appear in their own group, can be renamed and deleted, and are included when I export or import mockups.
- Include two or three sample mockups in `public/samples/` built from the templates, loadable from an empty-state button.

## Milestone 8 (optional, confirm first): Click-through prototypes

- In Edit mode, set any button or link to "Go to frame…". In Preview mode, clicking it shows that frame, with a back button, so a set of frames works as a clickable prototype.
- Include the links in the HTML export.

---

## Usability bar (check at every milestone)

- An empty state explains the first step ("Drag a component onto the frame, or start from a template").
- Hover states on everything interactive, and cursors that match the action.
- Drop indicators are always visible and unambiguous; it should be hard to drop something in the wrong place.
- Nothing destructive happens without undo; deleting a mockup or template asks for confirmation.
- Interactions stay smooth with a long page (50+ components per frame and 10+ frames): use `requestAnimationFrame` for drag updates and avoid re-rendering whole frames on every change.

## Data model (starting point; refine and document in `docs/DATA-MODEL.md`)

```json
{
  "version": 1,
  "id": "doc_x",
  "name": "Untitled mockup",
  "nswVersion": "3.x.x",
  "view": { "x": 0, "y": 0, "zoom": 1 },
  "frames": [
    { "id": "f1", "name": "Home", "device": "iphone", "width": 393, "x": 0, "y": 0,
      "root": ["s1"] }
  ],
  "nodes": {
    "s1": { "id": "s1", "type": "section", "props": { "background": "off-white", "padding": "md" },
            "children": ["c1"] },
    "c1": { "id": "c1", "type": "container", "children": ["g1"] },
    "g1": { "id": "g1", "type": "grid", "props": { "columns": [12] }, "children": ["col1"] },
    "col1": { "id": "col1", "type": "column", "children": ["b1"] },
    "b1": { "id": "b1", "type": "component", "componentId": "button", "variant": "brand-dark",
            "props": { "fullWidth": false, "icon": null, "href": "#" },
            "text": { "label": "Get started" },
            "textFit": { "label": "natural" }, "hidden": false }
  },
  "images": { "img_ab12": { "dataUrl": "data:image/…", "alt": "" } }
}
```

Start with Milestone 0 and Milestone 1, then stop and report.
