# Feature brief: working from screenshots

I want to recreate existing screens (a current NSW page, our SharePoint intranet, a screen someone sent me) in the app quickly. Add three things, in order:

1. **R1, Reference layer**: put a screenshot on a frame as a tracing guide, and rebuild it by hand on top.
2. **R2, Page specs**: a compact JSON "page spec" format that Claude (in a normal chat) can write from a screenshot, plus an importer in the app.
3. **R3, Import from screenshot** (optional, confirm first): the app sends a screenshot to the Claude API and gets a page spec back, all in one step.

Read `CLAUDE.md`, `docs/MILESTONES.md`, `docs/DECISIONS.md` and `docs/DATA-MODEL.md` first. Same workflow as before: after each milestone update the docs (including adding these milestones to `MILESTONES.md`), commit, push, and **stop and summarise what to test**. Don't start the next milestone until I confirm. Every rule in `CLAUDE.md` still applies, and both kits (NSW and SharePoint) must be supported throughout.

---

## Milestone R1: Reference layer

- **Add a reference image to a frame**: from the frame's properties panel ("Add reference image"), by dropping an image file on a selected frame, or by pasting an image (⌘/Ctrl+V) while a frame is selected and nothing else is.
- Draw it **over** the frame content, with pointer events disabled so I can still select and drop through it. Default opacity 40%.
- Controls in the properties panel: opacity slider, show/hide (also a shortcut, e.g. ⌘/Ctrl+Shift+R), **Over / Behind** content, **Fit to frame width** (default) or **Actual size**, nudge offset (x/y), replace, remove.
- **Side by side**: an option to show the screenshot at full opacity beside the frame instead of over it, for comparing.
- When I add a reference image, offer to set the frame width to the screenshot's width (rounded to the nearest device preset if within 5%), since screenshots are often 2× resolution — detect that and halve.
- The reference layer is **Edit mode only**. It never appears in Preview mode, thumbnails, PNG or HTML export, build notes or templates.
- Store it with the frame: `frame.reference = { imageId, opacity, placement: 'over' | 'behind' | 'beside', fit: 'width' | 'actual', offsetX, offsetY, visible }`, with the image in `doc.images` like other images. This is a schema change: bump the document version, add a migration and validation for it, and update `DATA-MODEL.md`.
- Adding, changing and removing the reference are undoable; dragging the opacity slider is one undo entry.
- Works in the single-file build (no network).
- Tests: unit tests for the migration, validation and the 2× detection; e2e for adding a reference by paste and by the panel, changing opacity, toggling over/behind/beside, checking it's absent from PNG export, and undo.

## Milestone R2: Page specs (AI-ready format and importer)

The full document format (flat node map, ids) is awkward for an AI or a person to write. Add a compact, nested format that converts into a normal frame.

**The format** (`.page.json`):

```json
{
  "format": "mockup-page-spec",
  "version": 1,
  "kit": "nsw",
  "name": "Home",
  "device": "desktop",
  "settings": {},
  "page": [
    { "component": "masthead", "variant": "dark" },
    { "section": { "background": "off-white" }, "blocks": [
      { "component": "heading", "variant": "h1", "text": { "text": "Find a service" } },
      { "row": [6, 6], "columns": [
        [ { "component": "card", "variant": "default", "text": { "title": "Apply", "copy": "…" } } ],
        [ { "component": "button", "variant": "dark", "text": { "label": "Get started" }, "props": { "fullWidth": true } } ]
      ]}
    ]}
  ]
}
```

Base it on the template DSLs the kits already use (`src/kits/*/templateDsl.ts`), so templates and page specs share one converter where possible. Each kit defines its own section and row shapes in the spec (e.g. SharePoint uses section layouts such as `twoColumn` or `oneThirdLeft`, vertical sections and frame settings for the site header, navigation and theme). A file may hold one page or a list of pages (`"pages": [...]`) to create several frames.

**Generated reference document**: add `npm run page-spec-docs`, which generates `docs/PAGE-SPEC.md` from the kit catalogues and settings definitions, so it's always complete and current. It must list, per kit:
- every component id, its variants, its editable text keys (with what each is), its options and optional parts;
- the section, row and column shapes, section settings and frame/kit settings with their allowed values;
- the rules (what can contain what, full-width components, limits such as one vertical section per SharePoint page);
- a full worked example per kit;
- at the top, a **ready-to-paste instruction for Claude**: "Recreate the attached screenshot as a page spec using only the components below. Choose the kit… Use the closest variant… Copy text exactly… Use a placeholder for anything with no match… Output only JSON." Keep it short enough to paste into a chat alongside the reference.

Run it in CI and fail if `docs/PAGE-SPEC.md` is out of date. Also add a **"Copy page spec instructions"** button in the app (per kit) that copies the same instruction and reference text to the clipboard, so I can paste it into a Claude chat with a screenshot without opening the repo.

**Importer**:
- **Import page spec**: open a `.page.json` file, drop one on the canvas, or paste spec JSON (⌘/Ctrl+V, detected by its `format` field, or via an "Import page spec" dialog with a text box). Each page becomes a new frame placed to the right of the existing frames, and is selected.
- Treat specs as untrusted: parse with `safeJsonParse`, validate field by field, apply the tree rules with `canContain`/`resolveInsertion`, enforce size limits, and sanitise text.
- **Be forgiving and say what happened**: an unknown component becomes the labelled placeholder used by frame conversion (showing the name the spec gave it); an unknown variant falls back to the component's default; unknown text keys and options are dropped; an item in a place the rules don't allow is moved to the nearest valid place. After import, show a short report ("Imported 24 components. 2 placeholders: 'Search filters', 'Map'. 1 unknown variant replaced.") that I can expand.
- **Export page spec**: for any frame, "Copy as page spec" / download `.page.json`, so I can round-trip a frame through a chat ("make this denser", "add a contact section") and import the result.
- Importing is one undo entry.
- Tests: unit tests for spec → document for both kits, every forgiving rule, round-trip (frame → spec → frame gives the same tree), and rejection of malicious input; a test that `docs/PAGE-SPEC.md` matches the generator; e2e for importing a file and pasting JSON, the report, and undo.

## Milestone R3 (optional, confirm first): Import from screenshot

One step from screenshot to editable frame, using the Claude API with the R2 format.

- **"New frame from screenshot"**: choose or drop an image, choose the kit (or "Detect"), optionally type a note ("this is our intranet home page; ignore the cookie banner"), then **Create**. Show progress, and allow cancelling.
- **API**: call the Anthropic Messages API from the browser (with the `anthropic-dangerous-direct-browser-access: true` header), sending the image, the kit's section of the page spec reference and the instruction. Ask for the page spec through tool use with a JSON schema generated from the R2 format, so the response is always parseable. Then run it through the R2 importer, so the same validation, placeholders and report apply. Retry once with the validation errors if the response is invalid.
- **Model**: a setting with a sensible current default (a recent Claude Sonnet model); don't hard-code a model in more than one place.
- **Images**: downscale so the long edge is at most 1568 px before sending; very tall full-page screenshots are split into overlapping slices sent in one request, in order.
- **Also use the screenshot as the frame's reference layer** (R1), set to Side by side, so I can compare straight away.
- **API key**: entered in a settings dialog, stored in this browser's local storage only, never in documents, exports, templates or the repo; a "Forget key" button; a link explaining how to get a key. Handle missing, invalid and rate-limited keys with clear messages.
- **Data notice**: before the first import (and in the dialog), explain in one or two sentences that the screenshot is sent to Anthropic, and to check their organisation's rules before sending screenshots of internal or sensitive systems. A "don't show again" option.
- **Single-file build**: the single file must stay network-free (rule 6). Exclude this feature from `build:single` at build time and show "Import from screenshot is available in the online version" with the Pages link instead.
- Record the decisions (direct browser calls, key storage, model setting, slicing) in `DECISIONS.md`.
- Tests: unit tests with a mocked API (success, invalid then corrected response, error codes, cancel) and for image downscaling and slicing; e2e with the API mocked (route interception) that creates a frame from a sample screenshot; a check that the single-file build contains no API code or URLs.

---

## Usability bar (as before, plus)

- It's always clear which parts came from an import and need checking: placeholders are obvious, and the import report stays available from the frame's properties panel until dismissed.
- Nothing here changes existing frames: imports always create new frames.
