import { renderThumbnail } from '../export/png';
import { FREE_NO_CONVERT, isFreeFrame } from '../layout/free';
import { collectIds } from '../layout/tree';
import { useStore } from '../store/store';
import { useTemplates } from '../store/templates';
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

/** Save a frame as one of the user's own templates, with a thumbnail. */
export async function saveFrameAsTemplate(frameId: string, name: string): Promise<boolean> {
  const s = useStore.getState();
  const frame = s.doc.frames.find((f) => f.id === frameId);
  const label = name.trim();
  if (!frame || !label) return false;
  if (isFreeFrame(frame)) {
    s.setNotice(FREE_NO_CONVERT);
    return false;
  }
  if (frame.root.length === 0) {
    s.setNotice('That frame is empty, so there is nothing to save as a template.');
    return false;
  }
  const nodes = Object.fromEntries(
    collectIds(s.doc.nodes, frame.root).map((id) => [id, structuredClone(s.doc.nodes[id]!)]),
  );
  const thumbnail = (await renderThumbnail(frameId, 360)) ?? undefined;
  useTemplates.getState().add({
    name: label,
    device: frame.device,
    width: frame.width,
    kitId: frame.kitId,
    ...(frame.settings ? { settings: structuredClone(frame.settings) } : {}),
    root: [...frame.root],
    nodes,
    images: imagesUsedBy(nodes, s.doc.images, frame.settings),
    thumbnail,
  });
  s.setLeftTab('templates');
  s.setNotice(`Saved “${label}” as a template. It’s in the Templates tab, under My templates.`);
  return true;
}
