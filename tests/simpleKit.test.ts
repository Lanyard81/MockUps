import { describe, expect, it } from 'vitest';
import { getKit } from '../src/kits';
import { renderComponent } from '../src/layout/component';
import { renderFrameHtml } from '../src/layout/render';
import { createDoc, useStore } from '../src/store/store';
import { accentText, contrast, inkFor } from '../src/kits/simple/render';

const simple = getKit('simple');

describe('Simple kit', () => {
  it('is registered alongside the others', () => {
    expect(simple.id).toBe('simple');
    expect(simple.catalogue.components.length).toBeGreaterThan(30);
    expect(simple.categories).toContain(simple.layoutCategory);
  });

  it('draws every variant of every component, using only its own markup', () => {
    for (const c of simple.catalogue.components)
      for (const v of c.variants) {
        const out = renderComponent(
          { id: 'n1', type: 'component', componentId: c.id, variant: v.id, props: {} },
          {},
        );
        expect(out, `${c.id}/${v.id}`).toContain('sk-');
        expect(out, `${c.id}/${v.id}`).not.toMatch(/\bnsw-|\bsp-/);
      }
  });

  it('builds every template into a frame that renders', () => {
    let n = 0;
    const makeId = (p: string) => `${p}${++n}`;
    expect(simple.templates.length).toBeGreaterThanOrEqual(5);
    for (const t of simple.templates) {
      const built = t.build(makeId);
      const html = renderFrameHtml(built.nodes, built.root, {}, { kitId: 'simple' });
      expect(html, t.id).toContain('sk-page');
    }
  });

  it('puts the chosen accent on the page, and ignores anything that is not a hex colour', () => {
    useStore.setState({ doc: createDoc('simple'), past: [], future: [] });
    const doc = useStore.getState().doc;
    const ok = renderFrameHtml(
      doc.nodes,
      doc.frames[0]!.root,
      {},
      {
        kitId: 'simple',
        kitSettings: { accent: '#7c3aed' },
      },
    );
    expect(ok).toContain('--sk-accent:#7c3aed');
    const bad = renderFrameHtml(
      doc.nodes,
      doc.frames[0]!.root,
      {},
      {
        kitId: 'simple',
        kitSettings: { accent: 'red;background:url(x)' },
      },
    );
    expect(bad).toContain('--sk-accent:#2563eb');
  });

  it('picks readable text for light and dark accents', () => {
    expect(inkFor('#2563eb')).toBe('#ffffff');
    expect(inkFor('#facc15')).toBe('#0b0f19');
  });

  it('adds components to a Simple frame through the store, with sections and columns', () => {
    useStore.setState({ doc: createDoc('simple'), past: [], future: [] });
    const f = useStore.getState().doc.frames[0]!.id;
    useStore.getState().addComponent(f, 'sk-card', 'image');
    const doc = useStore.getState().doc;
    const types = Object.values(doc.nodes).map((n) => n.type);
    expect(types).toContain('section');
    expect(types).toContain('column');
    expect(types).toContain('component');
    expect(doc.frames[0]!.kitId).toBe('simple');
  });

  it('keeps button text and accent text readable (4.5:1) for every accent on offer', () => {
    const accents = ['#2563eb', '#7c3aed', '#0d9488', '#16a34a', '#ea580c', '#dc2626', '#111827'];
    for (const a of accents) {
      expect(contrast(inkFor(a), a), `button text on ${a}`).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(accentText(a), '#ffffff'),
        `accent text on white for ${a}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
