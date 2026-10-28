# Milestones

Tick items as they are completed. Work stops after each milestone until the user confirms.

## Milestone 0: Repository, tooling and documentation scaffolding

- [x] Vite + React + TypeScript (strict) + Zustand project
- [x] Folder structure from the brief
- [x] ESLint, Prettier, Vitest, Playwright
- [x] `build:single` produces `dist-single/mockmaker.html`
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

## Milestone S6: Convert a frame between kits

- [x] "Convert to SharePoint" and "Convert to NSW" in the frame menu and the frame panel: a converted copy is made beside the original (never destructive, one undo step)
- [x] A mapping table in each kit (`kits/sharepoint/convertFromNsw.ts`, `kits/nsw/convertFromSharePoint.ts`): headings, paragraphs and lists to Text; buttons to Button (links and styles kept); link lists to Quick links; cards to Link cards; hero banners to Hero; images to Image; tables to Text tables; accordions and tabs to collapsible sections, and the reverse
- [x] Page furniture becomes site settings (masthead, header, menu and footer to site title, menu and footer) and back
- [x] Section structure maps to the nearest layout (one, two or three columns, one-third left or right, full width), including column widths; backgrounds map to the nearest equivalent
- [x] Text and pictures carry across; anything without an equivalent becomes a clearly labelled placeholder showing the original name (a SharePoint Placeholder web part; an NSW in-page alert), and a summary lists what could not be mapped
- [x] Tests: the mapping both ways, structure, placeholders, one undo step and an untouched original (Vitest); the flows in the browser (Playwright)

## Milestone R1: Reference layer

- [x] Add a reference image to a frame from the frame's Properties ("Add reference image…"), by dropping an image on the frame, or by pasting one with only a frame selected
- [x] Drawn over the content with pointer events off; default opacity 40%
- [x] Controls: opacity, show/hide (⌘/Ctrl+Shift+R, also in the frame menu), Over / Behind / Beside (full opacity next to the frame), Fit to width or Actual size, x/y offset, replace, remove
- [x] Offers to set the frame width to the screenshot's width (nearest device preset within 5%, 2× captures halved)
- [x] Edit mode only: absent from Preview, thumbnails, PNG and HTML export, build notes and templates
- [x] Stored as `frame.reference` with the image in `doc.images`; document version 3 with migration and validation
- [x] Undoable (an opacity drag is one step); works in the single-file build
- [x] Tests: migration, validation, width detection, actions and undo (Vitest); paste, panel, opacity, placements, shortcut, drop, export unchanged, Preview, reload (Playwright)

## Milestone R2: Page specs (AI-ready format and importer)

- [x] `.page.json` format: a compact nested spec (`format: "mockup-page-spec"`, kit, name, device, settings, page) for one page or a list (`pages`); each kit defines its own section, row and column shapes
- [x] Shared with the templates: NSW specs build through the template DSL (`buildTree`), SharePoint specs through `buildPage`
- [x] `npm run page-spec-docs` generates `docs/PAGE-SPEC.md` (instruction to paste into Claude, then per kit every component with variants, text keys, options and optional parts, the shapes, settings, rules and a worked example); CI fails if it is out of date
- [x] File → "Copy page spec instructions" (per kit) copies the instruction and that kit's reference
- [x] Import: File → Import page spec… (paste or choose a file), drop a `.page.json` on the editor, or paste JSON (⌘/Ctrl+V, detected by its `format`); each page becomes a new, selected frame to the right of the others; one undo step
- [x] Untrusted: `safeJsonParse`, field-by-field checks against the catalogue and settings definitions, size limits, text and links cleaned, the tree built by the kit's own rules
- [x] Forgiving and honest: unknown components become labelled placeholders, unknown variants the default, unknown text keys, options and settings are dropped, items in a place the rules disallow move to the nearest valid place; a report (summary line, expandable details) after import and in the frame's Properties until dismissed
- [x] Export: Copy as page spec / Download (.page.json) from the frame menu and Properties; round trip frame to spec to frame gives the same tree (tested on every template)
- [x] Tests: spec to document for both kits, every forgiving rule, round trip, hostile input, docs up to date (Vitest); import by dialog, paste and drop, the report, undo, export and instructions (Playwright)

## Milestone R3: Import from screenshot (optional, not started)

## Milestone F1: Freeform frames

- [x] A frame can be Flow (sections, grids, columns: as before) or Freeform: set in Properties → Layout, or choose Freeform in the Add frame menu
- [x] On a Freeform frame, drag a component from the library and it lands where it is dropped (centred on the pointer); clicking a tile adds it cascading from the last item
- [x] Press an item and drag to move it anywhere with no snapping (Shift locks one direction); drag the side handles to resize its width; arrow keys nudge (Shift: 10 px); Alt+↑/↓ and the right-click menu (Bring to front, Send to back) change what is in front; Duplicate, Copy/Paste, Delete, text editing and Layers work
- [x] A move, resize or nudge is one undo step, and nothing re-renders while dragging
- [x] Switching a Flow frame to Freeform keeps each component where it is on screen; switching back puts them in reading order, each in its own section (both undoable, after a confirmation)
- [x] Works with both kits; Preview, PNG and HTML export show the board as arranged (HTML export uses absolute positions)
- [x] Document version 4 with migration and validation; `DATA-MODEL.md` updated
- [x] Not on freeform frames, with a reason when tried: sections and grids, page parts, Convert, Copy as page spec, build notes, Save as template
- [x] Tests: boxes, operations, rendering, files and store actions (Vitest); drop, move, shift-lock, resize, nudge, front/back, switching, Preview and reload (Playwright)

## Milestone G1: Freeform alignment

- [x] Pink alignment guides while moving an item: lines up with the frame's edges and middle, or another item's edges and middle (hints only: nothing is forced)
- [x] Optional per-frame grid (8, 16 or 24 px) drawn on the frame, and optional "Snap to guides"; hold Alt while dragging to ignore snapping
- [x] Position panel for an item on a freeform frame: X, Y and width as numbers, align left, centre or right in the frame, bring to front and send to back
- [x] Document version 5 (`frame.freeGrid`, `frame.freeSnap`), migration and validation
- [x] Tests: guide and snap maths, settings, validation (Vitest); guides, grid and the Position panel (Playwright)

## Milestone G2: My components

- [x] Save a component or a whole section for reuse: right-click → Save as component…, or the button in Properties
- [x] A "My components" list at the top of the Library (for the library's kit): click to add next to the selection, or drag onto a frame (freeform frames take components where dropped); delete asks first
- [x] The copy keeps its text and options, gets fresh ids and brings its pictures; one undo step; kits never mix; a section can't go on a freeform frame
- [x] Stored in the browser like saved templates, and carried in `.mockup.json` files (merged without duplicates when opened)
- [x] Tests: saving, adding, dropping, freeform, kit rules, files, validation (Vitest); save, click, drag, reload, delete and kit separation (Playwright)

## Milestone G3: Comments

- [x] Pin a note to a spot on a frame: Comment in the toolbar (or "Add a comment" in the Comments tab), then click; Esc cancels
- [x] Numbered pins on the canvas open a note: edit the text, mark it Done or Reopen, delete it; an empty note is not kept
- [x] Comments tab: the list (open notes, or with Show done), click to open one, copy or download all as Markdown
- [x] PNG export can mark the open comments on the image (option in the Export dialog)
- [x] Saved with the mockup (document version 6), shown while editing only: never in Preview or HTML export; deleting a frame takes its notes with it; every change is one undo step
- [x] Tests: actions, undo, validation, Markdown (Vitest); pinning, list, done, delete, undo, Esc, reload, Preview, Markdown download and PNG marks (Playwright)

## Milestone G4: Share as a viewer file

- [x] File → Export… → "Viewer file (to share)": the whole mockup in one self-contained, read-only HTML file
- [x] Tabs for every frame, working click-through links between frames with a Back button, wide frames scaled to fit the window
- [x] Optional comments: pins on the frame and a list, shown on request
- [x] Kit styles, scripts and fonts are embedded once per kit; no network needed to open it (tested offline from disk); text in the mockup can't break out of the file
- [x] Tests: contents, links, comments, escaping, no external references (Vitest); export, open offline, tabs, click-through, Back, comments (Playwright)
- [ ] A hosted link people can open from a URL: needs a server, which this offline-first app doesn't have (see `DECISIONS.md` 057)

## Milestone G5: Search everything (⌘K)

- [x] ⌘/Ctrl+K (or the Search button) opens a palette over the editor; it opens from anywhere, even while typing, and the same key closes it
- [x] Finds actions (undo, zoom, export, theme, add a frame of a device, switch layout...), frames (jump to one), components of the selected frame's kit (every variant), templates and samples, your saved components and templates, and comments; arrows move, Enter runs, Esc closes
- [x] Words can be in any order; matches at the start of a word rank first
- [x] Tests: ranking (Vitest); finding and running, keys, toggling, nothing found (Playwright)

## Milestone G6: Better click-through prototypes

- [x] A start frame: set it from the frame's menu or Properties (the first frame is the start by default); a "▶ Start" badge marks it
- [x] "▶ Play" in the toolbar (and ⌘K) runs the click-through full screen from the start frame; Esc closes
- [x] A transition on each "Go to frame" link (None, Fade, Slide in, Rise); going Back has its own motion; transitions honour reduced motion
- [x] The viewer file opens on the start frame and keeps each link's transition
- [x] Hover and tab states already work live in Preview and Play because components run the kit's own scripts
- [x] Document version 7 (`startFrameId`), migration and validation
- [x] Tests: start frame, transitions, validation, viewer (Vitest); play, transition, back, start frame and undo (Playwright)

## Milestone G7: Version history

- [x] File → Version history… (and ⌘K): save a named version of the mockup, kept in this browser (the newest 30 per mockup)
- [x] Each version says what has changed since ("1 frame changed, 1 frame added"), with the detail one click away: frames added, removed, renamed or resized, components added, removed or edited, rearranged pieces, comments
- [x] Restore puts a version's content back as one undo step (after saving what was there first as "Before restoring…"); "Open as new mockup" makes a separate copy; delete removes one
- [x] Versions go when their mockup is deleted; they are not part of the mockup file
- [x] Tests: saving, limits, deleting, restoring, comparing (Vitest); save, compare, restore, undo, reload, open as new, delete (Playwright)

## Milestone G8: Responsive preview

- [x] "Check responsive layouts…" (frame menu, Properties, ⌘K): the frame's page at phone (393), tablet (820) and desktop (1440) widths side by side, each drawn by the kit as that device would
- [x] Problems listed under each width: content wider than the screen (the page would scroll sideways) and, on a phone, buttons and links smaller than 24px; each names the components involved and selects one in the editor when clicked
- [x] A freeform frame says it has a fixed width instead
- [x] Tests: the checks (Vitest); three widths, an overflow found and selected, freeform message (Playwright)

## G9: Accessibility checks

- [x] "Check accessibility…" (frame context menu, Frame panel, command palette) lists problems in a frame's page: skipped heading levels, missing or repeated h1, empty headings, links and buttons with no name, form fields with no label, uploaded pictures with no alt text, and text with too little colour contrast (WCAG AA, 4.5:1, or 3:1 for large text).
- [x] Each problem names the component; click it to select it in the editor.

## G10: Quick wins

- [x] Add frame menu: A4 page, social post, social card, 16:9 and 4:3 slides (`lib/frameSizes.ts`).
- [x] Right-click a frame → "Duplicate as phone / tablet / desktop" copies it at that device's width.
- [x] Export → PDF document: one page per frame, as tall as the frame (`export/pdf.ts`, no library).
- [x] The empty state in the Properties panel welcomes you and offers the sample mockups.
- [x] A Flow / Freeform toggle in the toolbar (before the ? button) sets the default layout for new frames and new mockups. Remembered per browser (`lib/layoutDefault.ts`); the Add frame menu toggle changes the same setting.

## K3: Simple kit

- [x] A third library beside NSW and SharePoint: **Simple (generic)**, a neutral, brand-free set of everyday parts for quick ideas and wireframes (`src/kits/simple/`).
- [x] 38 components in seven groups: text (headings, paragraphs, quotes, lists, badges, dividers and spacers), actions (buttons, button pairs, links), content (cards, heroes, callouts, statistics, features, accordion, table, item lists, profiles, steps, testimonials, pricing, empty state, progress), forms (fields, checkboxes and switches, sign-in and contact forms), navigation (header bar, footer, breadcrumb, tab bar, side menu, pagination) and media (images, video, logo strip, wireframe boxes).
- [x] Sections with one, two or three columns or a narrow/wide split; background (none, soft grey, dark, accent), spacing and edge-to-edge options; header bar and footer sit on the page itself, with one-click "Add header bar" and "Add footer".
- [x] Accent colour for all Simple frames (Properties, any Simple frame) with a per-frame override; text colour on the accent follows its brightness.
- [x] Seven page templates (landing, sign in, dashboard, article, pricing, phone home, contact), page-spec import and export, and the reference in `docs/PAGE-SPEC.md`.

## Review milestones (from `docs/review/FIX-PLAN.md`)

### Q1: Plain-language pass

- [x] One glossary: **page** (was frame/screen), **Stacked / Free** layout (was Flow/Freeform), **Present** (was Play), **prototype links** (was click-through), **page description** (was page spec) in the UI, tour, menus, palette, dialogs, shortcuts and messages.
- [x] Honest messages: an import with nothing usable says so; the accessibility and responsive checks say "nothing to check yet" on an empty page; disabled Convert and Save as template say why; grammar fixes ("Add an iPhone page", SharePoint "Add one column").
- [x] The layout toggle in the top bar is labelled "New pages", with explanations in its tooltips.

### Q2: Colour contrast

- [x] Primary buttons, selected page-name chips and the icon picker use a new `--dd-accent-fill` (4.7:1 and 5.9:1 with white) instead of the brighter accent; muted and placeholder text tokens raised to at least 4.5:1 in both themes.
- [x] Simple kit: button text is white or near-black, whichever reads better (every accent on offer reaches 4.5:1); accent-coloured text (links, outline buttons, tabs, badges) uses a darkened accent that reaches 5:1 on white.
- [x] axe-core (dev dependency) checks colour contrast on the editor in both themes; unit tests check the tokens and every Simple accent.

### M1: Keyboard and screen reader basics

- [x] Layers is a real tree: one Tab stop, arrows move, ← → close/open, Enter selects, F2 renames, Delete deletes, Alt+↑/↓ reorders, the menu key opens the context menu.
- [x] `]` and `[` select the next or previous page or item in reading order (also in the command palette); Ctrl/⌘ X cuts.
- [x] Page names are focusable buttons (Enter selects, F2 renames, menu key opens actions).
- [x] The left tabs are a tab list with arrow keys, Home and End; the More button is part of it.
- [x] File and Add page menus: arrow keys, Home/End, Esc returns focus; the Add page layout and style toggles sit above the menu, not inside it.
- [x] Space presses a focused button, tab, menu item or tree row (it only pans when nothing else wants it).
- [x] Skip links (canvas, Properties, library), landmarks (`aside`, `main`, an h1), and the page behind a dialog is inert while it is open.
- [x] The toast is a permanent polite live region, stays 8 seconds and while hovered or focused.
- [x] axe-core runs on 15 screens and dialogs: no critical or serious violations.

### M2: Never lose work silently

- [x] Leaving the page (reload, close, switch away) while a save is waiting saves now and writes a synchronous recovery copy; the next start restores it and says so. Saves wait 400 ms instead of 700.
- [x] Two tabs on the same mockup: the tab that didn't save is told ("changed in another tab"), pauses saving, and offers "Load the other tab's version" or "Keep this version".
- [x] File → New mockup asks first when the open one has content, and says it stays in My mockups. Opening a file or starting a new mockup saves the one being left first.
- [x] Deleting a page or an item says so, with "Bring it back"; deleting a saved version asks first.
- [x] The save status keeps its width (the top bar no longer shifts on autosave) and its tooltip says "Saved in this browser at 10:42". The storage banner now tells apart "this browser won't keep data" from "the last save failed", and clears when saving works again.
- [x] The shareable viewer file leaves comments out unless "Include comments" is ticked (default off).
