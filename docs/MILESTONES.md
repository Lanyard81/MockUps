# Milestones

Tick items as they are completed. Work stops after each milestone until the user confirms.

## Milestone 0: Repository, tooling and documentation scaffolding

- [x] Vite + React + TypeScript (strict) + Zustand project
- [x] Folder structure from the brief
- [x] ESLint, Prettier, Vitest, Playwright
- [x] `build:single` produces `dist-single/nsw-mockup-builder.html`
- [x] GitHub Actions: checks, Pages deploy, single-file artifact, release attachment on tags
- [x] README, CLAUDE.md, MILESTONES, DECISIONS, DATA-MODEL, NSW-DESIGN-SYSTEM, LICENSE, .gitignore
- [ ] GitHub Pages enabled in repository settings (needs the owner: Settings → Pages → Source: GitHub Actions)

## Milestone 1: Canvas and device frames

- [x] Infinite canvas: pan (space + drag, middle mouse, scroll), zoom (Ctrl/⌘ + scroll, pinch), 25–400% zoom control, Zoom to fit
- [x] Device presets: iPhone 393, Android 412, Tablet 820, Desktop 1440, Custom
- [x] Frames: name label, move, rename, add, duplicate, delete
- [x] Each frame is a `srcdoc` iframe running the real NSW CSS, fonts, icons and JavaScript
- [x] Frame height grows with content; dashed fold line at the device screen height
- [x] Edit / Preview toggle; `NSW.initSite()` re-run after content changes
- [x] Undo/redo for frame changes (one drag = one entry)
- [x] Tests: geometry, tree, store (Vitest); canvas and single-file (Playwright)

## Milestone 2: Component catalogue and library

- [x] Catalogue generation script (`npm run catalogue`): hand-written markup validated against the installed package (see `DECISIONS.md` 009–011)
- [x] `catalogue/overrides.ts` and regeneration docs (README, `NSW-DESIGN-SYSTEM.md`)
- [x] All 46 components covered, plus Heading, Paragraph and List text blocks; 103 variants
- [ ] Every component compared with its docs-site demo page (not possible from the build sandbox: the docs site is blocked. Checked against the package CSS and by eye instead; **needs a check on your side**)
- [x] Components that can't be shown faithfully are listed in `NSW-DESIGN-SYSTEM.md`
- [x] Library panel: categories, instant search, cached live thumbnails, variants
- [x] Layout blocks: Section, Container, Grid (1–4 columns)
- [x] Click a variant to add it to the selected frame (drag and drop is Milestone 3)
- [x] Tests: catalogue and store (Vitest); library, adding and layout blocks (Playwright)

## Milestone 3: Drag, drop and the layout model

- [x] Drag from the library (components and layout blocks) with a ghost label and a drop indicator
- [x] Drop indicator: a line between items, a highlighted empty column, and the target container outlined
- [x] Dropping into empty space (below content, between sections, or an empty frame) creates a section automatically
- [x] Drag existing items to reorder, move between columns and sections, or move to another frame
- [x] Click to select; hover outlines; breadcrumb Frame › Section › Grid › Column › Component; Esc selects the parent, then the frame, then nothing
- [x] Delete/Backspace, ⌘/Ctrl+D, copy and paste (within and between frames), Alt+↑/↓
- [x] Undo/redo for every tree change; one drag is one history entry; Esc cancels a drag
- [x] Tests: tree operations and store actions (Vitest); drag, select and shortcuts (Playwright)

## Milestone 4: Editing text and properties

- [x] Inline text editing: double-click text (or Enter / F2 on a selection); Enter commits, Shift+Enter adds a line break where allowed, Esc cancels, Tab moves to the next text in the component, paste is plain text, one session is one undo step
- [x] Text grows its component naturally
- [x] Shrink text to fit, per text element: keeps the box, reduces the font size to at most 75% or 12px, then truncates with an ellipsis and a warning badge (on the canvas data attribute and in the panel); re-runs on text, frame width and font changes
- [x] Properties panel (right): contextual to the selection
  - [x] Variant switcher (text is kept)
  - [x] Component options: full width, small, disabled, link address, heading level, show/hide optional parts
  - [x] Searchable Material Icons picker with before/after position
  - [x] Images: upload or drop a file (on the picture or the panel), deduplicated and mirrored to IndexedDB, alt text alongside
  - [x] Sections: background (10 NSW options) and padding; containers: edge to edge
  - [x] Grids: 1–6 columns, per-breakpoint column widths; single columns too
  - [x] Frames: name, device preset, width (the old frame bar is gone)
- [x] Tests: tree operations (grid columns), text fitting, rendering, images, store actions (Vitest); drag a button in, edit its label on the canvas, switch variant and undo each step, plus the rest of the editing features (Playwright)

## Milestone 5: Layers, shortcuts and polish

- [ ] Layers panel
- [ ] Quick page parts (masthead + header, footer)
- [ ] Shortcuts sheet (`?`) and first-run tour
- [ ] Right-click menu

## Milestone 6: Saving, export and the single-file build

- [ ] Autosave to IndexedDB, restore on load
- [ ] My mockups list
- [ ] Save and open `.mockup.json` with embedded images
- [ ] Export: PNG, HTML (CDN or self-contained), copy HTML
- [ ] Single-file offline test including saving; `file://` storage banner
- [ ] Pages deployment confirmed, live link in README

## Milestone 7: Templates

- [ ] Templates tab
- [ ] Official NSW templates built from catalogue components
- [ ] Drop a template to create or replace a frame
- [ ] Save as template; my templates
- [ ] Sample mockups

## Milestone 8 (optional, confirm first): Click-through prototypes

- [ ] "Go to frame…" links, back button in Preview
- [ ] Links in HTML export
