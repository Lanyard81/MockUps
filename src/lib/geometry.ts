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

/**
 * Keep a box in view without changing the zoom: if it is already (mostly) on screen the view stays;
 * otherwise slide the view so the box sits in the middle (or at its left or top edge when it is wider or taller than the window).
 */
export function revealView(view: View, box: Rect, vw: number, vh: number, margin = 32): View {
  if (vw <= 0 || vh <= 0) return view;
  const left = box.x * view.zoom + view.x;
  const top = box.y * view.zoom + view.y;
  const right = left + box.width * view.zoom;
  const bottom = top + box.height * view.zoom;
  const visible = left >= margin && right <= vw - margin && top >= margin && bottom <= vh - margin;
  const topInView = top >= margin && top <= vh - margin && left >= margin && left < vw - margin;
  if (visible || topInView) return view;
  const wide = box.width * view.zoom > vw - margin * 2;
  const x = wide
    ? margin - box.x * view.zoom
    : (vw - box.width * view.zoom) / 2 - box.x * view.zoom;
  const tall = box.height * view.zoom > vh - margin * 2;
  const y = tall
    ? margin - box.y * view.zoom
    : (vh - box.height * view.zoom) / 2 - box.y * view.zoom;
  return { ...view, x, y };
}

export const ZOOM_PRESETS = [10, 25, 50, 75, 100, 150, 200, 300, 400];

/**
 * The zoom menu's entries and which one to show for a zoom of `pct` percent: a zoom within 2% of a
 * preset shows as that preset (no "75%" beside "76%"); any other zoom gets an entry of its own.
 */
export function zoomChoices(pct: number): { options: number[]; shown: number } {
  const near = ZOOM_PRESETS.find((p) => Math.abs(p - pct) <= 2);
  return near !== undefined
    ? { options: ZOOM_PRESETS, shown: near }
    : { options: [...ZOOM_PRESETS, pct].sort((a, b) => a - b), shown: pct };
}
