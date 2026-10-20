# Data model

The mockup document is plain JSON. The TypeScript types are in `src/store/types.ts`. `version` is bumped on any breaking change, with a migration on load.

```json
{
  "version": 1,
  "id": "doc_x",
  "name": "Untitled mockup",
  "nswVersion": "3.28.1",
  "view": { "x": 80, "y": 80, "zoom": 1 },
  "frames": [
    {
      "id": "f_1",
      "name": "Home",
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

**Document**: `id`, `name`, `nswVersion` (the `nsw-design-system` version the mockup was made with), `view` (canvas pan and zoom, not part of undo), `frames`, `nodes`, `images`.

**Frame**: `device` is `iphone | android | tablet | desktop | custom`; `width` is in CSS px (240–3000; setting it by hand switches `device` to `custom`); `x`, `y` are canvas world coordinates; `root` is the ordered list of top-level node ids: usually sections, or full-width components (masthead, header, footer and so on) that sit outside any section. Frame height is not stored: it comes from the content, with a minimum of the device screen height (iPhone 852, Android 915, Tablet 1180, Desktop 900, Custom 800).

**Node**: a flat map keyed by id. `type` is one of `section | container | grid | column | component`. Structure is `section > container > grid > column > component`; children are ordered id arrays. A node has exactly one parent. Deleting a node deletes its descendants.

| Field                    | Used by   | Meaning                                                                                                                                                                                                                                 |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `props`                  | all       | Type-specific options. Section: `background`, `padding`. Column: `span` (1–12, the width from the md breakpoint up; always 12 on small screens). A grid's column count is its number of column children. Components: catalogue options. |
| `componentId`, `variant` | component | Catalogue entry and variant id.                                                                                                                                                                                                         |
| `text`                   | component | Editable text by region name.                                                                                                                                                                                                           |
| `textFit`                | component | `natural` or `shrink`, per text region.                                                                                                                                                                                                 |
| `hidden`                 | all       | Hidden in the canvas and exports. Set from the Layers panel (Milestone 5).                                                                                                                                                              |

**Images**: keyed by `img_…` id, deduplicated by content. Saved files embed `dataUrl`; in the browser they are also kept in IndexedDB.

## Components

`componentId` is a catalogue id (`button`, `card`, `hero-banner` and so on, see `src/catalogue/sources/`). `variant` is a variant id from that component (`dark`, `dark-outline`, `headline`). If `variant` is missing, the component's default variant is used. A node whose `componentId` is not in the catalogue renders as an "Unknown component" placeholder, so files from newer versions open without crashing.

`text`, `textFit` and the option `props` are written by the editing tools in Milestone 4. Until then, components render their default markup.

## Current limitations

Saved files are not yet implemented (Milestone 6).
