/**
 * Accessibility checks for a rendered page (Milestone G9). They look at the page the way a browser or a
 * screen reader would: headings in order, names on links and fields, text colour against what is behind it.
 * Structure checks need only the markup; contrast needs a browser (computed styles).
 */
export interface A11yIssue {
  rule: 'heading-order' | 'heading-empty' | 'link-name' | 'form-label' | 'image-alt' | 'contrast';
  severity: 'error' | 'warning';
  message: string;
  /** The component it is in (a node id), if known. */
  nodeId: string | null;
}

const nodeOf = (el: Element): string | null =>
  el.closest('[data-node]')?.getAttribute('data-node') ?? null;
const textOf = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

/** The name a person would hear for a link or button: its text, an aria-label, a title or a picture's alt. */
function accessibleName(el: Element): string {
  const label = el.getAttribute('aria-label')?.trim();
  if (label) return label;
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    const t = labelledby
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim();
    if (t) return t;
  }
  const text = textOf(el);
  if (text) return text;
  const alt = el.querySelector('img[alt]')?.getAttribute('alt')?.trim();
  if (alt) return alt;
  return el.getAttribute('title')?.trim() ?? '';
}

/** Headings, links, buttons and form fields: what they are called and in what order. */
export function checkStructure(root: ParentNode): A11yIssue[] {
  const issues: A11yIssue[] = [];

  const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  let previous = 0;
  let h1s = 0;
  for (const h of headings) {
    const level = Number(h.tagName[1]);
    if (!textOf(h) && !h.querySelector('img[alt]:not([alt=""])'))
      issues.push({
        rule: 'heading-empty',
        severity: 'error',
        message: `An empty heading (h${level}) is announced as nothing.`,
        nodeId: nodeOf(h),
      });
    if (level === 1) h1s++;
    if (previous && level > previous + 1)
      issues.push({
        rule: 'heading-order',
        severity: 'warning',
        message: `“${textOf(h).slice(0, 40)}” is an h${level} straight after an h${previous}. Don’t skip heading levels.`,
        nodeId: nodeOf(h),
      });
    previous = level;
  }
  if (headings.length > 0 && h1s === 0)
    issues.push({
      rule: 'heading-order',
      severity: 'warning',
      message: 'The page has no main heading (h1).',
      nodeId: null,
    });
  if (h1s > 1)
    issues.push({
      rule: 'heading-order',
      severity: 'warning',
      message: `The page has ${h1s} main headings (h1); use one.`,
      nodeId: null,
    });

  for (const el of root.querySelectorAll('a[href], button')) {
    if (el.getAttribute('aria-hidden') === 'true' || (el as HTMLButtonElement).disabled) continue;
    if (!accessibleName(el))
      issues.push({
        rule: 'link-name',
        severity: 'error',
        message: `${el.tagName === 'A' ? 'A link' : 'A button'} has no name, so a screen reader can only say “${el.tagName === 'A' ? 'link' : 'button'}”.`,
        nodeId: nodeOf(el),
      });
  }

  const doc = (root as Document).ownerDocument ?? (root as Document);
  for (const el of root.querySelectorAll('input, select, textarea')) {
    const type = (el.getAttribute('type') ?? 'text').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue;
    const id = el.getAttribute('id');
    const labelled =
      !!el.getAttribute('aria-label')?.trim() ||
      !!el.getAttribute('aria-labelledby') ||
      !!el.getAttribute('title')?.trim() ||
      !!el.closest('label') ||
      (!!id && [...doc.querySelectorAll('label[for]')].some((l) => l.getAttribute('for') === id));
    if (!labelled)
      issues.push({
        rule: 'form-label',
        severity: 'error',
        message: 'A form field has no label.',
        nodeId: nodeOf(el),
      });
  }
  return issues;
}

/** Pictures the person added with no description (a placeholder picture isn't checked). */
export function checkImages(
  nodes: Record<string, { props?: Record<string, unknown> }>,
  ids: string[],
): A11yIssue[] {
  const issues: A11yIssue[] = [];
  for (const id of ids) {
    const images = nodes[id]?.props?.images;
    if (!images || typeof images !== 'object') continue;
    for (const entry of Object.values(images as Record<string, { imageId?: string; alt?: string }>))
      if (entry?.imageId && !(entry.alt ?? '').trim())
        issues.push({
          rule: 'image-alt',
          severity: 'warning',
          message:
            'A picture has no description (alt text). Describe it, or leave it empty only if it is purely decoration.',
          nodeId: id,
        });
  }
  return issues;
}

// ---- Contrast ----

export type Rgba = [number, number, number, number];

/** Read a CSS colour as computed by a browser (`rgb(...)`, `rgba(...)`, or `color(srgb ...)`). */
export function parseCssColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase();
  if (v === 'transparent') return [0, 0, 0, 0];
  let m = v.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const a =
      m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [Number(m[1]), Number(m[2]), Number(m[3]), a];
  }
  m = v.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const a =
      m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [Number(m[1]) * 255, Number(m[2]) * 255, Number(m[3]) * 255, a];
  }
  return null;
}

/** A colour painted over another (the top one's alpha decides how much shows through). */
export function over(top: Rgba, below: Rgba): Rgba {
  const a = top[3] + below[3] * (1 - top[3]);
  if (a === 0) return [0, 0, 0, 0];
  const mix = (i: 0 | 1 | 2) => (top[i] * top[3] + below[i] * below[3] * (1 - top[3])) / a;
  return [mix(0), mix(1), mix(2), a];
}

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgba) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG contrast ratio between two opaque colours, 1 to 21. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The ratio text needs: 3 for large text (24px, or 18.66px bold), else 4.5. */
export const requiredContrast = (fontSizePx: number, bold: boolean): number =>
  fontSizePx >= 24 || (bold && fontSizePx >= 18.66) ? 3 : 4.5;

/**
 * Text colour against what it sits on, for every element in `root` that has text of its own. The
 * background is the first ancestor painting a colour; anything over a picture or gradient is skipped
 * (it can't be judged from a colour). Needs a browser's computed styles.
 */
export function checkContrast(root: HTMLElement): A11yIssue[] {
  const win = root.ownerDocument.defaultView;
  if (!win) return [];
  const seen = new Set<string>();
  const issues: A11yIssue[] = [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || !(n.textContent ?? '').trim()) continue;
    if (['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
    const cs = win.getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const fg = parseCssColor(cs.color);
    if (!fg) continue;
    // Walk up for the background, stopping if a picture is painted behind the text.
    let bg: Rgba = [0, 0, 0, 0];
    let skip = false;
    for (let a: Element | null = el; a; a = a.parentElement) {
      const acs = win.getComputedStyle(a);
      if (acs.backgroundImage && acs.backgroundImage !== 'none') {
        skip = true;
        break;
      }
      const c = parseCssColor(acs.backgroundColor);
      // Layers nearer the text sit on top of those further up the tree.
      if (c && c[3] > 0) bg = over(bg, c);
      if (bg[3] >= 1) break;
    }
    if (skip) continue;
    const base: Rgba = bg[3] >= 1 ? bg : over(bg, [255, 255, 255, 1]); // a page is white behind everything
    const text = over(fg, base);
    const ratio = contrastRatio(text, base);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = requiredContrast(size, bold);
    if (ratio + 0.01 < need) {
      const nodeId = nodeOf(el);
      const key = `${nodeId}|${cs.color}|${cs.backgroundColor}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({
        rule: 'contrast',
        severity: 'error',
        message: `Text “${(n.textContent ?? '').trim().slice(0, 30)}” has a contrast of ${ratio.toFixed(1)}:1; it needs ${need}:1.`,
        nodeId,
      });
    }
  }
  return issues;
}
