import { beforeEach, describe, expect, it } from 'vitest';
import { getKit } from '../src/kits';
import {
  framesToSpecText,
  importPageSpec,
  looksLikePageSpec,
  parsePageSpecText,
  summariseReport,
  type ImportedPage,
} from '../src/pagespec';
import { cleanTree } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';
import { OFFICIAL_TEMPLATES, instantiateOfficial } from '../src/templates';
import type { DocNode, MockupDoc } from '../src/store/types';

const s = () => useStore.getState();

/** A page's tree without ids, so two trees can be compared. */
function shape(nodes: Record<string, DocNode>, ids: string[]): unknown[] {
  return ids.map((id) => {
    const n = nodes[id]!;
    const clean = (o: object | undefined) => (o && Object.keys(o).length ? o : undefined);
    return {
      type: n.type,
      props: clean(n.props),
      componentId: n.componentId,
      variant: n.variant,
      text: clean(n.text),
      textFit: clean(n.textFit),
      hidden: n.hidden === true ? true : undefined,
      name: n.name,
      children: n.children ? shape(nodes, n.children) : undefined,
    };
  });
}

const frameDoc = (t: ReturnType<typeof instantiateOfficial>): MockupDoc => {
  const doc = createDoc(t.kitId);
  return {
    ...doc,
    frames: [
      {
        id: 'f1',
        name: t.name,
        kitId: t.kitId,
        ...(t.settings ? { settings: t.settings } : {}),
        device: t.device,
        width: t.width,
        x: 0,
        y: 0,
        root: t.root,
      },
    ],
    nodes: t.nodes,
  };
};

describe('page spec round trip', () => {
  for (const def of OFFICIAL_TEMPLATES) {
    it(`${def.id}: frame to spec to frame gives the same tree`, () => {
      const t = instantiateOfficial(def);
      const doc = frameDoc(t);
      const out = framesToSpecText(doc, ['f1'])!;
      const [page] = importPageSpec(out.text, 'nsw');
      expect(page!.report.notes, def.id).toEqual([]);
      expect(page!.report.placeholders).toEqual([]);
      expect(page!.kitId).toBe(t.kitId);
      expect(shape(page!.nodes, page!.root)).toEqual(shape(t.nodes, t.root));
      expect(page!.settings ?? {}).toEqual(t.settings ?? {});
      // ...and the result is a valid tree under the kit's own rules.
      expect(() => cleanTree(page!.nodes, [page!.root], [page!.kitId])).not.toThrow();
    });
  }
});

describe('page spec import', () => {
  const spec = (over: Record<string, unknown>) =>
    JSON.stringify({ format: 'mockup-page-spec', version: 1, kit: 'nsw', ...over });
  const one = (over: Record<string, unknown>, kit = 'nsw'): ImportedPage =>
    importPageSpec(spec(over), kit)[0]!;
  const comps = (p: ImportedPage) => Object.values(p.nodes).filter((n) => n.type === 'component');

  it('builds the NSW example from the brief', () => {
    const p = one(getKit('nsw').pageSpec.docs.example as Record<string, unknown>);
    expect(p.report.notes).toEqual([]);
    expect(p.name).toBe('Home');
    expect(comps(p).map((n) => n.componentId)).toEqual([
      'masthead',
      'header',
      'main-nav',
      'heading',
      'card',
      'button',
      'footer',
    ]);
    expect(summariseReport(p.report)).toBe('Imported 7 components.');
  });

  it('builds the SharePoint example, with its frame settings', () => {
    const p = one(getKit('sharepoint').pageSpec.docs.example as Record<string, unknown>);
    expect(p.kitId).toBe('sharepoint');
    expect(p.settings).toMatchObject({ siteType: 'communication', siteTitle: 'Contoso intranet' });
    expect(p.root).toHaveLength(2);
  });

  it('turns an unknown component into a labelled placeholder and counts it', () => {
    const p = one({
      page: [
        {
          section: {},
          blocks: [
            { component: 'search-filters', text: { title: 'x' } },
            { component: 'search-filters' },
            { component: 'heading', variant: 'h1', text: { text: 'Hi' } },
          ],
        },
      ],
    });
    expect(p.report.placeholders).toEqual([{ name: 'search-filters', count: 2 }]);
    expect(p.report.components).toBe(1);
    const alert = comps(p).find((n) => n.componentId === 'in-page-alert')!;
    expect(alert.text?.title).toContain('search-filters');
    expect(summariseReport(p.report)).toContain('2 placeholders: “search-filters” (2)');
  });

  it('treats a component from the other kit as a placeholder', () => {
    const p = one({ page: [{ section: {}, blocks: [{ component: 'sp-news' }] }] });
    expect(p.report.placeholders[0]?.name).toBe('News');
  });

  it('replaces an unknown variant with the default, and drops unknown text keys, options and parts', () => {
    const p = one({
      page: [
        {
          section: {},
          blocks: [
            {
              component: 'button',
              variant: 'sparkly',
              text: { label: 'Go', nope: 'x' },
              props: { href: 'https://example.com', bogus: true },
              hide: ['nothing'],
            },
          ],
        },
      ],
    });
    const button = comps(p)[0]!;
    expect(button.variant).toBeUndefined();
    expect(button.text).toEqual({ label: 'Go' });
    expect(button.props).toEqual({ href: 'https://example.com' });
    expect(p.report.unknownVariants).toBe(1);
    expect(p.report.dropped).toBe(3);
  });

  it('moves a full-width component out of a section, and wraps a loose one in a section', () => {
    const p = one({
      page: [
        { component: 'paragraph', text: { text: 'Loose' } },
        {
          section: {},
          blocks: [{ component: 'footer', variant: 'dark' }, { component: 'heading' }],
        },
      ],
    });
    const types = p.root.map((id) => p.nodes[id]!.type);
    expect(types).toEqual(['section', 'section', 'component']);
    expect(p.nodes[p.root[2]!]!.componentId).toBe('footer');
    expect(p.report.moved).toBe(1);
  });

  it('limits and repairs rows', () => {
    const cols = Array.from({ length: 8 }, () => [{ component: 'paragraph' }]);
    const p = one({
      page: [{ section: {}, blocks: [{ row: [3, 3], columns: cols }] }],
    });
    const grid = Object.values(p.nodes).find((n) => n.type === 'grid')!;
    expect(grid.children).toHaveLength(6);
    expect(p.report.moved).toBe(1);
    expect(comps(p)).toHaveLength(8);
    expect(() => cleanTree(p.nodes, [p.root], ['nsw'])).not.toThrow();
  });

  it('SharePoint: a full-width section on a team site becomes one column, with the reason', () => {
    const p = one(
      {
        kit: 'sharepoint',
        settings: { siteType: 'team' },
        page: [{ section: { layout: 'full-width' }, columns: [[{ component: 'sp-text' }]] }],
      },
      'sharepoint',
    );
    expect(p.nodes[p.root[0]!]!.props?.layout).toBe('one-column');
    expect(p.report.notes.join(' ')).toMatch(/communication sites/);
    expect(p.report.moved).toBe(1);
  });

  it('SharePoint: a second vertical section is refused, extra columns are merged, loose web parts get a section', () => {
    const p = one(
      {
        kit: 'sharepoint',
        page: [
          { component: 'sp-text' },
          { section: { layout: 'vertical' }, columns: [[{ component: 'sp-text' }]] },
          { section: { layout: 'vertical' }, columns: [[{ component: 'sp-text' }]] },
          {
            section: { layout: 'two-columns' },
            columns: [
              [{ component: 'sp-text' }],
              [{ component: 'sp-text' }],
              [{ component: 'sp-text' }],
            ],
          },
        ],
      },
      'sharepoint',
    );
    const layouts = p.root.map((id) => p.nodes[id]!.props?.layout);
    expect(layouts).toEqual(['one-column', 'vertical', 'one-column', 'two-columns']);
    const last = p.nodes[p.root[3]!]!;
    expect(last.children).toHaveLength(2);
    expect(p.nodes[last.children![1]!]!.children).toHaveLength(2);
    expect(() => cleanTree(p.nodes, [p.root], ['sharepoint'])).not.toThrow();
  });

  it('checks frame settings against the kit and drops what is not allowed', () => {
    const p = one(
      {
        kit: 'sharepoint',
        settings: {
          siteType: 'communication',
          headerLayout: 'enormous',
          colour: 'red',
          siteTitle: 'Hi',
        },
        page: [],
      },
      'sharepoint',
    );
    expect(p.settings).toEqual({ siteType: 'communication', siteTitle: 'Hi' });
    expect(p.report.dropped).toBeGreaterThanOrEqual(2);
  });

  it('uses the default kit when none is given, and refuses an unknown one', () => {
    const p = importPageSpec(
      JSON.stringify({ format: 'mockup-page-spec', version: 1, page: [] }),
      'sharepoint',
    )[0]!;
    expect(p.kitId).toBe('sharepoint');
    expect(p.report.notes.join(' ')).toMatch(/No kit was given/);
    expect(() => one({ kit: 'material', page: [] })).toThrow(/doesn’t have/);
  });

  it('imports a list of pages', () => {
    const text = JSON.stringify({
      format: 'mockup-page-spec',
      version: 1,
      kit: 'nsw',
      pages: [
        { name: 'A', page: [] },
        { name: 'B', kit: 'sharepoint', page: [] },
      ],
    });
    const pages = importPageSpec(text, 'nsw');
    expect(pages.map((p) => [p.name, p.kitId])).toEqual([
      ['A', 'nsw'],
      ['B', 'sharepoint'],
    ]);
  });
});

describe('page spec: untrusted input', () => {
  const bad = (text: string, message: RegExp) =>
    expect(() => importPageSpec(text, 'nsw')).toThrow(message);

  it('refuses text that is not a page spec', () => {
    bad('not json', /valid JSON/);
    bad('{"hello":1}', /isn’t a page spec/);
    bad('[1,2]', /isn’t a page spec/);
    bad('{"format":"mockup-page-spec","version":99,"page":[]}', /newer version/);
    bad('{"format":"mockup-page-spec","version":1,"pages":[]}', /no pages/);
  });

  it('refuses prototype-pollution keys at any depth', () => {
    bad(
      '{"format":"mockup-page-spec","version":1,"page":[],"x":{"__proto__":{"polluted":true}}}',
      /will not open/,
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('enforces size limits', () => {
    bad(' '.repeat(2_000_001), /too large/);
    const pages = Array.from({ length: 21 }, () => ({ page: [] }));
    bad(JSON.stringify({ format: 'mockup-page-spec', version: 1, pages }), /more than 20 pages/);
  });

  it('caps the number of components', () => {
    const blocks = Array.from({ length: 1200 }, () => ({ component: 'paragraph' }));
    const p = importPageSpec(
      JSON.stringify({ format: 'mockup-page-spec', version: 1, page: [{ section: {}, blocks }] }),
      'nsw',
    )[0]!;
    expect(p.report.components).toBe(1000);
    expect(p.report.notes.join(' ')).toMatch(/first 1000/);
  });

  it('keeps hostile text and links harmless', () => {
    const p = importPageSpec(
      JSON.stringify({
        format: 'mockup-page-spec',
        version: 1,
        kit: 'nsw',
        name: '<img src=x onerror=alert(1)>'.repeat(20),
        page: [
          {
            section: { background: 'url(javascript:alert(1))', padding: { a: 1 } },
            blocks: [
              {
                component: 'button',
                text: { label: 'x\u0000y'.repeat(5000) },
                props: { href: 'javascript:alert(1)', __proto__x: 1 },
              },
              { component: 'constructor' },
              'a string',
              { row: 'no', columns: 'no' },
            ],
          },
        ],
      }),
      'nsw',
    )[0]!;
    const button = Object.values(p.nodes).find((n) => n.componentId === 'button')!;
    expect(button.props?.href).toBeUndefined();
    expect(button.text!.label!.length).toBeLessThanOrEqual(5000);
    expect(button.text!.label).not.toContain('\u0000');
    expect(p.name.length).toBeLessThanOrEqual(100);
    const section = Object.values(p.nodes).find((n) => n.type === 'section')!;
    expect(section.props?.background).toBe('white'); // the bad value is ignored; the default stays
    expect(section.props?.padding).toBeUndefined();
    expect(() => cleanTree(p.nodes, [p.root], ['nsw'])).not.toThrow();
  });
});

describe('page spec detection and parsing', () => {
  it('recognises a spec by its format field', () => {
    expect(looksLikePageSpec('{"format": "mockup-page-spec"}')).toBe(true);
    expect(looksLikePageSpec('hello world')).toBe(false);
    expect(parsePageSpecText('{"format":"mockup-page-spec","page":[]}').pages).toHaveLength(1);
  });
});

describe('page spec import and export in the store', () => {
  beforeEach(() => {
    useStore.setState({
      doc: createDoc(),
      past: [],
      future: [],
      selectedFrameId: null,
      importReports: {},
    });
    // A page with something on it, so an import adds beside it (an empty starter page is replaced).
    useStore.getState().addComponent(useStore.getState().doc.frames[0]!.id, 'heading', 'h1');
  });

  it('adds a frame per page to the right of the others, selects the last, and is one undo step', () => {
    const before = s().doc.frames.length;
    const text = JSON.stringify({
      format: 'mockup-page-spec',
      version: 1,
      kit: 'nsw',
      pages: [
        { name: 'One', page: [{ component: 'heading', variant: 'h1' }] },
        { name: 'Two', page: [] },
      ],
    });
    const right = Math.max(...s().doc.frames.map((f) => f.x + f.width));
    expect(s().importPageSpecText(text)).toBe(true);
    expect(s().doc.frames).toHaveLength(before + 2);
    const added = s().doc.frames.slice(before);
    expect(added.map((f) => f.name)).toEqual(['One', 'Two']);
    expect(added[0]!.x).toBeGreaterThan(right);
    expect(added[1]!.x).toBeGreaterThan(added[0]!.x);
    expect(s().selectedFrameId).toBe(added[1]!.id);
    expect(Object.keys(s().importReports)).toEqual(added.map((f) => f.id));
    expect(s().importSummary?.pages).toHaveLength(2);
    s().undo();
    expect(s().doc.frames).toHaveLength(before);
    expect(s().importReports).toEqual({});
  });

  it('replaces an empty starter page instead of sitting beside it', () => {
    useStore.setState({ doc: createDoc(), past: [], future: [] });
    const starter = s().doc.frames[0]!;
    s().importPageSpecText('{"format":"mockup-page-spec","version":1,"name":"Real","page":[]}');
    expect(s().doc.frames.map((f) => f.name)).toEqual(['Real']);
    expect(s().doc.frames[0]!.x).toBe(starter.x);
    s().undo();
    expect(s().doc.frames.map((f) => f.id)).toEqual([starter.id]);
  });

  it('never reuses a frame name', () => {
    const text = '{"format":"mockup-page-spec","version":1,"name":"Same","page":[]}';
    s().importPageSpecText(text);
    s().importPageSpecText(text);
    expect(
      s()
        .doc.frames.map((f) => f.name)
        .slice(1),
    ).toEqual(['Same', 'Same 2']);
  });

  it('says what is wrong and changes nothing when the text is not a spec', () => {
    expect(s().importPageSpecText('nope')).toBe(false);
    expect(s().doc.frames).toHaveLength(1);
    expect(s().notice).toMatch(/valid JSON/);
  });

  it('can dismiss a frame’s report', () => {
    s().importPageSpecText('{"format":"mockup-page-spec","version":1,"page":[]}');
    const id = Object.keys(s().importReports)[0]!;
    s().dismissImportReport(id);
    expect(s().importReports[id]).toBeUndefined();
  });
});

describe('docs/PAGE-SPEC.md', () => {
  it('matches what the generator writes (run npm run page-spec-docs after changing a kit)', async () => {
    const { generatePageSpecDoc } = await import('../src/pagespec/docs');
    const { readFileSync } = await import('node:fs');
    expect(readFileSync('docs/PAGE-SPEC.md', 'utf8')).toBe(generatePageSpecDoc());
  });

  it('lists every component of every kit', async () => {
    const { generatePageSpecDoc } = await import('../src/pagespec/docs');
    const { KITS } = await import('../src/kits');
    const doc = generatePageSpecDoc();
    for (const kit of KITS)
      for (const c of kit.catalogue.components) expect(doc, c.id).toContain(`\`${c.id}\``);
  });

  it('the copy button’s text is the instruction plus one kit’s reference', async () => {
    const { pageSpecInstructions, SPEC_INSTRUCTION } = await import('../src/pagespec/docs');
    const text = pageSpecInstructions('sharepoint');
    expect(text.startsWith(SPEC_INSTRUCTION)).toBe(true);
    expect(text).toContain('`sp-news`');
    expect(text).not.toContain('`masthead`');
  });
});
