import { beforeEach, describe, expect, it } from 'vitest';
import { align, alignInFrame, snapToGrid } from '../src/layout/guides';
import { validateDoc } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';

const s = () => useStore.getState();
const frame = { width: 1000, height: 800 };

describe('alignment guides', () => {
  const other = { x: 100, y: 100, width: 200, height: 100 };

  it('shows a guide where a box lines up exactly, and moves nothing', () => {
    const r = align({ x: 100, y: 400, width: 150, height: 50 }, [other], frame, { snap: false });
    expect(r.dx).toBe(0);
    expect(r.guides.some((g) => g.axis === 'x' && g.pos === 100)).toBe(true);
  });

  it('does not guide or snap a box that is merely close, unless snapping is on', () => {
    const box = { x: 104, y: 400, width: 150, height: 50 };
    expect(align(box, [other], frame, { snap: false }).guides.filter((g) => g.pos === 100)).toEqual(
      [],
    );
    const snapped = align(box, [other], frame, { snap: true });
    expect(snapped.dx).toBe(-4);
    expect(snapped.guides.some((g) => g.axis === 'x' && g.pos === 100)).toBe(true);
  });

  it('snaps centre to centre and to the frame edges, within the threshold only', () => {
    const centre = align({ x: 421, y: 10, width: 160, height: 40 }, [], frame, { snap: true });
    expect(centre.dx).toBe(-1); // its middle (501) to the frame's middle (500)
    expect(align({ x: 300, y: 300, width: 100, height: 40 }, [], frame, { snap: true }).dx).toBe(0);
    const edge = align({ x: 5, y: 3, width: 100, height: 40 }, [], frame, { snap: true });
    expect([edge.dx, edge.dy]).toEqual([-5, -3]);
  });

  it('spans a guide from one box to the other', () => {
    const g = align({ x: 100, y: 400, width: 150, height: 50 }, [other], frame, {
      snap: false,
    }).guides.find((x) => x.axis === 'x' && x.pos === 100)!;
    expect([g.from, g.to]).toEqual([100, 450]);
  });
});

describe('grid and alignment helpers', () => {
  it('snaps to the grid', () => {
    expect(snapToGrid(13, 8)).toBe(16);
    expect(snapToGrid(11, 8)).toBe(8);
    expect(snapToGrid(13, 0)).toBe(13);
  });
  it('aligns an item inside the frame', () => {
    expect(alignInFrame('left', 300, 1000)).toBe(0);
    expect(alignInFrame('centre', 300, 1000)).toBe(350);
    expect(alignInFrame('right', 300, 1000)).toBe(700);
  });
});

describe('freeform grid and snap settings', () => {
  beforeEach(() => {
    useStore.setState({ doc: createDoc(), past: [], future: [], selectedFrameId: null });
  });

  it('sets and clears them on a freeform frame, one undo step each, and refuses a flow frame', () => {
    const flow = s().doc.frames[0]!;
    s().setFrameFree(flow.id, { freeGrid: 8 });
    expect(s().doc.frames[0]!.freeGrid).toBeUndefined();
    s().addFrame('desktop', 'nsw', 'free');
    const f = s().doc.frames[1]!;
    s().setFrameFree(f.id, { freeGrid: 16, freeSnap: true });
    expect(s().doc.frames[1]).toMatchObject({ freeGrid: 16, freeSnap: true });
    s().setFrameFree(f.id, { freeGrid: 7 }); // not an allowed size: cleared
    expect(s().doc.frames[1]!.freeGrid).toBeUndefined();
    s().undo();
    expect(s().doc.frames[1]!.freeGrid).toBe(16);
    // Going back to flow drops them.
    s().setFrameLayout(f.id, 'flow');
    expect(s().doc.frames[1]!.freeGrid).toBeUndefined();
    expect(s().doc.frames[1]!.freeSnap).toBeUndefined();
  });

  it('validates them on load', () => {
    const raw = (frame: object) => ({
      version: 5,
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
          root: [],
          ...frame,
        },
      ],
      nodes: {},
      images: {},
    });
    expect(
      validateDoc(raw({ layout: 'free', freeGrid: 16, freeSnap: true })).frames[0],
    ).toMatchObject({
      freeGrid: 16,
      freeSnap: true,
    });
    const bad = validateDoc(raw({ layout: 'free', freeGrid: 5, freeSnap: 'yes' })).frames[0]!;
    expect(bad.freeGrid).toBeUndefined();
    expect(bad.freeSnap).toBeUndefined();
    // They mean nothing on a flow frame.
    expect(validateDoc(raw({ freeGrid: 16 })).frames[0]!.freeGrid).toBeUndefined();
  });
});
