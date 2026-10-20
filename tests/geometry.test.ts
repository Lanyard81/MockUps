import { describe, expect, it } from 'vitest';
import { clampZoom, fitView, unionRects, zoomAt } from '../src/lib/geometry';

describe('geometry', () => {
  it('clamps zoom to 25%–400%', () => {
    expect(clampZoom(0.01)).toBe(0.25);
    expect(clampZoom(99)).toBe(4);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  it('keeps the point under the cursor fixed when zooming', () => {
    const view = { x: 100, y: 50, zoom: 1 };
    const next = zoomAt(view, 2, 300, 250);
    expect((300 - next.x) / next.zoom).toBeCloseTo((300 - view.x) / view.zoom);
    expect((250 - next.y) / next.zoom).toBeCloseTo((250 - view.y) / view.zoom);
  });

  it('fits bounds inside the viewport without upscaling past 100%', () => {
    const v = fitView({ x: 0, y: 0, width: 400, height: 2000 }, 1000, 800, 0);
    expect(v.zoom).toBeCloseTo(0.4);
    const small = fitView({ x: 0, y: 0, width: 100, height: 100 }, 1000, 800, 0);
    expect(small.zoom).toBe(1);
  });

  it('unions rectangles', () => {
    expect(unionRects([])).toBeNull();
    expect(
      unionRects([
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 20, y: 5, width: 10, height: 10 },
      ]),
    ).toEqual({ x: 0, y: 0, width: 30, height: 15 });
  });
});
