import { newId } from '../lib/ids';
import { cloneSubtrees } from '../layout/tree';
import type { SavedTemplate } from '../store/types';
import { buildTree, type InstantiatedTemplate, type MakeId, type TemplateDef } from './build';
import { OFFICIAL_TEMPLATES } from './official';

export { OFFICIAL_TEMPLATES };
export type { InstantiatedTemplate, TemplateDef };

/** Official template groups, in the order they appear. */
export const TEMPLATE_GROUPS = [
  'Homepage',
  'Content',
  'Search',
  'Maps',
  'Theming',
  'Landing pages',
  'Kitchen sink',
] as const;

export const getOfficialTemplate = (id: string) => OFFICIAL_TEMPLATES.find((t) => t.id === id);

/** An official template with fresh ids, ready to put in a document. */
export function instantiateOfficial(
  def: TemplateDef,
  makeId: MakeId = newId,
): InstantiatedTemplate {
  const { root, nodes } = buildTree(def.items(), makeId);
  return { name: def.name, device: def.device, width: def.width, root, nodes, images: {} };
}

/** One of the user's saved templates, copied with fresh ids so it can be used many times. */
export function instantiateSaved(t: SavedTemplate, makeId: MakeId = newId): InstantiatedTemplate {
  const copy = cloneSubtrees(t.nodes, t.root, makeId);
  return {
    name: t.name,
    device: t.device,
    width: t.width,
    root: copy.roots,
    nodes: copy.nodes,
    images: t.images,
  };
}
