import { beforeEach, describe, expect, it } from 'vitest';
import { exportHtmlFiles } from '../src/export/page';
import { renderFrameHtml } from '../src/layout/render';
import { createDoc, useStore } from '../src/store/store';

const s = () => useStore.getState();

function twoLinkedFrames() {
  useStore.setState({ doc: createDoc(), past: [], future: [], prototype: null });
  const first = s().doc.frames[0]!.id;
  s().addComponent(first, 'button', 'dark');
  s().addFrame('desktop');
  const second = s().doc.frames[1]!.id;
  s().addComponent(second, 'heading', 'h1');
  const button = Object.values(s().doc.nodes).find((n) => n.componentId === 'button')!;
  s().setNodeProps(button.id, { goto: second });
  return { first, second, button };
}

describe('click-through prototypes', () => {
  beforeEach(() => useStore.setState({ prototype: null }));

  it('renders a go-to-frame link as a real link carrying data-goto', () => {
    const { second } = twoLinkedFrames();
    const doc = s().doc;
    const html = renderFrameHtml(doc.nodes, doc.frames[0]!.root, doc.images);
    expect(html).toContain(`data-goto="${second}"`);
    expect(html).toMatch(/<a [^>]*data-goto/);
  });

  it('setting the link is one undo step', () => {
    const { button } = twoLinkedFrames();
    s().undo();
    expect(s().doc.nodes[button.id]!.props?.goto).toBeUndefined();
  });

  it('exports go-to-frame links as relative page links', async () => {
    twoLinkedFrames();
    const doc = s().doc;
    const files = await exportHtmlFiles(doc, doc.frames, 'cdn');
    const home = files.find((f) => f.name !== 'index.html')!;
    const second = files.filter((f) => f.name !== 'index.html')[1]!;
    expect(home.data).toContain(`href="${second.name}"`);
    expect(home.data).not.toContain('data-goto');
  });

  it('keeps a stack of visited frames: go, back, close, and ignores unknown frames', () => {
    const { first, second } = twoLinkedFrames();
    s().openPrototype(first);
    s().prototypeGo(second);
    expect(s().prototype).toEqual([first, second]);
    s().prototypeBack();
    expect(s().prototype).toEqual([first]);
    s().prototypeBack();
    expect(s().prototype).toEqual([first]);
    s().prototypeGo('nope');
    expect(s().prototype).toEqual([first]);
    s().closePrototype();
    expect(s().prototype).toBeNull();
  });

  it('leaving Preview closes the viewer, and the viewer never enters history', () => {
    const { first } = twoLinkedFrames();
    const past = s().past.length;
    s().openPrototype(first);
    expect(s().past.length).toBe(past);
    s().setMode('edit');
    expect(s().prototype).toBeNull();
  });
});
