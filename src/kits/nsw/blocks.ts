import type { BuiltTree } from '../../layout/tree';
import type { DocNode } from '../../store/types';

type Nodes = Record<string, DocNode>;

type MakeId = (prefix: string) => string;

const col = (id: string, span: number, children: string[] = []): DocNode => ({
  id,
  type: 'column',
  props: { spans: { base: 12, md: span } },
  children,
});

/** Section > container > grid > column(s). The usual shape of a page band. */
export function buildSection(
  makeId: MakeId,
  background = 'white',
  spans: number[] = [12],
): BuiltTree {
  const nodes: Nodes = {};
  const colIds = spans.map((span) => {
    const id = makeId('n');
    nodes[id] = col(id, span);
    return id;
  });
  const grid = buildGridNode(makeId, colIds, nodes);
  const container = makeId('n');
  nodes[container] = { id: container, type: 'container', children: [grid] };
  const section = makeId('n');
  nodes[section] = { id: section, type: 'section', props: { background }, children: [container] };
  return { nodes, rootId: section };
}

function buildGridNode(makeId: MakeId, colIds: string[], nodes: Nodes): string {
  const id = makeId('n');
  nodes[id] = { id, type: 'grid', children: colIds };
  return id;
}

/** A grid of `count` equal columns (1–4) on its own. */
export function buildGrid(makeId: MakeId, count: number): BuiltTree {
  const span = 12 / count;
  const nodes: Nodes = {};
  const colIds = Array.from({ length: count }, () => {
    const id = makeId('n');
    nodes[id] = col(id, span);
    return id;
  });
  return { nodes, rootId: buildGridNode(makeId, colIds, nodes) };
}

/** A container holding a single-column grid. */
export function buildContainer(makeId: MakeId): BuiltTree {
  const grid = buildGrid(makeId, 1);
  const id = makeId('n');
  return {
    nodes: { ...grid.nodes, [id]: { id, type: 'container', children: [grid.rootId] } },
    rootId: id,
  };
}
