/**
 * Alignment helpers for freeform frames (Milestone G1). Pure: the canvas feeds in boxes measured from
 * the frame and draws what comes back. Guides are hints; snapping is opt-in and never forced.
 */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Guide {
  axis: 'x' | 'y';
  /** The coordinate of the line (x for a vertical guide, y for a horizontal one). */
  pos: number;
  /** The extent of the line along the other axis. */
  from: number;
  to: number;
}

/** The three lines of a span that things align on: start, middle, end. */
const anchors = (start: number, size: number) => [start, start + size / 2, start + size];

function bestOffset(moverAnchors: number[], targets: number[], threshold: number): number | null {
  let best: number | null = null;
  for (const a of moverAnchors)
    for (const t of targets) {
      const d = t - a;
      if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best))) best = d;
    }
  return best;
}

export interface AlignResult {
  /** How far to move the box to land on the nearest line (0 unless snapping). */
  dx: number;
  dy: number;
  guides: Guide[];
}

/**
 * Compare a box being moved with the frame's edges and middle and with the other boxes. Lines within
 * `threshold` pixels attract the box when `snap` is on. Guides are returned for every line the box
 * lies on (within `tolerance`, 1px by default) once it has moved.
 */
export function align(
  mover: Box,
  others: Box[],
  frame: { width: number; height: number },
  opts: { snap: boolean; threshold?: number; tolerance?: number },
): AlignResult {
  const threshold = opts.threshold ?? 6;
  const tolerance = opts.tolerance ?? 1;
  const xs = [0, frame.width / 2, frame.width, ...others.flatMap((o) => anchors(o.x, o.width))];
  const ys = [0, frame.height / 2, frame.height, ...others.flatMap((o) => anchors(o.y, o.height))];
  const dx = opts.snap ? (bestOffset(anchors(mover.x, mover.width), xs, threshold) ?? 0) : 0;
  const dy = opts.snap ? (bestOffset(anchors(mover.y, mover.height), ys, threshold) ?? 0) : 0;
  const moved = { ...mover, x: mover.x + dx, y: mover.y + dy };

  const guides: Guide[] = [];
  const seen = new Set<string>();
  const add = (g: Guide) => {
    const key = `${g.axis}:${Math.round(g.pos * 2)}`;
    if (seen.has(key)) return;
    seen.add(key);
    guides.push(g);
  };
  const frameRect: Box = { x: 0, y: 0, width: frame.width, height: frame.height };
  for (const o of [frameRect, ...others]) {
    for (const t of anchors(o.x, o.width))
      for (const a of anchors(moved.x, moved.width))
        if (Math.abs(t - a) <= tolerance)
          add({
            axis: 'x',
            pos: t,
            from: Math.min(o.y, moved.y),
            to: Math.max(o.y + o.height, moved.y + moved.height),
          });
    for (const t of anchors(o.y, o.height))
      for (const a of anchors(moved.y, moved.height))
        if (Math.abs(t - a) <= tolerance)
          add({
            axis: 'y',
            pos: t,
            from: Math.min(o.x, moved.x),
            to: Math.max(o.x + o.width, moved.x + moved.width),
          });
  }
  return { dx, dy, guides };
}

/** Round to the nearest grid line. A grid of 0 or less does nothing. */
export const snapToGrid = (n: number, grid: number): number =>
  grid > 0 ? Math.round(n / grid) * grid : n;

/** Where an item of `width` goes to sit at the left, centre or right of a frame. */
export function alignInFrame(
  to: 'left' | 'centre' | 'right',
  width: number,
  frameWidth: number,
): number {
  if (to === 'left') return 0;
  if (to === 'right') return Math.round(frameWidth - width);
  return Math.round((frameWidth - width) / 2);
}
