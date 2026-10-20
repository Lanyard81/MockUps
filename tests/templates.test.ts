import { beforeEach, describe, expect, it } from 'vitest';
import { getComponent } from '../src/catalogue';
import { renderFrameHtml } from '../src/layout/render';
import { cleanTree, parseMockupFile, serialiseMockupFile } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';
import { SAMPLES, buildSample } from '../src/kits/nsw/samples';
import {
  OFFICIAL_TEMPLATES,
  templateGroups,
  getOfficialTemplate,
  instantiateOfficial,
  instantiateSaved,
} from '../src/templates';

const s = () => useStore.getState();

describe('official templates', () => {
  it('has all 22 NSW and 7 SharePoint templates, in known groups, with unique ids', () => {
    expect(OFFICIAL_TEMPLATES.filter((t) => t.kitId === 'nsw')).toHaveLength(22);
    expect(OFFICIAL_TEMPLATES.filter((t) => t.kitId === 'sharepoint')).toHaveLength(7);
    expect(new Set(OFFICIAL_TEMPLATES.map((t) => t.id)).size).toBe(OFFICIAL_TEMPLATES.length);
    for (const t of OFFICIAL_TEMPLATES) expect(templateGroups(t.kitId)).toContain(t.group);
  });

  for (const def of OFFICIAL_TEMPLATES) {
    it(`${def.id} builds a valid tree of real components`, () => {
      const t = instantiateOfficial(def);
      expect(t.root.length).toBeGreaterThan(0);
      expect(() => cleanTree(t.nodes, [t.root], [t.kitId])).not.toThrow();
      for (const n of Object.values(t.nodes)) {
        if (n.type !== 'component') continue;
        const comp = getComponent(n.componentId!);
        expect(comp, `${def.id}: ${n.componentId}`).toBeDefined();
        const variant = comp!.variants.find((v) => v.id === (n.variant ?? comp!.defaultVariant));
        expect(variant, `${def.id}: ${n.componentId}/${n.variant}`).toBeDefined();
        for (const key of Object.keys(n.text ?? {}))
          expect(variant!.html, `${def.id}: text ${key}`).toContain(`data-edit="${key}"`);
      }
      expect(renderFrameHtml(t.nodes, t.root)).not.toContain('Unknown component');
    });
  }
});

describe('template store actions', () => {
  beforeEach(() => useStore.setState({ doc: createDoc(), past: [], future: [] }));

  it('adds a frame from a template as one undo step', () => {
    const before = s().past.length;
    const id = s().addFrameFromTemplate(instantiateOfficial(getOfficialTemplate('content-form')!));
    expect(s().past.length).toBe(before + 1);
    expect(s().doc.frames.find((f) => f.id === id)!.root.length).toBeGreaterThan(0);
    s().undo();
    expect(s().doc.frames.find((f) => f.id === id)).toBeUndefined();
  });

  it('replaces a frame’s content, removes the old nodes, and undoes in one step', () => {
    const frameId = s().doc.frames[0]!.id;
    s().addComponent(frameId, 'heading', 'h1');
    const oldIds = Object.keys(s().doc.nodes);
    const before = s().past.length;
    s().replaceFrameWithTemplate(
      frameId,
      instantiateOfficial(getOfficialTemplate('search-simple')!),
    );
    expect(s().past.length).toBe(before + 1);
    for (const id of oldIds) expect(s().doc.nodes[id]).toBeUndefined();
    s().undo();
    for (const id of oldIds) expect(s().doc.nodes[id]).toBeDefined();
  });

  it('copies saved templates with fresh ids', () => {
    const t = instantiateOfficial(getOfficialTemplate('content-article')!);
    const saved = { ...t, id: 't1', createdAt: 0 };
    const a = instantiateSaved(saved as never);
    const b = instantiateSaved(saved as never);
    expect(Object.keys(a.nodes).some((k) => k in b.nodes)).toBe(false);
  });
});

describe('samples', () => {
  for (const def of SAMPLES) {
    it(`${def.id} is a valid file and its links point at real frames`, () => {
      const doc = buildSample(def);
      const parsed = parseMockupFile(serialiseMockupFile(doc)).doc;
      const frameIds = new Set(parsed.frames.map((f) => f.id));
      const gotos = Object.values(parsed.nodes).flatMap((n) =>
        typeof n.props?.goto === 'string' ? [n.props.goto] : [],
      );
      for (const g of gotos) expect(frameIds.has(g)).toBe(true);
    });
  }
});
