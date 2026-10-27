import { beforeEach, describe, expect, it } from 'vitest';
import { getComponent, getCatalogue, kitOfComponent } from '../src/catalogue';
import { DEFAULT_KIT_ID, KITS, getKit, hasKit } from '../src/kits';
import {
  buildChain,
  canContain,
  depthOf,
  resolveInsertion,
  schemaOfFrame,
} from '../src/layout/ops';
import { DOC_VERSION, migrateDoc } from '../src/persistence/migrate';
import { FileError, parseMockupFile, validateDoc } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';
import type { DocNode } from '../src/store/types';
import { buildSample } from '../src/kits/nsw/samples';
import { SAMPLES } from '../src/kits/nsw/samples';

const s = () => useStore.getState();

describe('kit registry', () => {
  it('lists the kits with unique ids and finds them by id', () => {
    expect(new Set(KITS.map((k) => k.id)).size).toBe(KITS.length);
    for (const k of KITS) {
      expect(getKit(k.id)).toBe(k);
      expect(hasKit(k.id)).toBe(true);
    }
  });

  it('falls back to the default kit for a missing or unknown id', () => {
    expect(getKit(undefined).id).toBe(DEFAULT_KIT_ID);
    expect(getKit('nope').id).toBe(DEFAULT_KIT_ID);
    expect(hasKit('nope')).toBe(false);
  });

  it('keeps component ids unique across kits and finds a component’s kit', () => {
    const ids = KITS.flatMap((k) => k.catalogue.components.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const k of KITS)
      for (const c of k.catalogue.components) {
        expect(getComponent(c.id)).toBeDefined();
        expect(kitOfComponent(c.id)).toBe(k.id);
      }
    expect(getCatalogue('nsw').components.length).toBeGreaterThan(40);
  });

  it('gives every kit a complete definition', () => {
    for (const k of KITS) {
      expect(k.name && k.shortLabel && k.version && k.licence).toBeTruthy();
      expect(k.shell.document).toContain('<div id="root">');
      expect(k.categories).toContain(k.layoutCategory);
      expect(k.schema.layers.length).toBeGreaterThan(0);
      for (const b of k.layoutBlocks) expect(k.schema.layers).toContain(b.layer);
      for (const c of k.catalogue.components) expect(k.categories).toContain(c.category);
    }
  });
});

describe('layout rules come from the kit schema', () => {
  const node = (type: DocNode['type'], id = type): DocNode => ({ id, type, children: [] });
  const comp = (id: string): DocNode => ({ id, type: 'component', componentId: 'heading' });

  it('NSW has five levels', () => {
    const schema = getKit('nsw').schema;
    expect(schema.layers).toEqual(['section', 'container', 'grid', 'column']);
    expect(depthOf(node('column'), schema)).toBe(4);
    expect(depthOf(comp('a'), schema)).toBe(5);
    expect(canContain(node('section'), node('container'), schema)).toBe(true);
    expect(canContain(node('section'), node('column'), schema)).toBe(false);
  });

  it('a kit with fewer layers changes depth, containment and the chain built for a drop', () => {
    const shallow = {
      layers: ['section', 'column'],
      defaultProps: (t: string) => (t === 'section' ? { layout: 'one' } : undefined),
    } as const;
    expect(depthOf(comp('a'), shallow as never)).toBe(3);
    expect(depthOf(node('grid'), shallow as never)).toBe(-1);
    expect(canContain(node('column'), comp('a'), shallow as never)).toBe(true);
    expect(canContain(node('section'), comp('a'), shallow as never)).toBe(false);
    let n = 0;
    const chain = buildChain(() => `n${++n}`, comp('a'), 1, shallow as never);
    expect(Object.values(chain.nodes).map((x) => x.type)).toEqual(['column', 'section']);
    expect(chain.nodes[chain.topId]!.props).toEqual({ layout: 'one' });
  });

  it('operations look the schema up from the frame’s kit, defaulting to NSW', () => {
    const doc = createDoc();
    expect(schemaOfFrame(doc, doc.frames[0]!.id)).toBe(getKit('nsw').schema);
    const ins = resolveInsertion(doc, doc.frames[0]!.id, null, comp('x'));
    expect(ins.chainFrom).toBe(1);
  });
});

describe('document migration', () => {
  const v1 = () => ({
    version: 1,
    id: 'doc_old',
    name: 'Old',
    nswVersion: '3.20.0',
    view: { x: 0, y: 0, zoom: 1 },
    frames: [
      { id: 'f1', name: 'One', device: 'iphone', width: 393, x: 0, y: 0, root: [] },
      { id: 'f2', name: 'Two', device: 'desktop', width: 1440, x: 500, y: 0, root: [] },
    ],
    nodes: {},
    images: {},
  });

  it('turns a version 1 document into version 2 with every frame on the NSW kit', () => {
    const out = migrateDoc(v1()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(out.version).toBe(DOC_VERSION);
    expect(out.defaultKitId).toBe('nsw');
    expect(out.kitVersions).toEqual({ nsw: '3.20.0' });
    expect(out.kitSettings).toEqual({});
    expect(out.nswVersion).toBeUndefined();
    expect(out.frames.map((f: { kitId: string }) => f.kitId)).toEqual(['nsw', 'nsw']);
  });

  it('does not change the input and leaves current or unknown input alone', () => {
    const old = v1();
    migrateDoc(old);
    expect(old.version).toBe(1);
    const current = migrateDoc(migrateDoc(old));
    expect((current as { version: number }).version).toBe(DOC_VERSION);
    expect(migrateDoc('x')).toBe('x');
    expect(migrateDoc(null)).toBeNull();
  });

  it('opens a version 1 file and validates it as the current version', () => {
    const doc = validateDoc(v1());
    expect(doc.version).toBe(DOC_VERSION);
    expect(doc.frames.every((f) => f.kitId === 'nsw')).toBe(true);
    expect(doc.kitVersions.nsw).toBe('3.20.0');
  });

  it('opens a version 1 file in its saved-file envelope', () => {
    const text = JSON.stringify({
      app: 'nsw-mockup-builder',
      fileVersion: 1,
      doc: v1(),
      templates: [],
    });
    expect(parseMockupFile(text).doc.version).toBe(DOC_VERSION);
  });

  it('refuses a frame from a kit this build doesn’t have, in words', () => {
    const doc = { ...(migrateDoc(v1()) as object) } as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    doc.frames[0].kitId = 'unknown-kit';
    expect(() => validateDoc(doc)).toThrow(FileError);
    expect(() => validateDoc(doc)).toThrow(/style kit/);
  });

  it('keeps kit settings as plain data and drops anything unsafe', () => {
    const doc = migrateDoc(v1()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    doc.frames[0].settings = JSON.parse(
      '{"header":"compact","__proto__":{"x":1},"n":[1,{"a":true}],"f":null}',
    );
    doc.kitSettings = { nsw: { theme: 'teal' } };
    const out = validateDoc(doc);
    expect(out.frames[0]!.settings).toEqual({ header: 'compact', n: [1, { a: true }] });
    expect(out.kitSettings).toEqual({ nsw: { theme: 'teal' } });
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
});

describe('kit-aware store', () => {
  beforeEach(() => useStore.setState({ doc: createDoc(), past: [], future: [] }));

  it('a new document starts on the default kit with its version recorded', () => {
    const doc = createDoc();
    expect(doc.version).toBe(DOC_VERSION);
    expect(doc.defaultKitId).toBe('nsw');
    expect(doc.kitVersions.nsw).toBe(getKit('nsw').version);
    expect(doc.frames[0]!.kitId).toBe('nsw');
  });

  it('new frames get the default kit unless one is asked for', () => {
    s().addFrame('desktop');
    expect(s().doc.frames[1]!.kitId).toBe('nsw');
    s().addFrame('tablet', 'nsw');
    expect(s().doc.frames[2]!.kitId).toBe('nsw');
  });

  it('frame and kit settings are single undoable changes, and undefined clears a key', () => {
    const frame = s().doc.frames[0]!.id;
    const before = s().past.length;
    s().setFrameSettings(frame, { header: 'compact', logo: 'a' });
    expect(s().doc.frames[0]!.settings).toEqual({ header: 'compact', logo: 'a' });
    s().setFrameSettings(frame, { logo: undefined });
    expect(s().doc.frames[0]!.settings).toEqual({ header: 'compact' });
    s().setKitSettings('nsw', { theme: 'teal' });
    expect(s().doc.kitSettings.nsw).toEqual({ theme: 'teal' });
    expect(s().past.length).toBe(before + 3);
    s().undo();
    s().undo();
    s().undo();
    expect(s().doc.frames[0]!.settings).toBeUndefined();
    expect(s().doc.kitSettings.nsw).toBeUndefined();
  });

  it('layout blocks and page parts come from the frame’s kit', () => {
    const frame = s().doc.frames[0]!.id;
    s().addLayoutBlock(frame, 'grid', 3);
    const grid = Object.values(s().doc.nodes).find((n) => n.type === 'grid')!;
    expect(grid.children).toHaveLength(3);
    s().addPageParts(frame, 'top');
    s().addPageParts(frame, 'nonsense');
    expect(Object.values(s().doc.nodes).some((n) => n.componentId === 'masthead')).toBe(true);
  });

  it('the NSW samples are current-version documents on the NSW kit', () => {
    for (const def of SAMPLES) {
      const doc = buildSample(def);
      expect(doc.version).toBe(DOC_VERSION);
      expect(doc.frames.every((f) => f.kitId === 'nsw')).toBe(true);
    }
  });
});

describe('kits do not mix inside a frame', () => {
  beforeEach(() => {
    useStore.setState({ doc: createDoc(), past: [], future: [], notice: null, clipboard: null });
    s().addFrame('desktop', 'sharepoint');
  });
  const nsw = () => s().doc.frames[0]!;
  const sp = () => s().doc.frames[1]!;

  it('adds a frame in the chosen kit and records its version', () => {
    expect(sp().kitId).toBe('sharepoint');
    expect(s().doc.kitVersions.sharepoint).toBe(getKit('sharepoint').version);
  });

  it('refuses a component from the other kit, with a message, and makes no history entry', () => {
    const past = s().past.length;
    s().addComponent(sp().id, 'heading', 'h1');
    expect(s().notice).toMatch(
      /This is a SharePoint page — switch the library to SharePoint, or convert the page/,
    );
    expect(s().past.length).toBe(past);
    s().addComponent(nsw().id, 'sp-text', 'paragraph');
    expect(s().notice).toMatch(/This is an NSW page/);
    expect(Object.keys(s().doc.nodes)).toHaveLength(0);
  });

  it('accepts a component of the frame’s own kit and builds that kit’s layers around it', () => {
    s().addComponent(sp().id, 'sp-text', 'paragraph');
    const types = Object.values(s().doc.nodes)
      .map((n) => n.type)
      .sort();
    expect(types).toEqual(['column', 'component', 'section']);
    s().undo();
    expect(Object.keys(s().doc.nodes)).toHaveLength(0);
  });

  it('builds layout blocks from the frame’s kit', () => {
    s().addLayoutBlock(sp().id, 'section', 1);
    const section = Object.values(s().doc.nodes).find((n) => n.type === 'section')!;
    expect(section.props?.layout).toBe('one-column');
    expect(Object.values(s().doc.nodes).some((n) => n.type === 'container')).toBe(false);
  });

  it('refuses to drop a new item from the other kit', () => {
    const past = s().past.length;
    s().dropNew(
      { kind: 'new-component', componentId: 'heading', variantId: 'h1', label: 'Heading' },
      {
        frameId: sp().id,
        parentId: null,
        index: 0,
        chainFrom: 1,
        indicator: { kind: 'box', rect: { x: 0, y: 0, width: 1, height: 1 } },
      },
    );
    expect(s().past.length).toBe(past);
    expect(s().notice).toMatch(/SharePoint page/);
    s().dropNew(
      { kind: 'new-layout', kitId: 'nsw', block: 'section', label: 'Section' },
      {
        frameId: sp().id,
        parentId: null,
        index: 0,
        chainFrom: null,
        indicator: { kind: 'box', rect: { x: 0, y: 0, width: 1, height: 1 } },
      },
    );
    expect(s().past.length).toBe(past);
  });

  it('refuses to move a node, or paste a copy, into a frame of the other kit', () => {
    s().addComponent(nsw().id, 'heading', 'h1');
    const heading = Object.values(s().doc.nodes).find((n) => n.componentId === 'heading')!;
    const before = s().past.length;
    s().moveNode(heading.id, { frameId: sp().id, parentId: null, index: 0, chainFrom: 1 });
    expect(s().past.length).toBe(before);
    expect(s().notice).toMatch(/SharePoint page/);
    s().setNotice(null);
    s().copyNode(heading.id);
    s().selectFrame(sp().id);
    s().pasteClipboard();
    expect(s().past.length).toBe(before);
    expect(s().notice).toMatch(/SharePoint page/);
  });

  it('a layout node can’t cross kits even when it is empty', () => {
    s().addLayoutBlock(nsw().id, 'section');
    const section = Object.values(s().doc.nodes).find((n) => n.type === 'section')!;
    s().copyNode(section.id);
    s().selectFrame(sp().id);
    s().pasteClipboard();
    expect(Object.values(s().doc.nodes).filter((n) => n.type === 'section')).toHaveLength(1);
  });

  it('remembers the kit chosen for new frames, and new mockups start in it', () => {
    s().setNewFrameKit('sharepoint');
    expect(s().newFrameKitId).toBe('sharepoint');
    expect(localStorage.getItem('pagewright.lastKit')).toBe('sharepoint');
    s().newDoc();
    expect(s().doc.defaultKitId).toBe('sharepoint');
    expect(s().doc.frames[0]!.kitId).toBe('sharepoint');
    s().setNewFrameKit('nsw');
  });

  it('the library follows the selected frame until another kit is chosen for it', () => {
    s().selectFrame(sp().id);
    s().setLibraryKit('nsw');
    expect(s().libraryKit).toEqual({ kitId: 'nsw', frameId: sp().id });
    s().setLibraryKit(null);
    expect(s().libraryKit).toBeNull();
  });
});
