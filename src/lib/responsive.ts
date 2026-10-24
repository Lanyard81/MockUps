import type { DeviceId } from '../store/types';

/** The widths the responsive view shows a page at, narrowest first. */
export const RESPONSIVE_SIZES: { id: DeviceId; label: string; width: number; shown: number }[] = [
  { id: 'iphone', label: 'Phone', width: 393, shown: 220 },
  { id: 'tablet', label: 'Tablet', width: 820, shown: 330 },
  { id: 'desktop', label: 'Desktop', width: 1440, shown: 520 },
];

/** The smallest a touch target should be (WCAG 2.2 AA, 24 CSS pixels), checked on phone widths. */
export const MIN_TARGET = 24;

export interface Box {
  nodeId: string | null;
  right: number;
  width: number;
  height: number;
}

export interface ResponsiveIssue {
  kind: 'overflow' | 'small-target';
  text: string;
  /** Components involved (the first few), to select from the list. */
  nodeIds: string[];
}

const uniq = (ids: (string | null)[]) => [...new Set(ids.filter((x): x is string => !!x))];

/**
 * Problems at one width, from measurements taken inside the rendered page: anything sticking out past
 * the right edge (the page would scroll sideways), and, on a phone, buttons and links too small to
 * tap. `boxes` is every element's right edge and size; `scrollWidth` the page's own width.
 */
export function findIssues(width: number, scrollWidth: number, boxes: Box[]): ResponsiveIssue[] {
  const issues: ResponsiveIssue[] = [];
  const extra = Math.round(scrollWidth - width);
  if (extra > 1) {
    const offenders = boxes.filter((b) => b.width > 0 && b.right > width + 1);
    issues.push({
      kind: 'overflow',
      text: `Wider than the screen by ${extra}px, so the page would scroll sideways.`,
      nodeIds: uniq(offenders.map((b) => b.nodeId)).slice(0, 5),
    });
  }
  return issues;
}

/** Interactive elements under the minimum size (only meaningful on a phone). */
export function smallTargets(width: number, targets: Box[]): ResponsiveIssue[] {
  if (width > 600) return [];
  const small = targets.filter(
    (t) => t.width > 0 && (t.width < MIN_TARGET || t.height < MIN_TARGET),
  );
  if (small.length === 0) return [];
  return [
    {
      kind: 'small-target',
      text: `${small.length} button${small.length === 1 ? '' : 's'} or link${small.length === 1 ? ' is' : 's are'} smaller than ${MIN_TARGET}px, which is hard to tap.`,
      nodeIds: uniq(small.map((t) => t.nodeId)).slice(0, 5),
    },
  ];
}
