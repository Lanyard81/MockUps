# Feature brief: style kits, and a SharePoint (out of the box) kit

The app works today with one style library: the NSW Design System. Add a second one, **SharePoint Online (modern, out of the box)**, so I can mock up intranet pages as well as NSW web pages, and switch between the two.

Read these first: `CLAUDE.md`, `docs/BUILD-PROMPT.md` (the original brief, still in force), `docs/MILESTONES.md`, `docs/DECISIONS.md`, `docs/DATA-MODEL.md`, and **`docs/SHAREPOINT-OOB.md`** (what SharePoint offers out of the box, with sources; items marked "verify" need checking).

Work in the same milestone workflow as before: after each milestone update the docs, commit, push, and **stop and summarise what to test**. Don't start the next milestone until I confirm.

## Where this fits

- Do **Milestones S1 and S2 next, before Milestone 5**, so that Milestones 5–8 (layers, saving, export, templates, prototypes) are built kit-aware from the start. Then ask me whether to do S3–S6 straight away or finish Milestones 5–8 first.
- Add these milestones to `docs/MILESTONES.md`, and update `CLAUDE.md`, `DECISIONS.md` and `DATA-MODEL.md` as you go.

---

## Principles

- **A kit is a self-contained style library**: everything that is specific to a design system lives in its kit folder; the editor core (canvas, drag and drop, selection, undo, text editing, properties panel, persistence, export) stays kit-agnostic.
- **The NSW kit must behave exactly as it does now.** S1 is a refactor: no visible change, and every existing test still passes.
- **Honest SharePoint fidelity.** SharePoint's page markup and CSS aren't published, so the SharePoint kit is a **lookalike built on Fluent UI design tokens**, not real SharePoint code. Label it "SharePoint-style" in the UI. Aim for something a SharePoint user would recognise at a glance and that a site owner could rebuild in SharePoint using only out-of-the-box features. Never show a layout or option SharePoint doesn't offer out of the box.
- **Licensing**: no Microsoft or SharePoint logos in mockups or the UI. Don't bundle Segoe UI (use a font stack: `"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif`). Use Fluent System Icons (MIT) for icons, never the Fabric MDL2 icon font. Record each choice in `DECISIONS.md`.
- **Single file still works offline**: the SharePoint kit's CSS, icons, sample images and fonts (apart from the system fallback) must be bundled; no runtime network requests. Generate sample images (placeholder photos, logos, avatars) locally, e.g. as SVG illustrations or gradients.
- All existing rules in `CLAUDE.md` still apply (store actions only, never break undo, sanitise untrusted content, stable Zustand selectors, and so on). Rule 3 ("real NSW markup only") becomes "each kit's components use only that kit's markup rules", and stays exactly as strict for NSW.

---

## Milestone S1: Kit architecture (refactor, no visible change)

- Introduce a **`Kit` interface** and move everything NSW-specific into `src/kits/nsw/`. A kit provides at least:
  - id, name, short label, version, licence note;
  - the **frame shell** (CSS, JS, fonts, and an `init(frameWindow)` hook run after content changes, e.g. `NSW.initSite()`);
  - its **catalogue** (components, variants, options, editable text, optional parts, categories) and the generator/validator for it;
  - its **layout schema**: which node types exist, what can contain what, and the default structure created when something is dropped into empty space. Move today's NSW rules out of `src/layout/ops.ts` into the NSW kit's schema; `ops.ts` stays the single place that applies rules, now reading them from the kit.
  - **renderers** for layout nodes (sections, containers, grids, columns) and for page chrome;
  - section, layout and frame-level **settings definitions** (e.g. section backgrounds), so the properties panel builds itself from data, as component options already do;
  - **templates** (later milestones) and **thumbnails**;
  - device presets, if the kit needs different ones (default: the shared ones).
- A **kit registry** (`src/kits/index.ts`) lists available kits. Adding a third kit later should mean adding a folder and one registry line.
- **Data model**: bump `version` to 2. Each frame gets `kitId`; the document gets `defaultKitId` and `kitSettings` (per kit: theme, site chrome and so on). `nswVersion` becomes per-kit version info. Write a v1 → v2 migration (all frames become `nsw`) with unit tests, even though nothing is persisted yet, so files from any earlier build load.
- Tests: all existing unit and e2e tests pass unchanged (only import paths may change). Add unit tests for the registry, migration, and that ops rules come from the kit schema.

## Milestone S2: Switching between kits

- **Per-frame kits**: every frame belongs to one kit, so one mockup can hold NSW and SharePoint screens side by side for comparison.
- **New frame**: the add-frame control asks for the kit (and device), remembering my last choice. The document's default kit is used for the first frame of a new mockup.
- **Library**: a kit switcher at the top (segmented control: "NSW" | "SharePoint"). The library follows the selected frame's kit automatically; I can switch tabs to browse the other kit, but dragging a component into a frame of a different kit is blocked, with a clear message ("This is a SharePoint frame — switch the library to SharePoint, or convert the frame").
- **Frame label** shows a small kit badge. The properties panel shows the frame's kit and its kit-specific settings.
- **Editor UI** keeps its own warm, flat styling regardless of kit.
- Until S3 lands, register a minimal SharePoint kit stub (one Text web part and a one-column section) so switching can be tested end to end.
- Tests: e2e for creating frames in each kit, the library following selection, the cross-kit drop being blocked, and undo of each step.

## Milestone S3: SharePoint kit foundations (site chrome, themes, sections)

Build the kit in `src/kits/sharepoint/`, styled with Fluent UI design tokens. Prefer a lightweight dependency (e.g. Fluent UI's theme generator or `@fluentui/tokens`) over the full React component library, since frames render plain HTML; record the choice.

**Theme** (per document for the SharePoint kit, overridable per frame):
- The default themes listed in `SHAREPOINT-OOB.md` (verify names and colours), each generating the full set of theme slots from its primary colour the way SharePoint does.
- **Custom theme**: pick a primary colour (and optionally text and background colours) and generate the palette. Include a quick "Organisation theme" preset I can edit.
- Light and dark themes both work.

**Site settings** (per frame, so different frames can show different sites):
- **Site type**: Communication or Team. This drives what's allowed (footer, full-width sections, navigation orientation and mega menu).
- **Suite bar**: optional, generic and unbranded (app launcher dots, search box, initials avatar). Toggle on by default.
- **Header**: layout Minimal / Compact / Standard / Extended; background (theme colour options or an uploaded image with overlay); site title text and show/hide; logo upload and logo thumbnail; logo alignment on Extended.
- **Navigation**: editable items with up to three levels; Mega menu or Cascading (mega menu only where allowed); horizontal or vertical as the site type requires; show/hide. Menus open in Preview mode.
- **Footer** (Communication only): show/hide, Simple or Extended layout, background, logo, display name, up to eight links.
- **Page title area**: layouts Image and title, Plain, Colour block, Overlap; alignment; topic header, author and published date toggles.
- Editable text everywhere it would be editable in SharePoint (site title, nav labels, footer links, page title).

**Sections** (the kit's layout schema):
- One column, Two columns, Three columns, One-third left, One-third right; Full-width (Communication only); Vertical section (right side, one per page, not with a full-width section, moves below the content under 1024 px); Flexible section (simplified: web parts placed on a grid and resizable; label it as an approximation in the panel and in `SHAREPOINT-OOB.md`).
- Changing a section's layout moves content the way SharePoint does (rightmost column content moves left; going to one column stacks the rest underneath).
- Backgrounds: none plus the theme-derived options, gradient, or image with automatic overlay. Respect the web parts that always keep the page background.
- Collapsible sections: title (with heading level), divider, icon left or right, expanded or collapsed by default — working in Preview mode.
- Responsive behaviour on phone and tablet frames: columns stack, header and navigation collapse to a mobile layout. Use SharePoint's breakpoints as far as they can be verified; record assumptions.

**Reference screenshots**: I'll add screenshots from our tenant to `docs/sharepoint-reference/`. Compare the kit against them where available, and list differences you couldn't resolve in `SHAREPOINT-OOB.md`.

Tests: unit tests for theme generation, section layout changes and the site-type rules; e2e for changing header, navigation, theme and section layouts, with undo.

## Milestone S4: Core web parts

Each web part is a catalogue component with layout variants, options from data, editable text, and realistic sample content (generated images, plausible names and dates). Each shows its web part title with "See all" where SharePoint does, controlled by a "Show title and commands" option.

- **Text**: headings (verify the current heading set), paragraph, pull quote, bullet and numbered lists, simple table with SharePoint table styles, alignment, highlight and font colours from the theme.
- **Image** (caption, alt text, aspect ratio, uploaded image), **Image gallery** (Brick, Grid, Carousel).
- **Button**, **Call to action**, **Link** (preview card), **Divider**, **Spacer**.
- **Hero**: Tiles and Layers, 1–5 items, each with image, title, link and call to action; works full width.
- **Quick links**: Compact, Filmstrip, Grid, Button, List, Tiles, with each layout's options (icons or images, descriptions, alignment) and per-link icon picker (Fluent icons).
- **News**: Top story, List, Side-by-side, Hub news, Carousel, Tiles, Filmstrip; number of items; compact view; editable sample stories.
- **Events**: Filmstrip and Compact (verify); **Highlighted content**: Cards, List, Carousel, Filmstrip (verify); **People**: Compact and Descriptive (verify), with initials avatars.
- **Document library** and **List**: static views with file-type icons, columns and a command bar; editable rows.
- **Countdown timer**, **Page properties**.
- Carousels, filmstrips and collapsible content work in Preview mode.
- Tests: catalogue validation (every variant renders, no unknown classes outside the kit's CSS), unit tests for option application, and e2e for adding each web part, switching its layout and editing text.

## Milestone S5: More web parts, templates and SharePoint-specific export

- **More web parts**, as static or placeholder-style previews marked with their fidelity (as the NSW catalogue does): Quick chart (column and pie, with editable data), Weather, World clock, Sites, Recent documents, Site activity, Saved for later, Group calendar, Organisation chart, Markdown, Code snippet, Embed, YouTube, File and media, Microsoft Forms, Power BI, Power Apps, Maps, Planner, Conversations and Highlights (Viva Engage), Agent link. Leave out retired or niche ones (My feed, Stream classic, Kindle instant preview, Assignments, Connectors) and list them as excluded.
- **Templates** for the SharePoint kit (plugging into Milestone 7's Templates tab): pages in the style of the Communication site Topic, Showcase and Blank home pages, a Team site home page, a hub/intranet home page, a news article page, and a department landing page. Build them from kit components so everything stays editable.
- **"Copy as SharePoint build notes"**: for a SharePoint frame, export a plain-English Markdown spec someone can follow in SharePoint: site settings (theme, header, navigation, footer), then each section with its layout and background, and each web part with its layout and options and content, in order. Also available as a download.
- PNG and HTML export work for SharePoint frames (they come from Milestone 6; make sure the kit CSS is included).

## Milestone S6 (optional, confirm first): Convert a frame between kits

- "Convert to SharePoint" / "Convert to NSW" on a frame creates a **converted copy** next to the original (never destructive; one undo step).
- Use a mapping table in each kit (e.g. NSW heading/paragraph/list → Text web part; button → Button; link list → Quick links List; cards grid → Quick links Tiles or Highlighted content; hero banner → Hero; image → Image; table → Text table; accordion → collapsible section). Anything without an equivalent becomes a clearly labelled placeholder showing the original component's name, and a summary lists what couldn't be mapped.
- Text and images carry across; section structure maps to the nearest layout.

---

## Usability bar (as before, plus)

- It is always obvious which kit a frame and the library are showing.
- SharePoint options use SharePoint's own names (so the build notes match what site owners see in SharePoint), with a one-line explanation on hover where the name isn't self-explanatory.
- Options SharePoint wouldn't allow in the current context (e.g. a footer on a Team site) are hidden or disabled with a reason, never silently ignored.
