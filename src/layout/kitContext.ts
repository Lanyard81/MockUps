import { getKit } from '../kits';
import type { SettingContext } from '../kits/types';
import type { DocNode } from '../store/types';
import { frameOfNode, parentOf, type Doc } from './ops';
import type { MockupDoc } from '../store/types';

/** The context a kit's settings (and rules such as "full-width sections need a communication site") are evaluated in. */
export function settingContextFor(
  doc: Pick<MockupDoc, 'frames' | 'nodes' | 'kitSettings'>,
  frameId: string,
  nodeId?: string,
): Omit<SettingContext, 'values'> {
  const frame = doc.frames.find((f) => f.id === frameId);
  const kitId = getKit(frame?.kitId).id;
  const topLevel = (frame?.root ?? []).map((id) => doc.nodes[id]).filter((n): n is DocNode => !!n);
  let section: DocNode | undefined;
  if (nodeId) {
    let cur: string | null = nodeId;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const n: DocNode | undefined = doc.nodes[cur];
      if (n?.type === 'section') {
        section = n;
        break;
      }
      cur = parentOf(doc as Doc, cur)?.parentId ?? null;
    }
  }
  return {
    frame: frame?.settings ?? {},
    kit: doc.kitSettings[kitId] ?? {},
    topLevel,
    nodeId,
    section,
  };
}

/** The frame a node is in, if it is in one. */
export const frameIdOf = (doc: Doc, nodeId: string): string | undefined => frameOfNode(doc, nodeId);
