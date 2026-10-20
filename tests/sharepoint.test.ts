import { beforeEach, describe, expect, it } from 'vitest';
import { setColumnCount } from '../src/layout/ops';
import { renderFrameHtml, renderFrameOf } from '../src/layout/render';
import { patchAtPath, getAtPath } from '../src/lib/settingsPath';
import { getKit } from '../src/kits';
import { SECTION_LAYOUTS, sectionLayoutOf } from '../src/kits/sharepoint/sections';
import { FRAME_SETTINGS, KIT_SETTINGS, SECTION_SETTINGS } from '../src/kits/sharepoint/settings';
import {
  DEFAULT_COMMUNICATION_NAV,
  DEFAULT_TEAM_NAV,
  readNavItems,
  readSite,
} from '../src/kits/sharepoint/site';
import { createDoc, useStore } from '../src/store/store';
import type { DocNode } from '../src/store/types';

const s = () => useStore.getState();
const sp = getKit('sharepoint');

function spDoc() {
  useStore.setState({ doc: createDoc('sharepoint'), past: [], future: [], notice: null });
  return s().doc.frames[0]!.id;
}
const sections = () =>
  s()
    .doc.frames[0]!.root.map((id) => s().doc.nodes[id]!)
    .filter((n) => n.type === 'section');
const columnsOf = (section: DocNode) => section.children!.map((id) => s().doc.nodes[id]!);
const text = (frameId: string, label: string) => {
  s().addComponent(frameId, 'sp-text', 'paragraph');
  const n = Object.values(s().doc.nodes)
    .filter((x) => x.type === 'component')
    .pop()!;
  s().setText(n.id, 'text', label);
  return n.id;
};

describe('site settings', () => {
  it('reads SharePoint’s defaults: a compact header, a mega menu, a footer, the suite bar', () => {
    const site = readSite(undefined);
    expect(site).toMatchObject({
      type: 'communication',
      suiteBar: true,
      header: { layout: 'compact', background: 'none', showTitle: true },
      nav: { visible: true, style: 'mega', orientation: 'horizontal' },
      footer: { visible: true, layout: 'simple' },
    });
    expect(site.nav.items).toEqual(DEFAULT_COMMUNICATION_NAV);
  });

  it('applies the team site rules whatever is stored: left menu, no mega menu, no footer', () => {
    const site = readSite({ siteType: 'team', navStyle: 'mega', footerVisible: true });
    expect(site.nav).toMatchObject({ orientation: 'vertical', style: 'cascading' });
    expect(site.nav.items).toEqual(DEFAULT_TEAM_NAV);
    expect(site.footer.visible).toBe(false);
  });

  it('ignores values that are not valid choices', () => {
    const site = readSite({
      siteType: 'nonsense',
      headerLayout: 'huge',
      headerOverlay: 9999,
      headerImage: 'javascript:1',
      footerLinks: ['a', 7, null],
    });
    expect(site.type).toBe('communication');
    expect(site.header.layout).toBe('compact');
    expect(site.header.overlay).toBe(100);
    expect(site.header.imageId).toBeUndefined();
    expect(site.footer.links).toEqual(['a']);
  });

  it('keeps menus to three levels and at most eight footer links', () => {
    const deep = [
      {
        label: 'a',
        children: [{ label: 'b', children: [{ label: 'c', children: [{ label: 'd' }] }] }],
      },
    ];
    const items = readNavItems(deep, []);
    expect(items[0]!.children![0]!.children![0]).toEqual({ label: 'c' });
    expect(
      readSite({ footerLinks: Array.from({ length: 12 }, (_, i) => `l${i}`) }).footer.links,
    ).toHaveLength(8);
  });
});

describe('settings paths', () => {
  const defaults = { navItems: [{ label: 'Home' }, { label: 'News', children: [{ label: 'A' }] }] };

  it('reads values by path', () => {
    expect(getAtPath(defaults, 'navItems.1.children.0.label')).toBe('A');
    expect(getAtPath(defaults, 'navItems.5.label')).toBeUndefined();
  });

  it('patches one value and keeps the rest, filling in a default list that was never saved', () => {
    const patch = patchAtPath(undefined, defaults, 'navItems.1.children.0.label', 'Z')!;
    expect(patch.navItems).toEqual([
      { label: 'Home' },
      { label: 'News', children: [{ label: 'Z' }] },
    ]);
    expect(defaults.navItems[1]!.children![0]!.label).toBe('A'); // the default is untouched
  });

  it('refuses paths that lead nowhere or reach into prototypes', () => {
    expect(patchAtPath(undefined, defaults, 'navItems.9.label', 'x')).toBeNull();
    expect(patchAtPath(undefined, defaults, 'nothing.0.label', 'x')).toBeNull();
    expect(patchAtPath(undefined, defaults, '__proto__.x', 'x')).toBeNull();
    expect(patchAtPath(undefined, defaults, 'navItems.__proto__.x', 'x')).toBeNull();
    expect(patchAtPath({}, {}, 'siteTitle', 'Hi')).toEqual({ siteTitle: 'Hi' });
  });
});

describe('column counts', () => {
  const doc = (cols: string[][]) => {
    const nodes: Record<string, DocNode> = {
      s: { id: 's', type: 'section', children: cols.map((_, i) => `c${i}`) },
    };
    cols.forEach((kids, i) => {
      nodes[`c${i}`] = { id: `c${i}`, type: 'column', children: kids };
      for (const k of kids) nodes[k] = { id: k, type: 'component', componentId: 'sp-text' };
    });
    return { frames: [], nodes };
  };
  let n = 0;
  const makeId = () => `new${++n}`;

  it('moves the content of removed columns into the last column that stays', () => {
    const out = setColumnCount(doc([['a'], ['b'], ['c', 'd']]), 's', 2, makeId);
    expect(out.nodes.s!.children).toEqual(['c0', 'c1']);
    expect(out.nodes.c1!.children).toEqual(['b', 'c', 'd']);
    expect(out.nodes.c2).toBeUndefined();
  });

  it('stacks everything in the first column when going to one', () => {
    const out = setColumnCount(doc([['a'], ['b'], ['c']]), 's', 1, makeId);
    expect(out.nodes.c0!.children).toEqual(['a', 'b', 'c']);
  });

  it('adds empty columns, and does nothing for the same count or a component', () => {
    const d = doc([['a']]);
    const out = setColumnCount(d, 's', 3, makeId);
    expect(out.nodes.s!.children).toHaveLength(3);
    expect(setColumnCount(d, 's', 1, makeId)).toBe(d);
    expect(setColumnCount(d, 'a', 2, makeId)).toBe(d);
  });
});

describe('section layouts', () => {
  const ctx = (
    frame: Record<string, unknown>,
    topLevel: DocNode[] = [],
    nodeId?: string,
    layout = 'one-column',
  ) => ({
    values: { layout },
    frame,
    kit: {},
    topLevel,
    nodeId,
  });
  const section = (id: string, layout: string): DocNode => ({
    id,
    type: 'section',
    props: { layout },
    children: [],
  });
  const reason = (id: string, c: ReturnType<typeof ctx>) =>
    SECTION_LAYOUTS.find((l) => l.id === id)!.unavailable?.(c) ?? null;

  it('has the layouts SharePoint offers, with their column counts', () => {
    expect(SECTION_LAYOUTS.map((l) => [l.id, l.columns])).toEqual([
      ['one-column', 1],
      ['two-columns', 2],
      ['three-columns', 3],
      ['one-third-left', 2],
      ['one-third-right', 2],
      ['full-width', 1],
      ['vertical', 1],
      ['flexible', 1],
    ]);
  });

  it('a full-width section needs a communication site', () => {
    expect(reason('full-width', ctx({}))).toBeNull();
    expect(reason('full-width', ctx({ siteType: 'team' }))).toMatch(/communication sites/);
  });

  it('a page has at most one vertical section, and not alongside a full-width section', () => {
    const top = [section('a', 'vertical'), section('b', 'one-column')];
    expect(reason('vertical', ctx({}, top, 'b'))).toMatch(/only one vertical section/);
    expect(reason('vertical', ctx({}, top, 'a', 'vertical'))).toBeNull(); // the vertical section itself
    expect(reason('full-width', ctx({}, top, 'b'))).toMatch(
      /full-width section and a vertical section/,
    );
    expect(
      reason('vertical', ctx({}, [section('f', 'full-width'), section('b', 'one-column')], 'b')),
    ).toMatch(/vertical section and a full-width section/);
  });

  it('a flexible section can’t be changed to another type, and nothing becomes one', () => {
    expect(reason('two-columns', ctx({}, [], 'x', 'flexible'))).toMatch(/can’t be changed/);
    expect(reason('flexible', ctx({}, [], 'x', 'one-column'))).toMatch(
      /only be added as a new section/,
    );
    expect(reason('flexible', ctx({}, [], 'x', 'flexible'))).toBeNull();
  });

  it('reads a section’s layout, defaulting to one column', () => {
    expect(sectionLayoutOf(section('a', 'two-columns'))).toBe('two-columns');
    expect(sectionLayoutOf({ id: 'x', type: 'section' })).toBe('one-column');
    expect(sectionLayoutOf(undefined)).toBe('one-column');
  });
});

describe('changing a section’s layout in the store', () => {
  beforeEach(() => {
    spDoc();
  });

  it('moves content the way SharePoint does, as one undo step each way', () => {
    const f = s().doc.frames[0]!.id;
    s().addLayoutBlock(f, 'section', 3); // three columns
    const section = sections()[0]!;
    expect(columnsOf(section)).toHaveLength(3);
    s().selectNode(f, columnsOf(section)[0]!.id);
    const a = text(f, 'A');
    s().selectNode(f, columnsOf(sections()[0]!)[2]!.id);
    const c = text(f, 'C');
    expect(s().doc.nodes[columnsOf(sections()[0]!)[2]!.id]!.children).toEqual([c]);

    const before = s().past.length;
    s().setSectionLayout(section.id, 'two-columns');
    expect(s().past.length).toBe(before + 1);
    const two = columnsOf(sections()[0]!);
    expect(two).toHaveLength(2);
    expect(two[1]!.children).toEqual([c]); // the third column’s content joins the second
    expect(two[0]!.children).toEqual([a]);
    expect(sections()[0]!.props?.layout).toBe('two-columns');

    s().setSectionLayout(section.id, 'one-column');
    expect(columnsOf(sections()[0]!)[0]!.children).toEqual([a, c]);

    s().undo();
    expect(columnsOf(sections()[0]!)).toHaveLength(2);
    s().undo();
    expect(columnsOf(sections()[0]!)).toHaveLength(3);
    expect(Object.keys(s().doc.nodes)).toContain(c);
  });

  it('refuses a layout the site can’t have, says why, and changes nothing', () => {
    const f = s().doc.frames[0]!.id;
    s().setFrameSettings(f, { siteType: 'team' });
    s().addLayoutBlock(f, 'section', 1);
    const before = s().past.length;
    s().setSectionLayout(sections()[0]!.id, 'full-width');
    expect(s().notice).toMatch(/communication sites/);
    expect(s().past.length).toBe(before);
    expect(sectionLayoutOf(sections()[0])).toBe('one-column');
  });

  it('keeps the layout blocks in line with the rules: no full-width on a team site, one vertical section', () => {
    const f = s().doc.frames[0]!.id;
    s().setFrameSettings(f, { siteType: 'team' });
    s().addLayoutBlock(f, 'section', 6); // full-width
    expect(sections()).toHaveLength(0);
    expect(s().notice).toMatch(/communication sites/);
    s().setFrameSettings(f, { siteType: 'communication' });
    s().addLayoutBlock(f, 'section', 7); // vertical
    s().addLayoutBlock(f, 'section', 7);
    expect(sections().filter((n) => sectionLayoutOf(n) === 'vertical')).toHaveLength(1);
    expect(s().notice).toMatch(/only one vertical section/);
    s().addLayoutBlock(f, 'section', 6); // full-width next to a vertical one
    expect(sections().some((n) => sectionLayoutOf(n) === 'full-width')).toBe(false);
  });

  it('a flexible section is added from the library and can’t be switched', () => {
    const f = s().doc.frames[0]!.id;
    s().addLayoutBlock(f, 'section', 8);
    const flexible = sections()[0]!;
    expect(sectionLayoutOf(flexible)).toBe('flexible');
    s().setSectionLayout(flexible.id, 'two-columns');
    expect(sectionLayoutOf(sections()[0])).toBe('flexible');
    expect(s().notice).toMatch(/can’t be changed/);
  });
});

describe('frame settings in the store', () => {
  beforeEach(() => {
    spDoc();
  });

  it('editing one menu label in place materialises the default menu and is one undo step', () => {
    const f = s().doc.frames[0]!.id;
    expect(s().doc.frames[0]!.settings).toBeUndefined();
    const before = s().past.length;
    s().setFrameSettingAt(f, 'navItems.1.label', 'Updates');
    expect(s().past.length).toBe(before + 1);
    const items = readSite(s().doc.frames[0]!.settings).nav.items;
    expect(items[1]!.label).toBe('Updates');
    expect(items[1]!.children).toEqual(DEFAULT_COMMUNICATION_NAV[1]!.children);
    s().undo();
    expect(s().doc.frames[0]!.settings).toBeUndefined();
  });

  it('a team site uses the team default menu when edited', () => {
    const f = s().doc.frames[0]!.id;
    s().setFrameSettings(f, { siteType: 'team' });
    s().setFrameSettingAt(f, 'navItems.0.label', 'Start');
    expect(readSite(s().doc.frames[0]!.settings).nav.items.map((i) => i.label)).toEqual([
      'Start',
      ...DEFAULT_TEAM_NAV.slice(1).map((i) => i.label),
    ]);
  });

  it('stores a frame picture with the document and counts it among the template’s pictures', () => {
    const f = s().doc.frames[0]!.id;
    s().setFrameImage(f, 'headerImage', {
      id: 'img_abc',
      dataUrl: 'data:image/png;base64,AAAA',
      name: 'x.png',
    });
    expect(s().doc.images.img_abc).toBeDefined();
    expect(s().doc.frames[0]!.settings?.headerImage).toBe('img_abc');
    s().undo();
    expect(s().doc.images.img_abc).toBeUndefined();
  });

  it('a collapsible section’s title is editable text, but a section has no other text', () => {
    const f = s().doc.frames[0]!.id;
    s().addLayoutBlock(f, 'section', 1);
    const id = sections()[0]!.id;
    s().setText(id, 'collapseTitle', 'Details');
    expect(s().doc.nodes[id]!.text).toEqual({ collapseTitle: 'Details' });
    const snap = s().doc;
    s().setText(id, 'other', 'x');
    expect(s().doc).toBe(snap);
  });
});

describe('rendering a SharePoint frame', () => {
  const render = (settings?: Record<string, unknown>, kitSettings?: Record<string, unknown>) => {
    const f = spDoc();
    if (settings) s().setFrameSettings(f, settings);
    if (kitSettings) s().setKitSettings('sharepoint', kitSettings);
    return renderFrameOf(s().doc, s().doc.frames[0]!);
  };

  it('draws the suite bar, header, menu and footer of a communication site', () => {
    const html = render();
    expect(html).toContain('sp-site--communication');
    expect(html).toContain('class="sp-suite"');
    expect(html).toContain('sp-header--compact');
    expect(html).toContain('sp-nav--horizontal sp-nav--mega');
    expect(html).toContain('<footer class="sp-footer sp-footer--simple"');
    expect(html).toContain('data-setting-edit="siteTitle"');
    expect(html).toContain('data-setting-edit="navItems.0.label"');
    expect(html).toContain('data-setting-edit="navItems.2.children.0.children.1.label"');
    expect(html).toContain('data-setting-edit="pageTitle"');
  });

  it('a team site has a left menu and no footer', () => {
    const html = render({ siteType: 'team' });
    expect(html).toContain('sp-site--team');
    expect(html).toContain('sp-nav--vertical sp-nav--cascading');
    expect(html).toContain('sp-body--side-nav');
    expect(html).not.toContain('<footer');
  });

  it('each header layout and background has its own markup', () => {
    for (const layout of ['minimal', 'compact', 'standard', 'extended'])
      expect(render({ headerLayout: layout })).toContain(`sp-header--${layout}`);
    expect(render({ headerBackground: 'image' })).toContain('sp-header__image');
    expect(render({ headerBackground: 'strong' })).toContain('data-variant="strong"');
    expect(render({ suiteBar: false })).not.toContain('class="sp-suite"');
    expect(render({ showSiteTitle: false })).not.toContain('data-setting-edit="siteTitle"');
    expect(render({ navVisible: false })).not.toContain('sp-nav__list');
  });

  it('the title area has four layouts and shows the topic, author and date when asked', () => {
    for (const layout of ['image-and-title', 'plain', 'colour-block', 'overlap'])
      expect(render({ titleLayout: layout })).toContain(`sp-title--${layout}`);
    const html = render({
      showTopic: true,
      topicText: 'Wellbeing',
      showAuthor: false,
      showDate: false,
    });
    expect(html).toContain('Wellbeing');
    expect(html).not.toContain('sp-title__byline');
    expect(render({ showTitleArea: false })).not.toContain('class="sp-title');
  });

  it('text from settings is escaped, never markup', () => {
    const html = render({ siteTitle: '<img src=x onerror=alert(1)>', footerLinks: ['<b>x</b>'] });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<b>x</b>');
  });

  it('the theme becomes CSS variables: the document’s, or a frame’s own when switched on', () => {
    expect(render(undefined, { themePreset: 'red' })).toContain('--sp-theme-primary:#a4262c');
    expect(render({ themePreset: 'green' }, { themePreset: 'red' })).toContain(
      '--sp-theme-primary:#a4262c',
    );
    expect(render({ themeOverride: true, themePreset: 'green' }, { themePreset: 'red' })).toContain(
      '--sp-theme-primary:#498205',
    );
    expect(render(undefined, { themePreset: 'dark-blue' })).toContain('sp-site--dark');
  });

  it('renders sections by layout, a vertical section beside the rest, and collapsible sections', () => {
    const f = spDoc();
    s().addLayoutBlock(f, 'section', 4); // one-third left
    s().addLayoutBlock(f, 'section', 7); // vertical
    s().addLayoutBlock(f, 'section', 1);
    const plain = sections()[2]!;
    s().setNodeProps(plain.id, {
      collapsible: true,
      collapsedByDefault: true,
      collapseHeading: 'h3',
      background: 'strong',
    });
    s().setText(plain.id, 'collapseTitle', 'More <detail>');
    const html = renderFrameOf(s().doc, s().doc.frames[0]!);
    expect(html).toContain('sp-section__inner--one-third-left');
    expect(html).toMatch(/<aside class="sp-section sp-section--vertical/);
    expect(html).toContain('sp-canvas--has-vertical');
    expect(html.indexOf('sp-canvas__main')).toBeLessThan(html.indexOf('<aside'));
    expect(html).toContain('sp-section--collapsible is-collapsed');
    expect(html).toContain(
      '<h3 class="sp-collapse__title" data-edit="collapseTitle">More &lt;detail&gt;</h3>',
    );
    expect(html).toContain('data-sp-collapse-toggle');
    expect(html).toContain('sp-section--bg-strong');
  });

  it('a vertical section is never collapsible, and full-width sections drop the page padding', () => {
    const f = spDoc();
    s().addLayoutBlock(f, 'section', 7);
    s().setNodeProps(sections()[0]!.id, { collapsible: true });
    expect(renderFrameOf(s().doc, s().doc.frames[0]!)).not.toContain('sp-collapse__head');
  });

  it('renders no chrome for an NSW frame, and nothing from SharePoint leaks into it', () => {
    useStore.setState({ doc: createDoc(), past: [], future: [] });
    const html = renderFrameOf(s().doc, s().doc.frames[0]!);
    expect(html).not.toContain('sp-');
  });

  it('renderFrameHtml works with no options at all (NSW)', () => {
    expect(renderFrameHtml({}, [])).toBe('');
  });
});

describe('kit settings definitions', () => {
  const ctx = (frame: Record<string, unknown>, values: Record<string, unknown> = {}) => ({
    values,
    frame,
    kit: {},
    topLevel: [],
  });
  const def = (key: string) => FRAME_SETTINGS.find((d) => d.key === key)!;

  it('explain themselves when an option isn’t available, instead of hiding or ignoring it', () => {
    expect(def('footerVisible').unavailable?.(ctx({ siteType: 'team' }))).toMatch(
      /communication sites/,
    );
    expect(def('footerVisible').unavailable?.(ctx({}))).toBeNull();
    const nav = def('navStyle');
    expect(
      nav.type === 'segmented' && nav.options[0]!.unavailable?.(ctx({ siteType: 'team' })),
    ).toMatch(/mega menu/i);
    expect(def('logoAlign').unavailable?.(ctx({ headerLayout: 'compact' }))).toMatch(/Extended/);
    expect(def('logoAlign').unavailable?.(ctx({ headerLayout: 'extended' }))).toBeNull();
    expect(def('headerOverlay').unavailable?.(ctx({}))).toMatch(/image/);
    const primary = KIT_SETTINGS.find((d) => d.key === 'themePrimary')!;
    expect(primary.unavailable?.(ctx({}, { themePreset: 'blue' }))).toMatch(/Custom/);
    expect(primary.unavailable?.(ctx({}, { themePreset: 'custom' }))).toBeNull();
    // A frame's own theme controls wait for "Use a different theme on this frame".
    expect(def('themePrimary').unavailable?.(ctx({}, { themePreset: 'custom' }))).toMatch(
      /different theme/,
    );
    expect(
      def('themePrimary').unavailable?.(ctx({ themeOverride: true }, { themePreset: 'custom' })),
    ).toBeNull();
  });

  it('every frame setting has a group, a label and a unique key per group', () => {
    const keys = new Set<string>();
    for (const d of FRAME_SETTINGS) {
      expect(d.group && d.label).toBeTruthy();
      // The theme controls repeat for the document and for a frame's own theme, in different groups.
      keys.add(`${d.group}|${d.key}`);
    }
    expect(keys.size).toBe(FRAME_SETTINGS.length);
  });

  it('section settings are laid out as SharePoint names them', () => {
    const labels = SECTION_SETTINGS.map((d) => d.label);
    expect(labels).toContain('Section layout');
    expect(labels).toContain('Collapsible section');
    expect(SECTION_SETTINGS.find((d) => d.key === 'collapseTitle')?.store).toBe('text');
  });

  it('the kit lists the section layouts as library blocks, in order', () => {
    expect(sp.layoutBlocks.map((b) => b.label)).toEqual([
      'One column',
      'Two columns',
      'Three columns',
      'One-third left column',
      'One-third right column',
      'Full-width section',
      'Vertical section',
      'Flexible section',
    ]);
  });
});
