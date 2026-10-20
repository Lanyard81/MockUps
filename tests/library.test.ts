import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteMockup,
  duplicateMockup,
  lastMockupId,
  listMockups,
  loadMockup,
  renameMockup,
  saveMockup,
  setMockupThumbnail,
} from '../src/persistence/library';
import { probeStorage, safeGet, safeSet } from '../src/persistence/storage';
import { createDoc } from '../src/store/store';
import { useTemplates } from '../src/store/templates';

beforeEach(async () => {
  for (const m of await listMockups()) await deleteMockup(m.id);
  useTemplates.setState({ templates: [] });
  await safeSet('templates', []);
});

describe('saved mockups', () => {
  it('saves, lists (newest first), loads and remembers the last one', async () => {
    const a = { ...createDoc(), name: 'A' };
    const b = { ...createDoc(), name: 'B' };
    await saveMockup(a);
    await new Promise((r) => setTimeout(r, 5));
    await saveMockup(b);
    expect((await listMockups()).map((m) => m.name)).toEqual(['B', 'A']);
    expect(await lastMockupId()).toBe(b.id);
    expect(await loadMockup(a.id)).toEqual(a);
  });

  it('keeps one entry per mockup and its thumbnail across saves', async () => {
    const a = createDoc();
    await saveMockup(a);
    await setMockupThumbnail(a.id, 'data:image/png;base64,AAAA');
    await saveMockup({ ...a, name: 'Renamed' });
    const list = await listMockups();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      name: 'Renamed',
      thumbnail: 'data:image/png;base64,AAAA',
      frames: 1,
    });
  });

  it('renames, duplicates under a new id without changing which one reopens, and deletes', async () => {
    const a = { ...createDoc(), name: 'Plan' };
    await saveMockup(a);
    await renameMockup(a.id, 'Plan v2');
    expect((await loadMockup(a.id))!.name).toBe('Plan v2');

    const copy = (await duplicateMockup(a.id))!;
    expect(copy.name).toBe('Plan v2 copy');
    expect(copy.id).not.toBe(a.id);
    expect(await lastMockupId()).toBe(a.id);
    expect(await listMockups()).toHaveLength(2);

    await deleteMockup(a.id);
    expect(await loadMockup(a.id)).toBeNull();
    expect((await listMockups()).map((m) => m.id)).toEqual([copy.id]);
    expect(await lastMockupId()).not.toBe(a.id);
  });

  it('treats damaged stored data as missing rather than crashing', async () => {
    await safeSet('mockup:bad', { version: 1, frames: [{ root: ['ghost'] }], nodes: {} });
    expect(await loadMockup('bad')).toBeNull();
    expect(await loadMockup('never-saved')).toBeNull();
  });

  it('can tell that storage works', async () => {
    expect(await probeStorage()).toBe(true);
    expect(await safeGet('missing')).toBeUndefined();
  });
});

describe('my templates', () => {
  const template = (name: string) => ({
    name,
    device: 'desktop' as const,
    width: 1440,
    root: [],
    nodes: {},
    images: {},
  });

  it('adds, renames, removes and survives a reload', async () => {
    const t = useTemplates.getState().add(template('Landing'));
    useTemplates.getState().rename(t.id, ' Landing page ');
    expect(useTemplates.getState().templates[0]!.name).toBe('Landing page');
    await new Promise((r) => setTimeout(r, 10));
    useTemplates.setState({ templates: [] });
    await useTemplates.getState().load();
    expect(useTemplates.getState().templates.map((x) => x.name)).toEqual(['Landing page']);
    useTemplates.getState().remove(t.id);
    expect(useTemplates.getState().templates).toEqual([]);
  });

  it('ignores empty names and merges only templates it does not have', () => {
    const t = useTemplates.getState().add(template('One'));
    useTemplates.getState().rename(t.id, '   ');
    expect(useTemplates.getState().templates[0]!.name).toBe('One');
    const added = useTemplates.getState().merge([t, { ...t, id: 'tpl_other', name: 'Other' }]);
    expect(added).toBe(1);
    expect(useTemplates.getState().templates).toHaveLength(2);
  });
});
