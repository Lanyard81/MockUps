import { beforeEach, describe, expect, it } from 'vitest';
import { getComponent, getVariant } from '../src/catalogue';
import { getKit } from '../src/kits';
import { buildSharePointNotes } from '../src/kits/sharepoint/buildNotes';
import {
  DEFAULT_CHART,
  MAX_CHART_POINTS,
  columnChart,
  pieChart,
  readChart,
} from '../src/kits/sharepoint/charts';
import { SP_TEMPLATES } from '../src/kits/sharepoint/templates';
import { describeVariant, optionsForVariant, renderComponent } from '../src/layout/component';
import { renderFrameOf } from '../src/layout/render';
import { createDoc, useStore } from '../src/store/store';
import type { DocNode } from '../src/store/types';
import { instantiateOfficial } from '../src/templates';

const s = () => useStore.getState();
const sp = getKit('sharepoint');
const tools = { getComponent, getVariant, describeVariant, optionsForVariant };
const node = (
  componentId: string,
  variant: string,
  props: Record<string, unknown> = {},
): DocNode => ({
  id: `n_${componentId}`,
  type: 'component',
  componentId,
  variant,
  props,
});

const STATIC_PARTS = [
  'sp-quick-chart',
  'sp-weather',
  'sp-world-clock',
  'sp-sites',
  'sp-recent-documents',
  'sp-site-activity',
  'sp-saved-for-later',
  'sp-group-calendar',
  'sp-org-chart',
  'sp-markdown',
  'sp-code-snippet',
  'sp-embed',
  'sp-youtube',
  'sp-file-media',
  'sp-forms',
  'sp-power-bi',
  'sp-power-apps',
  'sp-maps',
  'sp-planner',
  'sp-conversations',
  'sp-highlights',
  'sp-agent-link',
];

describe('the rest of the out-of-the-box web parts', () => {
  it('are all in the catalogue, and the ones that need live data say they are previews', () => {
    const ids = sp.catalogue.components.map((c) => c.id);
    for (const id of STATIC_PARTS) expect(ids).toContain(id);
    for (const id of STATIC_PARTS.filter(
      (i) => i !== 'sp-quick-chart' && i !== 'sp-code-snippet',
    )) {
      const c = getComponent(id)!;
      if (['sp-markdown'].includes(id)) continue;
      expect(['static', 'full']).toContain(c.fidelity);
    }
    expect(getComponent('sp-weather')!.fidelity).toBe('static');
    expect(getComponent('sp-weather')!.note).toMatch(/static preview/i);
  });

  it('leaves out the retired and niche ones', () => {
    const names = sp.catalogue.components.map((c) => c.name.toLowerCase()).join('|');
    for (const gone of ['my feed', 'stream', 'kindle', 'assignments', 'connectors'])
      expect(names).not.toContain(gone);
  });

  it('every one renders, is editable, and has no empty icons or scripts', () => {
    for (const id of STATIC_PARTS) {
      const c = getComponent(id)!;
      expect(c.editable.length, id).toBeGreaterThan(0);
      for (const v of c.variants) {
        const out = renderComponent(node(id, v.id), {});
        expect(out).not.toMatch(/<script|onerror/i);
        for (const m of out.matchAll(/<svg class="sp-icon[^>]*>(.*?)<\/svg>/g))
          expect(m[1], `${id} icon`).not.toBe('');
      }
    }
  });
});

describe('quick chart', () => {
  it('draws columns scaled to the data, with values and labels', () => {
    const svg = columnChart({ labels: ['A', 'B'], values: [10, 20] });
    expect((svg.match(/<rect/g) ?? []).length).toBe(2);
    const heights = [...svg.matchAll(/height="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(heights[1]).toBeCloseTo(heights[0]! * 2, 1);
    expect(svg).toContain('>A</text>');
    expect(svg).toContain('>20</text>');
  });

  it('draws a pie with a slice and a legend entry per value, and a whole circle for one value', () => {
    const pie = pieChart({ labels: ['A', 'B', 'C'], values: [1, 1, 2] });
    expect((pie.match(/<path/g) ?? []).length).toBe(3);
    expect((pie.match(/<li>/g) ?? []).length).toBe(3);
    expect(pieChart({ labels: ['Only'], values: [5] })).toContain('<circle');
  });

  it('cleans bad data: at most eight points, no negatives or non-numbers, labels as text', () => {
    expect(readChart(undefined)).toEqual(DEFAULT_CHART);
    const data = readChart({
      labels: Array.from({ length: 20 }, (_, i) => (i === 0 ? '<b>x</b>'.repeat(10) : `L${i}`)),
      values: [5, -3, 'x', null, 7],
    });
    expect(data.labels).toHaveLength(MAX_CHART_POINTS);
    expect(data.values.slice(0, 5)).toEqual([5, 0, 0, 0, 7]);
    expect(data.labels[0]!.length).toBeLessThanOrEqual(24);
    expect(columnChart(readChart({ labels: ['<img onerror=x>'], values: [1] }))).not.toContain(
      '<img',
    );
  });

  it('is drawn from the numbers in the node, in both chart types', () => {
    const data = { labels: ['Red', 'Blue', 'Green'], values: [3, 9, 6] };
    const col = renderComponent(node('sp-quick-chart', 'column', { chart: data }), {});
    expect(col).toContain('>Blue</text>');
    expect((col.match(/<rect/g) ?? []).length).toBe(3);
    const pie = renderComponent(node('sp-quick-chart', 'pie', { chart: data }), {});
    expect((pie.match(/<path/g) ?? []).length).toBe(3);
  });

  it('is edited through the store as one undo step', () => {
    useStore.setState({ doc: createDoc('sharepoint'), past: [], future: [] });
    const f = s().doc.frames[0]!.id;
    s().addComponent(f, 'sp-quick-chart', 'column');
    const chart = Object.values(s().doc.nodes).find((n) => n.componentId === 'sp-quick-chart')!;
    const before = s().past.length;
    s().setNodeProps(chart.id, { chart: { labels: ['X'], values: [1] } });
    expect(s().past.length).toBe(before + 1);
    s().undo();
    expect(s().doc.nodes[chart.id]!.props?.chart).toBeUndefined();
  });
});

describe('SharePoint templates', () => {
  it('are the seven in the brief, in two groups', () => {
    expect(SP_TEMPLATES.map((t) => t.name)).toEqual([
      'Communication site: Topic',
      'Communication site: Showcase',
      'Communication site: Blank',
      'Team site: Home page',
      'Intranet home page',
      'News article',
      'Department landing page',
    ]);
    expect(new Set(SP_TEMPLATES.map((t) => t.group))).toEqual(new Set(sp.templateGroups));
  });

  it('set the site up (type, header, title area) and build sections in the SharePoint tree', () => {
    const team = instantiateOfficial(SP_TEMPLATES.find((t) => t.id === 'sp-team-home')!);
    expect(team.settings?.siteType).toBe('team');
    const intranet = instantiateOfficial(SP_TEMPLATES.find((t) => t.id === 'sp-intranet-home')!);
    const sections = intranet.root.map((id) => intranet.nodes[id]!);
    expect(sections.map((x) => x.props?.layout)).toContain('vertical');
    expect(sections.filter((x) => x.props?.layout === 'vertical')).toHaveLength(1);
    // The rule: a page never has a full-width section next to a vertical one.
    expect(sections.some((x) => x.props?.layout === 'full-width')).toBe(false);
    for (const t of SP_TEMPLATES) {
      const inst = instantiateOfficial(t);
      const layouts = inst.root.map((id) => inst.nodes[id]!.props?.layout);
      if (layouts.includes('vertical')) expect(layouts).not.toContain('full-width');
      if (inst.settings?.siteType === 'team') expect(layouts).not.toContain('full-width');
    }
  });

  it('render as pages with their chrome, and become frames in a document', () => {
    useStore.setState({ doc: createDoc(), past: [], future: [] });
    for (const t of SP_TEMPLATES) {
      const id = s().addFrameFromTemplate(instantiateOfficial(t));
      const frame = s().doc.frames.find((f) => f.id === id)!;
      expect(frame.kitId).toBe('sharepoint');
      const html = renderFrameOf(s().doc, frame);
      expect(html).toContain('sp-site');
      expect(html).not.toContain('Unknown component');
    }
    expect(s().doc.kitVersions.sharepoint).toBeTruthy();
  });
});

describe('SharePoint build notes', () => {
  let doc = createDoc();
  beforeEach(() => {
    useStore.setState({ doc: createDoc('sharepoint'), past: [], future: [] });
    const f = s().doc.frames[0]!.id;
    s().setFrameSettings(f, {
      siteType: 'team',
      siteTitle: 'Project team',
      headerLayout: 'standard',
    });
    s().setKitSettings('sharepoint', { themePreset: 'teal' });
    s().addLayoutBlock(f, 'section', 2);
    const section = Object.values(s().doc.nodes).find((n) => n.type === 'section')!;
    s().setNodeProps(section.id, { background: 'soft', collapsible: true });
    s().setText(section.id, 'collapseTitle', 'Latest');
    s().selectNode(f, section.children![1]!);
    s().addComponent(f, 'sp-news', 'tiles');
    const news = Object.values(s().doc.nodes).find((n) => n.componentId === 'sp-news')!;
    s().setNodeProps(news.id, { hiddenParts: ['titleRow'], compact: true });
    s().setText(news.id, 'title1', 'Big announcement');
    doc = s().doc;
  });
  const notes = () => buildSharePointNotes(doc, doc.frames[0]!, tools);

  it('start with the site settings, in SharePoint’s own words', () => {
    const text = notes();
    expect(text).toMatch(/^# Home: SharePoint build notes/);
    expect(text).toContain('Site type: Team site');
    expect(text).toContain('Theme: Teal');
    expect(text).toContain('Header: layout Standard');
    expect(text).toContain('left-hand menu, cascading');
    expect(text).not.toContain('Footer'); // team sites have none
    expect(text.indexOf('## Site settings')).toBeLessThan(text.indexOf('## Page content'));
  });

  it('then list each section with its layout, background and options, and each web part in order', () => {
    const text = notes();
    expect(text).toContain('### Section 1: Two columns');
    expect(text).toContain('Background: Soft');
    expect(text).toMatch(/Collapsible section: on; title “Latest”/);
    expect(text).toContain('**Column 2**');
    expect(text).toContain('1. **News** web part, layout: Tiles');
    expect(text).toContain('Compact view: on');
    expect(text).toContain('Hide: title and commands');
    expect(text).toContain('“Big announcement”');
  });

  it('is stable text with no editor markers or HTML', () => {
    const text = notes();
    expect(text).not.toMatch(/data-|<div|<span|undefined|\[object/);
    expect(notes()).toBe(text);
  });

  it('says a static preview is one, and a communication site has a footer line', () => {
    useStore.setState({ doc: createDoc('sharepoint'), past: [], future: [] });
    const f = s().doc.frames[0]!.id;
    s().addComponent(f, 'sp-weather', 'forecast');
    const text = buildSharePointNotes(s().doc, s().doc.frames[0]!, tools);
    expect(text).toContain('Note: A static preview.');
    expect(text).toContain('Footer: Simple layout');
  });

  it('is offered by the kit, and NSW frames have none', () => {
    expect(sp.buildNotes?.label).toBe('SharePoint build notes');
    expect(getKit('nsw').buildNotes).toBeUndefined();
  });
});
