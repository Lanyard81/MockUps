import { clampZoom, zoomAt, type View } from '../lib/geometry';
import { useStore } from '../store/store';

/**
 * Touch on the canvas: two fingers pan and pinch-zoom, wherever they are (on the canvas or inside a
 * page). Frames are iframes, so their touches are reported here in screen coordinates. One finger
 * keeps its usual job (select, or move what was picked up), and a press-and-hold opens the item menu.
 */
const points = new Map<number, { x: number; y: number }>();
let start: { distance: number; mid: { x: number; y: number }; view: View } | null = null;

const spread = () => {
  const [a, b] = [...points.values()];
  return a && b
    ? {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      }
    : null;
};

/** Two or more fingers are down: single-finger actions (select, drag) should stand aside. */
export const isMultiTouch = () => points.size >= 2;

export function touchDown(id: number, x: number, y: number): void {
  points.set(id, { x, y });
  if (points.size === 2) {
    const s = spread()!;
    start = { ...s, view: useStore.getState().doc.view };
  }
}

export function touchMove(id: number, x: number, y: number): void {
  if (!points.has(id)) return;
  points.set(id, { x, y });
  const now = spread();
  if (!start || !now || points.size < 2 || start.distance < 1) return;
  const canvas = document.getElementById('canvas')?.getBoundingClientRect();
  const ox = canvas?.left ?? 0;
  const oy = canvas?.top ?? 0;
  const zoom = clampZoom(start.view.zoom * (now.distance / start.distance));
  const zoomed = zoomAt(start.view, zoom, start.mid.x - ox, start.mid.y - oy);
  useStore.getState().setView({
    ...zoomed,
    x: zoomed.x + (now.mid.x - start.mid.x),
    y: zoomed.y + (now.mid.y - start.mid.y),
  });
}

export function touchUp(id: number): void {
  points.delete(id);
  if (points.size < 2) start = null;
}

/** Hold still this long (in ms) with one finger to open the item menu. */
export const LONG_PRESS_MS = 500;
/** Moving further than this (in px) cancels a press-and-hold. */
export const LONG_PRESS_SLOP = 8;
