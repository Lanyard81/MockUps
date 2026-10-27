# Brief: gold-standard design and usability review of Pagewright

Carry out a rigorous, evidence-based review of Pagewright's design, navigation and usability, to the standard of a senior product design team preparing a professional tool for release. The benchmark is the best design tools people already know: **Figma, Framer, Webflow, Canva, and SharePoint's own page editor**. Pagewright should feel as obvious, calm and dependable as they do, for someone who has never used a design tool.

**This is a review, not a fix.** Don't change any app code in this pass. Produce the report and fix plan described below, commit them, push, and **stop for my approval**. I'll choose what gets fixed.

Read first: `CLAUDE.md`, `README.md`, `docs/MILESTONES.md`, `docs/DECISIONS.md`, and skim the feature briefs (`BUILD-PROMPT.md`, `SHAREPOINT-PROMPT.md`, `SCREENSHOT-PROMPT.md`) to understand what each feature is meant to do. Judge the app against those intentions and against the benchmark tools, not against the code.

---

## Who it's for

Primary user: a busy public servant, comfortable with Office and SharePoint but **not a designer**, who needs to produce a credible NSW web page or SharePoint intranet mockup in 15 minutes, show it to colleagues, and hand it to a builder. Secondary: a designer or developer who wants speed and precision (shortcuts, exact layout, clean export). Both must be well served; the first must never be scared off by features meant for the second.

## Method: use the app, don't just read the code

1. **Run it** (`npm run dev`) and drive it with Playwright, as a user would: mouse and keyboard, real drags, real typing. Capture screenshots of every finding (save in `docs/review/screens/`, named by finding id).
2. **Test at these sizes**: 1280×720 (a laptop), 1440×900, 1920×1080, 2560×1440, and a tablet (1024×768, touch). Also 200% browser zoom at 1280 wide.
3. **Light and dark**: check the editor in both if it supports them, and every kit's frames.
4. **Both builds**: the Pages site and the single file opened from disk, offline.
5. **Run independent review passes** using subagents, one per lens in the next section, each starting fresh with only this brief and the running app, so each lens gets full attention and no pass marks its own work. Then consolidate: merge duplicates, and **re-verify every finding yourself** by reproducing it before it goes in the report. Drop anything you can't reproduce.

### Task walkthroughs (time each one, count clicks, note every hesitation)

Do each as a first-time user, with no prior knowledge of the app, and record where a newcomer would get stuck, guess wrong, or need the shortcuts sheet:

1. First run: open the app cold and make anything at all. Is the first step obvious within five seconds?
2. Build an NSW service landing page on desktop: masthead, header, hero, three cards, a call-to-action, footer. Then the same page on a phone frame.
3. Build a SharePoint communication site home page: theme, header, mega menu, a hero, quick links, news, events, footer.
4. Build a simple page with the Simple kit.
5. Start from a template, change the text and images, rearrange two sections, delete one.
6. Make a mistake and recover: delete the wrong thing, undo, redo; drop something in the wrong column and fix it.
7. Find a specific component without knowing its name ("the thing with the expandable rows").
8. Turn a three-frame mockup into a click-through prototype and preview it.
9. Save, close, reopen; open "My mockups"; duplicate a mockup; open a saved file.
10. Export: PNG of one frame, HTML page, SharePoint build notes, page spec. Is it clear what each one is for?
11. Import a page spec, and add a reference screenshot and trace over it.
12. Convert a frame from NSW to SharePoint and understand what changed.
13. Keyboard only: build a small page without touching the mouse.

## Review lenses

For each, assess against named principles, cite the specific principle in each finding, and compare with how the benchmark tools solve the same problem.

1. **Navigation and information architecture**: toolbar, left panel tabs (Library, Layers, Templates, My components and so on), More menu, right-hand properties panel, command palette, dialogs. Is everything findable where a user would look first? Are names plain and consistent? Is anything duplicated, buried or orphaned? How deep is the most common task? Draw the current navigation map (a Mermaid diagram) and a proposed one.
2. **Interaction design**: drag and drop (feedback, drop indicators, cancelling, auto-scroll near edges), selection (clicking into nested items, breadcrumb, Esc), inline text editing, the properties panel (grouping, progressive disclosure, sensible defaults), undo granularity, zoom and pan, the hand tool, context menu, modes (Edit vs Preview), kit switching and the cross-kit guards. Use Nielsen's 10 heuristics, Fitts's law (target size and distance), Hick's law (choice overload), and direct-manipulation principles.
3. **Visual design of the editor UI** (not the kits): hierarchy, density, alignment, spacing rhythm, typography scale, colour use and meaning, iconography consistency (style, weight, size, labels or tooltips), states (hover, active, selected, focus, disabled, loading, empty, error), and whether it meets the stated aesthetic (warm, flat, calm; no glassmorphism or heavy shadows). Check the design tokens in `src/styles/theme.css` are used consistently and list any hard-coded values.
4. **Kit fidelity**: do NSW frames look exactly like the real NSW Design System? Does the SharePoint kit read convincingly as SharePoint and offer only out-of-the-box options with SharePoint's own names? Is the Simple kit coherent? Is it always clear which kit a frame and the library are showing?
5. **Accessibility of the editor** (WCAG 2.2 AA): keyboard access to every function, visible focus, focus order and trapping in dialogs, screen reader names and roles (test with the accessibility tree), contrast of text and UI elements, target sizes (2.5.8), dragging alternatives (2.5.7), reduced motion, zoom and reflow. Run axe-core on every main screen and dialog and include the results. Also check the app's own accessibility checker gives correct, useful advice.
6. **Content and microcopy**: labels, tooltips, empty states, errors, confirmations, toasts, the first-run tour, import reports. Plain English, Australian spelling, consistent terms (e.g. never "frame" in one place and "screen" in another for the same thing), actions named by outcome.
7. **Onboarding and learnability**: first-run tour, empty states, sample mockups, templates, the shortcuts sheet. Does the app teach itself? How quickly does a newcomer reach a satisfying result?
8. **Responsiveness and performance**: panel behaviour at each size (the More menu overflow, collapsing panels), touch on tablet, and perceived speed: time to first render, drag smoothness with 10 frames of 50+ components, thumbnail generation, large imports. Measure, don't guess (Playwright traces, frame timings).
9. **Trust and safety**: can work be lost (autosave clarity, storage banner, closing with unsaved changes, failed imports)? Are destructive actions protected? Is it clear where data goes (the screenshot import and API key)?

## Severity and evidence

Rate every finding:

- **S1 Critical**: blocks a core task, loses work, or fails WCAG A/AA in a way that excludes users.
- **S2 Major**: a core task is slow, confusing or error-prone for most users.
- **S3 Minor**: friction, inconsistency or polish issue with a workaround.
- **S4 Enhancement**: an opportunity to match or exceed the benchmark tools.

Each finding has: id (e.g. `NAV-03`), title, severity, lens, principle violated, where (screen and steps to reproduce), evidence (screenshot path, measurement or axe rule), impact on the user, a concrete recommendation (what it should do, with a benchmark example where useful, e.g. "as Figma's layers panel does"), and effort (S/M/L). Be specific: "the Section background swatches are 16px and unlabelled" beats "swatches could be clearer". Don't pad: no generic advice, no findings you didn't reproduce, and note things that are already excellent so they're protected in future changes.

## Deliverables

All in `docs/review/`:

1. **`REVIEW.md`**:
   - a one-page executive summary: overall verdict, a scorecard (1–5 per lens with one-line justification), the top 10 issues, and the top 5 strengths;
   - task walkthrough results: a table with time, clicks, success and the main sticking point per task;
   - all findings grouped by lens, sorted by severity;
   - the current and proposed navigation maps;
   - a short "what world class would look like" section: the handful of bold changes that would most lift Pagewright to the level of the benchmark tools.
2. **`FIX-PLAN.md`**: findings grouped into small, independent fix milestones in priority order (quick wins first, then S1/S2 issues, then larger redesigns), each with its scope, the findings it closes, acceptance criteria, and the tests that will prove it. Flag any changes that would break existing saved mockups or need a data migration.
3. **`screens/`**: the evidence screenshots, plus before-state screenshots of every main screen at 1440×900 for future comparison.
4. **`axe/`**: raw axe-core results per screen.

Commit and push the review, then **stop and give me**: the verdict, the scorecard, the top 10 issues, and the proposed first fix milestone. Don't start fixing until I confirm which milestones to do.
