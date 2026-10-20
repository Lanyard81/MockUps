import type { BuiltTree } from '../../layout/tree';
import type { DocNode } from '../../store/types';

type MakeId = (prefix: string) => string;

/** A section with `count` equal columns. */
export function buildSpSection(makeId: MakeId, count = 1): BuiltTree {
  const nodes: Record<string, DocNode> = {};
  const columns = Array.from({ length: count }, () => {
    const id = makeId('n');
    nodes[id] = { id, type: 'column', children: [] };
    return id;
  });
  const section = makeId('n');
  nodes[section] = {
    id: section,
    type: 'section',
    props: { layout: 'one-column' },
    children: columns,
  };
  return { nodes, rootId: section };
}
