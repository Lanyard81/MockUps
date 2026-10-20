# CLAUDE.md: conventions for this repository

NSW Mockup Builder: a Vite + React + TypeScript (strict) app where people drag real NSW Design System components onto device frames. The full brief is `docs/BUILD-PROMPT.md`; progress is in `docs/MILESTONES.md`.

## Folder structure

```
src/app/          App shell, toolbars, panels (React UI for the editor)
src/canvas/       Viewport, device frames (iframes), input forwarding, selection, drop indicators
src/catalogue/    Catalogue: sources/ (hand-written NSW markup), overrides.ts, generated/catalogue.json, thumbnails
src/store/        Zustand store, document actions, undo history, types
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
3. **Real NSW markup only.** Catalogue snippets in `src/catalogue/sources/` use official classes only; `npm run catalogue` rejects any class not in the installed `main.css`. Commit the regenerated `generated/catalogue.json` whenever sources change. Use official NSW classes and markup unchanged. Never restyle or recreate NSW components with custom CSS. The only CSS injected into a frame is the plumbing in `src/canvas/nswAssets.ts` (`FRAME_CSS`) and editor affordances that don't alter component appearance.
4. **Two worlds, no leaks.** Editor CSS (`--ed-*` tokens, `.btn`, `.frame`, etc.) lives in the host document. NSW CSS lives only inside frame iframes. Do not import NSW CSS into the host.
5. **Untrusted content is sanitised.** Anything from saved files or pasted input goes through DOMPurify before rendering (see `renderFrameHtml`). Only the official NSW JS and the app's own code run in frames.
6. **Single file must work from `file://`.** No runtime network requests, no dynamic `fetch` of app assets, no dynamic chunks. `scripts/finish-single.mjs` fails the build if the file loads anything external.

## Conventions

- Australian English in UI and docs (colour, organise, centre).
- Files: components `PascalCase.tsx`; modules `camelCase.ts`; tests `*.test.ts` in `tests/`; e2e `*.spec.ts` in `tests/e2e/`.
- Ids: `newId('prefix')` from `src/lib/ids.ts` (prefixes: `doc`, `f` frame, `n` node, `img`).
- Editor design: warm, flat, neutral. Colours, radii and spacing are CSS custom properties on `:root` in `src/styles/theme.css`. No glassmorphism or heavy shadows.
- Each dependency is recorded with its reason in `docs/DECISIONS.md`.
- Drag and drop uses plain pointer events (no DnD library). Hover, selection and drop state are UI-only store fields: they must never enter history or cause frames to re-render. A press that begins in an iframe keeps its events there, so drag code listens on the source frame's document too. Use `requestAnimationFrame` for drag updates and avoid re-rendering whole frames per change.

- Zustand selectors must return stable values: never `?? []` or `?? {}` inside `useStore(...)` (React error 185, the app freezes). Use module-level constants.
- Text editing is the only place a frame's DOM is edited in place (`canvas/textEdit.ts`); it commits once through `setText`. Everything else renders from the document.
- Component options are data (`overrides.ts` `options`, applied in `layout/component.ts`). Add an option there, not in the panel.

## Document model

`MockupDoc` in `src/store/types.ts`, documented in `docs/DATA-MODEL.md`. Frames hold ordered `root` section ids; `nodes` is a flat id map of `section > container > grid > column > component`; images are stored by id. Change the schema only with a `version` bump and a migration, and update `DATA-MODEL.md`.

## Testing expectations

- Unit tests (Vitest) for pure logic: geometry, tree operations, store actions and undo, text fitting.
- Playwright e2e for each milestone's user-visible behaviour (listed per milestone in the brief). The single-file e2e opens `dist-single/nsw-mockup-builder.html` from disk, offline.
- Before pushing: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run build:single && npm run test:e2e`.
- Playwright needs a Chromium: set `PW_CHROMIUM=/opt/pw-browsers/chromium` in the cloud sandbox.

## Milestone workflow

Work one milestone at a time. After each: update docs (`MILESTONES.md` ticks, `DECISIONS.md`, `DATA-MODEL.md`, `NSW-DESIGN-SYSTEM.md`, README if behaviour changed), commit with a clear message, push, then **stop and summarise what to test**. Do not start the next milestone until the user confirms. Check the usability bar in the brief at every milestone.
