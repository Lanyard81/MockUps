/**
 * "Shrink text to fit": keep an element's box and reduce its font size until the text fits,
 * down to 75% of the original or 12px, whichever is larger. If it still doesn't fit at that
 * size, the text is truncated with an ellipsis and a warning is shown.
 *
 * `fitFontSize` is pure (the caller supplies a `fits` test), so the rules are unit-tested without
 * a browser. `applyTextFit` runs it against real elements inside a frame.
 */
export const FIT_STEP = 0.5;
export const MIN_FIT_PX = 12;
export const MIN_FIT_RATIO = 0.75;

export const minFontSize = (original: number): number =>
  Math.max(MIN_FIT_PX, original * MIN_FIT_RATIO);

export interface FitResult {
  /** Font size to use, in px. */
  size: number;
  /** True when even the smallest allowed size doesn't fit, so the text must be truncated. */
  truncated: boolean;
}

/**
 * The largest font size, at most `original`, for which `fits(size)` is true, stepping down in
 * half-pixels to the minimum. A text that already fits keeps its original size.
 */
export function fitFontSize(original: number, fits: (size: number) => boolean): FitResult {
  if (fits(original)) return { size: original, truncated: false };
  const min = Math.min(original, minFontSize(original));
  // Fitting is monotonic (smaller text never fits worse), so binary search the half-pixel grid.
  let lo = 0;
  let hi = Math.floor((original - min) / FIT_STEP); // steps below `original` at the minimum
  if (!fits(original - hi * FIT_STEP)) return { size: original - hi * FIT_STEP, truncated: true };
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(original - mid * FIT_STEP)) hi = mid;
    else lo = mid + 1;
  }
  return { size: original - hi * FIT_STEP, truncated: false };
}

/**
 * The box a text element occupies when shrinking is switched on. It is measured the way it will
 * be fitted (as an inline-block), because an inline element's own box is shorter than its line.
 */
export function measureFitBox(el: HTMLElement): { width: number; height: number } {
  const before = el.style.display;
  const wasInline = el.ownerDocument.defaultView!.getComputedStyle(el).display === 'inline';
  if (wasInline) el.style.display = 'inline-block';
  const rect = el.getBoundingClientRect();
  el.style.display = before;
  return { width: rect.width, height: rect.height };
}

export interface FitTarget {
  nodeId: string;
  key: string;
  /** The element's box when shrinking was switched on, in CSS px. */
  box: { width: number; height: number };
}

export interface FitWarning {
  nodeId: string;
  key: string;
}

const STYLE_PROPS = [
  'fontSize',
  'width',
  'height',
  'maxWidth',
  'display',
  'overflow',
  'boxSizing',
  'whiteSpace',
  'textOverflow',
  'webkitLineClamp',
  'lineClamp',
] as const;

/** Remove anything a previous fit left on the element. */
function reset(el: HTMLElement) {
  for (const p of STYLE_PROPS) (el.style as unknown as Record<string, string>)[p] = '';
  el.style.removeProperty('-webkit-box-orient');
  el.removeAttribute('data-fit');
}

/**
 * Fit each target inside `doc`. Returns the elements that had to be truncated.
 * Safe to run repeatedly: it starts from the element's natural font size every time.
 */
export function applyTextFit(doc: Document, targets: FitTarget[]): FitWarning[] {
  const warnings: FitWarning[] = [];
  for (const t of targets) {
    const node = doc.querySelector(`[data-node="${t.nodeId}"]`);
    const el = node?.querySelector<HTMLElement>(`[data-edit="${t.key}"]`);
    if (!el) continue;
    reset(el);

    const original = parseFloat(doc.defaultView!.getComputedStyle(el).fontSize);
    // Freeze the box the text must fit in. The frame can still shrink it (max-width) on narrow screens.
    el.style.boxSizing = 'border-box';
    el.style.display = 'inline-block';
    el.style.width = `${t.box.width}px`;
    el.style.maxWidth = '100%';
    el.style.height = `${t.box.height}px`;
    el.style.overflow = 'hidden';
    el.setAttribute('data-fit', 'on');

    const fits = (size: number) => {
      el.style.fontSize = `${size}px`;
      return el.scrollWidth <= el.clientWidth + 0.5 && el.scrollHeight <= el.clientHeight + 0.5;
    };
    const result = fitFontSize(original, fits);
    el.style.fontSize = `${result.size}px`;

    if (result.truncated) {
      if (el.hasAttribute('data-multiline')) {
        const lineHeight =
          parseFloat(doc.defaultView!.getComputedStyle(el).lineHeight) || result.size * 1.4;
        const lines = Math.max(1, Math.floor(t.box.height / lineHeight));
        el.style.display = '-webkit-box';
        el.style.setProperty('-webkit-box-orient', 'vertical');
        (el.style as unknown as Record<string, string>).webkitLineClamp = String(lines);
      } else {
        el.style.whiteSpace = 'nowrap';
        el.style.textOverflow = 'ellipsis';
      }
      el.setAttribute('data-fit', 'truncated');
      warnings.push({ nodeId: t.nodeId, key: t.key });
    }
  }
  return warnings;
}
