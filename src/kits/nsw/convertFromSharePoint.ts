import type { DocNode } from '../../store/types';
import type { ConversionContext, ConversionSource, ConvertedPage, FrameConversion } from '../types';
import {
  buildTree,
  c,
  row,
  sec,
  top,
  type CompSpec,
  type RowSpec,
  type SectionSpec,
  type TopItem,
} from './templateDsl';

/**
 * SharePoint to NSW. A mapping table says which NSW component each web part becomes; section
 * layouts become rows of columns; the site settings become a masthead, header, main menu and
 * footer. Anything without an equivalent becomes an NSW in-page alert that names it.
 */
type Rule = (n: DocNode, s: ConversionSource) => CompSpec[];

const link = (n: DocNode) => ({
  ...(typeof n.props?.href === 'string' ? { href: n.props.href } : {}),
  ...(typeof n.props?.goto === 'string' ? { goto: n.props.goto } : {}),
});
const images = (n: DocNode) =>
  n.props?.images ? { images: structuredClone(n.props.images) } : undefined;
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const linkList = (n: DocNode, s: ConversionSource, titleKey: string, itemKey: string): CompSpec =>
  c('link-list', 'default', {
    text: {
      title: s.textOf(n, titleKey),
      ...Object.fromEntries(range(1, 4).map((i) => [`link${i}`, s.textOf(n, `${itemKey}${i}`)])),
    },
  });

const table = (headers: string[], rows: string[][], caption?: string): CompSpec =>
  c('table', 'default', {
    text: {
      ...(caption ? { caption } : {}),
      ...Object.fromEntries(headers.map((h, i) => [`h${i + 1}`, h])),
      ...Object.fromEntries(rows.flatMap((r, ri) => r.map((v, ci) => [`r${ri + 1}c${ci + 1}`, v]))),
    },
  });

/** The mapping table: SharePoint component id to what it becomes. */
const RULES: Record<string, Rule> = {
  'sp-text': (n, s) => {
    const v = s.variantOf(n);
    if (v.startsWith('heading-'))
      return [c('heading', `h${v.slice(-1)}`, { text: { text: s.textOf(n, 'text') } })];
    if (v === 'bullets' || v === 'numbers')
      return [
        c('list', v === 'numbers' ? 'number' : 'bullet', {
          text: Object.fromEntries(range(1, 3).map((i) => [`item${i}`, s.textOf(n, `item${i}`)])),
        }),
      ];
    if (v === 'table')
      return [
        table(
          range(1, 3).map((i) => s.textOf(n, `head${i}`)),
          range(1, 3).map((r) => range(1, 3).map((col) => s.textOf(n, `cell${r}${col}`))),
        ),
      ];
    return [c('paragraph', 'default', { text: { text: s.textOf(n, 'text') } })];
  },
  'sp-image': (n, s) => [
    c('media', 'default', { text: { caption: s.textOf(n, 'caption') }, props: images(n) }),
  ],
  'sp-button': (n, s) => [
    c('button', 'dark', { text: { label: s.textOf(n, 'label') }, props: link(n) }),
  ],
  'sp-cta': (n, s) => [
    c('callout', 'default', { text: { title: s.textOf(n, 'title'), copy: s.textOf(n, 'text') } }),
    c('button', 'dark', { text: { label: s.textOf(n, 'label') }, props: link(n) }),
  ],
  'sp-link': (n, s) =>
    s.variantOf(n) === 'card'
      ? [
          c('card', 'default', {
            text: { title: s.textOf(n, 'title'), copy: s.textOf(n, 'description') },
            props: { ...link(n), ...images(n) },
          }),
        ]
      : [c('link', 'default', { text: { label: s.textOf(n, 'title') }, props: link(n) })],
  'sp-hero': (n, s) => [
    c('hero-banner', 'dark', {
      text: { title: s.textOf(n, 'title1'), button: s.textOf(n, 'cta1') },
      props: link(n),
    }),
  ],
  'sp-quick-links': (n, s) => [linkList(n, s, 'title', 'title')],
  'sp-highlighted-content': (n, s) => [linkList(n, s, 'title', 'title')],
  'sp-news': (n, s) =>
    range(1, 4).map((i) =>
      c('list-item', 'default', {
        text: {
          label: s.textOf(n, `tag${i}`),
          title: s.textOf(n, `title${i}`),
          copy: s.textOf(n, `summary${i}`),
          date: s.textOf(n, `date${i}`),
        },
      }),
    ),
  'sp-events': (n, s) =>
    range(1, 3).map((i) =>
      c('list-item', 'default', {
        text: {
          label: s.textOf(n, `where${i}`),
          title: s.textOf(n, `title${i}`),
          date: `${s.textOf(n, `day${i}`)} ${s.textOf(n, `month${i}`)}`,
        },
      }),
    ),
  'sp-document-library': (n, s) => [
    table(
      ['Name', 'Modified', 'Modified by'],
      range(1, 3).map((i) => [
        s.textOf(n, `name${i}`),
        s.textOf(n, `modified${i}`),
        s.textOf(n, `by${i}`),
      ]),
      s.textOf(n, 'title'),
    ),
  ],
  'sp-list': (n, s) => [
    table(
      ['Title', 'Status', 'Owner'],
      range(1, 3).map((i) => [
        s.textOf(n, `title${i}`),
        s.textOf(n, `status${i}`),
        s.textOf(n, `owner${i}`),
      ]),
      s.textOf(n, 'title'),
    ),
  ],
  'sp-page-properties': (n, s) => [
    table(
      ['Property', 'Value'],
      range(1, 3).map((i) => [s.textOf(n, `key${i}`), s.textOf(n, `value${i}`)]),
    ),
  ],
  // Nothing to bring across: NSW sections and containers set the spacing.
  'sp-divider': () => [],
  'sp-spacer': () => [],
};

const BACKGROUNDS: Record<string, string> = {
  none: 'white',
  neutral: 'off-white',
  soft: 'brand-light',
  strong: 'brand-dark',
  gradient: 'brand-dark',
  image: 'brand-dark',
};

/** Column widths (out of 12, from the medium breakpoint up) for each SharePoint layout. */
const SPANS: Record<string, number[]> = {
  'one-column': [12],
  'two-columns': [6, 6],
  'three-columns': [4, 4, 4],
  'one-third-left': [4, 8],
  'one-third-right': [8, 4],
  'full-width': [12],
  vertical: [12],
  flexible: [12],
};

function convert(src: ConversionSource, ctx: ConversionContext): ConvertedPage {
  const chrome = src.chrome;
  const items: TopItem[] = [];
  const bottom: TopItem[] = [];

  const part = (n: DocNode): CompSpec[] => {
    const rule = n.componentId ? RULES[n.componentId] : undefined;
    if (!rule) {
      const name = src.nameOf(n);
      ctx.unmapped(name);
      return [
        c('in-page-alert', 'warning', {
          text: {
            title: `Not converted: ${name}`,
            copy: `“${name}” has no NSW equivalent, so it was not converted.`,
          },
        }),
      ];
    }
    const out = rule(n, src);
    ctx.mapped(
      src.nameOf(n),
      out.map((p) => p.componentId),
    );
    return out;
  };

  items.push(top('masthead', 'dark'));
  items.push(
    top('header', 'default', { text: chrome?.siteTitle ? { title: chrome.siteTitle } : undefined }),
  );
  ctx.mapped('Site header, menu and footer', ['masthead', 'header']);
  if (chrome?.showNav && chrome.navLabels.length)
    items.push(
      top('main-nav', 'default', {
        text: Object.fromEntries(chrome.navLabels.slice(0, 6).map((l, i) => [`item${i + 1}`, l])),
      }),
    );
  if (chrome?.showFooter) {
    bottom.push(
      top('footer', 'dark', {
        text: {
          group1: 'Links',
          ...Object.fromEntries(
            chrome.footerLinks.slice(0, 3).map((l, i) => [`g1link${i + 1}`, l]),
          ),
        },
      }),
    );
  }

  if (chrome?.title) {
    const blocks: CompSpec[] = [c('heading', 'h1', { text: { text: chrome.title.text } })];
    if (chrome.title.byline)
      blocks.push(c('paragraph', 'default', { text: { text: chrome.title.byline } }));
    items.push(sec({ bg: 'white' }, ...blocks));
  }

  const sections: SectionSpec[] = [];
  const vertical: SectionSpec[] = [];
  for (const id of src.frame.root) {
    const node = src.nodes[id];
    if (!node || node.hidden || node.type !== 'section') continue;
    const layout = String(node.props?.layout ?? 'one-column');
    const spans = SPANS[layout] ?? [12];
    const columns: CompSpec[][] = (node.children ?? []).map((cid) =>
      (src.nodes[cid]?.children ?? []).flatMap((wid) => {
        const w = src.nodes[wid];
        return w && !w.hidden ? part(w) : [];
      }),
    );
    if (node.props?.collapsible === true) {
      columns[0] = [
        c('heading', 'h2', {
          text: { text: src.textOf(node, 'collapseTitle') || 'Section title' },
        }),
        ...(columns[0] ?? []),
      ];
      ctx.note(
        'Collapsible sections became a heading followed by their content (NSW sections do not collapse).',
      );
    }
    const blocks: (CompSpec | RowSpec)[] =
      columns.length > 1 ? [row(spans.slice(0, columns.length), ...columns)] : (columns[0] ?? []);
    const spec = sec(
      {
        bg: BACKGROUNDS[String(node.props?.background ?? 'none')] ?? 'white',
        flush: layout === 'full-width',
      },
      ...blocks,
    );
    if (layout === 'vertical') {
      vertical.push(spec);
      ctx.note('The vertical section became an ordinary section at the end of the page.');
    } else sections.push(spec);
    if (node.props?.background === 'image')
      ctx.note('A section background picture was not carried across: NSW sections use colours.');
  }
  items.push(...sections, ...vertical, ...bottom);
  const built = buildTree(items, ctx.makeId);
  return { root: built.root, nodes: built.nodes, settings: undefined };
}

export const sharePointToNsw: FrameConversion = { from: 'sharepoint', convert };
