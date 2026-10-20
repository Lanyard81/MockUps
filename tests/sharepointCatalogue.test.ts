import { describe, expect, it } from 'vitest';
import { getKit } from '../src/kits';
import { SP_ICON_PATHS } from '../src/kits/sharepoint/icons.generated';
import { SP_ICON_NAMES } from '../src/kits/sharepoint/icons';
import { optionsForVariant, renderComponent } from '../src/layout/component';
import { renderFrameHtml } from '../src/layout/render';
import { createDoc, useStore } from '../src/store/store';
import type { DocNode } from '../src/store/types';

const sp = getKit('sharepoint');
const comps = sp.catalogue.components;
const ids = comps.map((c) => c.id);
const node = (
  componentId: string,
  variant: string,
  props: Record<string, unknown> = {},
): DocNode => ({
  id: `n_${componentId}_${variant}`,
  type: 'component',
  componentId,
  variant,
  props,
});
const html = (n: DocNode) => renderComponent(n, {});

describe('SharePoint catalogue', () => {
  it('has the core web parts from the brief', () => {
    for (const id of [
      'sp-text',
      'sp-image',
      'sp-image-gallery',
      'sp-button',
      'sp-cta',
      'sp-link',
      'sp-divider',
      'sp-spacer',
      'sp-hero',
      'sp-quick-links',
      'sp-news',
      'sp-events',
      'sp-highlighted-content',
      'sp-people',
      'sp-document-library',
      'sp-list',
      'sp-countdown',
      'sp-page-properties',
    ])
      expect(ids).toContain(id);
  });

  it('offers the layouts SharePoint lists for each web part', () => {
    const variants = (id: string) => comps.find((c) => c.id === id)!.variants.map((v) => v.label);
    expect(variants('sp-quick-links')).toEqual([
      'Compact',
      'Filmstrip',
      'Grid',
      'Button',
      'List',
      'Tiles',
    ]);
    expect(variants('sp-news')).toEqual([
      'Top story',
      'List',
      'Side-by-side',
      'Hub news',
      'Carousel',
      'Tiles',
      'Filmstrip',
    ]);
    expect(variants('sp-image-gallery')).toEqual(['Brick', 'Grid', 'Carousel']);
    expect(variants('sp-hero')).toEqual(['Tiles', 'Layers']);
    expect(variants('sp-events')).toEqual(['Compact', 'Filmstrip']);
    expect(variants('sp-highlighted-content')).toEqual(['Cards', 'List', 'Carousel', 'Filmstrip']);
    expect(variants('sp-people')).toEqual(['Compact', 'Descriptive']);
    expect(variants('sp-text')).toEqual(
      expect.arrayContaining([
        'Paragraph',
        'Heading 1',
        'Heading 4',
        'Pull quote',
        'Bulleted list',
        'Numbered list',
        'Table',
      ]),
    );
  });

  it('every variant renders sample content, with nothing unsafe and no empty icons', () => {
    for (const c of comps)
      for (const v of c.variants) {
        const out = html(node(c.id, v.id));
        expect(out, `${c.id}/${v.id}`).toContain('<');
        expect(out).not.toMatch(/<script|onerror|javascript:/i);
        expect(out).not.toContain('Unknown component');
        for (const m of out.matchAll(/<svg class="sp-icon[^>]*>(.*?)<\/svg>/g))
          expect(m[1], `${c.id}/${v.id} has an empty icon`).not.toBe('');
      }
  });

  it('every web part has editable text, and every editable key is in the markup', () => {
    for (const c of comps) {
      if (['sp-divider', 'sp-spacer'].includes(c.id)) continue;
      expect(c.editable.length, c.id).toBeGreaterThan(0);
      const def = c.variants.find((v) => v.id === c.defaultVariant)!.html;
      for (const e of c.editable) expect(def).toContain(`data-edit="${e.key}"`);
    }
  });

  it('titled web parts can hide the title and “See all”, as SharePoint’s “Show title and commands” does', () => {
    for (const id of ['sp-news', 'sp-events', 'sp-highlighted-content', 'sp-people']) {
      const c = comps.find((x) => x.id === id)!;
      const keys = c.optional.map((o) => o.key);
      expect(keys, id).toEqual(expect.arrayContaining(['titleRow', 'seeAll']));
      const hidden = html(node(id, c.defaultVariant, { hiddenParts: ['titleRow'] }));
      expect(hidden).not.toContain('sp-wp__head');
    }
    expect(
      comps.find((c) => c.id === 'sp-news')!.optional.find((o) => o.key === 'titleRow')!.label,
    ).toBe('Show title and commands');
  });

  it('items can be shown or hidden to set how many there are (hero 1 to 5, news stories, links)', () => {
    const hero = html(node('sp-hero', 'tiles', { hiddenParts: ['item3', 'item4', 'item5'] }));
    expect((hero.match(/sp-hero__tile/g) ?? []).length).toBe(2);
    expect((html(node('sp-hero', 'tiles')).match(/sp-hero__tile/g) ?? []).length).toBe(5);
    const links = html(
      node('sp-quick-links', 'compact', { hiddenParts: ['item4', 'item5', 'item6'] }),
    );
    expect((links.match(/sp-ql__item/g) ?? []).length).toBe(3);
  });

  it('carousels and filmstrips carry the hooks the Preview script uses', () => {
    for (const [id, variant] of [
      ['sp-news', 'carousel'],
      ['sp-image-gallery', 'carousel'],
      ['sp-highlighted-content', 'carousel'],
    ] as const) {
      const out = html(node(id, variant));
      expect(out).toContain('data-sp-carousel');
      expect(out).toContain('data-sp-next');
      expect((out.match(/sp-carousel__slide/g) ?? []).length).toBeGreaterThan(1);
    }
    for (const [id, variant] of [
      ['sp-news', 'filmstrip'],
      ['sp-quick-links', 'filmstrip'],
      ['sp-events', 'filmstrip'],
      ['sp-highlighted-content', 'filmstrip'],
    ] as const) {
      const out = html(node(id, variant));
      expect(out).toContain('data-sp-strip');
      expect(out).toContain('sp-strip__track');
    }
  });

  it('web parts that show live SharePoint data say they are static previews', () => {
    for (const id of [
      'sp-events',
      'sp-highlighted-content',
      'sp-document-library',
      'sp-list',
      'sp-countdown',
    ])
      expect(comps.find((c) => c.id === id)!.fidelity).toBe('static');
  });
});

describe('SharePoint web part options', () => {
  it('a choice adds its class and removes the others’', () => {
    const base = html(node('sp-image', 'image'));
    expect(base).toContain('sp-ratio-16x9');
    const square = html(node('sp-image', 'image', { ratio: '1x1' }));
    expect(square).toContain('sp-ratio-1x1');
    expect(square).not.toContain('sp-ratio-16x9');
    const centred = html(node('sp-text', 'paragraph', { align: 'center' }));
    expect(centred).toContain('sp-text sp-align-center');
    expect(html(node('sp-text', 'paragraph', { align: 'left' }))).not.toContain('sp-align');
  });

  it('toggles add theme colour and highlight to text', () => {
    const out = html(node('sp-text', 'paragraph', { accent: true, highlight: true }));
    expect(out).toContain('sp-text--accent');
    expect(out).toContain('sp-text--highlight');
  });

  it('a table style applies to tables only', () => {
    expect(html(node('sp-text', 'table', { tableStyle: 'striped' }))).toContain(
      'sp-table sp-table--striped',
    );
    expect(html(node('sp-text', 'paragraph', { tableStyle: 'striped' }))).not.toContain('striped');
  });

  it('a quick link’s icon can be any bundled Fluent icon, and an unknown one is ignored', () => {
    const base = html(node('sp-quick-links', 'compact'));
    const changed = html(node('sp-quick-links', 'compact', { icon1: 'rocket' }));
    expect(changed).toContain(SP_ICON_PATHS.rocket!.slice(0, 40));
    expect(changed).not.toBe(base);
    expect(html(node('sp-quick-links', 'compact', { icon1: 'not_an_icon' }))).toContain(
      'sp-ql__icon',
    );
    expect(html(node('sp-quick-links', 'compact', { icon1: '<img onerror=x>' }))).not.toContain(
      'onerror',
    );
  });

  it('compact view hides story pictures and summaries by class', () => {
    expect(html(node('sp-news', 'top-story', { compact: true }))).toContain(
      'sp-news sp-news--top sp-news--compact',
    );
  });

  it('only shows the options that do something in the chosen variant', () => {
    const text = comps.find((c) => c.id === 'sp-text')!;
    const keysFor = (variant: string) =>
      optionsForVariant(text.variants.find((v) => v.id === variant)!.html, text.options).map(
        (o) => o.key,
      );
    expect(keysFor('paragraph')).toEqual(['align', 'accent', 'highlight']);
    expect(keysFor('table')).toContain('tableStyle');
    const quick = comps.find((c) => c.id === 'sp-quick-links')!;
    const grid = optionsForVariant(
      quick.variants.find((v) => v.id === 'grid')!.html,
      quick.options,
    );
    expect(grid.some((o) => o.key === 'icon1')).toBe(false); // the grid shows pictures, not icons
  });

  it('a link or button can go to another frame (click-through) like NSW links', () => {
    const out = html(node('sp-button', 'primary', { href: 'https://example.com' }));
    expect(out).toContain('href="https://example.com"');
    const goto = html(node('sp-button', 'primary', { goto: 'f_2' }));
    expect(goto).toContain('data-goto="f_2"');
  });

  it('icons: a curated Fluent set, listed by name', () => {
    expect(SP_ICON_NAMES.length).toBeGreaterThan(150);
    expect(SP_ICON_NAMES).toEqual([...SP_ICON_NAMES].sort());
    for (const name of SP_ICON_NAMES) expect(SP_ICON_PATHS[name]).toMatch(/<path/);
    expect(sp.icons?.names).toBe(SP_ICON_NAMES);
  });
});

describe('web parts in a SharePoint page', () => {
  it('sit in a section column, and picture uploads replace the generated picture', () => {
    useStore.setState({ doc: createDoc('sharepoint'), past: [], future: [] });
    const f = useStore.getState().doc.frames[0]!.id;
    useStore.getState().addComponent(f, 'sp-image', 'image');
    const image = Object.values(useStore.getState().doc.nodes).find(
      (n) => n.componentId === 'sp-image',
    )!;
    useStore.getState().setImage(image.id, 'image', {
      id: 'img_zzz',
      dataUrl: 'data:image/png;base64,AAAA',
      name: 'a.png',
    });
    const doc = useStore.getState().doc;
    const out = renderFrameHtml(doc.nodes, doc.frames[0]!.root, doc.images, {
      kitId: 'sharepoint',
    });
    expect(out).toContain('data:image/png;base64,AAAA');
    expect(out).toContain('sp-column');
  });
});
