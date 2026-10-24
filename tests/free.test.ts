import { beforeEach, describe, expect, it } from 'vitest';
import {
  FREE_DEFAULT_WIDTH,
  clampBox,
  defaultWidth,
  estimateBoardHeight,
  readBox,
  reorder,
  setBox,
} from '../src/layout/free';
import { renderFrameHtml } from '../src/layout/render';
import { DOC_VERSION, migrateDoc } from '../src/persistence/migrate';
import { validateDoc } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';
import type { DocNode, DropTarget, MockupDoc } from '../src/store/types';

const s = () => useStore.getState();
const comp = (id: string, componentId = 'paragraph', free?: DocNode['free']): DocNode => ({
  id,
  type: 'component',
  componentId,
  ...(free ? { free } : {}),
});

describe('freeform boxes', () => {
  it('keeps boxes whole, within limits and at a usable width', () => {
    expect(clampBox({ x: 10.6, y: -3.2, width: 12 })).toEqual({ x: 11, y: -3, width: 48 });
    expect(clampBox({ x: 1e9, y: -1e9, width: 1e9 })).toEqual({ x: 10000, y: -10000, width: 4000 });
    expect(clampBox({ x: NaN, y: NaN, width: NaN })).toEqual({ x: 0, y: 0, width: 360 });
  });

  it('gives page-wide components the frame width and others a card-sized one', () => {
    expect(defaultWidth('masthead', 1440)).toBe(1440);
    expect(defaultWidth('card', 1440)).toBe(FREE_DEFAULT_WIDTH);
    expect(defaultWidth('card', 393)).toBe(345);
    expect(readBox(comp('a'), 1440)).toEqual({ x: 0, y: 0, width: 360 });
  });

  it('estimates room below the lowest item', () => {
    expect(
      estimateBoardHeight({ a: comp('a', 'card', { x: 0, y: 2000, width: 300 }) }, ['a']),
    ).toBe(2500);
    expect(estimateBoardHeight({}, [])).toBe(900);
  });
});

describe('freeform document operations', () => {
  const base = (): MockupDoc => {
    const doc = createDoc();
    return {
      ...doc,
      frames: [{ ...doc.frames[0]!, layout: 'free', width: 1000, root: ['a', 'b', 'c'] }],
      nodes: {
        a: comp('a', 'card', { x: 10, y: 20, width: 300 }),
        b: comp('b', 'card', { x: 50, y: 5, width: 300 }),
        c: comp('c', 'card', { x: 10, y: 5, width: 300 }),
      },
    };
  };

  it('changes a box, and reports no change when nothing moved', () => {
    const doc = base();
    expect(setBox(doc, 'a', { x: 15 }).nodes.a!.free).toEqual({ x: 15, y: 20, width: 300 });
    expect(setBox(doc, 'a', { x: 10 })).toBe(doc);
  });

  it('brings to front and sends to back', () => {
    const doc = base();
    expect(reorder(doc, 'a', 'front').frames[0]!.root).toEqual(['b', 'c', 'a']);
    expect(reorder(doc, 'c', 'back').frames[0]!.root).toEqual(['c', 'a', 'b']);
    expect(reorder(doc, 'c', 'front')).toBe(doc);
  });
});

describe('freeform rendering', () => {
  it('places each component where its box says, in order, inside a board', () => {
    const html = renderFrameHtml(
      { a: comp('a', 'paragraph', { x: 12, y: 34, width: 200 }) },
      ['a'],
      {},
      { layout: 'free', width: 1000, boardHeight: 700 },
    );
    expect(html).toContain('data-free-board');
    expect(html).toContain('height:700px');
    expect(html).toContain('left:12px;top:34px;width:200px');
    expect(html).toContain('data-node="a"');
  });

  it('renders a flow frame as before', () => {
    expect(renderFrameHtml({ a: comp('a') }, ['a'])).not.toContain('data-free');
  });
});

describe('freeform files', () => {
  it('migrates version 3 to 4 and opens a freeform frame', () => {
    const raw = {
      version: 3,
      id: 'd',
      name: 'x',
      defaultKitId: 'nsw',
      kitVersions: {},
      kitSettings: {},
      view: { x: 0, y: 0, zoom: 1 },
      frames: [
        {
          id: 'f',
          name: 'A',
          kitId: 'nsw',
          device: 'desktop',
          width: 1440,
          x: 0,
          y: 0,
          layout: 'free',
          root: ['n'],
        },
      ],
      nodes: {
        n: {
          id: 'n',
          type: 'component',
          componentId: 'card',
          free: { x: 5.4, y: 'bad', width: 99999 },
        },
      },
      images: {},
    };
    expect((migrateDoc(raw) as { version: number }).version).toBe(DOC_VERSION);
    const doc = validateDoc(raw);
    expect(doc.frames[0]!.layout).toBe('free');
    expect(doc.nodes.n!.free).toEqual({ x: 5, y: 0, width: 4000 });
  });

  it('refuses a freeform frame that holds a section, and ignores layout on bad values', () => {
    const raw = (layout: unknown, node: object) => ({
      version: 4,
      id: 'd',
      name: 'x',
      defaultKitId: 'nsw',
      kitVersions: {},
      kitSettings: {},
      view: { x: 0, y: 0, zoom: 1 },
      frames: [
        {
          id: 'f',
          name: 'A',
          kitId: 'nsw',
          device: 'desktop',
          width: 1440,
          x: 0,
          y: 0,
          layout,
          root: ['n'],
        },
      ],
      nodes: { n: { id: 'n', ...node } },
      images: {},
    });
    expect(() => validateDoc(raw('free', { type: 'section', children: [] }))).toThrow(
      /components only/,
    );
    // A flow frame still needs sections around components.
    expect(() => validateDoc(raw('sideways', { type: 'component', componentId: 'card' }))).toThrow(
      /breaks the rules/,
    );
    expect(
      validateDoc(raw('sideways', { type: 'section', children: [] })).frames[0]!.layout,
    ).toBeUndefined();
  });
});

describe('freeform store actions', () => {
  beforeEach(() => {
    useStore.setState({
      doc: createDoc(),
      past: [],
      future: [],
      selectedFrameId: null,
      selectedNodeId: null,
      notice: null,
    });
  });
  const free = () => {
    s().addFrame('desktop', 'nsw', 'free');
    return s().doc.frames[s().doc.frames.length - 1]!;
  };
  const target = (frameId: string, x: number, y: number): DropTarget => ({
    frameId,
    parentId: null,
    index: 0,
    chainFrom: null,
    free: { x, y },
    indicator: { kind: 'box', rect: { x, y, width: 1, height: 1 } },
  });

  it('adds a frame as freeform, and a clicked component lands on it with a box', () => {
    const f = free();
    expect(f.layout).toBe('free');
    s().addComponent(f.id, 'card');
    const frame = s().doc.frames.find((x) => x.id === f.id)!;
    expect(frame.root).toHaveLength(1);
    const node = s().doc.nodes[frame.root[0]!]!;
    expect(node.type).toBe('component'); // no section wrapped around it
    expect(node.free).toMatchObject({ width: 360 });
  });

  it('places a dropped component centred on the pointer, on top', () => {
    const f = free();
    s().addComponent(f.id, 'card');
    s().dropNew(
      { kind: 'new-component', componentId: 'button', variantId: 'dark', label: 'Button' },
      target(f.id, 600, 300),
    );
    const root = s().doc.frames.find((x) => x.id === f.id)!.root;
    const dropped = s().doc.nodes[root[1]!]!;
    expect(dropped.componentId).toBe('button');
    expect(dropped.free!.x).toBe(600 - dropped.free!.width / 2);
    expect(dropped.free!.y).toBe(284);
    expect(s().selectedNodeId).toBe(dropped.id);
  });

  it('refuses layout blocks on a freeform frame, with a reason', () => {
    const f = free();
    s().addLayoutBlock(f.id, 'section');
    expect(s().notice).toMatch(/holds components/);
    expect(s().doc.frames.find((x) => x.id === f.id)!.root).toHaveLength(0);
  });

  it('moves, resizes, nudges and reorders; each is one undo step', () => {
    const f = free();
    s().addComponent(f.id, 'card');
    s().addComponent(f.id, 'card');
    const [a, b] = s().doc.frames.find((x) => x.id === f.id)!.root as [string, string];
    const before = s().past.length;
    s().setFreeBox(a, { x: 100, y: 200, width: 420 });
    expect(s().doc.nodes[a]!.free).toEqual({ x: 100, y: 200, width: 420 });
    s().nudgeFree(a, 10, -5);
    expect(s().doc.nodes[a]!.free).toEqual({ x: 110, y: 195, width: 420 });
    s().reorderFree(a, 'front');
    expect(s().doc.frames.find((x) => x.id === f.id)!.root).toEqual([b, a]);
    expect(s().past.length).toBe(before + 3);
    s().undo();
    expect(s().doc.frames.find((x) => x.id === f.id)!.root).toEqual([a, b]);
    s().undo();
    s().undo();
    expect(s().doc.nodes[a]!.free).toMatchObject({ x: 32 });
  });

  it('duplicates a copy down and to the right, and pastes onto a freeform frame', () => {
    const f = free();
    s().addComponent(f.id, 'card');
    const a = s().doc.frames.find((x) => x.id === f.id)!.root[0]!;
    s().setFreeBox(a, { x: 100, y: 100 });
    s().duplicateNode(a);
    const root = s().doc.frames.find((x) => x.id === f.id)!.root;
    expect(root).toHaveLength(2);
    expect(s().doc.nodes[root[1]!]!.free).toMatchObject({ x: 124, y: 124 });
    s().copyNode(a);
    s().selectFrame(f.id);
    s().pasteClipboard();
    expect(s().doc.frames.find((x) => x.id === f.id)!.root).toHaveLength(3);
  });

  it('moves a component between frames, taking or dropping its box', () => {
    const f = free();
    s().addComponent(f.id, 'card');
    const a = s().doc.frames.find((x) => x.id === f.id)!.root[0]!;
    const flow = s().doc.frames[0]!;
    // Free to flow: a section is made around it, and the box is gone.
    s().moveNode(a, { frameId: flow.id, parentId: null, index: 0, chainFrom: 1 });
    expect(s().doc.nodes[a]!.free).toBeUndefined();
    expect(s().doc.frames.find((x) => x.id === f.id)!.root).toHaveLength(0);
    expect(s().doc.nodes[s().doc.frames[0]!.root[0]!]!.type).toBe('section');
    // Flow to free: it lands where it was dropped.
    s().moveNode(a, target(f.id, 300, 300));
    expect(s().doc.nodes[a]!.free).toMatchObject({ y: 284 });
    expect(s().doc.frames.find((x) => x.id === f.id)!.root).toEqual([a]);
  });

  it('refuses to put a section on a freeform frame', () => {
    const f = free();
    s().addLayoutBlock(s().doc.frames[0]!.id, 'section');
    const section = s().doc.frames[0]!.root[0]!;
    s().moveNode(section, target(f.id, 10, 10));
    expect(s().notice).toMatch(/holds components/);
    expect(s().doc.frames.find((x) => x.id === f.id)!.root).toHaveLength(0);
  });

  it('switches a flow frame to freeform, keeping positions, and back in reading order', () => {
    const frame = s().doc.frames[0]!;
    s().addLayoutBlock(frame.id, 'section');
    s().addComponent(frame.id, 'heading', 'h1');
    s().addComponent(frame.id, 'paragraph');
    const comps = Object.values(s().doc.nodes)
      .filter((n) => n.type === 'component')
      .map((n) => n.id);
    const boxes = {
      [comps[0]!]: { x: 10, y: 400, width: 200 },
      [comps[1]!]: { x: 10, y: 50, width: 200 },
    };
    s().setFrameLayout(frame.id, 'free', boxes);
    const asFree = s().doc.frames[0]!;
    expect(asFree.layout).toBe('free');
    expect(asFree.root.sort()).toEqual([...comps].sort());
    expect(Object.values(s().doc.nodes).every((n) => n.type === 'component')).toBe(true);
    expect(s().doc.nodes[comps[0]!]!.free).toEqual({ x: 10, y: 400, width: 200 });

    s().setFrameLayout(frame.id, 'flow');
    const flow = s().doc.frames[0]!;
    expect(flow.layout).toBeUndefined();
    // Top to bottom: the second component (y 50) comes first, each in its own section.
    const firstLeaf = (id: string): string => {
      const n = s().doc.nodes[id]!;
      return n.type === 'component' ? id : firstLeaf(n.children![0]!);
    };
    expect(flow.root.map(firstLeaf)).toEqual([comps[1], comps[0]]);
    expect(s().doc.nodes[comps[0]!]!.free).toBeUndefined();
    s().undo();
    expect(s().doc.frames[0]!.layout).toBe('free');
  });

  it('keeps freeform frames out of conversion, templates and page parts', () => {
    const f = free();
    s().convertFrame(f.id, 'sharepoint');
    expect(s().notice).toMatch(/can’t be converted/);
    expect(s().doc.frames).toHaveLength(2);
    s().setNotice(null);
    s().addPageParts(f.id, 'top');
    expect(s().notice).toMatch(/Flow frame/);
  });
});

describe('freeform keys and export', () => {
  beforeEach(() => {
    useStore.setState({
      doc: createDoc(),
      past: [],
      future: [],
      selectedFrameId: null,
      selectedNodeId: null,
      notice: null,
    });
  });

  it('Alt+up means forward on a freeform frame', () => {
    s().addFrame('desktop', 'nsw', 'free');
    const f = s().doc.frames[1]!;
    s().addComponent(f.id, 'card');
    s().addComponent(f.id, 'button');
    const [a, b] = s().doc.frames[1]!.root as [string, string];
    s().selectNode(f.id, a);
    s().moveSelected(-1); // "up" = forward: a goes in front of b
    expect(s().doc.frames[1]!.root).toEqual([b, a]);
    s().moveSelected(1);
    expect(s().doc.frames[1]!.root).toEqual([a, b]);
  });

  it('exports a freeform page with each item where it is, in a board as tall as the editor measured', async () => {
    s().addFrame('desktop', 'nsw', 'free');
    const f = s().doc.frames[1]!;
    s().addComponent(f.id, 'heading', 'h1');
    s().setFreeBox(s().doc.frames[1]!.root[0]!, { x: 40, y: 120, width: 500 });
    useStore.setState({ frameHeights: { [f.id]: 1234 } });
    const { buildFramePage } = await import('../src/export/page');
    const html = await buildFramePage(s().doc, s().doc.frames[1]!, 'cdn');
    expect(html).toContain('position:absolute;left:40px;top:120px;width:500px');
    expect(html).toContain('height:1234px');
    expect(html).not.toContain('data-free');
    expect(html).not.toContain('data-node');
  });
});
