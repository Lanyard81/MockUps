/* eslint-disable @typescript-eslint/no-explicit-any -- these tests deliberately edit untyped JSON */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  FileError,
  parseMockupFile,
  serialiseMockupFile,
  validateDoc,
} from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';
import type { MockupDoc } from '../src/store/types';

const s = () => useStore.getState();

/** A doc with a section, text, a card and a header (full width), built through the real store. */
function sampleDoc(): MockupDoc {
  useStore.setState({ doc: createDoc(), past: [], future: [] });
  const f = s().doc.frames[0]!.id;
  s().addComponent(f, 'heading', 'h1');
  s().setText(s().selectedNodeId!, 'text', 'Hello');
  s().addComponent(f, 'card', 'default');
  s().addPageParts(f, 'top');
  return s().doc;
}

const roundTrip = (doc: MockupDoc) => parseMockupFile(serialiseMockupFile(doc));
const mutate = (fn: (d: Record<string, any>) => void) => {
  const d = JSON.parse(JSON.stringify(sampleDoc())) as Record<string, any>;
  fn(d);
  return d;
};
const reject = (raw: unknown, message: RegExp) => {
  expect(() => validateDoc(raw)).toThrow(FileError);
  expect(() => validateDoc(raw)).toThrow(message);
};

beforeEach(() => {
  useStore.setState({ doc: createDoc() });
});

describe('saving and opening files', () => {
  it('round-trips a document exactly', () => {
    const doc = sampleDoc();
    expect(roundTrip(doc).doc).toEqual(doc);
  });

  it('keeps names, hidden layers, text and props', () => {
    const doc = sampleDoc();
    const id = Object.values(doc.nodes).find((n) => n.componentId === 'heading')!.id;
    s().setNodeName(id, 'Page title');
    s().setHidden(id, true);
    s().setNodeProps(id, { custom: { a: 1 } });
    const out = roundTrip(s().doc).doc.nodes[id]!;
    expect(out).toMatchObject({
      name: 'Page title',
      hidden: true,
      props: { custom: { a: 1 } },
      text: { text: 'Hello' },
    });
  });

  it('opens a bare document as well as the file format', () => {
    const doc = sampleDoc();
    expect(parseMockupFile(JSON.stringify(doc)).doc).toEqual(doc);
  });

  it('carries templates and skips damaged ones', () => {
    const doc = sampleDoc();
    const good = {
      id: 'tpl_1',
      name: 'Mine',
      createdAt: 1,
      device: 'iphone',
      width: 393,
      root: ['n'],
      nodes: { n: { id: 'n', type: 'component', componentId: 'masthead' } },
      images: {},
    };
    const bad = { id: 'tpl_2', name: 'Broken', root: ['missing'], nodes: {} };
    const text = JSON.stringify({
      app: 'nsw-mockup-builder',
      fileVersion: 1,
      doc,
      templates: [good, bad],
    });
    const out = parseMockupFile(text);
    expect(out.templates.map((t) => t.name)).toEqual(['Mine']);
  });
});

describe('untrusted input is refused or repaired', () => {
  it('rejects text that is not JSON, or not a mockup', () => {
    expect(() => parseMockupFile('not json')).toThrow(/isn’t valid JSON/);
    expect(() => parseMockupFile('[]')).toThrow(/isn’t a mockup file/);
    expect(() => parseMockupFile('{"hello":1}')).toThrow(/isn’t a mockup file/);
    expect(() => parseMockupFile('x'.repeat(201 * 1024 * 1024))).toThrow(/too large/);
  });

  it('refuses files from a newer version, in words', () => {
    reject(
      mutate((d) => (d.version = 2)),
      /newer version/,
    );
  });

  it('refuses damaged layouts: missing children, shared children, wrong types', () => {
    reject(
      mutate((d) => (d.frames[0].root = ['nope'])),
      /missing/,
    );
    reject(
      mutate((d) => {
        d.frames[0].root.push(d.frames[0].root[0]);
      }),
      /used twice/,
    );
    reject(
      mutate((d) => (d.nodes[d.frames[0].root.at(-1)].type = 'banana')),
      /unknown layer type/,
    );
    reject(
      mutate((d) => (d.frames = 'x')),
      /no frames/,
    );
    reject(
      mutate((d) => (d.nodes = null)),
      /no layout/,
    );
  });

  it('enforces the tree rules', () => {
    reject(
      mutate((d) => {
        d.nodes.stray = { id: 'stray', type: 'component', componentId: 'heading' };
        d.frames[0].root.push('stray'); // a component can't sit in the frame root
      }),
      /can’t go inside a frame/,
    );
    reject(
      mutate((d) => {
        d.nodes.box = { id: 'box', type: 'container', children: [] };
        d.frames[0].root.push('box'); // a container belongs in a section
      }),
      /can’t go inside a frame/,
    );
  });

  it('refuses prototype-pollution keys at any depth', () => {
    const text =
      '{"version":1,"frames":[],"nodes":{},"images":{},"x":{"__proto__":{"polluted":true}}}';
    expect(() => parseMockupFile(text)).toThrow(/will not open/);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('drops layers nothing uses', () => {
    const d = mutate((x) => (x.nodes.orphan = { id: 'orphan', type: 'section', children: [] }));
    expect(validateDoc(d).nodes.orphan).toBeUndefined();
  });

  it('clamps and repairs bad values', () => {
    const doc = validateDoc(
      mutate((d) => {
        Object.assign(d.frames[0], {
          width: 99999,
          device: 'toaster',
          x: 'far',
          name: 'n'.repeat(500),
        });
        d.view = { x: 5, y: 5, zoom: 99 };
      }),
    );
    expect(doc.frames[0]).toMatchObject({ width: 3000, device: 'custom', x: 0 });
    expect(doc.frames[0]!.name).toHaveLength(200);
    expect(doc.view.zoom).toBe(4);
  });

  it('keeps unknown components (they show as placeholders) but drops non-string text', () => {
    const d = mutate((x) => {
      const comp = Object.values(x.nodes).find((n: any) => n.componentId === 'heading') as any;
      comp.componentId = 'from-the-future';
      comp.text = { text: 'ok', bad: 5, __proto__x: 'y' };
    });
    const heading = Object.values(validateDoc(d).nodes).find(
      (n) => n.componentId === 'from-the-future',
    )!;
    expect(heading.text).toEqual({ text: 'ok', __proto__x: 'y' });
  });

  it('only keeps real image data URLs', () => {
    const img = (dataUrl: string) => ({ dataUrl });
    const doc = validateDoc(
      mutate((d) => {
        d.images = {
          png: img('data:image/png;base64,AAAA'),
          svg: img('data:image/svg+xml;charset=utf-8,%3Csvg%3E'),
          html: img('data:text/html;base64,PHNjcmlwdD4='),
          js: img('javascript:alert(1)'),
          web: img('https://example.com/a.png'),
          num: { dataUrl: 7 },
        };
      }),
    );
    expect(Object.keys(doc.images).sort()).toEqual(['png', 'svg']);
  });

  it('copies fields rather than trusting the input object', () => {
    const d = mutate((x) => (x.extra = 'ignored'));
    expect(validateDoc(d)).not.toHaveProperty('extra');
  });
});
