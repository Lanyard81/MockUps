/**
 * Where the pointer last was over the canvas (in screen coordinates), so zoom shortcuts zoom around
 * it, as the scroll wheel does, instead of around the middle of the window.
 */
let last: { x: number; y: number } | null = null;

export const setCanvasPointer = (p: { x: number; y: number } | null) => {
  last = p;
};

/** The point to zoom around, relative to the canvas's top-left corner: the pointer if it is on the canvas, else the middle. */
export function zoomCentre(vp: { width: number; height: number }): { x: number; y: number } {
  const rect = document.getElementById('canvas')?.getBoundingClientRect();
  if (rect && last) {
    const x = last.x - rect.left;
    const y = last.y - rect.top;
    if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) return { x, y };
  }
  return { x: vp.width / 2, y: vp.height / 2 };
}
