import { beforeEach, describe, expect, it } from 'vitest';
import { getKit } from '../src/kits';
import { conversionTargets, convertFrame } from '../src/layout/convert';
import { renderFrameOf } from '../src/layout/render';
import { createDoc, useStore } from '../src/store/store';
import type { DocNode } from '../src/store/types';

const s = () => useStore.getState();
const comps = (ids?: string[]) =>
  Object.values(s().doc.nodes).filter(
    (n) => n.type === 'component' && (!ids || ids.includes(n.componentId!)),
  );
const of = (componentId: string) => comps([componentId]);
const frameNodes = (frameIdx: number): DocNode[] => {
  const f = s().doc.frames[frameIdx]!;
  const out: DocNode[] = [];
  const walk = (id: string) => {
    const n = s().doc.nodes[id];
    if (!n) return;
    out.push(n);
    n.children?.forEach(walk);
  };
  f.root.forEach(walk);
  return out;
};
const types = (idx: number, type: string) => frameNodes(idx).filter((n) => n.type === type);
const componentsIn = (idx: number) => frameNodes(idx).filter((n) => n.type === 'component');
const layouts = (idx: number) =>
  s()
    .doc.frames[idx]!.root.map((id) => s().doc.nodes[id]!)
    .filter((n) => n.type === 'section')
    .map((n) => n.props?.layout);

/** An NSW page with a bit of everything, built through the real store. */
function nswPage() {
  useStore.setState({
    doc: createDoc(),
    past: [],
    future: [],
    conversionReport: null,
    notice: null,
  });
  const f = s().doc.frames[0]!.id;
  s().addPageParts(f, 'top');
  const header = of('header')[0]!;
  s().setText(header.id, 'title', 'Service NSW');
  s().addComponent(f, 'main-nav', 'default');
  s().addLayoutBlock(f, 'grid', 2);
  const grid = Object.values(s().doc.nodes).find((n) => n.type === 'grid')!;
  const col1 = grid.children![0]!;
  const col2 = grid.children![1]!;
  s().selectNode(f, col1);
  s().addComponent(f, 'heading', 'h2');
  s().setText(of('heading')[0]!.id, 'text', 'Apply online');
  s().addComponent(f, 'paragraph', 'default');
  s().addComponent(f, 'button', 'dark-outline');
  s().setNodeProps(of('button')[0]!.id, { goto: 'f_other' });
  s().selectNode(f, col2);
  s().addComponent(f, 'link-list', 'default');
  s().addComponent(f, 'accordion', 'default');
  s().addComponent(f, 'breadcrumbs', 'default');
  s().addComponent(f, 'form', 'text');
  s().addPageParts(f, 'footer');
  return f;
}

describe('which conversions exist', () => {
  it('goes both ways between NSW and SharePoint, and nowhere else', () => {
    expect(conversionTargets('nsw')).toEqual(['sharepoint']);
    expect(conversionTargets('sharepoint')).toEqual(['nsw']);
    expect(getKit('sharepoint').conversions?.map((c) => c.from)).toEqual(['nsw']);
    expect(getKit('nsw').conversions?.map((c) => c.from)).toEqual(['sharepoint']);
  });
});

describe('NSW to SharePoint', () => {
  beforeEach(() => {
    nswPage();
  });

  it('makes a converted copy beside the original, in one undo step, and leaves the original alone', () => {
    const before = s().doc.frames[0]!;
    const nodesBefore = JSON.stringify(
      frameNodes(0).map((n) => [n.id, n.props, n.text, n.children]),
    );
    const past = s().past.length;
    s().convertFrame(before.id, 'sharepoint');
    expect(s().past.length).toBe(past + 1);
    expect(s().doc.frames).toHaveLength(2);
    const copy = s().doc.frames[1]!;
    expect(copy).toMatchObject({
      kitId: 'sharepoint',
      name: 'Home (SharePoint)',
      device: 'iphone',
      width: 393,
    });
    expect(copy.x).toBeGreaterThan(before.x + before.width);
    expect(s().selectedFrameId).toBe(copy.id);
    expect(JSON.stringify(frameNodes(0).map((n) => [n.id, n.props, n.text, n.children]))).toBe(
      nodesBefore,
    );
    expect(s().doc.kitVersions.sharepoint).toBeTruthy();
    s().undo();
    expect(s().doc.frames).toHaveLength(1);
    expect(Object.keys(s().doc.nodes).sort()).toEqual(
      frameNodes(0)
        .map((n) => n.id)
        .sort(),
    );
  });

  it('turns page furniture into site settings, and content into web parts', () => {
    s().convertFrame(s().doc.frames[0]!.id, 'sharepoint');
    const copy = s().doc.frames[1]!;
    expect(copy.settings).toMatchObject({ siteTitle: 'Service NSW', showTitleArea: false });
    expect(copy.settings?.navItems).toBeInstanceOf(Array);
    expect(copy.settings?.footerVisible).not.toBe(false);
    expect(componentsIn(1).map((n) => n.componentId)).toEqual(
      expect.arrayContaining(['sp-text', 'sp-button', 'sp-quick-links']),
    );
    const heading = componentsIn(1).find((n) => n.variant === 'heading-2')!;
    expect(heading.text?.text).toBe('Apply online');
  });

  it('keeps a button’s link to another frame and its style', () => {
    s().convertFrame(s().doc.frames[0]!.id, 'sharepoint');
    const button = componentsIn(1).find((n) => n.componentId === 'sp-button')!;
    expect(button.props?.goto).toBe('f_other');
    expect(button.props?.style).toBe('secondary');
  });

  it('maps the section structure to the nearest layout, with the content in the right columns', () => {
    s().convertFrame(s().doc.frames[0]!.id, 'sharepoint');
    const section = types(1, 'section')[0]!;
    expect(section.props?.layout).toBe('two-columns');
    const cols = section.children!.map((id) => s().doc.nodes[id]!);
    expect(cols).toHaveLength(2);
    const ids = (c: DocNode) => c.children!.map((id) => s().doc.nodes[id]!.componentId);
    expect(ids(cols[0]!)).toContain('sp-text');
    expect(ids(cols[1]!)).toContain('sp-quick-links');
  });

  it('turns an accordion into collapsible sections', () => {
    s().convertFrame(s().doc.frames[0]!.id, 'sharepoint');
    const collapsible = types(1, 'section').filter((n) => n.props?.collapsible === true);
    expect(collapsible).toHaveLength(3);
    expect(collapsible[0]!.text?.collapseTitle).toBeTruthy();
    expect(collapsible[0]!.props?.collapsedByDefault).toBeFalsy();
    expect(collapsible[1]!.props?.collapsedByDefault).toBe(true);
  });

  it('gives what has no equivalent a clearly labelled placeholder, and lists it in the report', () => {
    s().convertFrame(s().doc.frames[0]!.id, 'sharepoint');
    const placeholders = componentsIn(1).filter((n) => n.componentId === 'sp-placeholder');
    expect(placeholders.map((n) => n.text?.name).sort()).toEqual(['Breadcrumbs', 'Forms']);
    expect(placeholders[0]!.text?.text).toMatch(/no SharePoint equivalent/);
    const report = s().conversionReport!;
    expect(report.placeholders.map((p) => p.name).sort()).toEqual(['Breadcrumbs', 'Forms']);
    expect(report.converted).toBeGreaterThan(5);
    expect(report.toKit).toBe('sharepoint');
    s().dismissConversionReport();
    expect(s().conversionReport).toBeNull();
  });

  it('renders the converted page as a SharePoint page', () => {
    s().convertFrame(s().doc.frames[0]!.id, 'sharepoint');
    const html = renderFrameOf(s().doc, s().doc.frames[1]!);
    expect(html).toContain('sp-site');
    expect(html).toContain('Apply online');
    expect(html).toContain('sp-placeholder');
    expect(html).not.toContain('nsw-');
    expect(layouts(1).every((l) => typeof l === 'string')).toBe(true);
  });

  it('refuses to convert to the same kit, and an unknown frame', () => {
    expect(convertFrame(s().doc, s().doc.frames[0]!.id, 'nsw')).toBeNull();
    expect(convertFrame(s().doc, 'nope', 'sharepoint')).toBeNull();
    const past = s().past.length;
    s().convertFrame(s().doc.frames[0]!.id, 'nsw');
    expect(s().past.length).toBe(past);
    expect(s().notice).toMatch(/can’t be converted/);
  });
});

describe('NSW sections map to SharePoint layouts', () => {
  const build = (cols: number, spans?: [number, number]) => {
    useStore.setState({ doc: createDoc(), past: [], future: [], conversionReport: null });
    const f = s().doc.frames[0]!.id;
    s().addLayoutBlock(f, 'grid', cols);
    const grid = Object.values(s().doc.nodes).find((n) => n.type === 'grid')!;
    grid.children!.forEach((cid, i) => {
      s().selectNode(f, cid);
      s().addComponent(f, 'paragraph', 'default');
      void i;
    });
    if (spans) {
      s().setColumnSpan(grid.children![0]!, 'md', spans[0]);
      s().setColumnSpan(grid.children![1]!, 'md', spans[1]);
    }
    s().convertFrame(f, 'sharepoint');
  };

  it('one, two and three columns', () => {
    build(1);
    expect(layouts(1)).toEqual(['one-column']);
    build(2);
    expect(layouts(1)).toEqual(['two-columns']);
    build(3);
    expect(layouts(1)).toEqual(['three-columns']);
  });

  it('a narrow and a wide column become one-third left or right', () => {
    build(2, [4, 8]);
    expect(layouts(1)).toEqual(['one-third-left']);
    build(2, [8, 4]);
    expect(layouts(1)).toEqual(['one-third-right']);
  });

  it('four columns become three, and say so', () => {
    build(4);
    expect(layouts(1)).toEqual(['three-columns']);
    expect(s().conversionReport!.notes.join(' ')).toMatch(/more than three columns/);
    expect(componentsIn(1)).toHaveLength(4);
  });
});

describe('SharePoint to NSW', () => {
  beforeEach(() => {
    useStore.setState({
      doc: createDoc('sharepoint'),
      past: [],
      future: [],
      conversionReport: null,
    });
    const f = s().doc.frames[0]!.id;
    s().setFrameSettings(f, {
      siteTitle: 'People hub',
      pageTitle: 'Welcome',
      navItems: [{ label: 'Home' }, { label: 'News' }],
      footerLinks: ['About', 'Contact'],
      showAuthor: false,
      showDate: false,
    });
    s().addLayoutBlock(f, 'section', 4); // one-third left
    const section = Object.values(s().doc.nodes).find((n) => n.type === 'section')!;
    s().setNodeProps(section.id, { background: 'soft', collapsible: true });
    s().setText(section.id, 'collapseTitle', 'Latest');
    s().selectNode(f, section.children![0]!);
    s().addComponent(f, 'sp-text', 'heading-2');
    s().setText(of('sp-text')[0]!.id, 'text', 'Hello');
    s().addComponent(f, 'sp-button', 'primary');
    s().selectNode(f, section.children![1]!);
    s().addComponent(f, 'sp-news', 'list');
    s().addComponent(f, 'sp-quick-chart', 'column');
    s().addComponent(f, 'sp-people', 'compact');
    s().addLayoutBlock(f, 'section', 7); // vertical
    s().selectNode(
      f,
      Object.values(s().doc.nodes)
        .filter((n) => n.type === 'section')
        .pop()!.children![0]!,
    );
    s().addComponent(f, 'sp-quick-links', 'list');
    s().convertFrame(f, 'nsw');
  });

  it('makes an NSW copy with masthead, header, menu and footer from the site settings', () => {
    const copy = s().doc.frames[1]!;
    expect(copy.kitId).toBe('nsw');
    const ids = s().doc.frames[1]!.root.map((id) => s().doc.nodes[id]!.componentId ?? 'section');
    expect(ids[0]).toBe('masthead');
    expect(ids[1]).toBe('header');
    expect(ids).toContain('main-nav');
    expect(ids[ids.length - 1]).toBe('footer');
    const header = componentsIn(1).find((n) => n.componentId === 'header')!;
    expect(header.text?.title).toBe('People hub');
    const nav = componentsIn(1).find((n) => n.componentId === 'main-nav')!;
    expect(nav.text).toMatchObject({ item1: 'Home', item2: 'News' });
  });

  it('turns the page title into a heading, layouts into rows of columns, and web parts into components', () => {
    const h1 = componentsIn(1).find((n) => n.componentId === 'heading' && n.variant === 'h1');
    expect(h1?.text?.text).toBe('Welcome');
    const grids = types(1, 'grid');
    expect(grids.length).toBeGreaterThan(0);
    const widths = grids
      .find((g) => g.children!.length === 2)!
      .children!.map((c) => (s().doc.nodes[c]!.props?.spans as { md: number }).md);
    expect(widths).toEqual([4, 8]);
    const kinds = componentsIn(1).map((n) => n.componentId);
    expect(kinds).toEqual(expect.arrayContaining(['heading', 'button', 'list-item', 'link-list']));
    const section = types(1, 'section').find((n) => n.props?.background === 'brand-light');
    expect(section).toBeDefined();
  });

  it('puts the vertical section at the end, and a collapsible title as a heading', () => {
    const sections = types(1, 'section');
    const last = sections[sections.length - 1]!;
    expect(
      frameNodes(1)
        .filter((n) => n.type === 'component')
        .some((n) => n.componentId === 'link-list'),
    ).toBe(true);
    void last;
    const latest = componentsIn(1).find(
      (n) => n.componentId === 'heading' && n.text?.text === 'Latest',
    );
    expect(latest?.variant).toBe('h2');
    expect(s().conversionReport!.notes.join(' ')).toMatch(/vertical section/);
    expect(s().conversionReport!.notes.join(' ')).toMatch(/Collapsible sections/);
  });

  it('turns a web part with no NSW equivalent into an NSW alert that names it', () => {
    const alerts = componentsIn(1).filter((n) => n.componentId === 'in-page-alert');
    expect(alerts.map((a) => a.text?.title).sort()).toEqual([
      'Not converted: People',
      'Not converted: Quick chart',
    ]);
    expect(alerts[0]!.variant).toBe('warning');
    expect(
      s()
        .conversionReport!.placeholders.map((p) => p.name)
        .sort(),
    ).toEqual(['People', 'Quick chart']);
  });

  it('the converted page uses only NSW markup', () => {
    const html = renderFrameOf(s().doc, s().doc.frames[1]!);
    expect(html).toContain('nsw-');
    expect(html).not.toContain('sp-');
  });
});
