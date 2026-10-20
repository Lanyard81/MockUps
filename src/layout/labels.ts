import { getComponent, getVariant } from '../catalogue';
import type { DocNode } from '../store/types';

/** What a node is called unless the user has renamed it. */
export function defaultNodeLabel(node: DocNode | undefined): string {
  if (!node) return '';
  switch (node.type) {
    case 'section':
      return 'Section';
    case 'container':
      return 'Container';
    case 'grid':
      return 'Grid';
    case 'column':
      return 'Column';
    case 'component': {
      const comp = node.componentId ? getComponent(node.componentId) : undefined;
      if (!comp) return 'Unknown component';
      const variant = getVariant(comp.id, node.variant);
      return comp.variants.length > 1 && variant ? `${comp.name} · ${variant.label}` : comp.name;
    }
  }
}

/** Human name for a node, used in the breadcrumb, selection chip, Layers panel and drag ghost. */
export function nodeLabel(node: DocNode | undefined): string {
  return node?.name || defaultNodeLabel(node);
}
