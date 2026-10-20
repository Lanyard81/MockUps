import { describe, expect, it } from 'vitest';
import {
  appendChild,
  buildContainer,
  buildGrid,
  buildSection,
  cloneSubtrees,
  collectIds,
  removeSubtrees,
} from '../src/layout/tree';

let n = 0;
const makeId = (p: string) => `${p}_${++n}`;

describe('tree', () => {
  const built = buildSection(makeId, 'off-white', [6, 6]);
  const { nodes } = built;
  const root = [built.rootId];

  it('builds section > container > grid > columns', () => {
    const section = nodes[built.rootId]!;
    expect(section.type).toBe('section');
    const container = nodes[section.children![0]!]!;
    expect(container.type).toBe('container');
    const grid = nodes[container.children![0]!]!;
    expect(grid.type).toBe('grid');
    expect(grid.children).toHaveLength(2);
    expect(
      grid.children!.map((c) => (nodes[c]!.props?.spans as { md?: number } | undefined)?.md),
    ).toEqual([6, 6]);
  });

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

  it('builds grids of 1–4 equal columns and containers with one column', () => {
    const g = buildGrid(makeId, 3);
    expect(
      g.nodes[g.rootId]!.children!.map(
        (c) => (g.nodes[c]!.props?.spans as { md?: number } | undefined)?.md,
      ),
    ).toEqual([4, 4, 4]);
    const c = buildContainer(makeId);
    expect(c.nodes[c.rootId]!.type).toBe('container');
  });

  it('appendChild does not mutate the original', () => {
    const col = nodes[nodes[nodes[built.rootId]!.children![0]!]!.children![0]!]!.children![1]!;
    const next = appendChild(nodes, col, 'x');
    expect(next[col]!.children).toEqual(['x']);
    expect(nodes[col]!.children).toEqual([]);
  });
});
