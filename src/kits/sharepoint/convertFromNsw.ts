import type { DocNode } from '../../store/types';
import type { ConversionContext, ConversionSource, ConvertedPage, FrameConversion } from '../types';
import { buildPage, section, wp, type SectionSpec, type WebPart } from './templateDsl';
import type { NavItem } from './site';

/**
 * NSW to SharePoint. A mapping table says which web part each NSW component becomes; the page
 * structure maps to the nearest section layout; the page furniture (masthead, header, menu, footer)
 * becomes site settings. Anything without an equivalent becomes a labelled placeholder.
 */
interface Out {
  /** Web parts for the column the component was in. */
  parts?: WebPart[];
  /** Whole sections to put after the current one (an accordion becomes collapsible sections). */
  sections?: SectionSpec[];
}
type Rule = (n: DocNode, s: ConversionSource) => Out;

const images = (n: DocNode) =>
  n.props?.images ? { images: structuredClone(n.props.images) } : undefined;
const link = (n: DocNode) => ({
  ...(typeof n.props?.href === 'string' ? { href: n.props.href } : {}),
  ...(typeof n.props?.goto === 'string' ? { goto: n.props.goto } : {}),
});
const keys = (prefix: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);

const collapsible = (title: string, body: string, collapsed: boolean): SectionSpec =>
  section(
    'one-column',
    { props: { collapsible: true, collapsedByDefault: collapsed }, text: { collapseTitle: title } },
    [wp('sp-text', 'paragraph', { text: { text: body } })],
  );

const quickLinks = (title: string, labels: string[]): WebPart =>
  wp('sp-quick-links', 'list', {
    text: { title, ...Object.fromEntries(labels.map((l, i) => [`title${i + 1}`, l])) },
    hide: [...keys('item', Math.max(4, labels.length + 1), 6), 'descriptions'],
  });

/** The mapping table: NSW component id to what it becomes. */
const RULES: Record<string, Rule> = {
  heading: (n, s) => ({
    parts: [
      wp('sp-text', `heading-${s.variantOf(n).replace('h', '')}`, {
        text: { text: s.textOf(n, 'text') },
      }),
    ],
  }),
  paragraph: (n, s) => ({
    parts: [wp('sp-text', 'paragraph', { text: { text: s.textOf(n, 'text') } })],
  }),
  list: (n, s) => ({
    parts: [
      wp('sp-text', s.variantOf(n) === 'number' ? 'numbers' : 'bullets', {
        text: Object.fromEntries(keys('item', 1, 3).map((k) => [k, s.textOf(n, k)])),
      }),
    ],
  }),
  button: (n, s) => ({
    parts: [
      wp('sp-button', 'primary', {
        text: { label: s.textOf(n, 'label') },
        props: {
          ...link(n),
          ...(s.variantOf(n).includes('outline') ? { style: 'secondary' } : {}),
        },
      }),
    ],
  }),
  link: (n, s) => ({
    parts: [wp('sp-link', 'inline', { text: { title: s.textOf(n, 'label') }, props: link(n) })],
  }),
  'link-list': (n, s) => ({
    parts: [
      quickLinks(
        s.textOf(n, 'title'),
        keys('link', 1, 4).map((k) => s.textOf(n, k)),
      ),
    ],
  }),
  'utility-list': (n, s) => ({
    parts: [
      quickLinks(
        s.textOf(n, 'title'),
        keys('item', 1, 3).map((k) => s.textOf(n, k)),
      ),
    ],
  }),
  'in-page-nav': (n, s) => ({
    parts: [
      quickLinks(
        s.textOf(n, 'title'),
        keys('item', 1, 4).map((k) => s.textOf(n, k)),
      ),
    ],
  }),
  card: (n, s) => ({
    parts: [
      wp('sp-link', 'card', {
        text: { title: s.textOf(n, 'title'), description: s.textOf(n, 'copy') },
        props: { ...link(n), ...images(n) },
        hide: ['url'],
      }),
    ],
  }),
  'list-item': (n, s) => ({
    parts: [wp('sp-link', 'inline', { text: { title: s.textOf(n, 'title') }, props: link(n) })],
  }),
  'card-carousel': (n, s) => ({
    parts: [
      wp('sp-highlighted-content', 'carousel', {
        text: {
          title: s.textOf(n, 'title'),
          ...Object.fromEntries(keys('title', 1, 3).map((k) => [k, s.textOf(n, k)])),
        },
        hide: ['seeAll', 'item4'],
      }),
    ],
  }),
  'hero-banner': (n, s) => ({
    parts: [
      wp('sp-hero', 'tiles', {
        text: { title1: s.textOf(n, 'title'), cta1: s.textOf(n, 'button') },
        props: link(n),
        hide: keys('item', 2, 5),
      }),
    ],
  }),
  'content-block': (n, s) => ({
    parts: [
      ...(s.variantOf(n) === 'image'
        ? [wp('sp-image', 'image', { props: images(n), hide: ['caption'] })]
        : []),
      wp('sp-text', 'heading-3', { text: { text: s.textOf(n, 'title') } }),
      wp('sp-text', 'paragraph', { text: { text: s.textOf(n, 'copy') } }),
      wp('sp-button', 'primary', { text: { label: s.textOf(n, 'link') }, props: link(n) }),
    ],
  }),
  callout: (n, s) => ({
    parts: [
      wp('sp-text', 'paragraph', {
        text: { text: `${s.textOf(n, 'title')}\n${s.textOf(n, 'copy')}` },
        props: { highlight: true },
      }),
    ],
  }),
  'in-page-alert': (n, s) => ({
    parts: [
      wp('sp-text', 'paragraph', {
        text: { text: `${s.textOf(n, 'title')}\n${s.textOf(n, 'copy')}` },
        props: { highlight: true },
      }),
    ],
  }),
  accordion: (n, s) => ({
    sections: keys('title', 1, 3).map((k, i) =>
      collapsible(s.textOf(n, k), s.textOf(n, `content${i + 1}`), i > 0),
    ),
  }),
  tabs: (n, s) => ({
    sections: keys('tab', 1, 3).map((k, i) =>
      collapsible(s.textOf(n, k), s.textOf(n, `panel${i + 1}`), i > 0),
    ),
  }),
  table: (n, s) => ({
    parts: [
      wp('sp-text', 'table', {
        text: {
          ...Object.fromEntries([1, 2, 3].map((c) => [`head${c}`, s.textOf(n, `h${c}`)])),
          ...Object.fromEntries(
            [1, 2, 3].flatMap((r) =>
              [1, 2, 3].map((c) => [`cell${r}${c}`, s.textOf(n, `r${r}c${c}`)]),
            ),
          ),
        },
        props: s.variantOf(n) === 'striped' ? { tableStyle: 'striped' } : undefined,
      }),
    ],
  }),
  media: (n, s) => ({
    parts:
      s.variantOf(n) === 'video'
        ? [wp('sp-youtube', 'video', { text: { title: s.textOf(n, 'caption') } })]
        : [
            wp('sp-image', 'image', {
              text: { caption: s.textOf(n, 'caption') },
              props: images(n),
            }),
          ],
  }),
  steps: (n, s) => ({
    parts: [
      wp('sp-text', 'numbers', {
        text: Object.fromEntries(
          keys('title', 1, 3).map((k, i) => [`item${i + 1}`, s.textOf(n, k)]),
        ),
      }),
    ],
  }),
};

/** Page furniture that becomes site settings rather than content. */
const CHROME = new Set(['masthead', 'header', 'main-nav', 'footer']);

const BACKGROUNDS: Record<string, string> = {
  white: 'none',
  'off-white': 'neutral',
  'grey-04': 'neutral',
  'grey-03': 'neutral',
  'brand-light': 'soft',
  'brand-dark': 'strong',
  'brand-supplementary': 'strong',
  'grey-01': 'strong',
  'grey-02': 'strong',
  black: 'strong',
};

const placeholder = (name: string): WebPart =>
  wp('sp-placeholder', 'placeholder', {
    text: { name, text: `“${name}” has no SharePoint equivalent, so it was not converted.` },
  });

function convert(src: ConversionSource, ctx: ConversionContext): ConvertedPage {
  const settings: Record<string, unknown> = { siteType: 'communication', showTitleArea: false };
  const sections: SectionSpec[] = [];
  let sawNav = false;
  let sawFooter = false;

  /** The web parts for one component, counting what was and wasn't converted. */
  const parts = (n: DocNode): { parts: WebPart[]; sections: SectionSpec[] } => {
    const rule = n.componentId ? RULES[n.componentId] : undefined;
    if (!rule) {
      ctx.unmapped(src.nameOf(n));
      return { parts: [placeholder(src.nameOf(n))], sections: [] };
    }
    const out = rule(n, src);
    ctx.mapped(
      src.nameOf(n),
      (out.parts ?? []).map((p) => p.componentId),
    );
    return { parts: out.parts ?? [], sections: out.sections ?? [] };
  };

  const chrome = (n: DocNode) => {
    ctx.mapped(src.nameOf(n), []);
    if (n.componentId === 'header') settings.siteTitle = src.textOf(n, 'title');
    if (n.componentId === 'main-nav') {
      sawNav = true;
      const items: NavItem[] = keys('item', 1, 6)
        .map((k) => ({ label: src.textOf(n, k) }))
        .filter((i) => i.label);
      settings.navItems = items;
    }
    if (n.componentId === 'footer') {
      sawFooter = true;
      settings.footerLinks = [1, 2, 3, 4]
        .flatMap((g) => [`g${g}link1`, `g${g}link2`])
        .map((k) => src.textOf(n, k))
        .filter(Boolean)
        .slice(0, 8);
    }
  };

  for (const id of src.frame.root) {
    const node = src.nodes[id];
    if (!node || node.hidden) continue;

    if (node.type === 'component') {
      if (node.componentId && CHROME.has(node.componentId)) {
        chrome(node);
        continue;
      }
      // Another full-width component (a hero banner, an alert): its own section.
      const out = parts(node);
      sections.push(
        section(node.componentId === 'hero-banner' ? 'full-width' : 'one-column', {}, out.parts),
        ...out.sections,
      );
      continue;
    }

    // A section: gather the grids inside it.
    const grids: DocNode[] = [];
    const walk = (nid: string) => {
      const n = src.nodes[nid];
      if (!n || n.hidden) return;
      if (n.type === 'grid') grids.push(n);
      else n.children?.forEach(walk);
    };
    node.children?.forEach(walk);

    const extra: SectionSpec[] = [];
    const column = (colId: string): WebPart[] => {
      const out: WebPart[] = [];
      for (const cid of src.nodes[colId]?.children ?? []) {
        const c = src.nodes[cid];
        if (!c || c.hidden) continue;
        const r = parts(c);
        out.push(...r.parts);
        extra.push(...r.sections);
      }
      return out;
    };

    let columns: WebPart[][];
    let layout = 'one-column';
    if (grids.length === 1) {
      const cols = (grids[0]!.children ?? []).map(column);
      columns = cols.length ? cols : [[]];
      if (columns.length > 3) {
        ctx.note(
          'A row with more than three columns was reduced to three: the extra columns were stacked in the last one.',
        );
        columns = [columns[0]!, columns[1]!, columns.slice(2).flat()];
      }
      layout = ['one-column', 'two-columns', 'three-columns'][columns.length - 1]!;
      if (columns.length === 2) {
        const spans = (grids[0]!.children ?? []).map(
          (c) => (src.nodes[c]?.props?.spans as { md?: number } | undefined)?.md,
        );
        if (spans[0] === 4 && spans[1] === 8) layout = 'one-third-left';
        else if (spans[0] === 8 && spans[1] === 4) layout = 'one-third-right';
      }
    } else {
      // Several rows in one section: SharePoint sections have one row, so they are stacked.
      const stacked = grids.flatMap((g) => (g.children ?? []).map(column).flat());
      columns = [stacked];
      if (grids.some((g) => (g.children?.length ?? 0) > 1))
        ctx.note('A section with several rows of columns was stacked into one column.');
    }
    sections.push(
      section(
        layout,
        { background: BACKGROUNDS[String(node.props?.background ?? 'white')] ?? 'none' },
        ...columns,
      ),
      ...extra,
    );
  }

  if (!sawNav) settings.navVisible = false;
  if (!sawFooter) settings.footerVisible = false;
  if (sections.length === 0) sections.push(section('one-column', {}, []));
  return buildPage({ settings, sections }, ctx.makeId) as ConvertedPage;
}

export const nswToSharePoint: FrameConversion = { from: 'nsw', convert };
