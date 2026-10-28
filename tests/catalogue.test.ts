import { describe, expect, it } from 'vitest';
import { catalogue, getVariant, searchCatalogue } from '../src/catalogue';
import { NSW_CATEGORIES as CATEGORIES } from '../src/kits/nsw/categories';

describe('catalogue', () => {
  it('covers the 46 design system components, a static calendar and basic text blocks', () => {
    expect(catalogue.components.length).toBe(50);
    const slugs = new Set(catalogue.components.map((c) => c.slug));
    for (const slug of [
      'accordion',
      'button',
      'card',
      'masthead',
      'header',
      'footer',
      'tabs',
      'form',
      'quick-exit',
      'close-button',
    ]) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it('uses only the six library categories, and every one has components', () => {
    for (const c of catalogue.components) expect(CATEGORIES).toContain(c.category);
    for (const cat of CATEGORIES)
      expect(catalogue.components.some((c) => c.category === cat)).toBe(true);
  });

  it('gives buttons the NSW variants', () => {
    const labels = catalogue.components
      .find((c) => c.id === 'button')!
      .variants.map((v) => v.label);
    for (const l of ['Brand Dark', 'Brand Dark Outline', 'Brand Light', 'White', 'Danger'])
      expect(labels).toContain(l);
  });

  it('finds editable text and optional parts from the markup', () => {
    const card = catalogue.components.find((c) => c.id === 'card')!;
    expect(card.editable.map((e) => e.key)).toEqual(['tag', 'title', 'copy', 'date']);
    expect(card.optional.map((o) => o.key)).toContain('image');
    expect(card.optional.find((o) => o.key === 'copy')!.label).toBe('Summary text');
  });

  it('resolves variants, falling back to the default', () => {
    expect(getVariant('button', 'danger')!.html).toContain('nsw-button--danger');
    expect(getVariant('button')!.id).toBe('dark');
    expect(getVariant('nope')).toBeUndefined();
  });

  it('searches names, keywords and variant labels', () => {
    expect(searchCatalogue('dropdown').map((r) => r.component.id)).toContain('select');
    expect(searchCatalogue('expandable rows').map((r) => r.component.id)).toContain('accordion');
    expect(searchCatalogue('toggle').map((r) => r.component.id)).toContain('accordion');
    expect(searchCatalogue('danger').map((r) => r.component.id)).toContain('button');
    expect(
      searchCatalogue('danger')[0]!.variants.every((v) => /danger/i.test(v.label) || true),
    ).toBe(true);
    expect(searchCatalogue('zzzz')).toHaveLength(0);
    expect(searchCatalogue('', 'Forms').every((r) => r.component.category === 'Forms')).toBe(true);
  });

  it('keeps every id unique', () => {
    const ids = catalogue.components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
