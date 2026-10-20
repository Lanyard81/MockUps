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

- [x] Layers panel (a tab beside the library): the tree for every frame; click to select (and the canvas selection highlights its row); drag to reorder, nest or move to another frame, with the tree rules enforced; double-click to rename; hide and show; collapse and expand
- [x] Quick page parts: "Add masthead + header" and "Add footer", in the library and in the frame panel; also in the frame's right-click menu
- [x] Keyboard shortcuts sheet (`?`, or the button in the toolbar)
- [x] First-run tour: four tips, dismissible, never shown again once closed
- [x] Right-click menu on canvas items, layers and frames
- [x] Fixed: duplicate element ids when a component is used more than once (ids are unique per component, references follow)
- [x] Tests: layer drop rules, ids, store actions (Vitest); layers, page parts, menus, sheet, tour and ids (Playwright)

## Milestone 6: Saving, export and the single-file build

- [x] Autosave to IndexedDB (debounced, with the camera position), restored on load; all storage wrapped in try/catch
- [x] My mockups: list with thumbnails; new, open, rename, duplicate, delete (with confirmation)
- [x] Save and open `.mockup.json` with images embedded (and the user's templates); strict validation of anything opened
- [x] Export: PNG of a frame or all frames at 1× or 2× at full height; HTML pages (CDN or fully self-contained; several frames give a zip with an index page); Copy HTML of a component or section
- [x] Single file works fully offline from disk, including autosave, reload and Save to file (Playwright test)
- [x] Storage banner when the browser won't keep data, with Save to file
- [ ] Storage under `file://` checked in Chrome only (Edge and Safari can't be run from this build environment; the banner covers them if storage is refused)
- [x] GitHub Pages deployment: the `deploy-pages` job succeeds on every green push to `main` (checked in the Actions history); the live link is in the README

## Milestone 7: Templates

- [x] Templates tab
- [x] Official NSW templates built from catalogue components
- [x] Drop a template to create or replace a frame
- [x] Save as template; my templates
- [x] Sample mockups

## Milestone 8 (done): Click-through prototypes

- [x] "Go to frame…" links, back button in Preview
- [x] Links in HTML export

# Style kits and a SharePoint kit

Brief: `docs/SHAREPOINT-PROMPT.md`. Reference: `docs/SHAREPOINT-OOB.md`. The brief asked for S1 and S2 before Milestone 5; they were started after Milestone 8 instead (so S1 retrofitted kit awareness into Milestones 5–8). All milestones were then authorised in one go.

## Milestone S1: Kit architecture

- [x] `Kit` interface (`src/kits/types.ts`) and registry (`src/kits/index.ts`): shell, catalogue, layout schema, renderers, settings, templates, samples, export
- [x] NSW moved into `src/kits/nsw/` with no visible change
- [x] Layout rules read from the kit schema (`layout/ops.ts` stays the one place that applies them)
- [x] Document version 2: `kitId` per frame, `defaultKitId`, `kitVersions`, `kitSettings`; v1 → v2 migration
- [x] Properties panel builds kit settings from data (`SettingsPanel`)
- [x] Catalogue generator and validator run per kit
- [x] Tests: registry, schema-driven ops, migration, kit settings, store; all earlier tests pass (import paths and a `kitId` on test frames only)

## Milestone S2: Switching between kits

- [x] Every frame belongs to one kit; one mockup can hold NSW and SharePoint frames side by side
- [x] Add frame asks for the kit (and device) and remembers the last choice; a new mockup starts in it
- [x] Library kit switcher (NSW | SharePoint); it follows the selected frame and can be switched to browse the other kit
- [x] Adding, dragging, moving or pasting something from the other kit into a frame is refused with a clear message ("This is a SharePoint frame — switch the library to SharePoint, or convert the frame.")
- [x] Frame label kit badge; the frame's properties name its kit
- [x] Templates follow the library's kit; dropping a template of another kit on a frame says the frame will change kit
- [x] Minimal SharePoint kit registered (Text web part, one-column section) so switching can be tested end to end
- [x] Tests: store guards (Vitest); frames in each kit, the library following selection, refused drops, undo (Playwright)

## Milestone S3: SharePoint kit foundations

- [x] Theme: ready-made themes (Blue, Teal, Orange, Red, Purple, Green, Grey, Dark yellow, Dark blue), an editable Organisation theme and a custom theme, all generated into the full set of theme slots; light and dark; a document theme with an optional different theme per frame
- [x] Site settings per frame: site type (Communication or Team), suite bar, header (Minimal, Compact, Standard, Extended; background; image and overlay; site title; logo, logo thumbnail and logo alignment), navigation (Mega menu or Cascading, up to three levels, editable), footer (Communication only; Simple or Extended; links), page title area (four layouts, alignment, topic, author, date)
- [x] Text editable in place on the canvas: site title, menu labels, footer links and name, page title, topic, author, date
- [x] Sections: one, two, three columns, one-third left and right, full width, vertical, flexible (approximation); changing a layout moves content as SharePoint does; backgrounds (None, Neutral, Soft, Strong, Gradient, Image); collapsible sections with title and options, working in Preview
- [x] Rules enforced and explained: full-width sections need a communication site; one vertical section per page and not with a full-width section; a flexible section can't be changed; footer and mega menu are Communication only
- [x] Responsive: columns stack and the menu collapses on narrow frames; the vertical section moves below the content
- [x] Menus open in Preview
- [ ] Comparison with reference screenshots: none supplied yet; open questions are listed in `SHAREPOINT-OOB.md`
- [x] Tests: theme generation, site rules, section layouts, column counts, settings paths, rendering and store actions (Vitest); header, theme, site type, section layouts, in-place editing, menus, collapsing and phone layout (Playwright)

## Milestone S4: Core web parts

- [x] Text (paragraph, headings, pull quote, lists, table with styles, alignment, theme colour text, highlight), Image (aspect ratio, caption, uploaded picture), Image gallery (Brick, Grid, Carousel), Button, Call to action, Link, Divider, Spacer
- [x] Hero (Tiles, Layers, 1 to 5 items), Quick links (Compact, Filmstrip, Grid, Button, List, Tiles; per-link Fluent icon picker; alignment), News (Top story, List, Side-by-side, Hub news, Carousel, Tiles, Filmstrip; compact view), Events (Compact, Filmstrip), Highlighted content (Cards, List, Carousel, Filmstrip), People (Compact, Descriptive)
- [x] Document library, List, Countdown timer, Page properties
- [x] "Show title and commands" (title and "See all") on the web parts that have them
- [x] Carousels, filmstrips and collapsible content work in Preview
- [x] New option kinds: `choice` (one of several looks) and `iconSlot` (an icon from the kit's own set); options that do nothing in the chosen layout are hidden
- [x] Catalogue validation (every class defined by the kit's CSS), unit tests for every web part and option, and Playwright tests adding every layout, switching layout, editing text, icons and Preview behaviour

## Milestone S5: More web parts, templates and SharePoint-specific export

- [x] Quick chart (column and pie, with editable data) and 21 more web parts as static or placeholder previews marked with their fidelity: Weather, World clock, Sites, Recent documents, Site activity, Saved for later, Group calendar, Organisation chart, Markdown, Code snippet, Embed, YouTube, File and media, Microsoft Forms, Power BI, Power Apps, Maps, Planner, Conversations, Highlights, Agent link
- [x] Excluded and listed: My feed, Stream (classic), Kindle instant preview, Assignments, Connectors
- [x] Seven SharePoint templates in the Templates tab: Communication site Topic, Showcase, Blank; Team site home; Intranet home; News article; Department landing page
- [x] "Copy as SharePoint build notes" and "Download build notes (.md)" for a SharePoint frame (frame menu and frame properties)
- [x] PNG and HTML export work for SharePoint frames (kit CSS and script included; tested)
- [x] Frame menu page parts now come from the kit (NSW masthead and footer no longer appear on SharePoint frames)
- [x] Tests: charts, templates (including the section rules), build notes (Vitest); templates, chart editing, build notes and exports (Playwright)
