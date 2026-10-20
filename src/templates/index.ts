import { DEFAULT_KIT_ID, KITS, getKit } from '../kits';
import type { KitId } from '../kits/types';
import { newId } from '../lib/ids';
import { cloneSubtrees } from '../layout/tree';
import type { SavedTemplate } from '../store/types';
import type { InstantiatedTemplate, MakeId, TemplateDef } from './types';

export type { InstantiatedTemplate, TemplateDef };

/** Every official template, across kits. Ids are unique across kits. */
export const OFFICIAL_TEMPLATES: TemplateDef[] = KITS.flatMap((k) => k.templates);

/** Official template groups of a kit, in the order they appear. */
export const templateGroups = (kitId: KitId = DEFAULT_KIT_ID): readonly string[] =>
  getKit(kitId).templateGroups;

export const getOfficialTemplate = (id: string): TemplateDef | undefined =>
  OFFICIAL_TEMPLATES.find((t) => t.id === id);

/** An official template with fresh ids, ready to put in a document. */
export function instantiateOfficial(
  def: TemplateDef,
  makeId: MakeId = newId,
): InstantiatedTemplate {
  const { root, nodes, settings } = def.build(makeId);
  return {
    name: def.name,
    device: def.device,
    width: def.width,
    kitId: def.kitId,
    root,
    nodes,
    images: {},
    ...(settings ? { settings } : {}),
  };
}

/** One of the user's saved templates, copied with fresh ids so it can be used many times. */
export function instantiateSaved(t: SavedTemplate, makeId: MakeId = newId): InstantiatedTemplate {
  const copy = cloneSubtrees(t.nodes, t.root, makeId);
  return {
    name: t.name,
    device: t.device,
    width: t.width,
    kitId: t.kitId ?? DEFAULT_KIT_ID,
    root: copy.roots,
    nodes: copy.nodes,
    images: t.images,
    ...(t.settings ? { settings: t.settings } : {}),
  };
}
