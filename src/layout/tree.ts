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

export interface BuiltTree {
  nodes: Nodes;
  /** Id of the topmost node created. */
  rootId: string;
}

/** Immutably append `childId` to the children of `parentId`. */
export function appendChild(nodes: Nodes, parentId: string, childId: string): Nodes {
  const parent = nodes[parentId];
  if (!parent) throw new Error(`Missing node ${parentId}`);
  return { ...nodes, [parentId]: { ...parent, children: [...(parent.children ?? []), childId] } };
}
