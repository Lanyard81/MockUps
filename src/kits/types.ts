import type { Catalogue } from '../catalogue/types';
import type { DeviceId, DocNode, MockupDoc, NodeType } from '../store/types';
import type { TemplateDef } from '../templates/types';

/**
 * A kit is a self-contained style library (NSW Design System, SharePoint-style, ...). Everything
 * specific to a design system lives in its folder under `src/kits/`; the editor core (canvas, drag
 * and drop, selection, undo, text editing, persistence, export) only talks to this interface.
 */
export type KitId = string;

/** The layout node types a kit uses between the frame root and its components, top to bottom. */
export type LayerType = Exclude<NodeType, 'component'>;

/**
 * Which node types exist and what may contain what. Layers nest strictly in this order, with
 * components below the last layer; a full-width component sits directly in the frame root.
 */
export interface KitSchema {
  layers: readonly LayerType[];
  /** Props for a layer the editor creates itself (a component dropped on empty space). */
  defaultProps: (type: LayerType) => Record<string, unknown> | undefined;
  /** Largest number of children a layer may have (e.g. columns in a grid). Unset means no limit. */
  maxChildren?: Partial<Record<LayerType, number>>;
  /**
   * Arrangements of the top layer's columns, chosen with `props.layout`. Changing one changes the
   * number of columns and moves content between them (see `setSectionLayout` in `layout/ops.ts`).
   */
  sectionLayouts?: readonly SectionLayout[];
}

/** The document every frame loads, and what to run in it after the content changes. */
export interface KitShell {
  css: string;
  js: string;
  /** `@font-face` rules for the kit's fonts. URLs are mapped through `resolveUrl` (for exports). */
  fontCss: (resolveUrl?: (url: string) => string) => string;
  fonts: { family: string; style: string; weight: number; url: string }[];
  /** Plumbing only: never restyles a component. */
  frameCss: string;
  /** The full `srcdoc` for a frame (an empty `#root`, the CSS and the script). */
  document: string;
  /** Run after every render so scripted components behave (e.g. `NSW.initSite()`). */
  init: (frameWindow: Window) => void;
}

/**
 * A setting shown in the Properties panel, built from data (like component options). Values live in
 * the node's `props[key]` (or the frame's or document's settings for frame and kit settings).
 */
export type SettingDef = (
  | {
      type: 'swatches';
      options: readonly SettingOption<{ swatch: string }>[];
      /** Keep the default value in the document instead of clearing it. */
      keepDefault?: boolean;
    }
  | { type: 'segmented'; options: readonly SettingOption[] }
  | { type: 'select'; options: readonly SettingOption[] }
  | { type: 'toggle' }
  | { type: 'text'; placeholder?: string; multiline?: boolean }
  | { type: 'color' }
  | { type: 'number'; min: number; max: number; step?: number }
) & {
  key: string;
  label: string;
  /** Group title in the panel. Settings with the same title share a group. */
  group: string;
  hint?: string;
  default?: string | number | boolean;
  /**
   * Hidden or disabled when this returns a reason (a short sentence), so the panel never offers
   * something the kit can't do in that context.
   */
  unavailable?: (ctx: SettingContext) => string | null;
};

/** One choice in a setting. `unavailable` gives the reason it can't be chosen here, or null. */
export type SettingOption<Extra = unknown> = {
  id: string;
  label: string;
  /** A short explanation shown on hover, for names that aren't self-explanatory. */
  title?: string;
  unavailable?: (ctx: SettingContext) => string | null;
} & Extra;

export interface SettingContext {
  /** The values of the thing being edited. */
  values: Record<string, unknown>;
  /** Settings of the frame the thing is in (frame-level settings of this kit). */
  frame: Record<string, unknown>;
  /** The document-wide settings of this kit (e.g. the theme). */
  kit: Record<string, unknown>;
  /** The top-level nodes of the frame, for page-wide rules (one vertical section per page, ...). */
  topLevel: DocNode[];
}

/** What a kit needs to draw layout nodes and page chrome. */
export interface RenderContext {
  images: MockupDoc['images'];
  /** The frame's kit settings. */
  settings: Record<string, unknown>;
  /** The document-wide settings of this kit. */
  kitSettings: Record<string, unknown>;
}

/** A way of arranging a section's columns (SharePoint: one, two, three columns, one-third left...). */
export interface SectionLayout {
  id: string;
  label: string;
  /** How many columns the section has with this layout. */
  columns: number;
  title?: string;
  unavailable?: (ctx: SettingContext) => string | null;
}

export interface KitSettings {
  /** Settings per node type (section, container, ...). */
  node: Partial<Record<LayerType, SettingDef[]>>;
  /** Frame-level settings (e.g. SharePoint site type, header and navigation). */
  frame: SettingDef[];
  /** Document-level settings for this kit (e.g. the SharePoint theme). */
  kit: SettingDef[];
}

export interface LayerLabels {
  /** Layers panel and breadcrumb names, e.g. { section: 'Section' }. */
  names: Partial<Record<LayerType, string>>;
  /** The dashed "Empty ..." hint shown in Edit mode. */
  empty: Partial<Record<LayerType, string>>;
}

/** A tile in the library's "Layout blocks": a section, a column grid and so on. */
export interface LayoutBlock {
  /** Passed in the drag payload and to `addLayoutBlock`. */
  kind: string;
  columns?: number;
  label: string;
  title: string;
  /** Where in the tree the block's top node belongs. */
  layer: LayerType;
  /** Shapes for the tile's icon, in a 64×40 box. `fill` shapes are drawn solid. */
  icon: { x: number; y: number; width: number; height: number; fill?: boolean }[];
  build: (makeId: (prefix: string) => string) => { nodes: Record<string, DocNode>; rootId: string };
}

/** One-click page furniture (NSW: masthead and header at the top, a footer at the bottom). */
export interface PageParts {
  id: string;
  label: string;
  title: string;
  /** Put them at the top or the bottom of the frame. */
  position: 'top' | 'bottom';
  /** Catalogue ids and variants, in order. */
  components: [string, string][];
}

/** A ready-made mockup that ships with the app (File > Sample). Built from code, with fixed ids. */
export interface KitSample {
  id: string;
  name: string;
  description: string;
  build: () => MockupDoc;
}

export interface Kit {
  id: KitId;
  name: string;
  /** Short label for badges and the switcher ("NSW", "SharePoint"). */
  shortLabel: string;
  version: string;
  licence: string;
  /** One line shown in the UI when the kit is a lookalike rather than the real thing. */
  fidelityNote?: string;
  shell: KitShell;
  catalogue: Catalogue;
  /** Library filter tabs, in order. */
  categories: readonly string[];
  /** The tab that also shows the layout blocks and page parts. */
  layoutCategory: string;
  schema: KitSchema;
  labels: LayerLabels;
  /** Markup for a layout node, given the rendered markup of its children. */
  renderLayout: (node: DocNode, childrenHtml: string, ctx: RenderContext) => string;
  /** Wrap a variant that needs a dark backdrop (e.g. white buttons) for its library thumbnail. */
  previewOnDark?: (html: string) => string;
  /** Markup around the frame's content (page chrome). Defaults to the children's markup, joined. */
  renderFrame?: (children: { node: DocNode; html: string }[], ctx: RenderContext) => string;
  layoutBlocks: LayoutBlock[];
  pageParts: PageParts[];
  /** How exported HTML pages load the kit. */
  export: {
    /** Tags for the "link to the internet" mode, or null when the kit has no CDN version. */
    cdn: { head: string; foot: string } | null;
    /** Script that starts the kit's components on a loaded page. */
    init: string;
  };
  settings: KitSettings;
  templates: TemplateDef[];
  templateGroups: readonly string[];
  samples: KitSample[];
  /** Device presets the kit offers when adding a frame. */
  devices: readonly DeviceId[];
}
