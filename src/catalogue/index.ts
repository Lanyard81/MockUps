import data from './generated/catalogue.json';
import {
  CATEGORIES,
  type Catalogue,
  type CatalogueComponent,
  type CatalogueVariant,
  type Category,
} from './types';

export const catalogue = data as Catalogue;
export { CATEGORIES };
export type { Category, CatalogueComponent, CatalogueVariant };

const byId = new Map(catalogue.components.map((c) => [c.id, c]));

export const getComponent = (id: string): CatalogueComponent | undefined => byId.get(id);

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

/** Instant filter over names, keywords, categories and variant labels. Empty query lists everything. */
export function searchCatalogue(query: string, category: Category | 'All' = 'All'): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];
  for (const component of catalogue.components) {
    if (category !== 'All' && component.category !== category) continue;
    if (terms.length === 0) {
      results.push({ component, variants: component.variants });
      continue;
    }
    const head = [component.name, component.id, component.category, ...component.keywords]
      .join(' ')
      .toLowerCase();
    if (terms.every((t) => head.includes(t))) {
      results.push({ component, variants: component.variants });
      continue;
    }
    const matching = component.variants.filter((v) => {
      const hay = `${head} ${v.label}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    if (matching.length > 0) results.push({ component, variants: matching });
  }
  return results;
}
