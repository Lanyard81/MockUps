# PageWright fix plan

Companion to `REVIEW.md`. Findings are grouped into small, independent milestones in priority order: quick wins first, then the S1 and S2 issues, then the larger redesigns. Each milestone can ship on its own, follows the repo's usual gate (lint, format, catalogue and page-spec checks, samples, typecheck, unit tests, single-file build, Playwright) and updates `docs/MILESTONES.md`, `DECISIONS.md` and `TEST-LIST.md`. Theme ids (T1 to T16) are the cross-cutting themes in `REVIEW.md`; finding ids are listed so each can be ticked off.

**Data migrations.** None of these milestones changes the saved document schema, so no saved mockup breaks and no version bump is needed. Three things touch visible behaviour that people may have learned: renaming Flow/Freeform (label only; the stored value stays `free`), changing where click-to-add inserts (M4; existing documents are unaffected, only future clicks), and the autosave and multi-tab changes (M2; a new in-browser lock key, no document change). Flagged where relevant.

**Decisions for the owner** are marked ⚑.

## Q1. Plain-language pass (quick win, effort S)

- **Scope:** adopt one glossary across tour, menus, palette, dialogs and tooltips (Page not frame/screen, Template, Sample, Preview/Present, Row, Column); fix grammar and casing ("Add a iPhone frame", "iphone", "Add a one column"); explain Flow/Freeform where chosen ("Structured layout: sections and columns" / "Free layout: place anything anywhere") and rename them; make the failed or empty import dialog say what happened; the accessibility check says "This frame is empty" instead of "No problems found"; disabled tiles and Convert say why; show Mac or Windows shortcut glyphs by platform.
- **Closes:** T7; COPY-01, 02, 03, 06, 08, 09, 10, 11, 13, 14, 16, 17, 18, 20, 21, 22, 24; NAV-06, 15, 16; KIT-05 (reason only); TASK-B-05, 18; ONB-14.
- **Acceptance:** a grep for "screen" and "frame" in UI strings finds only the agreed terms; every string in `strings.txt` that the review flagged is changed; Australian spelling check passes; no layout shifts.
- **Tests:** unit test that scans UI string constants against a banned-terms list; Playwright checks for the new import message, the empty-frame accessibility message and the palette phrasing.

## Q2. Colour contrast (quick win, effort S)

- **Scope:** darken the primary blue and frame chip (white text to 4.5:1 in both themes), lift placeholder and muted text tokens, switch Simple button text to dark when white fails a real contrast test; label the Simple background swatches.
- **Closes:** T5; VIS-01, VIS-16, VIS-17; A11Y-04, A11Y-09; KIT-01; KIT-06 (labels).
- **Acceptance:** every text and control pair in both themes measures at least 4.5:1 (3:1 for large text and non-text parts); all seven Simple accents give at least 4.5:1 button text; axe `color-contrast` reports zero violations on the main screens.
- **Tests:** a Vitest contrast test over the theme tokens and the Simple accents; axe in Playwright on the empty app in both themes.

## M1. Keyboard and screen reader basics (S1, effort L)

- **Scope:** make Layers a real tree (roving tabindex; arrows move, Enter selects, Delete deletes, Alt+arrows reorder, Esc selects the parent); make frame names buttons (Enter renames, context menu key, Shift+F10); restore `tablist` with arrow keys and Home/End; give File, Add frame and context menus real menu behaviour (focus the first item, arrows, Esc returns focus) and take toggles out of `role=menu`; add a skip link, `main`, `nav` and a visually hidden h1; make the page behind dialogs inert; announce toasts politely and let them stay while focused; keyboard route for moving into another container or frame (a "Move to…" command).
- **Closes:** T1; A11Y-01, 02, 03, 05, 06, 10, 11, 12, 14, 18; TASK-B-16, 17; INT-07 (partly).
- **Acceptance:** with no mouse a person can add a component, select any existing one, edit its text, change a property, move it, delete it and undo; axe reports zero critical or serious violations on every main screen and dialog; Tab from the top reaches Properties in under 15 stops.
- **Tests:** Playwright keyboard-only build of a small page (task 13); axe on all screens; unit tests for the tree keyboard model.

## M2. Never lose work silently (S2, effort M)

- **Scope:** flush autosave on `pagehide`/`beforeunload` and keep a "Saving… / Saved to this browser, 10:42" status with reserved width; detect a second tab on the same mockup (BroadcastChannel or storage events) and warn before it overwrites; File > New mockup asks first or becomes undoable ("Undo" toast, previous mockup one click away); toast with Undo for delete frame, delete version, open file; storage banner distinguishes private-window from full and clears when storage recovers; viewer export comments default off with a clear explanation ⚑ (currently on when comments exist).
- **Closes:** T2; TRUST-01 to 12; COPY-12, 23; INT-13; TASK-A-18; TASK-B-07, 08.
- **Acceptance:** a reload at any moment after an edit keeps it; two tabs never silently overwrite; New mockup can always be undone or cancelled; every destructive action offers Undo.
- **Tests:** Playwright reload-at-0/100/300 ms keeps the edit; two-context overwrite test shows the warning; undo-after-New test; unit tests for the autosave flush.
- **Migration flag:** adds an in-browser lock key only; no document change.

## M3. A stable top bar (S2, effort M)

- **Scope:** fixed zones (document, history, mode, view, share), reserved-width save status so nothing moves on autosave; zoom controls (minus, level, plus, fit) as a cluster in a corner of the canvas; Edit/Preview, Play and a new Share/Export button never overflow; a labelled "View" or "Help" menu for Flow layout default, Shortcuts, Replay tour, Theme; explicit overflow priority and a labelled More menu; Hand tool gets an icon; fix Undo / Comment / Redo grouping.
- **Closes:** T4; NAV-03, 04, 05, 18; INT-01, 03, 11, 12; VIS-03, 04; ONB-12; PERF-03, 04, 10; COPY-03; TASK-B-19.
- **Acceptance:** at 1024, 1280, 1440 and 200% zoom the bar never shows an orphaned control and never hides mode, Play, Share or zoom; no control moves more than 1px during autosave.
- **Tests:** Playwright at five widths asserting the visible control set and positions before and after an autosave.

## M4. Insertion you can see (S2, effort M)

- **Scope:** an "Adding to: [target]" indicator under the Library search; page parts always go to the top or bottom; components go to the end of the nearest section unless a column is selected; a "Row of 3" option on repeatable parts (cards, content blocks) that builds a grid for you; larger empty-column drop targets; hide Container and Grid in the selection path and Layers behind an Advanced switch ⚑; Esc selects up past hidden layers.
- **Closes:** T3; ONB-01, 18; TASK-A-01, 02, 09, 16; INT-07; NAV-11 (partly).
- **Acceptance:** masthead, heading, three cards, footer built by clicking in that order gives that order, with the cards in a row on request, in four or fewer actions; Esc reaches the frame in at most three presses.
- **Tests:** unit tests for the new insertion rules in `tests/ops.test.ts` (rule 0 in CLAUDE.md); Playwright for the page above.
- **Migration flag:** changes only where new items are added; documents are untouched.

## M5. Hand-off in one place (S2, effort M)

- **Scope:** a Share/Export button opening one dialog listing every output with its purpose (image, PDF, web page, viewer file, SharePoint build notes, page spec, copy HTML) and a paper-size choice for PDF; Convert becomes a section of the Frame panel with a before/after list ("Accordion became…"), a clearer placement of the converted copy, and an enabled-or-explained state; viewer-file wording explains it is a read-only file to send.
- **Closes:** T6; NAV-01, 08, 09; TASK-B-09, 10, 14, 15, 20; KIT-05; COPY-07, 17.
- **Acceptance:** every output is reachable in two clicks from the bar; the convert summary names each converted and unconverted part; converted frames do not overlap their source.
- **Tests:** Playwright export of each format from the one dialog; unit test of the conversion report.

## M6. First run and help (S2, effort M)

- **Scope:** a start screen (Blank page, Templates, Samples, Import) shown for an empty mockup, replacing the Welcome card; reuse or remove the empty starter frame when a template is applied; a Help menu (Replay tour, Shortcuts, Glossary); a tour anchored to the controls it names, advancing on real actions and kept off the canvas; a readable empty-frame prompt; Play on nothing explains itself; sample descriptions.
- **Closes:** T8; ONB-02 to 11, 14 to 17; TASK-A-10, 14; TASK-B-02, 12; NAV-15.
- **Acceptance:** a newcomer reaches "first component on a page" in two actions without reading; the tour can be replayed; no tour card covers canvas content.
- **Tests:** Playwright first-run flow on a clean profile; tour anchoring and replay tests.

## M7. Library that finds and guides (S2/S3, effort M)

- **Scope:** make the wrong-kit notice actionable ("Add a SharePoint frame" / "Convert this frame") and keep tiles usable for adding a frame; synonyms and keywords so "expandable" and "toggle" find Accordion; the command palette indexes frame settings (theme, header, mega menu) and navigates panels; category headings as a real index; a refined sticky heading.
- **Closes:** T9, T12; NAV-07, 12, 14, 19; KIT-04; TASK-A-04, 05, 11; INT-05; ONB-17; VIS-11; A11Y-13, 17; PERF-09.
- **Acceptance:** searching "expandable rows" returns Accordion; "mega menu" opens the SharePoint header settings; no dead-end red banner remains.
- **Tests:** catalogue keyword tests; palette navigation tests; Playwright kit-mismatch flow.

## M8. Properties panels (S3, effort M)

- **Scope:** text first, then appearance, then behaviour; collapse specialist groups (click-through, reference image, responsive); one per-component "Shrink text to fit" switch; human labels instead of "G 1LINK 1"; labelled swatches; remove permanent red "Turn on…" lines; readable column-width labels; reset scroll when the selection changes.
- **Closes:** T11; NAV-10, 11; INT-09; TASK-A-06, 07, 15, 17; KIT-09, 10; COPY-04, 05; ONB-13; TASK-B-13.
- **Acceptance:** a Card's first control is its text; the footer panel has one shrink switch and readable labels; no permanent error-coloured text.
- **Tests:** Playwright order checks; panel snapshot tests per component type.

## M9. Small windows, zoom and touch (S2, effort L)

- **Scope:** collapsible side panels with a shortcut; panels sized by window width below 1700; reflow below 800px; one-finger pan, pinch zoom, long-press menu; 32px minimum targets (44px on touch); canvas hint adapts to touch.
- **Closes:** T10; PERF-05, 06, 07, 08, 11, 12; A11Y-07, 08; VIS-14; INT-11.
- **Acceptance:** at 200% zoom and 1024 wide the canvas is at least 60% of the width; on a tablet a person can pan, zoom and open the context menu by touch; no control under 24px (2.5.8).
- **Tests:** Playwright viewport matrix with touch; target-size scan.

## M10. Editor visual system (S3, effort L; ⚑ needs your decision first)

- **Decision ⚑:** keep the DevDan glass look (conflicts with the written "flat, no glassmorphism" rule in CLAUDE.md) or provide a flat, calm theme option. Either way update CLAUDE.md to match what ships.
- **Scope:** type and spacing tokens (minimum 12px), one icon set replacing glyphs and emoji, solid menu and popover surfaces, uniform selected and focus states, token audit of hard-coded colours and px values, softer canvas grid at low zoom, toast position clear of the hint bar.
- **Closes:** T14; VIS-02, 05 to 10, 12, 13, 15; NAV-17; TASK-B-06, 21.
- **Acceptance:** no hard-coded colour in `app.css` or components outside the token files; one icon family; smallest text is 12px; menus are opaque.
- **Tests:** a lint script for literal colours and font sizes; visual snapshots of main screens in both themes.

## M11. Canvas and frame handling (S3, effort M)

- **Scope:** edge auto-scroll while dragging; scroll the view to a newly added frame; zoom around the cursor; label truncation instead of overlap; selection tag above the item; stable library thumbnails; remove the duplicate 75/76% zoom entry; Esc always closes Play.
- **Closes:** T13, T15; INT-02, 04, 06, 08, 10; TASK-A-03, 08, 20; NAV-13; ONB-08; PERF-08; TASK-B-01, 03.
- **Acceptance:** a long page can be dropped below the fold by dragging; new frames are visible on creation; no frame labels overlap at any zoom.
- **Tests:** Playwright drag-near-edge test; label overlap check at several zooms.

## M12. Kit polish (S3, effort M)

- **Scope:** spacing pass on NSW templates and bare components; neutral logo placeholder; Simple landing alignment and bare-component rhythm; SharePoint frame panel density; sticky components in the kitchen sink template.
- **Closes:** T16; KIT-02, 03, 07, 08, 11, 12, 13, 14.
- **Acceptance:** headings never sit closer than 16px to the block above in templates; template thumbnails render on first paint.
- **Tests:** template render snapshots; a spacing assertion script.

## Suggested order

Q1, Q2 (days) then M1, M2, M3 (the three that most change trust), then M4, M5, M6, M7, M8, M9, then the owner decision for M10, then M11 and M12.

**Proposed first milestone: Q1 + Q2 together** (both small, no risk to saved work, and between them they fix the contrast failure, the misleading messages and the inconsistent vocabulary), followed immediately by M1 (the only S1).
