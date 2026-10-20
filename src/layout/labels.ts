import { getComponent, getVariant } from '../catalogue';
import { getKit } from '../kits';
import type { DocNode } from '../store/types';

/** What a node is called unless the user has renamed it. `kitId` is the kit of the frame it is in. */
export function defaultNodeLabel(node: DocNode | undefined, kitId?: string): string {
  if (!node) return '';
  if (node.type === 'component') {
    const comp = node.componentId ? getComponent(node.componentId) : undefined;
    if (!comp) return 'Unknown component';
    const variant = getVariant(comp.id, node.variant);
    return comp.variants.length > 1 && variant ? `${comp.name} · ${variant.label}` : comp.name;
  }
  return getKit(kitId).labels.names[node.type] ?? node.type;
}

/** Human name for a node, used in the breadcrumb, selection chip, Layers panel and drag ghost. */
export function nodeLabel(node: DocNode | undefined, kitId?: string): string {
  return node?.name || defaultNodeLabel(node, kitId);
}
