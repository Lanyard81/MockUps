import type { BuiltTree } from '../../layout/tree';
import type { DocNode } from '../../store/types';
import type { LayoutBlock } from '../types';
import { SECTION_LAYOUTS, fullWidthBlocked, verticalBlocked } from './sections';

type MakeId = (prefix: string) => string;

/** A section with the number of columns its layout has, and `props.layout` set. */
export function buildSpSection(makeId: MakeId, layoutId = 'one-column'): BuiltTree {
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

const bar = (x: number, w: number, fill = true) => ({ x, y: 6, width: w, height: 28, fill });

/** Library tiles for the section layouts (and where each can't be used). */
export const SP_LAYOUT_BLOCKS: LayoutBlock[] = [
  ['one-column', [bar(4, 56)]],
  ['two-columns', [bar(4, 27), bar(33, 27)]],
  ['three-columns', [bar(4, 17), bar(23, 18), bar(43, 17)]],
  ['one-third-left', [bar(4, 17), bar(23, 37)]],
  ['one-third-right', [bar(4, 37), bar(43, 17)]],
  ['full-width', [{ x: 0, y: 6, width: 64, height: 28, fill: true }]],
  ['vertical', [bar(4, 36), { x: 44, y: 6, width: 16, height: 28, fill: true }]],
  [
    'flexible',
    [bar(4, 26), bar(32, 14), bar(48, 12), { x: 4, y: 22, width: 56, height: 12, fill: true }],
  ],
].map(([id, icon]) => {
  const layout = SECTION_LAYOUTS.find((l) => l.id === id)!;
  return {
    kind: 'section',
    columns: SECTION_LAYOUTS.indexOf(layout) + 1, // distinguishes the layouts; not a column count
    label: layout.label.replace(' (approximation)', ''),
    title:
      layout.title ??
      `Add ${/section$/i.test(layout.label) ? 'a ' : ''}${layout.label.replace(' (approximation)', '').toLowerCase()}`,
    layer: 'section',
    icon: icon as LayoutBlock['icon'],
    unavailable:
      id === 'full-width'
        ? (ctx) => fullWidthBlocked(ctx)
        : id === 'vertical'
          ? (ctx) => verticalBlocked(ctx)
          : undefined,
    build: (makeId) => buildSpSection(makeId, id as string),
  } satisfies LayoutBlock;
});
