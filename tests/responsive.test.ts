import { describe, expect, it } from 'vitest';
import {
  MIN_TARGET,
  RESPONSIVE_SIZES,
  findIssues,
  smallTargets,
  type Box,
} from '../src/lib/responsive';

const box = (nodeId: string | null, right: number, width = 100, height = 40): Box => ({
  nodeId,
  right,
  width,
  height,
});

describe('responsive checks', () => {
  it('shows phone, tablet and desktop, narrowest first', () => {
    expect(RESPONSIVE_SIZES.map((s) => s.width)).toEqual([393, 820, 1440]);
  });

  it('reports nothing when the page fits', () => {
    expect(findIssues(393, 393, [box('a', 390)])).toEqual([]);
    expect(findIssues(393, 394, [box('a', 393)])).toEqual([]); // a pixel of rounding is fine
  });

  it('reports content wider than the screen, naming what sticks out (each once, at most five)', () => {
    const boxes = [box('a', 500), box('a', 600), box('b', 450), box(null, 700), box('c', 300)];
    const [issue] = findIssues(393, 600, boxes);
    expect(issue).toMatchObject({ kind: 'overflow' });
    expect(issue!.text).toContain('207px');
    expect(issue!.nodeIds).toEqual(['a', 'b']);
    const many = Array.from({ length: 9 }, (_, i) => box(`n${i}`, 900));
    expect(findIssues(393, 900, many)[0]!.nodeIds).toHaveLength(5);
  });

  it('ignores zero-width boxes that sit past the edge', () => {
    expect(findIssues(393, 395, [box('a', 900, 0)])[0]!.nodeIds).toEqual([]);
  });

  it('flags small buttons and links on a phone only', () => {
    const targets = [
      box('a', 50, MIN_TARGET - 1, 40),
      box('b', 50, 100, MIN_TARGET - 1),
      box('c', 50, 100, 44),
    ];
    const [issue] = smallTargets(393, targets);
    expect(issue).toMatchObject({ kind: 'small-target', nodeIds: ['a', 'b'] });
    expect(issue!.text).toContain('2 buttons or links are smaller than 24px');
    expect(smallTargets(820, targets)).toEqual([]);
    expect(smallTargets(393, [box('c', 50, 100, 44)])).toEqual([]);
  });
});
