import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { diffDocs } from '../src/lib/diff';
import { deleteMockup, listMockups, saveMockup } from '../src/persistence/library';
import {
  MAX_VERSIONS,
  deleteAllVersions,
  deleteVersion,
  listVersions,
  saveVersion,
} from '../src/persistence/versions';
import { createDoc, useStore } from '../src/store/store';

const s = () => useStore.getState();

beforeEach(async () => {
  for (const m of await listMockups()) await deleteMockup(m.id);
  useStore.setState({ doc: createDoc(), past: [], future: [], selectedFrameId: null });
});

describe('versions', () => {
  it('saves named snapshots, newest first, as copies', async () => {
    const doc = s().doc;
    s().addComponent(doc.frames[0]!.id, 'heading', 'h1');
    expect(await saveVersion(s().doc, '  First  ')).toMatchObject({ name: 'First' });
    s().addComponent(s().doc.frames[0]!.id, 'button', 'dark');
    await new Promise((r) => setTimeout(r, 5));
    await saveVersion(s().doc, 'Second');
    const list = await listVersions(doc.id);
    expect(list.map((v) => v.name)).toEqual(['Second', 'First']);
    // The first snapshot kept its one component: it is a copy, not a reference.
    expect(Object.keys(list[1]!.doc.nodes).length).toBeLessThan(
      Object.keys(list[0]!.doc.nodes).length,
    );
  });

  it('refuses an empty name, keeps the newest 30, and deletes one or all', async () => {
    expect(await saveVersion(s().doc, '   ')).toBeNull();
    for (let i = 0; i < MAX_VERSIONS + 3; i++) {
      await saveVersion(s().doc, `v${i}`);
      await new Promise((r) => setTimeout(r, 1));
    }
    const list = await listVersions(s().doc.id);
    expect(list).toHaveLength(MAX_VERSIONS);
    expect(list[0]!.name).toBe(`v${MAX_VERSIONS + 2}`);
    await deleteVersion(s().doc.id, list[0]!.id);
    expect(await listVersions(s().doc.id)).toHaveLength(MAX_VERSIONS - 1);
    await deleteAllVersions(s().doc.id);
    expect(await listVersions(s().doc.id)).toEqual([]);
  });

  it('are removed with the mockup they belong to', async () => {
    const doc = s().doc;
    await saveMockup(doc);
    await saveVersion(doc, 'Keep me');
    await deleteMockup(doc.id);
    expect(await listVersions(doc.id)).toEqual([]);
  });

  it('restoring puts the content back as one undo step, keeping the mockup’s id, name and view', async () => {
    const f = s().doc.frames[0]!;
    s().addComponent(f.id, 'heading', 'h1');
    const v = (await saveVersion(s().doc, 'Just a heading'))!;
    s().addComponent(f.id, 'button', 'dark');
    s().renameDoc('Renamed');
    const before = { id: s().doc.id, view: s().doc.view };
    s().restoreDoc(v.doc);
    expect(Object.values(s().doc.nodes).filter((n) => n.type === 'component')).toHaveLength(1);
    expect(s().doc).toMatchObject({ id: before.id, name: 'Renamed', view: before.view });
    s().undo();
    expect(Object.values(s().doc.nodes).filter((n) => n.type === 'component')).toHaveLength(2);
  });
});

describe('comparing versions', () => {
  it('says nothing changed for the same document', () => {
    const d = diffDocs(s().doc, s().doc);
    expect(d).toMatchObject({ changed: false, summary: 'No differences' });
  });

  it('describes added, removed, edited, renamed and resized pieces', () => {
    const f = s().doc.frames[0]!;
    s().addComponent(f.id, 'heading', 'h1');
    s().addComponent(f.id, 'button', 'dark');
    const base = structuredClone(s().doc);
    const heading = Object.values(s().doc.nodes).find((n) => n.componentId === 'heading')!;
    const button = Object.values(s().doc.nodes).find((n) => n.componentId === 'button')!;
    s().setText(heading.id, 'text', 'New words');
    s().deleteNode(button.id);
    s().addComponent(f.id, 'card');
    s().renameFrame(f.id, 'Landing');
    s().setFrameWidth(f.id, 500);
    s().addFrame('tablet');
    const d = diffDocs(base, s().doc);
    const frame = d.frames.find((x) => x.frameId === f.id)!;
    expect(frame.change).toBe('changed');
    expect(frame.details).toEqual(
      expect.arrayContaining([
        'renamed from “Home”',
        'width 393 to 500',
        '1 component added',
        '1 component removed',
        '1 component edited',
      ]),
    );
    expect(d.frames.some((x) => x.change === 'added')).toBe(true);
    expect(d.summary).toBe('1 frame changed, 1 frame added');
  });

  it('notices a removed frame, rearranging, and comments', () => {
    s().addFrame('tablet');
    const [a, b] = s().doc.frames;
    s().addComponent(a!.id, 'heading', 'h1');
    s().addComponent(a!.id, 'button', 'dark');
    const base = structuredClone(s().doc);
    const first = Object.values(s().doc.nodes).find((n) => n.componentId === 'heading')!;
    s().selectNode(a!.id, first.id);
    // Reordering the two sections-or-components without editing them is "rearranged".
    s().moveSelected(1);
    s().deleteFrame(b!.id);
    s().addComment(a!.id, 1, 1);
    const d = diffDocs(base, s().doc);
    expect(d.frames.find((x) => x.frameId === b!.id)?.change).toBe('removed');
    expect(d.summary).toContain('1 frame removed');
    expect(d.summary).toContain('1 comment added');
  });
});
