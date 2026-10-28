import type { DocNode } from '../../store/types';
import type { KitSpacing } from '../types';

/**
 * Space above a component, using the official NSW margin helpers (`nsw-m-top-*`), so stacked
 * components get the gaps the design system defines instead of touching.
 */
export const NSW_SPACING: KitSpacing = {
  options: [
    { id: 'none', label: 'None', cls: 'nsw-m-top-0' },
    { id: 'sm', label: 'Small', cls: 'nsw-m-top-sm' },
    { id: 'md', label: 'Medium', cls: 'nsw-m-top-md' },
    { id: 'lg', label: 'Large', cls: 'nsw-m-top-lg' },
    { id: 'xl', label: 'XL', cls: 'nsw-m-top-xl' },
  ],
  // A section heading that follows something else in its column opens a new group: give it room.
  auto: (node: DocNode) =>
    node.componentId === 'heading' && ['h2', 'h3', 'h4'].includes(node.variant ?? 'h1')
      ? 'lg'
      : null,
};
