import { beforeEach, describe, expect, it } from 'vitest';
import { commentNumber, commentsMarkdown, commentsOf } from '../src/lib/comments';
import { validateDoc } from '../src/persistence/schema';
import { createDoc, useStore } from '../src/store/store';

const s = () => useStore.getState();

beforeEach(() => {
  useStore.setState({
    doc: createDoc(),
    past: [],
    future: [],
    selectedFrameId: null,
    commentTool: false,
    activeCommentId: null,
  });
});

describe('comment actions', () => {
  it('pins a note, opens it, and puts the tool away', () => {
    s().setCommentTool(true);
    const id = s().addComment(s().doc.frames[0]!.id, 100.6, 40)!;
    expect(commentsOf(s().doc)).toMatchObject([{ id, x: 101, y: 40, text: '', resolved: false }]);
    expect(s().activeCommentId).toBe(id);
    expect(s().commentTool).toBe(false);
    expect(s().addComment('nope', 1, 1)).toBeNull();
  });

  it('edits, resolves and deletes, each one undo step, and ignores no-ops', () => {
    const id = s().addComment(s().doc.frames[0]!.id, 10, 20)!;
    const before = s().past.length;
    s().updateComment(id, { text: 'Move this up' });
    s().updateComment(id, { text: 'Move this up' }); // unchanged: no history entry
    s().updateComment(id, { resolved: true });
    expect(s().past.length).toBe(before + 2);
    expect(commentsOf(s().doc)[0]).toMatchObject({ text: 'Move this up', resolved: true });
    s().undo();
    expect(commentsOf(s().doc)[0]!.resolved).toBe(false);
    s().deleteComment(id);
    expect(commentsOf(s().doc)).toHaveLength(0);
    expect(s().activeCommentId).toBeNull();
    s().undo();
    expect(commentsOf(s().doc)).toHaveLength(1);
  });

  it('caps the text, and numbers notes in order', () => {
    const f = s().doc.frames[0]!.id;
    const a = s().addComment(f, 1, 1)!;
    const b = s().addComment(f, 2, 2)!;
    s().updateComment(a, { text: 'x'.repeat(5000) });
    expect(commentsOf(s().doc)[0]!.text).toHaveLength(2000);
    expect(commentNumber(s().doc, b)).toBe(2);
  });

  it('deleting a frame takes its notes with it, and undo brings them back', () => {
    s().addFrame('desktop');
    const first = s().doc.frames[0]!;
    const second = s().doc.frames[1]!;
    s().addComment(first.id, 1, 1);
    s().addComment(second.id, 2, 2);
    s().deleteFrame(second.id);
    expect(commentsOf(s().doc).map((c) => c.frameId)).toEqual([first.id]);
    s().undo();
    expect(commentsOf(s().doc)).toHaveLength(2);
  });
});

describe('comments in files', () => {
  const raw = (comments: unknown) => ({
    version: 6,
    id: 'd',
    name: 'x',
    defaultKitId: 'nsw',
    kitVersions: {},
    kitSettings: {},
    view: { x: 0, y: 0, zoom: 1 },
    frames: [
      { id: 'f', name: 'A', kitId: 'nsw', device: 'desktop', width: 1440, x: 0, y: 0, root: [] },
    ],
    nodes: {},
    images: {},
    comments,
  });

  it('keeps good notes and drops orphans, duplicates and junk', () => {
    const doc = validateDoc(
      raw([
        { id: 'a', frameId: 'f', x: 5, y: 1e9, text: 'ok', resolved: true, createdAt: 3 },
        { id: 'a', frameId: 'f', x: 1, y: 1, text: 'duplicate id' },
        { id: 'b', frameId: 'gone', x: 1, y: 1, text: 'orphan' },
        { id: '__proto__', frameId: 'f' },
        'junk',
        { id: 'c', frameId: 'f', text: 7 },
      ]),
    );
    expect(doc.comments).toEqual([
      { id: 'a', frameId: 'f', x: 5, y: 20000, text: 'ok', resolved: true, createdAt: 3 },
      { id: 'c', frameId: 'f', x: 0, y: 0, text: '', resolved: false, createdAt: 0 },
    ]);
  });

  it('a document with no notes has none, and an older version opens', () => {
    expect(validateDoc(raw(undefined)).comments).toBeUndefined();
    expect(validateDoc({ ...raw([]), version: 5 }).comments).toBeUndefined();
  });
});

describe('comments as Markdown', () => {
  it('groups open notes by frame, and can include the done ones', () => {
    const f = s().doc.frames[0]!;
    const a = s().addComment(f.id, 10, 20)!;
    s().updateComment(a, { text: 'First\nline' });
    const b = s().addComment(f.id, 30, 40)!;
    s().updateComment(b, { text: 'Second', resolved: true });
    const open = commentsMarkdown(s().doc);
    expect(open).toContain('## Home');
    expect(open).toContain('1. First line');
    expect(open).not.toContain('Second');
    const all = commentsMarkdown(s().doc, true);
    expect(all).toContain('2. [done] Second');
    expect(commentsMarkdown({ ...s().doc, comments: [] })).toContain('No open comments.');
  });
});
