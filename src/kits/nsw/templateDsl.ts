import type { DeviceId, DocNode } from '../../store/types';
import type { MakeId } from '../../templates/types';
import { equalSpans, type Spans } from './spans';

/**
 * A small language for writing templates as trees of real catalogue components, so every part of
 * a template stays editable (no pasted raw HTML). Example:
 *
 *   page(
 *     top('masthead', 'dark'),
 *     sec({ bg: 'off-white' }, c('heading', 'h1', { text: { text: 'Hello' } }), row([6, 6], [c(...)], [c(...)])),
 *   )
 */
export interface CompSpec {
  kind: 'comp';
  componentId: string;
  variant?: string;
  text?: Record<string, string>;
  props?: Record<string, unknown>;
  /** Optional parts to hide, by key. */
  hide?: string[];
  name?: string;
  textFit?: Record<string, 'natural' | 'shrink'>;
  hidden?: boolean;
}

export interface RowSpec {
  kind: 'row';
  spans: Spans[];
  columns: CompSpec[][];
}

export interface SectionSpec {
  kind: 'section';
  bg?: string;
  padding?: 'half' | 'none';
  flush?: boolean;
  blocks: (CompSpec | RowSpec)[];
}

export type TopItem = CompSpec | SectionSpec;

export interface BuiltTree {
  root: string[];
  nodes: Record<string, DocNode>;
}

interface CompOptions {
  text?: Record<string, string>;
  props?: Record<string, unknown>;
  hide?: string[];
  name?: string;
  textFit?: Record<string, 'natural' | 'shrink'>;
  hidden?: boolean;
}

export const c = (componentId: string, variant?: string, o: CompOptions = {}): CompSpec => ({
  kind: 'comp',
  componentId,
  variant,
  ...o,
});

/** A full-width component directly in the frame (masthead, header, footer, hero banner...). */
export const top = c;

/** A row of columns. Each width is the span from the medium breakpoint up; phones stack. */
export function row(widths: (number | Spans)[], ...columns: CompSpec[][]): RowSpec {
  return {
    kind: 'row',
    spans: widths.map((w) => (typeof w === 'number' ? { base: 12, md: w } : { base: 12, ...w })),
    columns,
  };
}

/** Equal columns. */
export const equal = (...columns: CompSpec[][]): RowSpec => ({
  kind: 'row',
  spans: columns.map(() => equalSpans(columns.length)),
  columns,
});

export function sec(
  opts: { bg?: string; padding?: 'half' | 'none'; flush?: boolean },
  ...blocks: (CompSpec | RowSpec)[]
): SectionSpec {
  return { kind: 'section', ...opts, blocks };
}

export const page = (...items: TopItem[]): TopItem[] => items;

/** Turn a template spec into document nodes. */
export function buildTree(items: TopItem[], makeId: MakeId): BuiltTree {
  const nodes: Record<string, DocNode> = {};
  const add = (node: Omit<DocNode, 'id'>): string => {
    const id = makeId('n');
    nodes[id] = { id, ...node };
    return id;
  };

  const comp = (s: CompSpec): string => {
    const props: Record<string, unknown> = { ...s.props };
    if (s.hide?.length) props.hiddenParts = s.hide;
    return add({
      type: 'component',
      componentId: s.componentId,
      ...(s.variant ? { variant: s.variant } : {}),
      props,
      text: { ...s.text },
      textFit: { ...s.textFit },
      hidden: s.hidden === true,
      ...(s.name ? { name: s.name } : {}),
    });
  };

  const column = (spans: Spans, items: CompSpec[]) =>
    add({ type: 'column', props: { spans }, children: items.map(comp) });
  const grid = (spans: Spans[], columns: CompSpec[][]) =>
    add({
      type: 'grid',
      children: columns.map((items, i) => column(spans[i] ?? { base: 12, md: 12 }, items)),
    });

  const section = (s: SectionSpec): string => {
    // Consecutive plain components share one single-column grid, so they stack like a page.
    const grids: string[] = [];
    let run: CompSpec[] = [];
    const flush = () => {
      if (run.length) grids.push(grid([{ base: 12, md: 12 }], [run]));
      run = [];
    };
    for (const b of s.blocks) {
      if (b.kind === 'comp') run.push(b);
      else {
        flush();
        grids.push(grid(b.spans, b.columns));
      }
    }
    flush();
    const container = add({
      type: 'container',
      ...(s.flush ? { props: { flush: true } } : {}),
      children: grids,
    });
    return add({
      type: 'section',
      props: { background: s.bg ?? 'white', ...(s.padding ? { padding: s.padding } : {}) },
      children: [container],
    });
  };

  const root = items.map((i) => (i.kind === 'comp' ? comp(i) : section(i)));
  return { root, nodes };
}

export interface NswTemplateDef {
  id: string;
  name: string;
  group: string;
  description: string;
  device: DeviceId;
  width: number;
  items: () => TopItem[];
}
