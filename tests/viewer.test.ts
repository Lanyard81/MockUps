import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildViewerFile } from '../src/export/viewer';
import { createDoc, useStore } from '../src/store/store';

// Fonts are fetched from the web server in the app; here they are a stand-in.
vi.mock('../src/lib/fontData', () => ({
  getFontEmbedCss: async () => '@font-face{font-family:x;src:url(data:font/woff2;base64,AA==)}',
}));

const s = () => useStore.getState();

beforeEach(() => {
  useStore.setState({
    doc: createDoc(),
    past: [],
    future: [],
    selectedFrameId: null,
    frameHeights: {},
  });
});

function data(html: string) {
  const m = html.match(/<script type="application\/json" id="mm-data">([\s\S]*?)<\/script>/);
  return JSON.parse(m![1]!) as {
    kits: Record<string, { css: string; js: string }>;
    frames: {
      id: string;
      name: string;
      html: string;
      width: number;
      comments: { n: number; text: string; done: boolean }[];
    }[];
    comments: unknown[];
  };
}

describe('viewer file', () => {
  it('holds every frame once, links between frames, and each kit’s assets once', async () => {
    const home = s().doc.frames[0]!;
    s().addComponent(home.id, 'button', 'dark');
    s().addFrame('desktop', 'sharepoint');
    const second = s().doc.frames[1]!;
    s().addFrame('tablet');
    const button = Object.values(s().doc.nodes).find((n) => n.componentId === 'button')!;
    s().setNodeProps(button.id, { goto: second.id });

    const html = await buildViewerFile(s().doc);
    const d = data(html);
    expect(d.frames.map((f) => f.name)).toEqual(['Home', second.name, s().doc.frames[2]!.name]);
    expect(Object.keys(d.kits).sort()).toEqual(['nsw', 'sharepoint']);
    expect(d.kits.nsw!.css).toContain('@font-face');
    // The link to the second frame is rewritten for the viewer, and editor markers are gone.
    expect(d.frames[0]!.html).toContain(`href="#goto:${second.id}"`);
    expect(d.frames[0]!.html).not.toContain('data-node');
    expect(d.frames[0]!.html).not.toContain('data-goto');
    // Kit assets are embedded once in the file, not once per frame.
    expect(html.split('.nsw-button').length).toBeLessThan(html.length / 100);
    expect((html.match(/<title>/g) ?? []).length).toBe(1);
  });

  it('works offline: no external links, scripts or stylesheets', async () => {
    const html = await buildViewerFile(s().doc);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<img[^>]+src="https?:/i);
  });

  it('carries comments only when asked, and marks done ones', async () => {
    const f = s().doc.frames[0]!;
    const a = s().addComment(f.id, 10, 20)!;
    s().updateComment(a, { text: 'Open note' });
    const b = s().addComment(f.id, 30, 40)!;
    s().updateComment(b, { text: 'Done note', resolved: true });
    const withNotes = data(await buildViewerFile(s().doc, { comments: true }));
    expect(withNotes.frames[0]!.comments).toMatchObject([
      { n: 1, text: 'Open note', done: false },
      { n: 2, text: 'Done note', done: true },
    ]);
    const without = data(await buildViewerFile(s().doc, { comments: false }));
    expect(without.frames[0]!.comments).toEqual([]);
    expect(without.comments).toEqual([]);
  });

  it('cannot be broken out of by text in the mockup or a note', async () => {
    const f = s().doc.frames[0]!;
    s().addComponent(f.id, 'heading', 'h1');
    const h = Object.values(s().doc.nodes).find((n) => n.componentId === 'heading')!;
    s().setText(h.id, 'text', '</script><script>alert(1)</script><!-- &amp;');
    s().renameFrame(f.id, '</script><b>x</b>');
    const c = s().addComment(f.id, 1, 1)!;
    s().updateComment(c, { text: '</script><img src=x onerror=alert(1)>' });
    const html = await buildViewerFile(s().doc);
    // The hostile text never appears raw: it can't close the data element or start a script.
    expect(html).not.toContain('</script><script>alert');
    expect(html).not.toContain('</script><b>');
    expect(html).not.toContain('<img src=x');
    const d = data(html);
    expect(d.frames[0]!.name).toBe('</script><b>x</b>');
    expect(d.frames[0]!.comments[0]!.text).toContain('onerror');
    expect(html).toContain('<title>Untitled mockup</title>');
  });
});
