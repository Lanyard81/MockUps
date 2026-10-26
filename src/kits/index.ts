import type { Kit, KitId } from './types';
import { nswKit } from './nsw';
import { sharepointKit } from './sharepoint';
import { simpleKit } from './simple';

/** Every kit the editor offers. Adding one is a folder under `src/kits/` and a line here. */
export const KITS: Kit[] = [nswKit, sharepointKit, simpleKit];

export const DEFAULT_KIT_ID: KitId = 'nsw';

const byId = new Map(KITS.map((k) => [k.id, k]));

/** The kit with this id. A missing or unknown id gives the NSW kit, so old files still open. */
export function getKit(id?: KitId | null): Kit {
  return (id ? byId.get(id) : undefined) ?? nswKit;
}

export const hasKit = (id: string): boolean => byId.has(id);
