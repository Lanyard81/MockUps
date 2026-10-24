import type { DocNode, MockupDoc } from '../store/types';

/** Images a set of nodes refers to, copied out of the document. */
export function imagesUsedBy(
  nodes: Record<string, DocNode>,
  images: MockupDoc['images'],
  settings?: Record<string, unknown>,
): MockupDoc['images'] {
  const used: MockupDoc['images'] = {};
  // Pictures a frame's kit settings use (a SharePoint header image or logo).
  for (const v of Object.values(settings ?? {})) {
    if (typeof v === 'string' && v.startsWith('img_') && images[v]) used[v] = images[v]!;
  }
  for (const node of Object.values(nodes)) {
    const slots = (node.props?.images ?? {}) as Record<string, { imageId?: string }>;
    for (const slot of Object.values(slots)) {
      if (slot?.imageId && images[slot.imageId]) used[slot.imageId] = images[slot.imageId]!;
    }
  }
  return used;
}
