import { beforeEach, describe, expect, it } from 'vitest';
import {
  parseMockupFile,
  serialiseMockupFile,
  validateSavedComponent,
} from '../src/persistence/schema';
import { useSavedComponents } from '../src/store/savedComponents';
import { createDoc, useStore } from '../src/store/store';
import type { DropTarget } from '../src/store/types';

const s = () => useStore.getState();
const saved = () => useSavedComponents.getState();

beforeEach(() => {
  useStore.setState({
    doc: createDoc(),
    past: [],
    future: [],
    selectedFrameId: null,
    selectedNodeId: null,
    notice: null,
  });
  useSavedComponents.setState({ components: [] });
});

/** A card with its own text, in the first frame. */
function cardWithText(text = 'Saved title') {
  const frame = s().doc.frames[0]!;
  s().addComponent(frame.id, 'card');
  const id = Object.values(s().doc.nodes).find((n) => n.componentId === 'card')!.id;
  s().setText(id, 'title', text);
  return { frame, id };
}

describe('saved components', () => {
  it('saves a component with its text and adds a copy with fresh ids', () => {
    const { frame, id } = cardWithText();
    expect(s().saveAsComponent(id, 'My card')).toBe(true);
    expect(saved().components).toHaveLength(1);
    expect(saved().components[0]).toMatchObject({ name: 'My card', kitId: 'nsw' });
    const before = Object.keys(s().doc.nodes).length;
    s().insertSaved(frame.id, saved().components[0]!.id);
    const cards = Object.values(s().doc.nodes).filter((n) => n.componentId === 'card');
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.text?.title)).toEqual(['Saved title', 'Saved title']);
    expect(new Set(cards.map((c) => c.id)).size).toBe(2);
    expect(Object.keys(s().doc.nodes).length).toBeGreaterThan(before);
    s().undo();
    expect(Object.values(s().doc.nodes).filter((n) => n.componentId === 'card')).toHaveLength(1);
  });

  it('saves a whole section, and keeps its contents when added again', () => {
    const frame = s().doc.frames[0]!;
    s().addLayoutBlock(frame.id, 'section');
    s().addComponent(frame.id, 'heading', 'h1');
    const section = s().doc.frames[0]!.root[0]!;
    expect(s().saveAsComponent(section, 'Hero block')).toBe(true);
    s().insertSaved(frame.id, saved().components[0]!.id);
    expect(s().doc.frames[0]!.root).toHaveLength(2);
    expect(Object.values(s().doc.nodes).filter((n) => n.componentId === 'heading')).toHaveLength(2);
  });

  it('refuses a column, an empty name and a missing node', () => {
    const frame = s().doc.frames[0]!;
    s().addLayoutBlock(frame.id, 'grid', 2);
    const column = Object.values(s().doc.nodes).find((n) => n.type === 'column')!;
    expect(s().saveAsComponent(column.id, 'x')).toBe(false);
    expect(s().notice).toMatch(/component or a section/);
    const { id } = cardWithText();
    expect(s().saveAsComponent(id, '   ')).toBe(false);
    expect(s().saveAsComponent('nope', 'x')).toBe(false);
    expect(saved().components).toHaveLength(0);
  });

  it('puts a component on a freeform frame with a box, and refuses a section there', () => {
    const { id } = cardWithText();
    s().saveAsComponent(id, 'Card');
    s().addFrame('desktop', 'nsw', 'free');
    const free = s().doc.frames[1]!;
    s().insertSaved(free.id, saved().components[0]!.id);
    const node = s().doc.nodes[s().doc.frames[1]!.root[0]!]!;
    expect(node.type).toBe('component');
    expect(node.free).toBeDefined();
    // Dropped at a position.
    const target: DropTarget = {
      frameId: free.id,
      parentId: null,
      index: 0,
      chainFrom: null,
      free: { x: 400, y: 300 },
      indicator: { kind: 'box', rect: { x: 0, y: 0, width: 1, height: 1 } },
    };
    s().dropNew({ kind: 'saved', savedId: saved().components[0]!.id, label: 'Card' }, target);
    const dropped = s().doc.nodes[s().doc.frames[1]!.root[1]!]!;
    expect(dropped.free!.y).toBe(284);

    s().addLayoutBlock(s().doc.frames[0]!.id, 'section');
    const section = s().doc.frames[0]!.root.find((r) => s().doc.nodes[r]!.type === 'section')!;
    s().saveAsComponent(section, 'Section');
    const sectionSaved = saved().components.find((c) => c.name === 'Section')!;
    s().insertSaved(free.id, sectionSaved.id);
    expect(s().notice).toMatch(/holds components/);
  });

  it('will not add a component to a frame of another kit', () => {
    const { id } = cardWithText();
    s().saveAsComponent(id, 'Card');
    s().addFrame('desktop', 'sharepoint');
    const sp = s().doc.frames[1]!;
    s().insertSaved(sp.id, saved().components[0]!.id);
    expect(s().notice).toMatch(/SharePoint page/);
    expect(s().doc.frames[1]!.root).toHaveLength(0);
  });

  it('a position from a freeform frame is dropped when it is added to a flow frame', () => {
    s().addFrame('desktop', 'nsw', 'free');
    const free = s().doc.frames[1]!;
    s().addComponent(free.id, 'card');
    const id = s().doc.frames[1]!.root[0]!;
    s().saveAsComponent(id, 'Free card');
    s().insertSaved(s().doc.frames[0]!.id, saved().components[0]!.id);
    expect(
      Object.values(s().doc.nodes).filter((n) => n.componentId === 'card' && n.free),
    ).toHaveLength(1); // only the original
  });

  it('renames and removes', () => {
    const { id } = cardWithText();
    s().saveAsComponent(id, 'A');
    const cid = saved().components[0]!.id;
    saved().rename(cid, ' B ');
    expect(saved().components[0]!.name).toBe('B');
    saved().remove(cid);
    expect(saved().components).toHaveLength(0);
  });
});

describe('saved components in files', () => {
  it('travel with a mockup file, are merged without duplicates, and damaged ones are skipped', () => {
    const { id } = cardWithText();
    s().saveAsComponent(id, 'Card');
    const text = serialiseMockupFile(s().doc, [], undefined, saved().components);
    const parsed = parseMockupFile(text);
    expect(parsed.components).toHaveLength(1);
    expect(saved().merge(parsed.components)).toBe(0);
    useSavedComponents.setState({ components: [] });
    expect(saved().merge(parsed.components)).toBe(1);

    const raw = JSON.parse(text);
    raw.components.push({ id: 'x', kitId: 'nsw', rootId: 'a', nodes: { a: { type: 'column' } } });
    raw.components.push('junk');
    expect(parseMockupFile(JSON.stringify(raw)).components).toHaveLength(1);
  });

  it('a file with no components still opens', () => {
    const raw = JSON.parse(serialiseMockupFile(createDoc()));
    delete raw.components;
    expect(parseMockupFile(JSON.stringify(raw)).components).toEqual([]);
  });

  it('validates the shape of a saved component', () => {
    expect(() => validateSavedComponent(null)).toThrow();
    expect(() => validateSavedComponent({ kitId: 'nope', rootId: 'a', nodes: {} })).toThrow(
      /unknown style kit/,
    );
    expect(() => validateSavedComponent({ kitId: 'nsw', rootId: 'a', nodes: {} })).toThrow(
      /no content/,
    );
    const ok = validateSavedComponent({
      id: 'c',
      name: 'N',
      kitId: 'nsw',
      rootId: 'a',
      nodes: { a: { type: 'component', componentId: 'card' } },
    });
    expect(ok.rootId).toBe('a');
  });
});
