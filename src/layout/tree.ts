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
  props: { span },
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

export function lastOfType(
  nodes: Nodes,
  ids: string[] | undefined,
  type: DocNode['type'],
): string | undefined {
  for (let i = (ids?.length ?? 0) - 1; i >= 0; i--) {
    const id = ids![i]!;
    if (nodes[id]?.type === type) return id;
  }
  return undefined;
}

/**
 * Where a new component should go so page content stacks naturally: the last column of the
 * last grid of the last container of the frame's last section. Undefined when there is none.
 */
export function findAppendColumn(nodes: Nodes, root: string[]): string | undefined {
  const section = lastOfType(nodes, root, 'section');
  if (!section || root[root.length - 1] !== section) return undefined;
  const container = lastOfType(nodes, nodes[section]?.children, 'container');
  const grid = lastOfType(nodes, container ? nodes[container]?.children : undefined, 'grid');
  return lastOfType(nodes, grid ? nodes[grid]?.children : undefined, 'column');
}

/** Immutably append `childId` to the children of `parentId`. */
export function appendChild(nodes: Nodes, parentId: string, childId: string): Nodes {
  const parent = nodes[parentId];
  if (!parent) throw new Error(`Missing node ${parentId}`);
  return { ...nodes, [parentId]: { ...parent, children: [...(parent.children ?? []), childId] } };
}
