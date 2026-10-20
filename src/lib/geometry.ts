export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

export interface View {
  x: number;
  y: number;
  zoom: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** Zoom while keeping the world point under (px, py) fixed on screen. */
export function zoomAt(view: View, nextZoom: number, px: number, py: number): View {
  const zoom = clampZoom(nextZoom);
  const wx = (px - view.x) / view.zoom;
  const wy = (py - view.y) / view.zoom;
  return { zoom, x: px - wx * zoom, y: py - wy * zoom };
}

/** View that fits `bounds` inside a viewport of the given size, with padding. */
export function fitView(bounds: Rect, vw: number, vh: number, padding = 64): View {
  if (bounds.width <= 0 || bounds.height <= 0 || vw <= 0 || vh <= 0) {
    return { x: 0, y: 0, zoom: 1 };
  }
  const zoom = clampZoom(
    Math.min((vw - padding * 2) / bounds.width, (vh - padding * 2) / bounds.height, 1),
  );
  return {
    zoom,
    x: (vw - bounds.width * zoom) / 2 - bounds.x * zoom,
    y: (vh - bounds.height * zoom) / 2 - bounds.y * zoom,
  };
}

export function unionRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;
  const x1 = Math.min(...rects.map((r) => r.x));
  const y1 = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.width));
  const y2 = Math.max(...rects.map((r) => r.y + r.height));
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}
