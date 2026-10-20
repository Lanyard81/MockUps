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

- [ ] Catalogue generation script (see the markup source note in `NSW-DESIGN-SYSTEM.md`)
- [ ] `catalogue/overrides.ts` and regeneration docs
- [ ] Every component checked against its docs-site demo; failures listed
- [ ] Library panel: categories, search, cached thumbnails, variants
- [ ] Layout blocks: Section, Container, Grid (1–4 columns)

## Milestone 3: Drag, drop and the layout model

- [ ] Drag from library with ghost preview and drop indicator
- [ ] Auto-create a section when dropping into empty space
- [ ] Reorder and move items between columns, sections and frames
- [ ] Selection with hover outlines, breadcrumb, Esc to select parent
- [ ] Delete, duplicate, copy/paste, Alt+↑/↓
- [ ] Undo/redo for every tree change (one drag = one entry)

## Milestone 4: Editing text and properties

- [ ] Inline text editing
- [ ] Shrink text to fit, with warning badge
- [ ] Properties panel: variant switcher, component options, images, sections, grids, frames
- [ ] Unit tests for tree operations and text fitting; e2e drag, edit, switch variant, undo

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
