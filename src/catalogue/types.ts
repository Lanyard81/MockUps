/** A library filter tab. Each kit lists its own (see `Kit.categories`). */
export type Category = string;

/** A variant as hand-written in a kit's `sources/`. HTML is that kit's own markup, with `data-edit` and `data-optional` markers. */
export interface VariantSource {
  id: string;
  label: string;
  html: string;
  /** Thumbnail background, for variants that only make sense on a dark section (e.g. white buttons). */
  previewBg?: 'brand-dark';
}

export interface ComponentSource {
  id: string;
  /** Slug of the component's documentation page (NSW: designsystem.nsw.gov.au/components/<slug>/). */
  slug: string;
  name: string;
  category: Category;
  /** Needs `NSW.initSite()` (or its own initialiser) to behave. */
  needsJs?: boolean;
  /** Spans the full frame width (masthead, header, footer). Lives directly under the frame root, not in a grid. */
  fullWidth?: boolean;
  /** How faithfully the canvas can show it. Anything but `full` is listed in docs/NSW-DESIGN-SYSTEM.md. */
  fidelity?: 'full' | 'static' | 'partial';
  note?: string;
  variants: VariantSource[];
}

export interface EditableText {
  key: string;
  default: string;
  multiline: boolean;
}

export interface OptionalPart {
  key: string;
  label: string;
}

/**
 * A property the user can change on a component, applied to its markup at render time.
 * Values live in the node's `props[key]`. Selectors are matched against the variant markup.
 */
export type OptionDef =
  | { type: 'toggleClass'; key: string; label: string; selector: string; className: string }
  | { type: 'toggleAttr'; key: string; label: string; selector: string; attr: string }
  /** Link address. On a <button> this turns the element into an <a>. */
  | { type: 'href'; key: string; label: string; selector: string }
  /** Heading level h1–h6 for the matched element. `default` is the level the markup uses. */
  | { type: 'headingLevel'; key: string; label: string; selector: string; default: number }
  /** A Material icon before or after the label. */
  | { type: 'icon'; key: string; label: string; selector: string };

export interface CatalogueVariant {
  id: string;
  label: string;
  html: string;
  previewBg?: 'brand-dark';
}

export interface CatalogueComponent {
  id: string;
  slug: string;
  name: string;
  category: Category;
  keywords: string[];
  needsJs: boolean;
  fullWidth: boolean;
  fidelity: 'full' | 'static' | 'partial';
  note?: string;
  defaultVariant: string;
  variants: CatalogueVariant[];
  /** Editable text regions found in the default variant. */
  editable: EditableText[];
  /** Parts the user can show or hide. */
  optional: OptionalPart[];
  options: OptionDef[];
}

export interface Catalogue {
  /** The version of the design system the markup was written against. */
  version: string;
  components: CatalogueComponent[];
}
