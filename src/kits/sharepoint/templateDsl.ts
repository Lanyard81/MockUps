import type { DocNode } from '../../store/types';
import type { MakeId } from '../../templates/types';

/**
 * A small language for writing SharePoint page templates as trees of real catalogue web parts, so
 * every part stays editable (no pasted raw HTML):
 *
 *   page(
 *     { type: 'communication', header: 'standard', title: 'Home' },
 *     section('two-columns', {}, [wp('sp-news', 'list')], [wp('sp-events', 'compact')]),
 *   )
 */
export interface WebPart {
  componentId: string;
  variant?: string;
  text?: Record<string, string>;
  props?: Record<string, unknown>;
  hide?: string[];
  textFit?: Record<string, 'natural' | 'shrink'>;
  hidden?: boolean;
  name?: string;
}

export const wp = (
  componentId: string,
  variant?: string,
  o: Omit<WebPart, 'componentId' | 'variant'> = {},
): WebPart => ({ componentId, variant, ...o });

export interface SectionSpec {
  layout: string;
  props?: Record<string, unknown>;
  text?: Record<string, string>;
  columns: WebPart[][];
}

export const section = (
  layout: string,
  o: { background?: string; props?: Record<string, unknown>; text?: Record<string, string> },
  ...columns: WebPart[][]
): SectionSpec => ({
  layout,
  props: { ...(o.background ? { background: o.background } : {}), ...o.props },
  text: o.text,
  columns,
});

export interface PageSpec {
  /** The frame's SharePoint settings (site type, header, title area, ...). */
  settings: Record<string, unknown>;
  sections: SectionSpec[];
}

export const page = (settings: Record<string, unknown>, ...sections: SectionSpec[]): PageSpec => ({
  settings,
  sections,
});

/** Build the nodes for a page. Each section gets one column per entry in `columns`. */
export function buildPage(
  spec: PageSpec,
  makeId: MakeId,
): { root: string[]; nodes: Record<string, DocNode>; settings: Record<string, unknown> } {
  const nodes: Record<string, DocNode> = {};
  const root = spec.sections.map((s) => {
    const columnIds = s.columns.map((parts) => {
      const kids = parts.map((p) => {
        const id = makeId('n');
        nodes[id] = {
          id,
          type: 'component',
          componentId: p.componentId,
          ...(p.variant ? { variant: p.variant } : {}),
          props: {
            ...p.props,
            ...(p.hide?.length ? { hiddenParts: p.hide } : {}),
          },
          ...(p.text ? { text: p.text } : {}),
          ...(p.textFit ? { textFit: p.textFit } : {}),
          ...(p.hidden ? { hidden: true } : {}),
          ...(p.name ? { name: p.name } : {}),
        };
        return id;
      });
      const id = makeId('n');
      nodes[id] = { id, type: 'column', children: kids };
      return id;
    });
    const id = makeId('n');
    nodes[id] = {
      id,
      type: 'section',
      props: { layout: s.layout, ...s.props },
      ...(s.text ? { text: s.text } : {}),
      children: columnIds,
    };
    return id;
  });
  return { root, nodes, settings: spec.settings };
}
