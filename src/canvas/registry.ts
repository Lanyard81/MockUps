/** Live iframe elements by frame id, so drag and overlays can reach into frames. */
const iframes = new Map<string, HTMLIFrameElement>();

export function registerFrameElement(frameId: string, el: HTMLIFrameElement | null) {
  if (el) iframes.set(frameId, el);
  else iframes.delete(frameId);
}

export const getFrameElement = (frameId: string) => iframes.get(frameId);

/** Canvas zoom as seen from outside the iframe (the iframe is scaled by the world transform). */
export function frameScale(iframe: HTMLIFrameElement): number {
  const rect = iframe.getBoundingClientRect();
  return iframe.offsetWidth ? rect.width / iframe.offsetWidth : 1;
}

/** Screen point to the iframe's own coordinates. */
export function toFramePoint(iframe: HTMLIFrameElement, clientX: number, clientY: number) {
  const rect = iframe.getBoundingClientRect();
  const scale = frameScale(iframe);
  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
}

export function nodeRect(doc: Document, nodeId: string): DOMRect | null {
  const el = doc.querySelector(`[data-node="${nodeId}"]`);
  return el ? el.getBoundingClientRect() : null;
}
