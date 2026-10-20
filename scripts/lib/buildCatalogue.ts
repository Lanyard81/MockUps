/**
 * Turns a kit's hand-written sources and overrides into catalogue data, and checks them: every CSS
 * class in every snippet must be defined by the kit's own CSS, every `js-` hook known to its
 * JavaScript, ids and `data-edit` keys unique. Returns the errors rather than exiting, so one
 * run can check every kit.
 */
import { JSDOM } from 'jsdom';
import type {
  CatalogueComponent,
  ComponentSource,
  EditableText,
  OptionalPart,
  OptionDef,
} from '../../src/catalogue/types';

export interface OverrideSpec {
  category?: string;
  keywords?: string[];
  optionalLabels?: Record<string, string>;
  defaultVariant?: string;
  options?: OptionDef[];
}

export interface KitBuildConfig {
  /** For messages, e.g. "nsw-design-system 3.28.1". */
  label: string;
  sources: ComponentSource[];
  overrides: Record<string, OverrideSpec>;
  categories: readonly string[];
  /** Every class the kit's CSS defines. */
  cssClasses: Set<string>;
  /** Classes that legitimately have no rule of their own. */
  allowedClasses: Set<string>;
  /** Kit JavaScript, to check `js-` hooks. Omit when the kit has no hooks. */
  js?: string;
}

const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function buildCatalogue(cfg: KitBuildConfig): {
  components: CatalogueComponent[];
  errors: string[];
} {
  const errors: string[] = [];
  const fail = (msg: string) => errors.push(msg);
  const components: CatalogueComponent[] = [];
  const seenIds = new Set<string>();

  for (const src of cfg.sources) {
    if (seenIds.has(src.id)) fail(`Duplicate component id: ${src.id}`);
    seenIds.add(src.id);
    if (!cfg.categories.includes(src.category)) fail(`${src.id}: unknown category`);
    if (src.variants.length === 0) fail(`${src.id}: no variants`);

    const ov = cfg.overrides[src.id] ?? {};
    const variantIds = new Set<string>();
    let editable: EditableText[] = [];
    let optional: OptionalPart[] = [];
    const defaultVariant = ov.defaultVariant ?? src.variants[0]?.id ?? '';

    for (const v of src.variants) {
      const where = `${src.id}/${v.id}`;
      if (variantIds.has(v.id)) fail(`${where}: duplicate variant id`);
      variantIds.add(v.id);

      const dom = new JSDOM(`<body>${v.html}</body>`);
      const body = dom.window.document.body;

      for (const el of body.querySelectorAll('[class]')) {
        for (const cls of el.getAttribute('class')!.split(/\s+/).filter(Boolean)) {
          if (cfg.allowedClasses.has(cls)) continue;
          if (cls.startsWith('js-')) {
            if (cfg.js && !cfg.js.includes(cls.slice(3)) && !cfg.js.includes(cls))
              fail(`${where}: unknown JS hook .${cls}`);
            continue;
          }
          if (!cfg.cssClasses.has(cls))
            fail(`${where}: class .${cls} is not defined in ${cfg.label} CSS`);
        }
      }

      const keys = new Set<string>();
      const found: EditableText[] = [];
      for (const el of body.querySelectorAll('[data-edit]')) {
        const key = el.getAttribute('data-edit')!;
        if (keys.has(key)) fail(`${where}: duplicate data-edit="${key}"`);
        keys.add(key);
        found.push({
          key,
          default: (el.textContent ?? '').trim(),
          multiline: el.hasAttribute('data-multiline'),
        });
      }
      const optFound: OptionalPart[] = [];
      for (const el of body.querySelectorAll('[data-optional]')) {
        const key = el.getAttribute('data-optional')!;
        if (!optFound.some((o) => o.key === key))
          optFound.push({ key, label: ov.optionalLabels?.[key] ?? titleCase(key) });
      }
      if (v.id === defaultVariant) {
        editable = found;
        optional = optFound;
        for (const opt of ov.options ?? []) {
          if (!body.querySelector(opt.selector)) {
            fail(
              `${src.id}: option "${opt.key}" selector "${opt.selector}" matches nothing in the default variant`,
            );
          }
        }
      }
    }
    if (!variantIds.has(defaultVariant))
      fail(`${src.id}: defaultVariant "${defaultVariant}" does not exist`);

    components.push({
      id: src.id,
      slug: src.slug,
      name: src.name,
      category: ov.category ?? src.category,
      keywords: ov.keywords ?? [],
      needsJs: src.needsJs ?? false,
      fullWidth: src.fullWidth ?? false,
      fidelity: src.fidelity ?? 'full',
      ...(src.note ? { note: src.note } : {}),
      defaultVariant,
      variants: src.variants.map(({ id, label, html, previewBg }) => ({
        id,
        label,
        html,
        ...(previewBg ? { previewBg } : {}),
      })),
      editable,
      optional,
      options: ov.options ?? [],
    });
  }

  for (const id of Object.keys(cfg.overrides))
    if (!seenIds.has(id)) fail(`overrides: unknown component "${id}"`);

  return { components, errors };
}
