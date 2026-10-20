/**
 * Builds src/catalogue/generated/catalogue.json from the hand-written sources in
 * src/catalogue/sources/ and the curated src/catalogue/overrides.ts.
 *
 * The npm package has no markup, so the markup is ours. This script is what keeps it honest:
 * every CSS class in every snippet must exist in the installed package's main.css, and every
 * `js-` hook must be known to its JavaScript. Fails (exit 1) on any mismatch, so upgrading
 * `nsw-design-system` and re-running it shows exactly what moved.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { overrides } from '../src/catalogue/overrides';
import { sources } from '../src/catalogue/sources';
import type {
  Catalogue,
  CatalogueComponent,
  EditableText,
  OptionalPart,
} from '../src/catalogue/types';
import { CATEGORIES } from '../src/catalogue/types';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve('nsw-design-system/package.json'));
const pkg = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8')) as {
  version: string;
};
const css = readFileSync(resolve(pkgDir, 'dist/css/main.css'), 'utf8');
const js = readFileSync(resolve(pkgDir, 'dist/js/main.js'), 'utf8');

const cssClasses = new Set<string>();
for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssClasses.add(m[1]!);

// Classes that legitimately have no rule of their own in main.css.
const ALLOWED = new Set(['material-icons', 'sr-only']);

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());

const components: CatalogueComponent[] = [];
const seenIds = new Set<string>();

for (const src of sources) {
  if (seenIds.has(src.id)) fail(`Duplicate component id: ${src.id}`);
  seenIds.add(src.id);
  if (!(CATEGORIES as readonly string[]).includes(src.category))
    fail(`${src.id}: unknown category`);
  if (src.variants.length === 0) fail(`${src.id}: no variants`);

  const ov = overrides[src.id] ?? {};
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
        if (ALLOWED.has(cls)) continue;
        if (cls.startsWith('js-')) {
          if (!js.includes(cls.slice(3)) && !js.includes(cls))
            fail(`${where}: unknown JS hook .${cls}`);
          continue;
        }
        if (!cssClasses.has(cls))
          fail(`${where}: class .${cls} is not defined in nsw-design-system main.css`);
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

for (const id of Object.keys(overrides))
  if (!seenIds.has(id)) fail(`overrides.ts: unknown component "${id}"`);

if (errors.length > 0) {
  console.error(
    `Catalogue check failed against nsw-design-system ${pkg.version}:\n` +
      errors.map((e) => `  - ${e}`).join('\n'),
  );
  process.exit(1);
}

const catalogue: Catalogue = { nswVersion: pkg.version, components };
const out = resolve(root, 'src/catalogue/generated/catalogue.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(catalogue, null, 1) + '\n');

// Material Icons names for the icon picker, from the installed font package.
const iconSrc = readFileSync(
  resolve(root, 'node_modules/material-icons/css/_codepoints.scss'),
  'utf8',
);
const icons = [...iconSrc.matchAll(/^\s*"([^"]+)":\s*[0-9a-f]+/gim)].map((m) => m[1]!).sort();
if (icons.length < 500)
  throw new Error(
    `Only found ${icons.length} Material Icons names; the package format may have changed`,
  );
writeFileSync(resolve(root, 'src/catalogue/generated/icons.json'), JSON.stringify(icons) + '\n');

const variants = components.reduce((n, c) => n + c.variants.length, 0);
const notFull = components.filter((c) => c.fidelity !== 'full');
console.log(
  `Catalogue: ${components.length} components, ${variants} variants, nsw-design-system ${pkg.version}`,
);
console.log(
  `Not fully faithful on the canvas: ${notFull.map((c) => `${c.id} (${c.fidelity})`).join(', ') || 'none'}`,
);
