import { describe, expect, it } from 'vitest';
import {
  ZOOM_PRESETS,
  clampZoom,
  fitView,
  revealView,
  unionRects,
  zoomAt,
  zoomChoices,
} from '../src/lib/geometry';

describe('geometry', () => {
  it('clamps zoom to 10%–400%', () => {
    expect(clampZoom(0.01)).toBe(0.1);
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

describe('revealView', () => {
  const view = { x: 0, y: 0, zoom: 1 };
  it('leaves the view alone when the box is already on screen', () => {
    expect(revealView(view, { x: 100, y: 100, width: 300, height: 400 }, 1000, 800)).toBe(view);
  });
  it('centres a box that is off to the right, keeping the zoom', () => {
    const v = revealView(view, { x: 2000, y: 0, width: 400, height: 300 }, 1000, 800);
    expect(v.zoom).toBe(1);
    expect(v.x).toBe(-1700); // the box's centre (2200) lands in the middle of the 1000px window
    expect(v.y).toBe(250);
  });
  it('aligns the left edge of a box wider than the window', () => {
    const v = revealView(view, { x: 3000, y: 0, width: 1500, height: 300 }, 1000, 800);
    expect(v.x).toBe(32 - 3000);
  });
  it('aligns the top of a box taller than the window', () => {
    const v = revealView(view, { x: -2000, y: 50, width: 400, height: 3000 }, 1000, 800);
    expect(v.y).toBe(32 - 50);
  });
});

describe('zoomChoices', () => {
  it('shows a zoom near a preset as that preset, so there are never two close entries', () => {
    expect(zoomChoices(76)).toEqual({ options: ZOOM_PRESETS, shown: 75 });
    expect(zoomChoices(100).shown).toBe(100);
  });
  it('adds an entry for a zoom that is nowhere near a preset', () => {
    const { options, shown } = zoomChoices(63);
    expect(shown).toBe(63);
    expect(options).toContain(63);
    expect(options).toEqual([...options].sort((a, b) => a - b));
  });
});
