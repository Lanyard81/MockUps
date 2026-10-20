# NSW Design System: reference for the mockup tool

Gathered 20 October 2026 for the MockUps repo (https://github.com/Lanyard81/MockUps). The build brief is in `docs/BUILD-PROMPT.md`.

## Key facts

- **Open source, MIT licence**: https://github.com/digitalnsw/nsw-design-system
- **npm package**: `nsw-design-system` (current major version: 3). A React library also exists: `nsw-ds-react`.
- **Built from**: SCSS + vanilla JS (Gulp build). Component source is in `src/components/<name>/`, core styles in `src/core/` and `src/global/scss/`.
- **HTML starter kit**: `HTMLstarterkit.zip` in each GitHub release, with compiled HTML, CSS and JS.
- **Docs site**: https://designsystem.nsw.gov.au
- **Browser support**: latest Chrome, Safari, Edge and Firefox.

## Install

**CDN**
```html
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nsw-design-system@3/dist/css/main.css">
<!-- end of body -->
<script src="https://cdn.jsdelivr.net/npm/nsw-design-system@3/dist/js/main.min.js"></script>
<script>window.NSW.initSite()</script>
```

**npm**
```
npm install --save nsw-design-system
```
```scss
// Everything
@import 'node_modules/nsw-design-system/src/main';

// Or core + selected components
@import 'node_modules/nsw-design-system/src/global/scss/settings/settings';
@import 'node_modules/nsw-design-system/src/global/scss/base/all';
@import 'node_modules/nsw-design-system/src/global/scss/helpers/all';
@import 'node_modules/nsw-design-system/src/global/scss/settings/palette';
@import 'node_modules/nsw-design-system/src/global/scss/settings/theme';
@import 'node_modules/nsw-design-system/src/core/all';
@import 'node_modules/nsw-design-system/src/components/accordion/accordion';
```

Interactive components (accordion, tabs, navigation, dialogs and so on) need `window.NSW.initSite()` to run after the markup is in the page.

## Fonts and icons

- **Text**: Public Sans, weights 400 and 700, plus 400 italic (Google Fonts)
- **Icons**: Material Icons (Google Fonts)

## Design tokens

These values come from a third-party summary. Verify them against `src/global/scss/settings/` in the package before relying on them.

| Token | Value |
|---|---|
| `--nsw-brand-dark` | #002664 |
| `--nsw-brand-light` | #cbedfd |
| `--nsw-brand-supplementary` | #146cfd |
| `--nsw-brand-accent` | #d7153a |
| `--nsw-brand-accent-light` | #ffe6ea |
| `--nsw-grey-01` / text dark | #22272b |
| `--nsw-grey-02` | #495054 |
| `--nsw-grey-03` | #cdd3d6 |
| `--nsw-grey-04` | #ebebeb |
| `--nsw-off-white` | #f2f2f2 |
| `--nsw-text-light` | #fff |
| Success (fg / bg) | #008a07 / #e5f6e6 |
| Info (fg / bg) | #2e5299 / #eaedf4 |
| Warning (fg / bg) | #c95000 / #fbeee5 |
| Error (fg / bg) | #b81237 / #f7e7eb |
| `--nsw-border-radius` | 0.25rem (4px) |
| `--nsw-font-size` (base) | 16px |
| `--nsw-font-size-md` | 1.125rem mobile / 1.25rem desktop |
| `--nsw-font-size-lg` | 1.375rem / 1.5rem |
| `--nsw-font-size-xl` | 1.75rem / 2rem |
| `--nsw-font-size-xxl` | 2.25rem / 3rem |
| Container max width | 1240px |

## Components (46)

Each component has a guidance page (`index.html`) and usually a demo page (`demo.html`) at `https://designsystem.nsw.gov.au/components/<slug>/`. The markup is in the package source at `src/components/<slug>/`.

| Component | Slug |
|---|---|
| Accordion | accordion |
| Back to top | back-to-top |
| Breadcrumbs | breadcrumbs |
| Buttons | button |
| Callout | callout |
| Card carousel | card-carousel |
| Cards | card |
| Close button | close-button |
| Content blocks | content-block |
| Cookie consent | cookie-consent |
| Date input | date-input |
| Date picker | date-picker |
| Dialog | dialog |
| File upload | file-upload |
| Filters | filters |
| Footer | footer |
| Forms | form |
| Global alert | global-alert |
| Header | header |
| Hero banner | hero-banner |
| Hero search | hero-search |
| In-page alert | in-page-alert |
| In-page navigation | in-page-nav |
| Link | link |
| Link list | link-list |
| List items | list-item |
| Loader | loader |
| Main navigation | main-nav |
| Masthead | masthead |
| Media | media |
| Pagination | pagination |
| Popover | popover |
| Progress indicator | progress-indicator |
| Quick exit | quick-exit |
| Results bar | results-bar |
| Select | select |
| Show more | show-more |
| Side navigation | side-nav |
| Status labels | status-labels |
| Steps | steps |
| Support list | support-list |
| Tables | table |
| Tabs | tabs |
| Tags | tag |
| Tooltip | tooltip |
| Utility list | utility-list |

### Buttons (example of variant detail)

Styles shown on the demo page: Brand Dark (primary), Brand Dark Outline, Brand Dark Outline Solid, Brand Light, Brand Light Outline, White, White Outline, Danger, and Disabled (use sparingly). Each comes as a button, a link styled as a button, with an icon (icon paired with text, never on its own), and full width. Guidance: Brand Dark is the main call to action; Outlined is for secondary actions; Danger is for destructive actions such as delete; Brand Light suits dark or brand-coloured backgrounds.

## Templates (21)

At `https://designsystem.nsw.gov.au/templates/`:

- **Homepage**: featured list, hero banner, hero search
- **Content**: article, Easy Read, filters, form, header links, side navigation
- **Search**: filters, no results, simple
- **Maps**: equal value filters, location based only, location primary with sub filters
- **Theming**: content only, full page, partial
- **Landing pages**: events, featured list, hero banner
- **Kitchen sink**: sticky elements

## Findings from the package (v3.28.1, checked 20 October 2026)

- **Package contents**: `dist/css/main.css` (290 kB), `dist/css/core.css`, `dist/js/main.js` (UMD, 333 kB), plus `src/**/*.scss` and `src/**/*.js`. **There are no component templates, HTML or JSON data in the npm package.** Each `src/components/<slug>/` folder holds only SCSS (and JS for interactive components).
- **Milestone 2 consequence**: the catalogue generator can't read markup from the package, as the brief assumed. Options: (a) read the upstream repository's component templates at generation time (not reachable from the build sandbox: `raw.githubusercontent.com` returned 404 for the guessed path and the docs site is blocked, so the exact upstream path is unverified); (b) scrape demo markup from the docs site; (c) hand-author the markup in `catalogue/overrides.ts`, validated against the package's SCSS class names (every class in a snippet must exist in `main.css`). See `DECISIONS.md` 009.
- **Global**: `window.NSW` is exposed by the UMD build. `NSW.initSite()` queries the whole document for `.js-accordion`, `.js-accordion-details`, `.js-tabs` and so on. Component classes are also exported (`NSW.Accordion`, `NSW.Tabs`, `NSW.Dialog`, ...).
- **Fonts**: `main.css` references the font family names only. Public Sans and Material Icons must be supplied separately. The app bundles woff2 files (see `DECISIONS.md` 002).
- **Classes confirmed in `main.css`**:
  - Buttons: `nsw-button` with `--dark`, `--dark-outline`, `--dark-outline-solid`, `--light`, `--light-outline`, `--white`, `--white-outline`, `--danger`, `--info`, plus `--small`, `--flex`, `--full-width`. (There is no `--primary`.)
  - Sections: `nsw-section` with `--white`, `--off-white`, `--brand-dark`, `--brand-light`, `--brand-supplementary`, `--black`, `--grey-*`, `--box`, `--image`, `--invert`, `--half-padding`, `--no-padding`.
  - Layout: `nsw-container`, `nsw-container--flush`, `nsw-grid`, `nsw-col`, `nsw-col-1` to `nsw-col-12`.
  - Accordion: the `<details>` variant uses `.js-accordion-details` with `details.nsw-accordion__item > summary.nsw-accordion__title` and `.nsw-accordion__content-wrap > .nsw-accordion__content`.

## Catalogue (Milestone 2)

Source: `src/catalogue/sources/*.ts` (hand-written NSW markup) → `npm run catalogue` → `src/catalogue/generated/catalogue.json`. 49 entries (the 46 components plus Heading, Paragraph and List, which are plain HTML elements styled by NSW base styles) and 103 variants.

### How the markup was checked

- **Automatic**: every CSS class in every snippet must be defined in the installed `main.css`, and every `js-` hook must exist in the package JavaScript. This is re-checked on each build and after each upgrade.
- **By eye**: every variant was rendered at desktop width and reviewed. Structure, nesting and ARIA are written from knowledge of the design system, not copied from it.
- **Not done**: comparison with the demo pages on designsystem.nsw.gov.au. That site is blocked from the build sandbox. Please compare the library against the docs site and report differences.

### Components that are not fully faithful on the canvas

| Component | Level | Reason |
| --- | --- | --- |
| Back to top | Static | The real component is fixed to the screen corner. Shown as the button it contains. |
| Quick exit | Static | The real component sticks to the top and listens for the Esc key. Shown as the bar, without the Esc hint. |
| Dialog | Static | Dialog box only: no dark backdrop, no open and close behaviour. |
| Cookie consent | Static | Banner only: the preferences dialog is not included. |
| Date picker | Static | Date field only: the calendar pop-up needs the page script and extra markup. |
| Filters | Static | Heading and groups only: the slide-in panel is not wired. |
| Card carousel | Static | Cards shown in a row: scrolling, arrows and dots need the carousel script and its markup. |
| Main navigation | Partial | Desktop bar from about 992px wide. Narrow frames show the slide-out menu closed, as on a real site. No sub-menus. |
| Side navigation | Partial | No expand and collapse on narrow frames. |
| Show more | Partial | Built on `details`: works in Preview, unverified against the official markup. |
| Support list | Partial | Logo grid with placeholders. |
| Popover | Partial | Trigger and panel included. Opens in Preview if the NSW script accepts the markup (untested). |

The library shows a "Static" or "Partial" badge on these, with the reason on hover.

### Other notes

- The NSW Government waratah logo is not in the npm package. The header shows a labelled placeholder.
- Interactive components in Preview mode (tested): accordion, tabs. Others rely on `initSite()` finding their markup.
- Multiple copies of a component repeat some element ids (see `DECISIONS.md` 015).
