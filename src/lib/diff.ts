import { collectIds } from '../layout/tree';
import type { DocNode, Frame, MockupDoc } from '../store/types';

type Snapshot = Pick<MockupDoc, 'frames' | 'nodes' | 'comments'>;

export interface FrameDiff {
  frameId: string;
  name: string;
  change: 'added' | 'removed' | 'changed' | 'same';
  /** Short phrases: "2 components added", "renamed from Home", "width 393 to 820"... */
  details: string[];
}

export interface DocDiff {
  frames: FrameDiff[];
  /** One line for the whole comparison: "2 frames changed, 1 added". */
  summary: string;
  changed: boolean;
}

const components = (doc: Snapshot, frame: Frame): Map<string, DocNode> => {
  const out = new Map<string, DocNode>();
  for (const id of collectIds(doc.nodes, frame.root)) {
    const n = doc.nodes[id];
    if (n?.type === 'component') out.set(id, n);
  }
  return out;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * What is different between an earlier version of a mockup (`base`) and a later one (`current`), in
 * words a person can scan. Frames are matched by id; components by id within them (an id is kept for
 * as long as a component lives), so a changed piece of text is "edited", not "removed and added".
 */
export function diffDocs(base: Snapshot, current: Snapshot): DocDiff {
  const out: FrameDiff[] = [];
  const baseFrames = new Map(base.frames.map((f) => [f.id, f]));
  const currentIds = new Set(current.frames.map((f) => f.id));

  for (const f of current.frames) {
    const before = baseFrames.get(f.id);
    if (!before) {
      out.push({
        frameId: f.id,
        name: f.name,
        change: 'added',
        details: [plural(components(current, f).size, 'component')],
      });
      continue;
    }
    const details: string[] = [];
    if (before.name !== f.name) details.push(`renamed from “${before.name}”`);
    if (before.width !== f.width) details.push(`width ${before.width} to ${f.width}`);
    if ((before.layout ?? 'flow') !== (f.layout ?? 'flow'))
      details.push(`layout ${before.layout ?? 'flow'} to ${f.layout ?? 'flow'}`);
    if (!same(before.settings, f.settings)) details.push('site settings changed');
    const a = components(base, before);
    const b = components(current, f);
    const added = [...b.keys()].filter((id) => !a.has(id)).length;
    const removed = [...a.keys()].filter((id) => !b.has(id)).length;
    const edited = [...b.entries()].filter(
      ([id, n]) =>
        a.has(id) &&
        !same(
          { v: n.variant, t: n.text, p: n.props, h: n.hidden, f: n.free },
          {
            v: a.get(id)!.variant,
            t: a.get(id)!.text,
            p: a.get(id)!.props,
            h: a.get(id)!.hidden,
            f: a.get(id)!.free,
          },
        ),
    ).length;
    if (added) details.push(`${plural(added, 'component')} added`);
    if (removed) details.push(`${plural(removed, 'component')} removed`);
    if (edited) details.push(`${plural(edited, 'component')} edited`);
    const order = (doc: Snapshot, fr: Frame) => collectIds(doc.nodes, fr.root).join();
    if (!added && !removed && !edited && order(base, before) !== order(current, f))
      details.push('rearranged');
    out.push({
      frameId: f.id,
      name: f.name,
      change: details.length ? 'changed' : 'same',
      details,
    });
  }
  for (const f of base.frames)
    if (!currentIds.has(f.id))
      out.push({
        frameId: f.id,
        name: f.name,
        change: 'removed',
        details: [plural(components(base, f).size, 'component')],
      });

  const count = (c: FrameDiff['change']) => out.filter((f) => f.change === c).length;
  const parts = [
    count('changed') ? plural(count('changed'), 'frame') + ' changed' : '',
    count('added') ? plural(count('added'), 'frame') + ' added' : '',
    count('removed') ? plural(count('removed'), 'frame') + ' removed' : '',
  ].filter(Boolean);
  const commentDelta = (current.comments?.length ?? 0) - (base.comments?.length ?? 0);
  if (commentDelta)
    parts.push(
      `${plural(Math.abs(commentDelta), 'comment')} ${commentDelta > 0 ? 'added' : 'removed'}`,
    );
  return {
    frames: out,
    summary: parts.length ? parts.join(', ') : 'No differences',
    changed: parts.length > 0,
  };
}
