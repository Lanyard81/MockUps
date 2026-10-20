export const CATEGORIES = [
  'Layout',
  'Navigation',
  'Content',
  'Forms',
  'Feedback',
  'Media',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** A variant as hand-written in `sources/`. HTML is real NSW markup, with `data-edit` and `data-optional` markers. */
export interface VariantSource {
  id: string;
  label: string;
  html: string;
  /** Thumbnail background, for variants that only make sense on a dark section (e.g. white buttons). */
  previewBg?: 'brand-dark';
}

export interface ComponentSource {
  id: string;
  /** Slug of the page on designsystem.nsw.gov.au/components/<slug>/ */
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
}

export interface Catalogue {
  nswVersion: string;
  components: CatalogueComponent[];
}
