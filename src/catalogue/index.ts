import { DEFAULT_KIT_ID, KITS, getKit } from '../kits';
import type { KitId } from '../kits/types';
import type { Catalogue, CatalogueComponent, CatalogueVariant, Category } from './types';

export type { Category, CatalogueComponent, CatalogueVariant };

/** The catalogue of one kit (NSW when no kit is given). */
export const getCatalogue = (kitId: KitId = DEFAULT_KIT_ID): Catalogue => getKit(kitId).catalogue;

/** The default (NSW) kit's catalogue, kept for callers that only deal with it. */
export const catalogue: Catalogue = getCatalogue();

// Component ids are unique across kits (the SharePoint kit prefixes its own), so a node's
// `componentId` is enough to find it whichever frame it is in.
const byId = new Map(KITS.flatMap((k) => k.catalogue.components.map((c) => [c.id, c] as const)));

export const getComponent = (id: string): CatalogueComponent | undefined => byId.get(id);

/** The kit a component belongs to, if it exists. */
export const kitOfComponent = (id: string): KitId | undefined =>
  KITS.find((k) => k.catalogue.components.some((c) => c.id === id))?.id;

export function getVariant(componentId: string, variantId?: string): CatalogueVariant | undefined {
  const c = byId.get(componentId);
  if (!c) return undefined;
  return c.variants.find((v) => v.id === (variantId ?? c.defaultVariant)) ?? c.variants[0];
}

/** True only if the component has exactly this variant (getVariant falls back to the default). */
export const hasVariant = (componentId: string, variantId: string): boolean =>
  !!byId.get(componentId)?.variants.some((v) => v.id === variantId);

export interface SearchResult {
  component: CatalogueComponent;
  variants: CatalogueVariant[];
}

/** Plain words people use for things the catalogue names differently. */
const SYNONYMS: Record<string, string[]> = {
  expandable: ['accordion'],
  expanding: ['accordion'],
  collapsible: ['accordion'],
  toggle: ['accordion', 'switch'],
  rows: ['accordion', 'table', 'list'],
  dropdown: ['select', 'menu'],
  popup: ['dialog', 'modal'],
  banner: ['hero', 'callout', 'notification'],
  alert: ['callout', 'notification'],
  tabs: ['tab'],
  steps: ['progress', 'stepper'],
  breadcrumbs: ['breadcrumb'],
  footer: ['footer'],
  nav: ['navigation', 'menu'],
  picture: ['image', 'media'],
  photo: ['image', 'media'],
  form: ['input', 'field'],
  textbox: ['input', 'text field'],
  checkbox: ['checkbox', 'check'],
  faq: ['accordion'],
  tile: ['card'],
};

/** The ways a typed word can match: itself, a simple stem ("expandable" → "expand"), and any synonyms. */
function alternatives(term: string): string[] {
  const out = [term, ...(SYNONYMS[term] ?? [])];
  const stem = term.replace(/(able|ible|ing|ed|es|s)$/, '');
  if (stem.length >= 4 && stem !== term) out.push(stem);
  return out;
}

/** Instant filter over names, keywords, categories and variant labels. Empty query lists everything. */
export function searchCatalogue(
  query: string,
  category: Category | 'All' = 'All',
  kitId: KitId = DEFAULT_KIT_ID,
): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];
  for (const component of getCatalogue(kitId).components) {
    if (category !== 'All' && component.category !== category) continue;
    if (terms.length === 0) {
      results.push({ component, variants: component.variants });
      continue;
    }
    const head = [component.name, component.id, component.category, ...component.keywords]
      .join(' ')
      .toLowerCase();
    const matches = (hay: string) =>
      terms.every((t) => alternatives(t).some((a) => hay.includes(a)));
    if (matches(head)) {
      results.push({ component, variants: component.variants });
      continue;
    }
    const matching = component.variants.filter((v) => {
      return matches(`${head} ${v.label}`.toLowerCase());
    });
    if (matching.length > 0) results.push({ component, variants: matching });
  }
  return results;
}
