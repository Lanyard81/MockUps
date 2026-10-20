import { getKit, KITS } from '../kits';
import type { Kit, SettingDef } from '../kits/types';
import type { CatalogueComponent, OptionDef } from '../catalogue/types';
import { describeVariant, optionsForVariant } from '../layout/component';
import { SPEC_FORMAT, SPEC_VERSION } from './types';

/** The instruction to paste into a chat with a screenshot. Kept short; the kit's reference follows it. */
export const SPEC_INSTRUCTION = `Recreate the attached screenshot as a page spec for the NSW Mockup Builder.

1. Choose the kit and set "kit": "nsw" for NSW Government sites, "sharepoint" for SharePoint or Microsoft 365 pages.
2. Use only the components, variants, text keys, options and settings listed in that kit's reference below. Use the closest variant when nothing matches exactly.
3. Copy all visible text exactly. Do not invent content you cannot see.
4. For anything with no match (a map, a chart you cannot express, a custom widget), add \`{ "component": "<what it is>" }\` with a name that is not in the list. The app turns it into a clearly labelled placeholder.
5. Follow the section, row and column shapes and the rules below, and keep the order of the page.
6. Output only the JSON: one object with "format": "${SPEC_FORMAT}" and "version": ${SPEC_VERSION}. No explanation, no code fences.`;

const code = (s: string) => `\`${s}\``;

function describeDef(def: SettingDef): string {
  switch (def.type) {
    case 'swatches':
    case 'segmented':
    case 'select':
      return def.options.map((o) => o.id).join(' \\| ');
    case 'toggle':
      return 'true \\| false';
    case 'text':
      return 'text';
    case 'color':
      return '#rrggbb';
    case 'number':
      return `${def.min} to ${def.max}`;
  }
}

function settingsTable(defs: SettingDef[]): string {
  if (defs.length === 0) return '_None._';
  return [
    '| Key | Values | Default | What it is |',
    '| --- | --- | --- | --- |',
    ...defs.map(
      (d) =>
        `| ${code(d.key)} | ${describeDef(d)} | ${d.default === undefined ? '' : code(String(d.default))} | ${d.group}: ${d.label} |`,
    ),
  ].join('\n');
}

function optionText(o: OptionDef): string {
  switch (o.type) {
    case 'toggleClass':
    case 'toggleAttr':
      return `${code(o.key)} (true) ${o.label}`;
    case 'href':
      return `${code(o.key)} (link address) ${o.label}`;
    case 'headingLevel':
      return `${code(o.key)} (1 to 6) ${o.label}`;
    case 'icon':
    case 'iconSlot':
      return `${code(o.key)} (icon name) ${o.label}`;
    case 'choice':
      return `${code(o.key)} (${o.choices.map((c) => c.id).join(' \\| ')}) ${o.label}`;
  }
}

function componentLine(c: CatalogueComponent): string {
  // Text keys and parts vary by variant: list the union, with the default wording from the first variant that has each.
  const text = new Map<string, string>();
  const optional = new Set<string>();
  const options = new Map<string, OptionDef>();
  for (const v of c.variants) {
    const parts = describeVariant(v.html);
    for (const e of parts.editable) if (!text.has(e.key)) text.set(e.key, e.default);
    for (const k of parts.optional) optional.add(k);
    for (const o of optionsForVariant(v.html, c.options))
      if (!options.has(o.key)) options.set(o.key, o);
  }
  const bits = [
    `variants: ${c.variants.map((v) => code(v.id)).join(', ')} (default ${code(c.defaultVariant)})`,
  ];
  if (text.size)
    bits.push(
      `text: ${[...text].map(([k, d]) => `${code(k)}${d ? ` “${d.replace(/\s+/g, ' ').slice(0, 40)}”` : ''}`).join(', ')}`,
    );
  if (options.size) bits.push(`options: ${[...options.values()].map(optionText).join('; ')}`);
  if (optional.size) bits.push(`hide: ${[...optional].map(code).join(', ')}`);
  if (c.fullWidth) bits.push('**full width**');
  return `- ${code(c.id)} ${c.name}: ${bits.join(' · ')}`;
}

/** The generated reference for one kit: shapes, rules, settings, every component and a worked example. */
export function kitReference(kit: Kit): string {
  const byCategory = new Map<string, CatalogueComponent[]>();
  for (const c of kit.catalogue.components) {
    const list = byCategory.get(c.category) ?? [];
    list.push(c);
    byCategory.set(c.category, list);
  }
  const lists = Object.keys(kit.frameDefaults?.({}) ?? {});
  const layerTables = Object.entries(kit.settings.node)
    .filter(([, defs]) => defs.length > 0)
    .map(
      ([type, defs]) =>
        `**${kit.labels.names[type as keyof typeof kit.labels.names] ?? type} settings**\n\n${settingsTable(defs)}`,
    );
  return [
    `## ${kit.name} (${code(`"kit": "${kit.id}"`)})`,
    '',
    '### Shapes',
    '',
    kit.pageSpec.docs.shapes,
    '',
    '### Rules',
    '',
    ...kit.pageSpec.docs.rules.map((r) => `- ${r}`),
    '',
    '### Frame settings (`settings`)',
    '',
    settingsTable(kit.settings.frame),
    ...(lists.length
      ? ['', `Lists you can also set in \`settings\`: ${lists.map(code).join(', ')}.`]
      : []),
    '',
    ...layerTables.flatMap((t) => [t, '']),
    '### Components',
    '',
    'Each entry may have `variant`, `text`, `props` (the options), `hide` (optional parts to hide), `name` and `hidden`.',
    '',
    ...[...byCategory].flatMap(([category, list]) => [
      `**${category}**`,
      '',
      ...list.map(componentLine),
      '',
    ]),
    '### Worked example',
    '',
    '```json',
    JSON.stringify(kit.pageSpec.docs.example, null, 2),
    '```',
    '',
  ].join('\n');
}

/** What the "Copy page spec instructions" button copies: the instruction, then one kit's reference. */
export function pageSpecInstructions(kitId: string): string {
  return `${SPEC_INSTRUCTION}\n\n---\n\n${kitReference(getKit(kitId))}`;
}

/** The whole of `docs/PAGE-SPEC.md`. Generated: run `npm run page-spec-docs` after changing a kit. */
export function generatePageSpecDoc(): string {
  return [
    '# Page spec reference',
    '',
    '<!-- Generated by `npm run page-spec-docs` from the kit catalogues and settings. Do not edit by hand. -->',
    '',
    'A page spec is a compact, nested JSON description of a page (`.page.json`). Import one with **File → Import page spec…**, by dropping the file on the editor, or by pasting the JSON. Each page becomes a new frame. **Copy as page spec** on a frame gives you the same format back, so a frame can go through a chat and return.',
    '',
    'Several pages: put them in a list, `{ "format": "' +
      SPEC_FORMAT +
      '", "version": ' +
      SPEC_VERSION +
      ', "pages": [ { "name": "Home", "kit": "nsw", "page": [ … ] }, … ] }`. Each page may set `name`, `kit`, `device` (iphone, android, tablet, desktop), `width` (240 to 3000), `settings` and `page`.',
    '',
    'The importer is forgiving and reports what it did: an unknown component becomes a labelled placeholder, an unknown variant becomes the default, unknown text keys, options and settings are dropped, and an item in a place the rules do not allow is moved to the nearest valid place.',
    '',
    '## Instruction for Claude',
    '',
    'Paste this, then the reference for the kit you need (File → Copy page spec instructions copies both), with your screenshot:',
    '',
    '```text',
    SPEC_INSTRUCTION,
    '```',
    '',
    ...KITS.map((k) => kitReference(k)),
  ].join('\n');
}
