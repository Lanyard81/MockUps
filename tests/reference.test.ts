import { beforeEach, describe, expect, it } from 'vitest';
import { referenceBox, suggestFrameWidth } from '../src/lib/reference';
import { DOC_VERSION, migrateDoc } from '../src/persistence/migrate';
import { validateDoc } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';

const s = () => useStore.getState();
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const image = { id: 'img_ref1', dataUrl: PIXEL, name: 'shot.png' };

beforeEach(() => {
  useStore.setState({ doc: createDoc(), past: [], future: [], selectedFrameId: null });
});

describe('screenshot width detection', () => {
  it('snaps a width within 5% of a device preset to that preset', () => {
    expect(suggestFrameWidth(1440)).toMatchObject({
      width: 1440,
      device: 'desktop',
      pixelRatio: 1,
    });
    expect(suggestFrameWidth(1400)).toMatchObject({
      width: 1440,
      device: 'desktop',
      pixelRatio: 1,
    });
    expect(suggestFrameWidth(393)).toMatchObject({ width: 393, device: 'iphone', pixelRatio: 1 });
  });

  it('halves a 2× capture', () => {
    expect(suggestFrameWidth(2880)).toMatchObject({
      width: 1440,
      device: 'desktop',
      pixelRatio: 2,
    });
    expect(suggestFrameWidth(786)).toMatchObject({ width: 393, device: 'iphone', pixelRatio: 2 });
    expect(suggestFrameWidth(1640)).toMatchObject({ width: 820, device: 'tablet', pixelRatio: 2 });
  });

  it('keeps an odd width as a custom width, within the frame limits', () => {
    expect(suggestFrameWidth(1000)).toEqual({ width: 1000, device: 'custom', pixelRatio: 1 });
    expect(suggestFrameWidth(100).width).toBe(240);
    expect(suggestFrameWidth(9000).width).toBe(3000);
  });
});

describe('reference box', () => {
  it('scales to the frame width, or shows the actual size (halved for a 2× capture)', () => {
    const img = { width: 2880, height: 5760 };
    const base = { offsetX: 4, offsetY: 6 };
    expect(referenceBox({ ...base, fit: 'width', pixelRatio: 2 }, 1440, img)).toEqual({
      left: 4,
      top: 6,
      width: 1440,
      height: 2880,
    });
    expect(referenceBox({ ...base, fit: 'actual', pixelRatio: 2 }, 1000, img).width).toBe(1440);
  });
});

describe('reference migration and validation', () => {
  const v2 = () => ({
    version: 2,
    id: 'd',
    name: 'Old',
    defaultKitId: 'nsw',
    kitVersions: {},
    kitSettings: {},
    view: { x: 0, y: 0, zoom: 1 },
    frames: [
      { id: 'f', name: 'A', kitId: 'nsw', device: 'iphone', width: 393, x: 0, y: 0, root: [] },
    ],
    nodes: {},
    images: {},
  });

  it('upgrades version 2 to the current version without touching the input', () => {
    const old = v2();
    const out = migrateDoc(old) as { version: number };
    expect(out.version).toBe(DOC_VERSION);
    expect(old.version).toBe(2);
    expect(validateDoc(old).frames[0]?.reference).toBeUndefined();
  });

  it('keeps a valid reference and clamps wild values', () => {
    const doc = v2() as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    doc.version = 3;
    doc.images = { ref: { dataUrl: PIXEL } };
    doc.frames[0].reference = {
      imageId: 'ref',
      opacity: 7,
      placement: 'sideways',
      fit: 'actual',
      offsetX: 1e9,
      offsetY: -3,
      visible: false,
      pixelRatio: 2,
    };
    expect(validateDoc(doc).frames[0]?.reference).toEqual({
      imageId: 'ref',
      opacity: 1,
      placement: 'over',
      fit: 'actual',
      offsetX: 20000,
      offsetY: -3,
      visible: false,
      pixelRatio: 2,
    });
  });

  it('drops a reference whose image is missing or whose data is damaged', () => {
    const doc = v2() as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    doc.version = 3;
    doc.frames[0].reference = { imageId: 'nope' };
    expect(validateDoc(doc).frames[0]?.reference).toBeUndefined();
    doc.frames[0].reference = 'bad';
    expect(validateDoc(doc).frames[0]?.reference).toBeUndefined();
    doc.images = { ref: { dataUrl: 'javascript:alert(1)' } };
    doc.frames[0].reference = { imageId: 'ref' };
    expect(validateDoc(doc).frames[0]?.reference).toBeUndefined();
  });
});

describe('reference actions and undo', () => {
  const frameId = () => s().doc.frames[0]!.id;
  const ref = () => s().doc.frames[0]!.reference;

  it('adds with defaults, and undo removes it again', () => {
    s().setFrameReference(frameId(), image, 2);
    expect(ref()).toMatchObject({
      imageId: 'img_ref1',
      opacity: 0.4,
      placement: 'over',
      fit: 'width',
      visible: true,
      pixelRatio: 2,
    });
    expect(s().doc.images.img_ref1).toBeDefined();
    s().undo();
    expect(ref()).toBeUndefined();
    expect(s().doc.images.img_ref1).toBeUndefined();
  });

  it('replacing keeps the look; removing and changing are undoable', () => {
    s().setFrameReference(frameId(), image, 1);
    s().updateFrameReference(frameId(), { placement: 'behind', opacity: 0.7 });
    s().setFrameReference(frameId(), { ...image, id: 'img_ref2' }, 1);
    expect(ref()).toMatchObject({ imageId: 'img_ref2', placement: 'behind', opacity: 0.7 });
    s().removeFrameReference(frameId());
    expect(ref()).toBeUndefined();
    s().undo();
    expect(ref()?.imageId).toBe('img_ref2');
  });

  it('dragging the opacity is one undo entry', () => {
    s().setFrameReference(frameId(), image, 1);
    const before = s().past.length;
    s().beginGesture();
    for (const o of [0.5, 0.6, 0.7, 0.8]) s().updateFrameReferenceLive(frameId(), { opacity: o });
    expect(s().past.length).toBe(before + 1);
    expect(ref()?.opacity).toBe(0.8);
    s().undo();
    expect(ref()?.opacity).toBe(0.4);
  });

  it('is not saved into templates', async () => {
    s().setFrameReference(frameId(), image, 1);
    s().addComponent(frameId(), 'button');
    const frame = s().doc.frames[0]!;
    const { imagesUsedBy } = await import('../src/templates/save');
    const nodes = Object.fromEntries(frame.root.map((id) => [id, s().doc.nodes[id]!]));
    expect(imagesUsedBy(nodes, s().doc.images, frame.settings)).toEqual({});
  });
});
