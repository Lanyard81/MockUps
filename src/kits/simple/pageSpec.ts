import type { DocNode, Frame } from '../../store/types';
import { componentToSpecEntry } from '../pageSpecShared';
import type { KitPageSpec, PageSpecComponent, PageSpecContext } from '../types';
import { buildPage, section, type Part, type RootItem, type SectionSpec } from './build';
import { SECTION_LAYOUTS } from './sections';

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const toPart = (p: PageSpecComponent): Part => ({
  componentId: p.componentId,
  variant: p.variant,
  ...(p.text ? { text: p.text } : {}),
  ...(p.props ? { props: p.props } : {}),
  ...(p.hide ? { hide: p.hide } : {}),
  ...(p.textFit ? { textFit: p.textFit } : {}),
  ...(p.hidden ? { hidden: true } : {}),
  ...(p.name ? { name: p.name } : {}),
});

function build(blocks: unknown[], ctx: PageSpecContext) {
  const items: RootItem[] = [];
  let loose: Part[] = [];
  const flushLoose = () => {
    if (loose.length) items.push(section('one-column', {}, loose));
    loose = [];
  };

  const addSection = (raw: Record<string, unknown>) => {
    const settings = isObject(raw.section) ? raw.section : {};
    const { layout: wanted, ...rest } = settings;
    let layout = SECTION_LAYOUTS.find((l) => l.id === wanted);
    if (wanted !== undefined && !layout)
      ctx.note(
        `The section layout “${String(wanted).slice(0, 40)}” doesn’t exist, so “One column” was used.`,
      );
    layout ??= SECTION_LAYOUTS[0]!;
    const { props } = ctx.layerProps('section', { ...rest, layout: layout.id });
    const rawColumns = Array.isArray(raw.columns) ? raw.columns : [];
    const columns: Part[][] = rawColumns.map((col) =>
      (Array.isArray(col) ? col : [])
        .map((entry) => ctx.component(entry))
        .filter((p): p is PageSpecComponent => p !== null && !ctx.isFullWidth(p.componentId))
        .map(toPart),
    );
    if (columns.length > layout.columns) {
      ctx.moved();
      ctx.note(
        `A “${layout.label}” section has ${layout.columns} column${layout.columns === 1 ? '' : 's'}, so the content of the extra column${columns.length - layout.columns === 1 ? '' : 's'} was moved into the last one.`,
      );
      const extra = columns.splice(layout.columns - 1).flat();
      columns.push(extra);
    }
    while (columns.length < layout.columns) columns.push([]);
    items.push({ layout: layout.id, props, columns } satisfies SectionSpec);
  };

  for (const b of blocks) {
    if (isObject(b) && typeof b.component === 'string') {
      const p = ctx.component(b);
      if (!p) continue;
      if (ctx.isFullWidth(p.componentId)) {
        flushLoose(); // a header bar or footer sits on the page itself
        items.push(toPart(p));
      } else {
        ctx.moved(); // other components go in a section
        loose.push(toPart(p));
      }
    } else if (isObject(b) && 'section' in b) {
      flushLoose();
      addSection(b);
    } else ctx.note('Something on the page wasn’t a component or a section, so it was left out.');
  }
  flushLoose();
  const built = buildPage({ settings: ctx.frame, items }, ctx.makeId);
  return { root: built.root, nodes: built.nodes };
}

function read(frame: Frame, nodes: Record<string, DocNode>): unknown[] {
  return frame.root.flatMap((id) => {
    const node = nodes[id];
    if (!node) return [];
    if (node.type === 'component') return [componentToSpecEntry(node)];
    if (node.type !== 'section') return [];
    const settings: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node.props ?? {})) if (v !== undefined) settings[k] = v;
    const columns = (node.children ?? [])
      .map((cid) => nodes[cid])
      .filter((n): n is DocNode => !!n && n.type === 'column')
      .map((col) =>
        (col.children ?? [])
          .map((cid) => nodes[cid])
          .filter((n): n is DocNode => !!n && n.type === 'component')
          .map(componentToSpecEntry),
      );
    return [{ section: settings, columns }];
  });
}

export const simplePageSpec: KitPageSpec = {
  build,
  read,
  placeholder: (name) => ({
    componentId: 'sk-placeholder',
    variant: 'placeholder',
    text: { name, text: `“${name}” isn’t a component this kit has, so it was not imported.` },
  }),
  docs: {
    shapes: [
      '- **Top level** (`page`): a list of sections. A header bar (`sk-navbar`) or footer (`sk-footer`) goes directly in `page`. Any other component put directly in `page` is wrapped in a one-column section for you.',
      '- **Section**: `{ "section": { "layout": "two-columns", "background": "soft" }, "columns": [ [component, …], [component, …] ] }`. One list per column.',
      '- **Layouts** (`section.layout`): `one-column`, `two-columns`, `three-columns`, `sidebar-left` (2 columns, narrow then wide), `sidebar-right` (2 columns, wide then narrow). Extra columns are merged into the last; missing ones are left empty.',
      '- **Component**: `{ "component": "sk-card", "variant": "image", "text": { … }, "props": { … }, "hide": [ … ] }`.',
      '- **Page settings** (`settings`, top of the file): an optional accent colour for this page (`accentOverride: true`, `accent: "#7c3aed"`).',
    ].join('\n'),
    rules: [
      'A header bar and a footer sit directly on the page, not inside a section.',
      'Sections have a fixed number of columns for their layout.',
    ],
    example: {
      format: 'mockup-page-spec',
      version: 1,
      kit: 'simple',
      name: 'Landing page',
      device: 'desktop',
      page: [
        { component: 'sk-navbar', variant: 'simple', text: { brand: 'Acme' } },
        {
          section: { layout: 'one-column', background: 'soft' },
          columns: [
            [
              {
                component: 'sk-hero',
                variant: 'centre',
                text: { title: 'Make something people love' },
              },
            ],
          ],
        },
        {
          section: { layout: 'three-columns' },
          columns: [
            [{ component: 'sk-card', variant: 'image' }],
            [{ component: 'sk-card', variant: 'image' }],
            [{ component: 'sk-card', variant: 'image' }],
          ],
        },
        { component: 'sk-footer', variant: 'simple' },
      ],
    },
  },
};
