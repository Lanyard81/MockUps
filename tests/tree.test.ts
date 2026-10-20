import { describe, expect, it } from 'vitest';
import { demoNodes } from '../src/catalogue/demo';
import { cloneSubtrees, collectIds, removeSubtrees } from '../src/layout/tree';

let n = 0;
const makeId = (p: string) => `${p}_${++n}`;

describe('tree', () => {
  const { nodes, root } = demoNodes(makeId);

  it('collects all descendants', () => {
    expect(collectIds(nodes, root).length).toBe(Object.keys(nodes).length);
  });

  it('removes a subtree completely', () => {
    expect(Object.keys(removeSubtrees(nodes, root))).toHaveLength(0);
  });

  it('clones with fresh ids and keeps structure', () => {
    const c = cloneSubtrees(nodes, root, makeId);
    expect(Object.keys(c.nodes)).toHaveLength(Object.keys(nodes).length);
    expect(Object.keys(c.nodes).some((id) => id in nodes)).toBe(false);
    expect(c.nodes[c.roots[0]!]?.type).toBe('section');
  });
});
