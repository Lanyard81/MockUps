import { kitOfComponent } from '../catalogue';
import { getKit } from '../kits';
import type { KitId } from '../kits/types';
import type { DocNode } from '../store/types';
import { collectIds } from './tree';

const article = (label: string) => (/^[aeiou]|^NSW/i.test(label) ? 'an' : 'a');

/**
 * The message shown when something from one kit is put in a frame of another. Kits don't mix inside
 * a frame: a SharePoint web part can't sit on an NSW page, or the reverse.
 */
export function kitMismatchMessage(frameKitId: KitId): string {
  const kit = getKit(frameKitId);
  return `This is ${article(kit.shortLabel)} ${kit.shortLabel} page, so items from another kit can’t go on it. Add a page of that kit, or convert this one.`;
}

/** The kits of the components in these subtrees. Layout nodes (sections, columns) have none of their own. */
export function subtreeKits(nodes: Record<string, DocNode>, rootIds: string[]): Set<KitId> {
  const kits = new Set<KitId>();
  for (const id of collectIds(nodes, rootIds)) {
    const n = nodes[id];
    const kit =
      n?.type === 'component' && n.componentId ? kitOfComponent(n.componentId) : undefined;
    if (kit) kits.add(kit);
  }
  return kits;
}

/** Can a component of this id go into a frame of this kit? */
export const componentFitsKit = (componentId: string, frameKitId: KitId): boolean => {
  const kit = kitOfComponent(componentId);
  return !kit || kit === getKit(frameKitId).id;
};

/** Can these subtrees go into a frame of this kit? Layout nodes can't cross kits, so an empty one needs the same kit it came from. */
export const subtreesFitKit = (
  nodes: Record<string, DocNode>,
  rootIds: string[],
  frameKitId: KitId,
): boolean => {
  const target = getKit(frameKitId).id;
  for (const k of subtreeKits(nodes, rootIds)) if (k !== target) return false;
  return true;
};
