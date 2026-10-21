# CLAUDE.md: conventions for this repository

MockMaker: a Vite + React + TypeScript (strict) app where people drag real NSW Design System components onto device frames. The full brief is `docs/BUILD-PROMPT.md`; progress is in `docs/MILESTONES.md`.

## Folder structure

```
src/app/          App shell, toolbars, panels (React UI for the editor)
src/canvas/       Viewport, device frames (iframes), input forwarding, selection, drop indicators
src/kits/         One folder per style kit (nsw/, sharepoint/): shell, catalogue (sources/, overrides.ts, generated/), layout schema and renderer, templates, samples. index.ts is the registry; types.ts the Kit interface
src/catalogue/    Kit-agnostic catalogue API (getComponent, search), types, thumbnails
src/templates/    Template types, using templates, saving your own
src/store/        Zustand store, document actions, undo history, types
src/pagespec/     Page specs: import, export, checking, and the generated reference (docs.ts); kits supply their own converter (kits/*/pageSpec.ts)
src/layout/       Pure document-tree operations (insert, move, remove, clone, wrap) and tree -> HTML
src/persistence/  Autosave, IndexedDB, file save/open
src/export/       PNG, HTML and JSON export
src/lib/          Pure helpers: geometry, ids, text fitting
src/styles/       Editor theme tokens (theme.css) and editor styles (app.css)
scripts/          Catalogue generation, single-file post-build
public/samples/   Sample mockups
tests/            Vitest unit tests; tests/e2e/ for Playwright
```

## Rules that must not be broken

0. **Tree rules live in `src/layout/ops.ts`.** Pure functions only; test every new rule in `tests/ops.test.ts`. UI code asks `canContain` / `resolveInsertion` and never reimplements them.

1. **All document changes go through store actions** (`src/store/store.ts`). Components never mutate or `set` document state directly. Pure tree logic lives in `src/layout/` and is called by actions.
2. **Never break undo.** Every document change is one history entry via `commit()`. A continuous gesture (drag, text edit session) is one entry: call `beginGesture()` once, then apply live updates. View changes (pan and zoom) are not history. History is capped at 100.
3. **Each kit uses only its own markup.** NSW: real NSW markup only. Catalogue snippets in `src/kits/nsw/catalogue/sources/` use official classes only; `npm run catalogue` rejects any class not in the installed `main.css`. Commit the regenerated `generated/catalogue.json` whenever sources change. Use official NSW classes and markup unchanged. Never restyle or recreate NSW components with custom CSS. The only CSS injected into an NSW frame is the plumbing in `src/kits/nsw/shell.ts` (`FRAME_CSS`) and editor affordances that don't alter component appearance. The SharePoint kit is a lookalike (see `docs/SHAREPOINT-OOB.md`) and follows the same rule against its own CSS.

3a. **Kits are self-contained.** Everything specific to a design system lives in its `src/kits/<id>/` folder. The editor core never imports from a kit folder directly: it goes through `getKit()`. Kit files import no UI or store code (a cycle). Adding a kit is a folder and a line in `src/kits/index.ts`. 4. **Two worlds, no leaks.** Editor CSS (`--ed-*` tokens, `.btn`, `.frame`, etc.) lives in the host document. NSW CSS lives only inside frame iframes. Do not import NSW CSS into the host. 5. **Untrusted content is sanitised.** Anything from saved files or pasted input goes through DOMPurify before rendering (see `renderFrameHtml`). Only the official NSW JS and the app's own code run in frames. 6. **Single file must work from `file://`.** No runtime network requests, no dynamic `fetch` of app assets, no dynamic chunks. `scripts/finish-single.mjs` fails the build if the file loads anything external.

## Conventions

- Australian English in UI and docs (colour, organise, centre).
- Files: components `PascalCase.tsx`; modules `camelCase.ts`; tests `*.test.ts` in `tests/`; e2e `*.spec.ts` in `tests/e2e/`.
- Ids: `newId('prefix')` from `src/lib/ids.ts` (prefixes: `doc`, `f` frame, `n` node, `img`).
- Editor design: warm, flat, neutral. Colours, radii and spacing are CSS custom properties on `:root` in `src/styles/theme.css`. No glassmorphism or heavy shadows.
- Each dependency is recorded with its reason in `docs/DECISIONS.md`.
- Drag and drop uses plain pointer events (no DnD library). Hover, selection and drop state are UI-only store fields: they must never enter history or cause frames to re-render. A press that begins in an iframe keeps its events there, so drag code listens on the source frame's document too. Use `requestAnimationFrame` for drag updates and avoid re-rendering whole frames per change.

- Zustand selectors must return stable values: never `?? []` or `?? {}` inside `useStore(...)` (React error 185, the app freezes). Use module-level constants.
- Text editing is the only place a frame's DOM is edited in place (`canvas/textEdit.ts`); it commits once through `setText`. Everything else renders from the document.
- Layer and canvas moves share one rule set and one store action (`moveNode`); Layers placements come from `layout/layers.ts`. The right-click menu, shortcuts and panel buttons call the same store actions: never add a second implementation of an action.
- After changing a kit's catalogue, settings or page-spec shapes, run `npm run page-spec-docs` and commit `docs/PAGE-SPEC.md` (CI checks it).
- Any new key that does something must be added to `app/shortcutList.ts` (the `?` sheet) and, if it's an item action, to `ContextMenu.tsx`.
- Component options are data (`overrides.ts` `options`, applied in `layout/component.ts`). Add an option there, not in the panel.

## Document model

`MockupDoc` in `src/store/types.ts`, documented in `docs/DATA-MODEL.md`. Frames hold ordered `root` section ids; `nodes` is a flat id map of `section > container > grid > column > component`; images are stored by id. Change the schema only with a `version` bump and a migration, and update `DATA-MODEL.md`.

## Testing expectations

- Unit tests (Vitest) for pure logic: geometry, tree operations, store actions and undo, text fitting.
- Playwright e2e for each milestone's user-visible behaviour (listed per milestone in the brief). The single-file e2e opens `dist-single/mockmaker.html` from disk, offline.
- Before pushing: `npm run lint && npm run format:check && npm run catalogue:check && npm run page-spec-docs:check && npm run samples && git diff --exit-code public/samples && npm run typecheck && npm test && npm run build:single && npm run test:e2e` (the same steps CI runs, in its order). `catalogue:check`, `page-spec-docs:check` and the samples check compare generated files with what is committed, so run the generators and commit their output (a generator run on uncommitted files passes by mistake: check `git status` is clean afterwards).
- Playwright needs a Chromium: set `PW_CHROMIUM=/opt/pw-browsers/chromium` in the cloud sandbox.

## Milestone workflow

Work one milestone at a time. After each: update docs (`MILESTONES.md` ticks, `DECISIONS.md`, `DATA-MODEL.md`, `NSW-DESIGN-SYSTEM.md`, README if behaviour changed), commit with a clear message, push, then **stop and summarise what to test**. Do not start the next milestone until the user confirms. Check the usability bar in the brief at every milestone.
