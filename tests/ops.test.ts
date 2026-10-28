import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyInsertion,
  arrangeInRow,
  buildChain,
  canContain,
  canMoveInto,
  clearChildren,
  describeInsertion,
  depthOf,
  detachNode,
  frameOfNode,
  insertNode,
  isWithin,
  locate,
  moveAmongSiblings,
  parentOf,
  pathTo,
  removeNode,
  resolveInsertion,
  setGridColumnCount,
  sideBySideChoices,
  type Doc,
} from '../src/layout/ops';
import { buildSection } from '../src/kits/nsw/blocks';
import type { DocNode } from '../src/store/types';

let n = 0;
const makeId = (p: string) => `${p}_${++n}`;
const comp = (id: string, componentId = 'button'): DocNode => ({
  id,
  type: 'component',
  componentId,
  variant: 'dark',
});

/** Frame f1 with one section (one column holding a, b) and a second frame f2. */
function fixture(): { doc: Doc; section: string; container: string; grid: string; column: string } {
  const built = buildSection(makeId);
  const section = built.rootId;
  const container = built.nodes[section]!.children![0]!;
  const grid = built.nodes[container]!.children![0]!;
  const column = built.nodes[grid]!.children![0]!;
  const nodes: Doc['nodes'] = { ...built.nodes, a: comp('a'), b: comp('b') };
  nodes[column] = { ...nodes[column]!, children: ['a', 'b'] };
  const doc: Doc = {
    frames: [
      {
        id: 'f1',
        name: 'One',
        kitId: 'nsw',
        device: 'iphone',
        width: 393,
        x: 0,
        y: 0,
        root: [section],
      },
      { id: 'f2', name: 'Two', kitId: 'nsw', device: 'iphone', width: 393, x: 500, y: 0, root: [] },
    ],
    nodes,
  };
  return { doc, section, container, grid, column };
}

let fx: ReturnType<typeof fixture>;
beforeEach(() => {
  fx = fixture();
});

describe('depth and containment rules', () => {
  it('layers the tree section > container > grid > column > component', () => {
    expect(
      ['section', 'container', 'grid', 'column'].map((type) =>
        depthOf({ id: 'x', type } as DocNode),
      ),
    ).toEqual([1, 2, 3, 4]);
    expect(depthOf(comp('x'))).toBe(5);
  });

  it('treats full-width components as root-level', () => {
    const mast = comp('m', 'masthead');
    expect(depthOf(mast)).toBe(1);
    expect(canContain(null, mast)).toBe(true);
    expect(canContain(fx.doc.nodes[fx.section]!, mast)).toBe(false);
  });

  it('only lets each layer hold the next one down', () => {
    const { doc } = fx;
    expect(canContain(null, doc.nodes[fx.section]!)).toBe(true);
    expect(canContain(null, comp('x'))).toBe(false);
    expect(canContain(doc.nodes[fx.section]!, doc.nodes[fx.container]!)).toBe(true);
    expect(canContain(doc.nodes[fx.column]!, comp('x'))).toBe(true);
    expect(canContain(doc.nodes[fx.section]!, comp('x'))).toBe(false);
    expect(canContain(comp('a'), comp('b'))).toBe(false);
  });

  it('refuses to move a node into itself or its own descendants, or to move columns', () => {
    const { doc } = fx;
    expect(canMoveInto(doc, fx.section, fx.column)).toBe(false);
    expect(canMoveInto(doc, fx.container, fx.container)).toBe(false);
    expect(canMoveInto(doc, fx.column, fx.grid)).toBe(false);
    expect(canMoveInto(doc, 'a', fx.column)).toBe(true);
    expect(canMoveInto(doc, fx.section, null)).toBe(true);
  });
});

describe('locating nodes', () => {
  it('finds parent, index, frame and path', () => {
    const { doc } = fx;
    expect(parentOf(doc, 'b')).toEqual({ parentId: fx.column, index: 1 });
    expect(parentOf(doc, fx.section)).toEqual({ parentId: null, index: 0 });
    expect(frameOfNode(doc, 'b')).toBe('f1');
    expect(locate(doc, 'a')).toEqual({ frameId: 'f1', parentId: fx.column, index: 0 });
    expect(pathTo(doc, 'b')).toEqual([fx.section, fx.container, fx.grid, fx.column, 'b']);
    expect(isWithin(doc, 'b', fx.container)).toBe(true);
    expect(isWithin(doc, fx.section, 'b')).toBe(false);
    expect(parentOf(doc, 'nope')).toBeUndefined();
  });
});

describe('editing the tree', () => {
  it('inserts at an index in a parent and in a frame root', () => {
    const { doc } = fx;
    const withC: Doc = { ...doc, nodes: { ...doc.nodes, c: comp('c') } };
    expect(insertNode(withC, 'f1', fx.column, 1, 'c').nodes[fx.column]!.children).toEqual([
      'a',
      'c',
      'b',
    ]);
    const withMast = { ...doc, nodes: { ...doc.nodes, m: comp('m', 'masthead') } };
    expect(insertNode(withMast, 'f1', null, 0, 'm').frames[0]!.root).toEqual(['m', fx.section]);
  });

  it('never mutates its input', () => {
    const { doc } = fx;
    const before = JSON.stringify(doc);
    removeNode(doc, 'a');
    detachNode(doc, 'b');
    moveAmongSiblings(doc, 'a', 1);
    clearChildren(doc, fx.column);
    expect(JSON.stringify(doc)).toBe(before);
  });

  it('removes a node with its descendants', () => {
    const out = removeNode(fx.doc, fx.container);
    expect(out.nodes[fx.container]).toBeUndefined();
    expect(out.nodes[fx.grid]).toBeUndefined();
    expect(out.nodes['a']).toBeUndefined();
    expect(out.nodes[fx.section]!.children).toEqual([]);
  });

  it('clears a column but keeps it', () => {
    const out = clearChildren(fx.doc, fx.column);
    expect(out.nodes[fx.column]!.children).toEqual([]);
    expect(out.nodes['a']).toBeUndefined();
    expect(out.nodes[fx.grid]!.children).toEqual([fx.column]);
  });

  it('swaps with siblings and stops at the ends', () => {
    const { doc } = fx;
    expect(moveAmongSiblings(doc, 'a', 1).nodes[fx.column]!.children).toEqual(['b', 'a']);
    expect(moveAmongSiblings(doc, 'b', -1).nodes[fx.column]!.children).toEqual(['b', 'a']);
    expect(moveAmongSiblings(doc, 'a', -1)).toBe(doc);
    expect(moveAmongSiblings(doc, 'b', 1)).toBe(doc);
  });
});

describe('creating missing layers', () => {
  it('wraps a component in section > container > grid > column', () => {
    const leaf = comp('x');
    const chain = buildChain(makeId, leaf, 1);
    expect(
      Object.values(chain.nodes)
        .map((c) => c.type)
        .sort(),
    ).toEqual(['column', 'container', 'grid', 'section']);
    expect(chain.nodes[chain.topId]!.type).toBe('section');
    const col = Object.values(chain.nodes).find((c) => c.type === 'column')!;
    expect(col.children).toEqual(['x']);
    expect(col.props?.spans).toEqual({ base: 12, md: 12 });
  });

  it('builds only the layers that are missing', () => {
    const chain = buildChain(makeId, comp('x'), 4);
    expect(Object.values(chain.nodes).map((c) => c.type)).toEqual(['column']);
    expect(buildChain(makeId, comp('y'), 5).topId).toBe('y');
    expect(buildChain(makeId, comp('m', 'masthead'), 1).topId).toBe('m');
  });
});

describe('choosing where a new node goes', () => {
  it('stacks after the selected component', () => {
    const { doc } = fx;
    const ins = resolveInsertion(doc, 'f1', 'a', comp('x'));
    expect(ins).toEqual({ parentId: fx.column, index: 1, chainFrom: null });
  });

  it('adds to the end of the last column when nothing is selected', () => {
    const { doc } = fx;
    expect(resolveInsertion(doc, 'f1', null, comp('x'))).toEqual({
      parentId: fx.column,
      index: 2,
      chainFrom: null,
    });
  });

  it('puts content inside a selected column, and after a selected section for new sections', () => {
    const { doc } = fx;
    expect(resolveInsertion(doc, 'f1', fx.column, comp('x'))).toEqual({
      parentId: fx.column,
      index: 2,
      chainFrom: null,
    });
    expect(resolveInsertion(doc, 'f1', 'a', doc.nodes[fx.section]!)).toEqual({
      parentId: null,
      index: 1,
      chainFrom: null,
    });
  });

  it('puts a full-width component after the selected top-level item', () => {
    expect(resolveInsertion(fx.doc, 'f1', 'b', comp('m', 'masthead'))).toEqual({
      parentId: null,
      index: 1,
      chainFrom: null,
    });
  });

  it('starts a new section for an empty frame, or after a full-width component', () => {
    const { doc } = fx;
    expect(resolveInsertion(doc, 'f2', null, comp('x'))).toEqual({
      parentId: null,
      index: 0,
      chainFrom: 1,
    });
    const withMast = {
      ...doc,
      frames: doc.frames.map((f) => (f.id === 'f2' ? { ...f, root: ['m'] } : f)),
      nodes: { ...doc.nodes, m: comp('m', 'masthead') },
    };
    expect(resolveInsertion(withMast, 'f2', 'm', comp('x'))).toEqual({
      parentId: null,
      index: 1,
      chainFrom: 1,
    });
  });

  it('ignores an anchor from another frame', () => {
    expect(resolveInsertion(fx.doc, 'f2', 'a', comp('x'))).toEqual({
      parentId: null,
      index: 0,
      chainFrom: 1,
    });
  });

  it('fills in missing layers inside an empty section', () => {
    const empty: Doc = {
      frames: [
        { id: 'f', name: 'F', kitId: 'nsw', device: 'iphone', width: 393, x: 0, y: 0, root: ['s'] },
      ],
      nodes: { s: { id: 's', type: 'section', children: [] } },
    };
    const ins = resolveInsertion(empty, 'f', 's', comp('x'));
    expect(ins).toEqual({ parentId: 's', index: 0, chainFrom: 2 });
    const doc: Doc = { ...empty, nodes: { ...empty.nodes, x: comp('x') } };
    const out = applyInsertion(doc, 'f', ins, 'x', makeId);
    expect(pathTo(out, 'x').map((id) => out.nodes[id]!.type)).toEqual([
      'section',
      'container',
      'grid',
      'column',
      'component',
    ]);
  });
});

describe('applying an insertion', () => {
  it('creates the whole chain on empty space', () => {
    const doc: Doc = { ...fx.doc, nodes: { ...fx.doc.nodes, x: comp('x') } };
    const out = applyInsertion(doc, 'f2', { parentId: null, index: 0, chainFrom: 1 }, 'x', makeId);
    expect(pathTo(out, 'x').map((id) => out.nodes[id]!.type)).toEqual([
      'section',
      'container',
      'grid',
      'column',
      'component',
    ]);
    expect(out.frames[1]!.root).toHaveLength(1);
  });

  it('moves a node between frames by detach then insert', () => {
    const { doc } = fx;
    const moved = applyInsertion(
      detachNode(doc, 'a'),
      'f2',
      { parentId: null, index: 0, chainFrom: 1 },
      'a',
      makeId,
    );
    expect(moved.nodes[fx.column]!.children).toEqual(['b']);
    expect(frameOfNode(moved, 'a')).toBe('f2');
  });
});

describe("changing a grid's column count", () => {
  const mdSpans = (doc: Doc, gridId: string) =>
    doc.nodes[gridId]!.children!.map((c) => (doc.nodes[c]!.props?.spans as { md?: number }).md);

  it('adds equal-width empty columns', () => {
    const out = setGridColumnCount(fx.doc, fx.grid, 3, makeId);
    expect(out.nodes[fx.grid]!.children).toHaveLength(3);
    expect(mdSpans(out, fx.grid)).toEqual([4, 4, 4]);
    expect(out.nodes[out.nodes[fx.grid]!.children![2]!]!.children).toEqual([]);
    expect(out.nodes[fx.column]!.children).toEqual(['a', 'b']);
  });

  it('merges removed columns into the last kept column, losing nothing', () => {
    const three = setGridColumnCount(fx.doc, fx.grid, 3, makeId);
    const [c1, c2, c3] = three.nodes[fx.grid]!.children!;
    const filled: Doc = {
      ...three,
      nodes: {
        ...three.nodes,
        c: comp('c'),
        d: comp('d'),
        [c2!]: { ...three.nodes[c2!]!, children: ['c'] },
        [c3!]: { ...three.nodes[c3!]!, children: ['d'] },
      },
    };
    const out = setGridColumnCount(filled, fx.grid, 1, makeId);
    expect(out.nodes[fx.grid]!.children).toEqual([c1]);
    expect(out.nodes[c1!]!.children).toEqual(['a', 'b', 'c', 'd']);
    const two = setGridColumnCount(filled, fx.grid, 2, makeId);
    expect(two.nodes[c2!]!.children).toEqual(['c', 'd']);
    expect(two.nodes[c3!]).toBeUndefined();
    expect(mdSpans(two, fx.grid)).toEqual([6, 6]);
  });

  it('clamps to 1–6 and ignores non-grids', () => {
    expect(setGridColumnCount(fx.doc, fx.grid, 99, makeId).nodes[fx.grid]!.children).toHaveLength(
      6,
    );
    expect(setGridColumnCount(fx.doc, fx.grid, 0, makeId).nodes[fx.grid]!.children).toHaveLength(1);
    expect(setGridColumnCount(fx.doc, 'a', 3, makeId)).toBe(fx.doc);
  });
});

describe('content stays between the header and the footer', () => {
  /** f1: masthead, header, the section (with a, b), footer. */
  function withParts() {
    const { doc, section, column } = fixture();
    doc.nodes.m = { ...comp('m', 'masthead') };
    doc.nodes.h = { ...comp('h', 'header') };
    doc.nodes.ft = { ...comp('ft', 'footer') };
    doc.frames[0] = { ...doc.frames[0]!, root: ['m', 'h', section, 'ft'] };
    return { doc, section, column };
  }

  it('adds before the footer when nothing is selected, or the footer is', () => {
    const { doc, column } = withParts();
    expect(resolveInsertion(doc, 'f1', null, comp('x'))).toEqual({
      parentId: column,
      index: 2,
      chainFrom: null,
    });
    expect(resolveInsertion(doc, 'f1', 'ft', comp('x'))).toEqual({
      parentId: column,
      index: 2,
      chainFrom: null,
    });
  });

  it('adds after the last header part when the masthead is selected, in a section of its own', () => {
    const { doc } = withParts();
    // With the masthead selected, content goes after the header (index 2), starting a new section.
    const ins = resolveInsertion(doc, 'f1', 'm', comp('x'));
    expect(ins.parentId).toBeNull();
    expect(ins.index).toBe(2);
    expect(ins.chainFrom).toBe(1);
  });

  it('puts a footer at the end and describes the spot in words', () => {
    const { doc } = withParts();
    const label = (n: DocNode) => n.componentId ?? n.type;
    expect(describeInsertion(doc, 'f1', null, label)).toBe('after “button”');
    expect(describeInsertion(doc, 'f2', null, label)).toBe('at the top of the page');
  });
});

describe('side by side', () => {
  /** A grid of one column holding a, b, c (three cards, say). */
  function stacked() {
    const { doc, grid, column } = fixture();
    doc.nodes.c = comp('c');
    doc.nodes[column] = { ...doc.nodes[column]!, children: ['a', 'b', 'c'] };
    return { doc, grid, column };
  }

  it('offers 2 and 3 across for an item with two after it', () => {
    const { doc } = stacked();
    expect(sideBySideChoices(doc, 'a')).toEqual([2, 3]);
    expect(sideBySideChoices(doc, 'b')).toEqual([2]);
    expect(sideBySideChoices(doc, 'c')).toEqual([]);
  });

  it('spreads three stacked items into three columns of one grid', () => {
    const { doc, grid } = stacked();
    const next = arrangeInRow(doc, 'a', 3, makeId);
    const cols = next.nodes[grid]!.children!;
    expect(cols).toHaveLength(3);
    expect(cols.map((id) => next.nodes[id]!.children)).toEqual([['a'], ['b'], ['c']]);
  });

  it('leaves the items before it in place, and does nothing when there is no one to put beside it', () => {
    const { doc, grid, column } = stacked();
    const next = arrangeInRow(doc, 'b', 2, makeId);
    const cols = next.nodes[grid]!.children!;
    expect(next.nodes[cols[0]!]!.children).toEqual(['a', 'b']);
    expect(next.nodes[cols[1]!]!.children).toEqual(['c']);
    expect(arrangeInRow(doc, 'c', 2, makeId)).toBe(doc);
    expect(next.nodes[column]!.children).toEqual(['a', 'b']);
  });
});
