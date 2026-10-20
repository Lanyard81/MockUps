import type { DocNode, Frame } from '../../store/types';
import type { KitPageSpec, PageSpecComponent, PageSpecContext } from '../types';
import { componentToSpecEntry } from '../pageSpecShared';
import { BREAKPOINTS, equalSpans, readSpans, type Spans } from './spans';
import {
  buildTree,
  c,
  sec,
  type CompSpec,
  type RowSpec,
  type SectionSpec,
  type TopItem,
} from './templateDsl';

/** Most columns a row may have (the grid's limit in the kit's schema). */
const MAX_COLUMNS = 6;

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const toComp = (p: PageSpecComponent): CompSpec =>
  c(p.componentId, p.variant, {
    ...(p.text ? { text: p.text } : {}),
    ...(p.props ? { props: p.props } : {}),
    ...(p.hide ? { hide: p.hide } : {}),
    ...(p.textFit ? { textFit: p.textFit } : {}),
    ...(p.hidden ? { hidden: true } : {}),
    ...(p.name ? { name: p.name } : {}),
  });

/** A width in a row: a number (the width from the medium breakpoint up) or per-breakpoint widths. */
function toSpans(raw: unknown, fallback: Spans): Spans {
  const clamp = (n: number) => Math.min(12, Math.max(1, Math.round(n)));
  if (typeof raw === 'number' && Number.isFinite(raw)) return { base: 12, md: clamp(raw) };
  if (isObject(raw)) {
    const out: Spans = {};
    for (const bp of BREAKPOINTS) {
      const v = raw[bp.id];
      if (typeof v === 'number' && Number.isFinite(v)) out[bp.id] = clamp(v);
    }
    if (Object.keys(out).length) return { base: 12, ...out };
  }
  return fallback;
}

function buildSection(
  raw: Record<string, unknown>,
  ctx: PageSpecContext,
): { section: SectionSpec; hoisted: CompSpec[] } {
  const hoisted: CompSpec[] = [];
  const settings = isObject(raw.section) ? raw.section : {};
  const { flush, ...sectionRaw } = settings;
  const { props } = ctx.layerProps('section', sectionRaw);
  const container = ctx.layerProps('container', flush === undefined ? {} : { flush });
  const bg = typeof props.background === 'string' ? props.background : undefined;
  const padding =
    props.padding === 'half' || props.padding === 'none'
      ? (props.padding as 'half' | 'none')
      : undefined;

  /** A component for this place; a full-width one can't sit inside a section, so it moves out after it. */
  const place = (rawComp: unknown): CompSpec | null => {
    const p = ctx.component(rawComp);
    if (!p) return null;
    if (ctx.isFullWidth(p.componentId)) {
      ctx.moved();
      ctx.note(
        `“${p.componentId}” spans the whole page, so it was moved out of its section to just after it.`,
      );
      hoisted.push(toComp(p));
      return null;
    }
    return toComp(p);
  };

  const blocks: (CompSpec | RowSpec)[] = [];
  for (const b of Array.isArray(raw.blocks) ? raw.blocks : []) {
    if (isObject(b) && Array.isArray(b.row)) {
      const cols = (Array.isArray(b.columns) ? b.columns : []).slice(0, MAX_COLUMNS);
      if (Array.isArray(b.columns) && b.columns.length > MAX_COLUMNS) {
        ctx.moved();
        ctx.note(
          `A row had more than ${MAX_COLUMNS} columns; the extra ones were moved into the last column.`,
        );
        const extra = (b.columns as unknown[]).slice(MAX_COLUMNS).flat();
        const last = Array.isArray(cols[cols.length - 1])
          ? (cols[cols.length - 1] as unknown[])
          : [];
        cols[cols.length - 1] = [...last, ...extra];
      }
      const columns = cols.map((col) =>
        (Array.isArray(col) ? col : []).map(place).filter((x): x is CompSpec => x !== null),
      );
      if (columns.length === 0) continue;
      const spans = columns.map((_, i) =>
        toSpans((b.row as unknown[])[i], equalSpans(columns.length)),
      );
      if ((b.row as unknown[]).length !== columns.length)
        ctx.note('A row’s widths didn’t match its columns, so missing widths were shared equally.');
      blocks.push({ kind: 'row', spans, columns } satisfies RowSpec);
    } else if (isObject(b) && typeof b.component === 'string') {
      const comp = place(b);
      if (comp) blocks.push(comp);
    } else ctx.note('Something inside a section wasn’t a component or a row, so it was left out.');
  }
  return {
    section: {
      kind: 'section',
      ...(bg ? { bg } : {}),
      ...(padding ? { padding } : {}),
      ...(container.props.flush === true ? { flush: true } : {}),
      blocks,
    },
    hoisted,
  };
}

function build(blocks: unknown[], ctx: PageSpecContext) {
  const items: TopItem[] = [];
  let loose: CompSpec[] = [];
  const flushLoose = () => {
    if (loose.length) items.push(sec({}, ...loose));
    loose = [];
  };
  for (const b of blocks) {
    if (isObject(b) && typeof b.component === 'string') {
      const p = ctx.component(b);
      if (!p) continue;
      if (ctx.isFullWidth(p.componentId)) {
        flushLoose();
        items.push(toComp(p));
      } else loose.push(toComp(p)); // a component on the page itself goes into a section, as when dropped on empty space
    } else if (isObject(b) && 'section' in b) {
      flushLoose();
      const { section, hoisted } = buildSection(b, ctx);
      items.push(section, ...hoisted);
    } else if (isObject(b) && Array.isArray(b.row)) {
      // A row outside any section: give it a section of its own.
      flushLoose();
      ctx.moved();
      const { section, hoisted } = buildSection({ section: {}, blocks: [b] }, ctx);
      items.push(section, ...hoisted);
    } else ctx.note('Something on the page wasn’t a component or a section, so it was left out.');
  }
  flushLoose();
  return buildTree(items, ctx.makeId);
}

const spansToSpec = (spans: Spans): number | Spans => {
  const keys = Object.keys(spans).filter((k) => spans[k as keyof Spans] !== undefined);
  return keys.every((k) => k === 'base' || k === 'md') &&
    spans.base === 12 &&
    spans.md !== undefined
    ? spans.md
    : spans;
};

function read(frame: Frame, nodes: Record<string, DocNode>): unknown[] {
  const comps = (ids: string[]) =>
    ids
      .map((id) => nodes[id])
      .filter((n): n is DocNode => !!n && n.type === 'component')
      .map(componentToSpecEntry);
  return frame.root.flatMap((id) => {
    const node = nodes[id];
    if (!node) return [];
    if (node.type === 'component') return [componentToSpecEntry(node)];
    if (node.type !== 'section') return [];
    const containers = (node.children ?? [])
      .map((cid) => nodes[cid])
      .filter((n): n is DocNode => !!n);
    const settings: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node.props ?? {})) {
      if (v === undefined || (k === 'padding' && v === 'default')) continue;
      settings[k] = v;
    }
    if (containers[0]?.props?.flush === true) settings.flush = true;
    const blocks: unknown[] = [];
    for (const container of containers)
      for (const gid of container.children ?? []) {
        const grid = nodes[gid];
        if (!grid) continue;
        const cols = (grid.children ?? [])
          .map((cid) => nodes[cid])
          .filter((n): n is DocNode => !!n);
        const single = cols.length === 1 ? readSpans(cols[0]!.props) : undefined;
        if (
          cols.length === 1 &&
          single &&
          single.base === 12 &&
          (single.md ?? 12) === 12 &&
          Object.keys(single).every((k) => k === 'base' || k === 'md')
        )
          blocks.push(...comps(cols[0]!.children ?? []));
        else
          blocks.push({
            row: cols.map((col) => spansToSpec(readSpans(col.props))),
            columns: cols.map((col) => comps(col.children ?? [])),
          });
      }
    return [{ section: settings, blocks }];
  });
}

export const nswPageSpec: KitPageSpec = {
  build,
  read,
  placeholder: (name) => ({
    componentId: 'in-page-alert',
    variant: 'warning',
    text: {
      title: `Not imported: ${name}`,
      copy: `“${name}” isn’t a component this kit has. Replace this with the nearest match.`,
    },
    name: `Placeholder: ${name}`,
  }),
  docs: {
    shapes: [
      '- **Top level** (`page`): a list of items. Each is either a component, or a section.',
      '- **Component**: `{ "component": "card", "variant": "default", "text": { "title": "…" }, "props": { … }, "hide": ["image"] }`. A full-width component (masthead, header, main navigation, footer, hero banner, …) sits directly in `page`. Any other component put directly in `page` is wrapped in a section for you.',
      '- **Section**: `{ "section": { "background": "off-white", "padding": "half", "flush": true }, "blocks": [ … ] }`. `blocks` holds components (stacked in one column) and rows.',
      '- **Row**: `{ "row": [8, 4], "columns": [ [component, …], [component, …] ] }`. `row` has one width per column, out of 12 from the medium breakpoint up (phones stack). A width can also be an object by breakpoint: `{ "base": 12, "md": 6, "lg": 4 }`. At most 6 columns.',
      '- **Section settings**: `background` (white, off-white, brand-light, brand-dark, brand-supplementary, grey-01, grey-02, grey-03, grey-04, black), `padding` (default, half, none), `flush` (true: edge to edge).',
    ].join('\n'),
    rules: [
      'Components that span the whole page cannot be inside a section or a column; they are moved to just after it.',
      'Sections cannot be nested, and rows must be inside a section.',
      'A row has at most 6 columns.',
    ],
    example: {
      format: 'mockup-page-spec',
      version: 1,
      kit: 'nsw',
      name: 'Home',
      device: 'desktop',
      settings: {},
      page: [
        { component: 'masthead', variant: 'dark' },
        {
          component: 'header',
          variant: 'default',
          text: { title: 'Service NSW', description: 'Everyday services' },
        },
        { component: 'main-nav', variant: 'default' },
        {
          section: { background: 'off-white' },
          blocks: [
            { component: 'heading', variant: 'h1', text: { text: 'Find a service' } },
            {
              row: [6, 6],
              columns: [
                [
                  {
                    component: 'card',
                    variant: 'default',
                    text: { title: 'Apply', copy: 'Apply online in minutes.' },
                  },
                ],
                [{ component: 'button', variant: 'dark', text: { label: 'Get started' } }],
              ],
            },
          ],
        },
        { component: 'footer', variant: 'dark' },
      ],
    },
  },
};
