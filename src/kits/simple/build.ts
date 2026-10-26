import type { DocNode } from '../../store/types';
import type { MakeId } from '../../templates/types';

/**
 * A small language for writing page templates as trees of real catalogue components, so every part
 * stays editable (no pasted raw HTML):
 *
 *   page(section('two-columns', {}, [c('sk-heading', 'h2')], [c('sk-card', 'image')]))
 */
export interface Part {
  componentId: string;
  variant?: string;
  text?: Record<string, string>;
  props?: Record<string, unknown>;
  hide?: string[];
  textFit?: Record<string, 'natural' | 'shrink'>;
  hidden?: boolean;
  name?: string;
}

export const c = (
  componentId: string,
  variant?: string,
  o: Omit<Part, 'componentId' | 'variant'> = {},
): Part => ({ componentId, variant, ...o });

export type RootItem = SectionSpec | Part;

export interface SectionSpec {
  layout: string;
  props?: Record<string, unknown>;
  columns: Part[][];
}

export const section = (
  layout: string,
  o: { background?: string; spacing?: string; props?: Record<string, unknown> },
  ...columns: Part[][]
): SectionSpec => ({
  layout,
  props: {
    ...(o.background ? { background: o.background } : {}),
    ...(o.spacing ? { spacing: o.spacing } : {}),
    ...o.props,
  },
  columns,
});

export interface PageSpec {
  settings: Record<string, unknown>;
  items: RootItem[];
}

export const page = (settings: Record<string, unknown>, ...items: RootItem[]): PageSpec => ({
  settings,
  items,
});

const isSection = (i: RootItem): i is SectionSpec => 'columns' in i;

/** Build the nodes for a page. A bare part (a header bar, a footer) sits directly in the frame. */
export function buildPage(
  spec: PageSpec,
  makeId: MakeId,
): { root: string[]; nodes: Record<string, DocNode>; settings: Record<string, unknown> } {
  const nodes: Record<string, DocNode> = {};
  const part = (p: Part) => {
    const id = makeId('n');
    nodes[id] = {
      id,
      type: 'component',
      componentId: p.componentId,
      ...(p.variant ? { variant: p.variant } : {}),
      props: { ...p.props, ...(p.hide?.length ? { hiddenParts: p.hide } : {}) },
      ...(p.text ? { text: p.text } : {}),
      ...(p.textFit ? { textFit: p.textFit } : {}),
      ...(p.hidden ? { hidden: true } : {}),
      ...(p.name ? { name: p.name } : {}),
    };
    return id;
  };
  const root = spec.items.map((item) => {
    if (!isSection(item)) return part(item);
    const columnIds = item.columns.map((parts) => {
      const id = makeId('n');
      nodes[id] = { id, type: 'column', children: parts.map(part) };
      return id;
    });
    const id = makeId('n');
    nodes[id] = {
      id,
      type: 'section',
      props: { layout: item.layout, ...item.props },
      children: columnIds,
    };
    return id;
  });
  return { root, nodes, settings: spec.settings };
}
