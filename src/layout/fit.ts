import type { FitTarget } from '../lib/textFit';
import type { DocNode } from '../store/types';
import { collectIds } from './tree';

/** The text regions in a frame that have "shrink to fit" switched on, with the box they must fit. */
export function collectFitTargets(nodes: Record<string, DocNode>, root: string[]): FitTarget[] {
  const targets: FitTarget[] = [];
  for (const id of collectIds(nodes, root)) {
    const node = nodes[id];
    if (!node || node.type !== 'component' || node.hidden) continue;
    const boxes = (node.props?.fitBoxes ?? {}) as Record<
      string,
      { width?: number; height?: number }
    >;
    for (const [key, mode] of Object.entries(node.textFit ?? {})) {
      const box = boxes[key];
      if (mode === 'shrink' && box?.width && box?.height) {
        targets.push({ nodeId: id, key, box: { width: box.width, height: box.height } });
      }
    }
  }
  return targets;
}
