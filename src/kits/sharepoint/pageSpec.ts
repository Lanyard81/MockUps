import type { DocNode, Frame } from '../../store/types';
import { componentToSpecEntry } from '../pageSpecShared';
import type { KitPageSpec, PageSpecComponent, PageSpecContext } from '../types';
import { readChart } from './charts';
import { SECTION_LAYOUTS } from './sections';
import { buildPage, section, wp, type SectionSpec, type WebPart } from './templateDsl';

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const toPart = (p: PageSpecComponent): WebPart =>
  wp(p.componentId, p.variant, {
    ...(p.text ? { text: p.text } : {}),
    ...(p.props ? { props: p.props } : {}),
    ...(p.hide ? { hide: p.hide } : {}),
    ...(p.textFit ? { textFit: p.textFit } : {}),
    ...(p.hidden ? { hidden: true } : {}),
    ...(p.name ? { name: p.name } : {}),
  });

/** The section nodes built so far, as the rules (one vertical section per page...) see them. */
const asNodes = (specs: SectionSpec[]): DocNode[] =>
  specs.map((s, i) => ({ id: `s${i}`, type: 'section', props: { layout: s.layout, ...s.props } }));

function build(blocks: unknown[], ctx: PageSpecContext) {
  const sections: SectionSpec[] = [];
  let loose: WebPart[] = [];
  const flushLoose = () => {
    if (loose.length) sections.push(section('one-column', {}, loose));
    loose = [];
  };

  const addSection = (raw: Record<string, unknown>) => {
    const settings = isObject(raw.section) ? raw.section : {};
    const { layout: wanted, ...rest } = settings;
    let layout = SECTION_LAYOUTS.find((l) => l.id === wanted);
    if (wanted !== undefined && !layout) {
      ctx.note(
        `The section layout “${String(wanted).slice(0, 40)}” doesn’t exist, so “One column” was used.`,
      );
    }
    // A layout the page's rules don't allow here (a full-width section on a team site, a second vertical
    // section...) falls back to one column, with the reason.
    const blocked = layout?.unavailable?.({
      values: { layout: layout.id },
      frame: ctx.frame,
      kit: {},
      topLevel: asNodes(sections),
    });
    if (layout && blocked) {
      ctx.note(`“${layout.label}” wasn’t used: ${blocked} A one-column section was used instead.`);
      ctx.moved();
      layout = undefined;
    }
    layout ??= SECTION_LAYOUTS[0]!;
    const { props, text } = ctx.layerProps(
      'section',
      { ...rest, layout: layout.id },
      asNodes(sections),
    );

    const rawColumns = Array.isArray(raw.columns) ? raw.columns : [];
    const columns: WebPart[][] = rawColumns.map((col) =>
      (Array.isArray(col) ? col : [])
        .map((c) => ctx.component(c))
        .filter((p): p is PageSpecComponent => p !== null)
        .map(toPart),
    );
    // A layout has a fixed number of columns: extra content moves into the last, and missing columns are empty.
    if (columns.length > layout.columns) {
      ctx.moved();
      ctx.note(
        `A “${layout.label}” section has ${layout.columns} column${layout.columns === 1 ? '' : 's'}, so the content of the extra column${columns.length - layout.columns === 1 ? '' : 's'} was moved into the last one.`,
      );
      const extra = columns.splice(layout.columns - 1).flat();
      columns.push(extra);
    }
    while (columns.length < layout.columns) columns.push([]);
    sections.push({
      layout: layout.id,
      props,
      text: Object.keys(text).length ? text : undefined,
      columns,
    });
  };

  for (const b of blocks) {
    if (isObject(b) && typeof b.component === 'string') {
      const p = ctx.component(b);
      if (p) {
        ctx.moved(); // a web part can't sit on the page itself: it goes in a section
        loose.push(toPart(p));
      }
    } else if (isObject(b) && 'section' in b) {
      flushLoose();
      addSection(b);
    } else ctx.note('Something on the page wasn’t a web part or a section, so it was left out.');
  }
  flushLoose();
  const built = buildPage({ settings: ctx.frame, sections }, ctx.makeId);
  return { root: built.root, nodes: built.nodes };
}

function read(frame: Frame, nodes: Record<string, DocNode>): unknown[] {
  return frame.root.flatMap((id) => {
    const node = nodes[id];
    if (!node || node.type !== 'section') return [];
    const settings: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node.props ?? {})) if (v !== undefined) settings[k] = v;
    for (const [k, v] of Object.entries(node.text ?? {}))
      if (typeof v === 'string') settings[k] = v;
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

export const sharepointPageSpec: KitPageSpec = {
  build,
  read,
  placeholder: (name) => ({
    componentId: 'sp-placeholder',
    variant: 'placeholder',
    text: { name, text: `“${name}” isn’t a web part this kit has, so it was not imported.` },
  }),
  extraProps: (componentId, raw) =>
    componentId === 'sp-quick-chart' && 'chart' in raw ? { chart: readChart(raw.chart) } : {},
  docs: {
    shapes: [
      '- **Top level** (`page`): a list of sections. A web part put directly in `page` is wrapped in a one-column section for you.',
      '- **Section**: `{ "section": { "layout": "two-columns", "background": "soft" }, "columns": [ [webpart, …], [webpart, …] ] }`. One list per column.',
      '- **Layouts** (`section.layout`): `one-column`, `two-columns`, `three-columns`, `one-third-left` (2 columns), `one-third-right` (2 columns), `full-width` (1), `vertical` (1), `flexible` (1). Extra columns are merged into the last; missing ones are left empty.',
      '- **Web part**: `{ "component": "sp-news", "variant": "list", "text": { … }, "props": { … }, "hide": [ … ] }`.',
      '- **Frame settings** (`settings`, top of the file): the site (communication or team), suite bar, header, navigation, footer and page title area. See the settings table below. Menus and footer links are lists: `"navItems": [ { "label": "Home" }, { "label": "News", "children": [ { "label": "Latest" } ] } ]`.',
    ].join('\n'),
    rules: [
      'A full-width section needs a communication site.',
      'A page has at most one vertical section, and not together with a full-width section.',
      'A flexible section can only be added as a new section; it cannot be turned into another layout.',
      'A vertical section cannot be collapsible.',
      'Team sites have a left-hand menu and no footer.',
      'Where a rule is broken, the section becomes a one-column section (or the setting is left out), and the import report says so.',
    ],
    example: {
      format: 'mockup-page-spec',
      version: 1,
      kit: 'sharepoint',
      name: 'Intranet home',
      device: 'desktop',
      settings: { siteType: 'communication', siteTitle: 'Contoso intranet' },
      page: [
        {
          section: { layout: 'one-column' },
          columns: [[{ component: 'sp-hero', variant: 'layers', text: { title1: 'Welcome' } }]],
        },
        {
          section: { layout: 'two-columns', background: 'neutral' },
          columns: [
            [{ component: 'sp-news', variant: 'list' }],
            [{ component: 'sp-events', variant: 'compact' }],
          ],
        },
      ],
    },
  },
};
