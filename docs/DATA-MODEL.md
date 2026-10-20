# Data model

The mockup document is plain JSON. The TypeScript types are in `src/store/types.ts`. `version` is bumped on any breaking change, with a migration on load.

```json
{
  "version": 2,
  "id": "doc_x",
  "name": "Untitled mockup",
  "defaultKitId": "nsw",
  "kitVersions": { "nsw": "3.28.1" },
  "kitSettings": {},
  "view": { "x": 80, "y": 80, "zoom": 1 },
  "frames": [
    {
      "id": "f_1",
      "name": "Home",
      "kitId": "nsw",
      "device": "iphone",
      "width": 393,
      "x": 0,
      "y": 0,
      "root": ["n_s1"]
    }
  ],
  "nodes": {
    "n_s1": {
      "id": "n_s1",
      "type": "section",
      "props": { "background": "off-white" },
      "children": ["n_c1"]
    },
    "n_c1": { "id": "n_c1", "type": "container", "children": ["n_g1"] },
    "n_g1": { "id": "n_g1", "type": "grid", "children": ["n_col1"] },
    "n_col1": { "id": "n_col1", "type": "column", "props": { "span": 12 }, "children": ["n_b1"] },
    "n_b1": {
      "id": "n_b1",
      "type": "component",
      "componentId": "button",
      "variant": "dark",
      "props": {},
      "text": { "label": "Get started" },
      "textFit": { "label": "natural" },
      "hidden": false
    }
  },
  "images": { "img_ab12": { "dataUrl": "data:image/png;base64,…", "alt": "" } }
}
```

## Fields

**Document**: `id`, `name`, `defaultKitId` (the kit for the first frame and for new frames), `kitVersions` (the design-system version of each kit in use, e.g. the `nsw-design-system` version), `kitSettings` (document-wide settings per kit, such as a SharePoint theme), `view` (canvas pan and zoom, not part of undo), `frames`, `nodes`, `images`.

**Frame**: `kitId` is the style kit the frame is built with (`nsw`, `sharepoint`); `settings` (optional) are that kit's frame-level settings, such as a SharePoint site type, header and navigation. `device` is `iphone | android | tablet | desktop | custom`; `width` is in CSS px (240–3000; setting it by hand switches `device` to `custom`); `x`, `y` are canvas world coordinates; `root` is the ordered list of top-level node ids: usually sections, or full-width components (masthead, header, footer and so on) that sit outside any section. Frame height is not stored: it comes from the content, with a minimum of the device screen height (iPhone 852, Android 915, Tablet 1180, Desktop 900, Custom 800).

**Node**: a flat map keyed by id. `type` is one of `section | container | grid | column | component`. Structure is `section > container > grid > column > component`; children are ordered id arrays. A node has exactly one parent. Deleting a node deletes its descendants.

| Field                    | Used by   | Meaning                                                                                                                                                                                                                                 |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `props`                  | all       | Type-specific options. Section: `background`, `padding`. Column: `span` (1–12, the width from the md breakpoint up; always 12 on small screens). A grid's column count is its number of column children. Components: catalogue options. |
| `componentId`, `variant` | component | Catalogue entry and variant id.                                                                                                                                                                                                         |
| `text`                   | component | Editable text by region name.                                                                                                                                                                                                           |
| `textFit`                | component | `natural` or `shrink`, per text region.                                                                                                                                                                                                 |
| `hidden`                 | all       | Hidden in the canvas and exports. Set from the Layers panel (Milestone 5).                                                                                                                                                              |

**Images**: keyed by `img_…` id (derived from the image content, so the same picture is stored once), `{ dataUrl, name? }`. Saved files embed `dataUrl`; in the browser they are also kept in IndexedDB. Alt text is not here: it belongs to each use (`props.images[key].alt`).

## Tree rules

Each node type has a depth, and a node's parent is always exactly one level shallower. The layers come from the frame's kit (`KitSchema.layers`). NSW: frame root 0 › section 1 › container 2 › grid 3 › column 4 › component 5. SharePoint: frame root 0 › section 1 › column 2 › component 3. Full-width components (masthead, header, footer, hero banner, global alert and so on) have depth 1 and live in the frame root beside sections. Columns can't be moved or deleted on their own (deleting empties them). Loading code must reject files that break these rules rather than render them.

## Components

`componentId` is a catalogue id (`button`, `card`, `hero-banner` and so on, see `src/catalogue/sources/`). `variant` is a variant id from that component (`dark`, `dark-outline`, `headline`). If `variant` is missing, the component's default variant is used. A node whose `componentId` is not in the catalogue renders as an "Unknown component" placeholder, so files from newer versions open without crashing.

**`text`** maps an editable region name (the `data-edit` key in the variant markup) to its text. Line breaks are `\n`. Regions that aren't in `text` show the variant's default. Because it is keyed by region name, the text survives a variant change.

**`textFit`** maps a region name to `natural` or `shrink`. For `shrink`, `props.fitBoxes[key]` holds the `{ width, height }` (CSS px) the text is fitted into.

**`props`** for components holds option values (see `OptionDef` in `src/catalogue/types.ts`) plus:

| Key           | Value                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `hiddenParts` | `string[]` of optional-part keys that are hidden                                                                                              |
| `images`      | `{ [slot]: { imageId?: string, alt?: string } }`. No `imageId` means the placeholder is shown                                                 |
| `fitBoxes`    | see `textFit` above                                                                                                                           |
| option keys   | `fullWidth`, `small`, `disabled` (booleans); `href` (string); `level` (heading level 1–6); `icon` (`{ name, position: 'before' \| 'after' }`) |

**Layout node props**

| Node      | Props                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| section   | `background` (`white`, `off-white`, `brand-light`, `brand-dark`, `brand-supplementary`, `grey-01`…`grey-04`, `black`), `padding` (`half`, `none`; absent means standard) |
| container | `flush` (boolean)                                                                                                                                                        |
| column    | `spans`: `{ base?, sm?, md?, lg?, xl? }`, each 1–12. A breakpoint left out inherits from the smaller one, as in the NSW grid. `base` defaults to 12                      |

A grid's column count is its number of column children (1–6).

## Files

A `.mockup.json` is an envelope:

```json
{
  "app": "nsw-mockup-builder",
  "fileVersion": 1,
  "savedAt": "2026-10-20T00:00:00.000Z",
  "doc": { "version": 1, "...": "..." },
  "templates": []
}
```

`doc` is the document above, with images embedded as data URLs. `templates` are the user's saved templates (`SavedTemplate` in `src/store/types.ts`: a name, a device and width, the `root` ids and `nodes`, and its images). A bare document with no envelope also opens. Everything is validated on the way in (see `DECISIONS.md` 037): a file that breaks the layout rules, is too large, comes from a newer version, or contains anything other than real image data URLs is refused or repaired as described there.

Stored mockups are the same document, validated again each time they are loaded.

`props.goto` (optional, a frame id) on a component with a link option makes the link a click-through to that frame. No version bump: it is an optional prop.

## Versions and migration

`version` is the document version (now **2**). Files are upgraded on load by `src/persistence/migrate.ts` before they are validated, so any earlier file opens.

- **1 → 2** (style kits): every frame gets `kitId: "nsw"`; `defaultKitId: "nsw"`, `kitVersions: { nsw: <old nswVersion> }` and `kitSettings: {}` are added; `nswVersion` is removed.

A frame whose `kitId` this build doesn't have is refused with a message (rather than shown with the wrong styles). Kit settings (`frame.settings`, `kitSettings`) are plain data: strings, numbers, booleans, lists and nested objects of limited size and depth; anything else is dropped on load. The envelope of a saved file (`fileVersion`) is unchanged.

## Frame settings for the SharePoint kit

`frame.settings` for a `sharepoint` frame (all optional; defaults are applied when reading): `siteType` (`communication | team`), `suiteBar`, `headerLayout` (`minimal | compact | standard | extended`), `headerBackground` (`none | neutral | soft | strong | image`), `headerImage` / `siteLogo` / `logoThumbnail` / `footerLogo` / `titleImage` (an `img_…` id in `doc.images`), `headerOverlay` (0–100), `showSiteTitle`, `siteTitle`, `logoAlign`, `navVisible`, `navStyle` (`mega | cascading`), `navItems` (`[{ label, children? }]`, three levels), `footerVisible`, `footerLayout`, `footerBackground`, `showFooterName`, `footerName`, `footerLinks` (up to eight strings), `showTitleArea`, `titleLayout`, `titleAlign`, `pageTitle`, `showTopic`, `topicText`, `showAuthor`, `authorName`, `showDate`, `publishedDate`, and a theme of the frame's own when `themeOverride` is true: `themePreset`, `themePrimary`, `themeText`, `themeBackground`, `themeDark`. The document-wide theme is `kitSettings.sharepoint` with the same `theme*` keys.

SharePoint section nodes use `props.layout` (`one-column | two-columns | three-columns | one-third-left | one-third-right | full-width | vertical | flexible`), `props.background` (`none | neutral | soft | strong | gradient | image`, with the picture under `props.images.background`), `props.collapsible`, `collapseHeading`, `collapseDivider`, `collapseIcon`, `collapsedByDefault`, and `text.collapseTitle`. The tree is section › column › component.
