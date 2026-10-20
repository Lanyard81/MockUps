import type { DocNode } from '../store/types';

type Nodes = Record<string, DocNode>;

/** Collect a node and all of its descendants. */
export function collectIds(nodes: Nodes, rootIds: string[]): string[] {
  const out: string[] = [];
  const walk = (id: string) => {
    out.push(id);
    nodes[id]?.children?.forEach(walk);
  };
  rootIds.forEach(walk);
  return out;
}

/** Return a copy of `nodes` without the given roots and their descendants. */
export function removeSubtrees(nodes: Nodes, rootIds: string[]): Nodes {
  const drop = new Set(collectIds(nodes, rootIds));
  return Object.fromEntries(Object.entries(nodes).filter(([id]) => !drop.has(id)));
}

/** Deep-copy subtrees with fresh ids. Returns the new nodes and the new root ids. */
export function cloneSubtrees(
  nodes: Nodes,
  rootIds: string[],
  makeId: (prefix: string) => string,
): { nodes: Nodes; roots: string[] } {
  const added: Nodes = {};
  const copy = (id: string): string => {
    const src = nodes[id];
    if (!src) throw new Error(`Missing node ${id}`);
    const newId = makeId('n');
    added[newId] = {
      ...structuredClone(src),
      id: newId,
      ...(src.children ? { children: src.children.map(copy) } : {}),
    };
    return newId;
  };
  return { roots: rootIds.map(copy), nodes: added };
}

type MakeId = (prefix: string) => string;

export interface BuiltTree {
  nodes: Nodes;
  /** Id of the topmost node created. */
  rootId: string;
}

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

/** Immutably append `childId` to the children of `parentId`. */
export function appendChild(nodes: Nodes, parentId: string, childId: string): Nodes {
  const parent = nodes[parentId];
  if (!parent) throw new Error(`Missing node ${parentId}`);
  return { ...nodes, [parentId]: { ...parent, children: [...(parent.children ?? []), childId] } };
}
