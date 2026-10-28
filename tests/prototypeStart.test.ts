import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildViewerFile } from '../src/export/viewer';
import { renderFrameHtml } from '../src/layout/render';
import { validateDoc } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';

vi.mock('../src/lib/fontData', () => ({ getFontEmbedCss: async () => '@font-face{}' }));

const s = () => useStore.getState();

beforeEach(() => {
  useStore.setState({
    doc: createDoc(),
    past: [],
    future: [],
    prototype: null,
    prototypeMotion: 'none',
    frameHeights: {},
  });
});

describe('start frame and play', () => {
  it('says there is nothing to present when every page is empty', () => {
    s().playPrototype();
    expect(s().prototype).toBeNull();
    expect(s().notice).toMatch(/nothing to present/);
  });

  it('plays from the first frame unless one is set, and sets, clears and undoes', () => {
    s().addFrame('tablet');
    const [a, b] = s().doc.frames;
    s().addComponent(a!.id, 'heading', 'h1');
    s().playPrototype();
    expect(s().prototype).toEqual([a!.id]);
    s().closePrototype();
    s().setStartFrame(b!.id);
    expect(s().doc.startFrameId).toBe(b!.id);
    s().playPrototype();
    expect(s().prototype).toEqual([b!.id]);
    s().closePrototype();
    s().undo();
    expect(s().doc.startFrameId).toBeUndefined();
    s().setStartFrame(b!.id);
    s().setStartFrame(null);
    expect(s().doc.startFrameId).toBeUndefined();
    s().setStartFrame('nope');
    expect(s().doc.startFrameId).toBeUndefined();
  });

  it('clears the start frame when that frame is deleted', () => {
    s().addFrame('tablet');
    const b = s().doc.frames[1]!;
    s().setStartFrame(b.id);
    s().deleteFrame(b.id);
    expect(s().doc.startFrameId).toBeUndefined();
    s().undo();
    expect(s().doc.startFrameId).toBe(b.id);
  });

  it('is validated on load', () => {
    const raw = (startFrameId: unknown) => ({
      version: 7,
      id: 'd',
      name: 'x',
      defaultKitId: 'nsw',
      kitVersions: {},
      kitSettings: {},
      view: { x: 0, y: 0, zoom: 1 },
      frames: [
        { id: 'f', name: 'A', kitId: 'nsw', device: 'desktop', width: 1440, x: 0, y: 0, root: [] },
      ],
      nodes: {},
      images: {},
      startFrameId,
    });
    expect(validateDoc(raw('f')).startFrameId).toBe('f');
    expect(validateDoc(raw('gone')).startFrameId).toBeUndefined();
    expect(validateDoc(raw(42)).startFrameId).toBeUndefined();
  });
});

describe('transitions', () => {
  function withLink(transition: unknown) {
    s().addFrame('tablet');
    s().addLayoutBlock(s().doc.frames[0]!.id, 'section');
    s().addComponent(s().doc.frames[0]!.id, 'button', 'dark');
    const button = Object.values(s().doc.nodes).find((n) => n.componentId === 'button')!;
    s().setNodeProps(button.id, { goto: s().doc.frames[1]!.id, transition });
    return renderFrameHtml(s().doc.nodes, s().doc.frames[0]!.root, s().doc.images);
  }

  it('puts a known transition on the link, and ignores anything else', () => {
    expect(withLink('slide')).toContain('data-transition="slide"');
  });
  it('drops an unknown transition', () => {
    expect(withLink('spin')).not.toContain('data-transition');
  });

  it('moves with the transition of the link, and back is its own motion', () => {
    s().addFrame('tablet');
    const [a, b] = s().doc.frames;
    s().openPrototype(a!.id);
    s().prototypeGo(b!.id, 'rise');
    expect(s().prototypeMotion).toBe('rise');
    s().prototypeBack();
    expect(s().prototypeMotion).toBe('back');
    s().prototypeGo(b!.id, 'spin');
    expect(s().prototypeMotion).toBe('none');
    s().prototypeGo(a!.id, null);
    expect(s().prototypeMotion).toBe('none');
  });
});

describe('viewer file', () => {
  it('opens on the start frame and keeps each link’s transition', async () => {
    s().addFrame('tablet');
    s().addLayoutBlock(s().doc.frames[0]!.id, 'section');
    s().addComponent(s().doc.frames[0]!.id, 'button', 'dark');
    const [a, b] = s().doc.frames;
    const button = Object.values(s().doc.nodes).find((n) => n.componentId === 'button')!;
    s().setNodeProps(button.id, { goto: b!.id, transition: 'fade' });
    s().setStartFrame(b!.id);
    const html = await buildViewerFile(s().doc);
    const data = JSON.parse(
      html.match(/<script type="application\/json" id="mm-data">([\s\S]*?)<\/script>/)![1]!,
    ) as { start: string; frames: { id: string; html: string }[] };
    expect(data.start).toBe(b!.id);
    const first = data.frames.find((f) => f.id === a!.id)!;
    expect(first.html).toContain('data-mm-t="fade"');
    expect(first.html).not.toContain('data-transition');
  });
});
