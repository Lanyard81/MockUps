import { beforeEach, describe, expect, it } from 'vitest';
import { createDoc, useStore } from '../src/store/store';

const s = () => useStore.getState();

beforeEach(() => {
  useStore.setState({ doc: createDoc(), past: [], future: [], selectedFrameId: null });
});

describe('frame actions and undo', () => {
  it('adds a frame at the device width and undoes it', () => {
    s().addFrame('tablet');
    expect(s().doc.frames).toHaveLength(2);
    expect(s().doc.frames[1]?.width).toBe(820);
    s().undo();
    expect(s().doc.frames).toHaveLength(1);
    s().redo();
    expect(s().doc.frames).toHaveLength(2);
  });

  it('duplicates a frame with fresh node ids, and deleting it frees its nodes', () => {
    s().addComponent(s().doc.frames[0]!.id, 'button');
    const first = s().doc.frames[0]!;
    const before = Object.keys(s().doc.nodes).length;
    s().duplicateFrame(first.id);
    const copy = s().doc.frames[1]!;
    expect(copy.root[0]).not.toBe(first.root[0]);
    expect(Object.keys(s().doc.nodes).length).toBe(before * 2);
    s().deleteFrame(copy.id);
    expect(Object.keys(s().doc.nodes).length).toBe(before);
  });

  it('treats a drag as one history entry', () => {
    const id = s().doc.frames[0]!.id;
    s().beginGesture();
    s().moveFrameLive(id, 10, 10);
    s().moveFrameLive(id, 50, 60);
    expect(s().past).toHaveLength(1);
    s().undo();
    expect(s().doc.frames[0]).toMatchObject({ x: 0, y: 0 });
  });

  it('does not put view changes in history', () => {
    s().setView({ x: 5, y: 5, zoom: 2 });
    expect(s().past).toHaveLength(0);
  });

  it('caps history at 100 entries', () => {
    const id = s().doc.frames[0]!.id;
    for (let i = 0; i < 120; i++) s().renameFrame(id, `Name ${i}`);
    expect(s().past).toHaveLength(100);
  });

  it('setting a width switches the device to custom and clamps it', () => {
    const id = s().doc.frames[0]!.id;
    s().setFrameWidth(id, 10);
    expect(s().doc.frames[0]).toMatchObject({ width: 240, device: 'custom' });
  });
});

describe('adding components and layout blocks', () => {
  const frameId = () => s().doc.frames[0]!.id;
  const rootTypes = () => s().doc.frames[0]!.root.map((id) => s().doc.nodes[id]!.type);

  it('creates a section automatically for the first component, then stacks into it', () => {
    s().addComponent(frameId(), 'heading', 'h1');
    s().addComponent(frameId(), 'paragraph');
    expect(rootTypes()).toEqual(['section']);
    const comps = Object.values(s().doc.nodes).filter((n) => n.type === 'component');
    expect(comps.map((n) => n.componentId)).toEqual(['heading', 'paragraph']);
    expect(comps[0]!.variant).toBe('h1');
    expect(comps[1]!.variant).toBe('default');
  });

  it('puts full-width components straight under the frame root', () => {
    s().addComponent(frameId(), 'masthead');
    expect(rootTypes()).toEqual(['component']);
  });

  it('starts a new section after a full-width component', () => {
    s().addComponent(frameId(), 'masthead');
    s().addComponent(frameId(), 'heading');
    expect(rootTypes()).toEqual(['component', 'section']);
  });

  it('adds grids of N columns with md spans that add up to 12', () => {
    s().addLayoutBlock(frameId(), 'grid', 3);
    const cols = Object.values(s().doc.nodes).filter((n) => n.type === 'column');
    expect(cols.map((c) => c.props?.span)).toEqual([4, 4, 4]);
  });

  it('ignores unknown components and every add is one undo step', () => {
    s().addComponent(frameId(), 'does-not-exist');
    expect(s().past).toHaveLength(0);
    s().addComponent(frameId(), 'button');
    expect(s().past).toHaveLength(1);
    s().undo();
    expect(s().doc.frames[0]!.root).toEqual([]);
    expect(Object.keys(s().doc.nodes)).toHaveLength(0);
  });
});

describe('selection, moving and clipboard', () => {
  const frameId = () => s().doc.frames[0]!.id;
  const target = (
    parentId: string | null,
    index: number,
    chainFrom: number | null = null,
    fId = frameId(),
  ) => ({
    frameId: fId,
    parentId,
    index,
    chainFrom,
    indicator: { kind: 'line' as const, rect: { x: 0, y: 0, width: 1, height: 1 } },
  });
  const comps = () =>
    Object.values(s().doc.nodes)
      .filter((n) => n.type === 'component')
      .map((n) => n.variant);
  const columnOf = (id: string) =>
    s().doc.nodes[id] && Object.values(s().doc.nodes).find((n) => n.children?.includes(id))!;

  beforeEach(() => {
    useStore.setState({ clipboard: null, selectedNodeId: null });
    s().addComponent(frameId(), 'heading', 'h1');
    s().addComponent(frameId(), 'heading', 'h2');
    s().addComponent(frameId(), 'heading', 'h3');
  });

  it('selects what it just added, and inserts the next one after it', () => {
    const [a] = columnOf(s().selectedNodeId!)!.children!;
    s().selectNode(frameId(), a!);
    s().addComponent(frameId(), 'paragraph');
    const order = columnOf(s().selectedNodeId!)!.children!.map(
      (id) => s().doc.nodes[id]!.componentId,
    );
    expect(order).toEqual(['heading', 'paragraph', 'heading', 'heading']);
  });

  it('Esc selects the parent, then the frame, then nothing', () => {
    const leaf = s().selectedNodeId!;
    const types: (string | null)[] = [];
    for (let i = 0; i < 8; i++) {
      s().selectParent();
      types.push(
        s().selectedNodeId
          ? s().doc.nodes[s().selectedNodeId!]!.type
          : s().selectedFrameId
            ? 'frame'
            : null,
      );
    }
    expect(s().doc.nodes[leaf]).toBeDefined();
    expect(types.slice(0, 6)).toEqual(['column', 'grid', 'container', 'section', 'frame', null]);
  });

  it('dropping a new component at an index is one undo step', () => {
    const column = columnOf(s().selectedNodeId!)!;
    const before = s().past.length;
    s().dropNew(
      { kind: 'new-component', componentId: 'button', variantId: 'danger', label: 'x' },
      target(column.id, 1),
    );
    expect(s().past.length).toBe(before + 1);
    expect(s().doc.nodes[column.id]!.children!.map((id) => s().doc.nodes[id]!.variant)).toEqual([
      'h1',
      'danger',
      'h2',
      'h3',
    ]);
    s().undo();
    expect(comps()).toEqual(['h1', 'h2', 'h3']);
  });

  it('dropping on empty space creates a section around it', () => {
    s().dropNew(
      { kind: 'new-component', componentId: 'button', variantId: 'dark', label: 'x' },
      target(null, 1, 1),
    );
    expect(s().doc.frames[0]!.root).toHaveLength(2);
  });

  it('moves a node within a column using the index after removal', () => {
    const column = columnOf(s().selectedNodeId!)!;
    const [first] = column.children!;
    s().moveNode(first!, target(column.id, 2));
    expect(s().doc.nodes[column.id]!.children!.map((id) => s().doc.nodes[id]!.variant)).toEqual([
      'h2',
      'h3',
      'h1',
    ]);
  });

  it('does not make a history entry when a drop lands where the node already is', () => {
    const column = columnOf(s().selectedNodeId!)!;
    const before = s().past.length;
    s().moveNode(column.children![1]!, target(column.id, 1));
    expect(s().past.length).toBe(before);
  });

  it('moves a node to another frame, and refuses to move a section into itself', () => {
    s().addFrame('tablet');
    const second = s().doc.frames[1]!.id;
    const leaf = Object.values(s().doc.nodes).find((n) => n.variant === 'h1')!.id;
    s().moveNode(leaf, target(null, 0, 1, second));
    expect(s().doc.frames[1]!.root).toHaveLength(1);
    expect(Object.values(s().doc.nodes).filter((n) => n.type === 'component')).toHaveLength(3);
    const section = s().doc.frames[0]!.root[0]!;
    const inner = Object.values(s().doc.nodes).find((n) => n.type === 'column')!.id;
    const snapshot = s().doc;
    s().moveNode(section, target(inner, 0));
    expect(s().doc).toBe(snapshot);
  });

  it('deletes a node (selecting its parent), and only empties a column', () => {
    const leaf = s().selectedNodeId!;
    s().deleteNode(leaf);
    expect(comps()).toEqual(['h1', 'h2']);
    expect(s().doc.nodes[s().selectedNodeId!]!.type).toBe('column');
    s().deleteNode(s().selectedNodeId!);
    expect(comps()).toEqual([]);
    expect(Object.values(s().doc.nodes).some((n) => n.type === 'column')).toBe(true);
    s().undo();
    s().undo();
    expect(comps()).toEqual(['h1', 'h2', 'h3']);
  });

  it('duplicates, copies and pastes with fresh ids, between frames', () => {
    const leaf = s().selectedNodeId!;
    s().duplicateNode(leaf);
    expect(comps()).toEqual(['h1', 'h2', 'h3', 'h3']);
    expect(s().selectedNodeId).not.toBe(leaf);

    s().copyNode(leaf);
    s().addFrame('android');
    s().pasteClipboard();
    const second = s().doc.frames[1]!;
    expect(second.root).toHaveLength(1);
    expect(comps()).toHaveLength(5);
    const ids = Object.keys(s().doc.nodes);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('does not copy columns', () => {
    const column = columnOf(s().selectedNodeId!)!;
    s().copyNode(column.id);
    expect(s().clipboard).toBeNull();
  });

  it('Alt+arrows swap siblings and do nothing at the ends', () => {
    const column = columnOf(s().selectedNodeId!)!;
    s().selectNode(frameId(), column.children![0]!);
    const before = s().past.length;
    s().moveSelected(-1);
    expect(s().past.length).toBe(before);
    s().moveSelected(1);
    expect(s().doc.nodes[column.id]!.children!.map((id) => s().doc.nodes[id]!.variant)).toEqual([
      'h2',
      'h1',
      'h3',
    ]);
  });

  it('clears a selection that undo removes', () => {
    s().undo();
    expect(s().selectedNodeId === null || !!s().doc.nodes[s().selectedNodeId!]).toBe(true);
    while (s().past.length) s().undo();
    expect(s().selectedNodeId).toBeNull();
  });
});
