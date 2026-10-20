import { getComponent, getVariant } from '../catalogue';
import type { DocNode } from '../store/types';

/** Human name for a node, used in the breadcrumb, selection chip and drag ghost. */
export function nodeLabel(node: DocNode | undefined): string {
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
