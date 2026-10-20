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
