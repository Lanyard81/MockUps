import type { BuiltTree } from '../../layout/tree';
import type { DocNode } from '../../store/types';
import type { LayoutBlock } from '../types';
import { SECTION_LAYOUTS } from './sections';

type MakeId = (prefix: string) => string;

/** A section with the number of columns its layout has, and `props.layout` set. */
export function buildSection(makeId: MakeId, layoutId = 'one-column'): BuiltTree {
  const layout = SECTION_LAYOUTS.find((l) => l.id === layoutId) ?? SECTION_LAYOUTS[0]!;
  const nodes: Record<string, DocNode> = {};
  const columns = Array.from({ length: layout.columns }, () => {
    const id = makeId('n');
    nodes[id] = { id, type: 'column', children: [] };
    return id;
  });
  const section = makeId('n');
  nodes[section] = {
    id: section,
    type: 'section',
    props: { layout: layout.id },
    children: columns,
  };
  return { nodes, rootId: section };
}

const bar = (x: number, w: number) => ({ x, y: 6, width: w, height: 28, fill: true });

const ICONS: Record<string, LayoutBlock['icon']> = {
  'one-column': [bar(4, 56)],
  'two-columns': [bar(4, 27), bar(33, 27)],
  'three-columns': [bar(4, 17), bar(23, 18), bar(43, 17)],
  'sidebar-left': [bar(4, 17), bar(23, 37)],
  'sidebar-right': [bar(4, 37), bar(43, 17)],
};

/** Library tiles for the section layouts. */
export const SIMPLE_LAYOUT_BLOCKS: LayoutBlock[] = SECTION_LAYOUTS.map((layout, i) => ({
  kind: 'section',
  columns: i + 1, // distinguishes the layouts; not a column count
  label: layout.label,
  title: layout.title ?? `Add a ${layout.label.toLowerCase()} section`,
  layer: 'section',
  icon: ICONS[layout.id]!,
  build: (makeId) => buildSection(makeId, layout.id),
}));
