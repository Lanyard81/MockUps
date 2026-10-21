/**
 * Turn the canvas markup into markup a developer would want: the editor's own markers removed,
 * "go to frame" links turned into real links, and (optionally) the wrapper divs unwrapped.
 */
const EDITOR_ATTRS = [
  'data-node',
  'data-free',
  'data-free-board',
  'data-empty',
  'data-edit',
  'data-optional',
  'data-image',
  'data-multiline',
  'data-fit',
  'data-editing',
  'data-setting-edit',
  'data-layout',
  'data-variant',
  'contenteditable',
];

export interface CleanOptions {
  /** Frame id to the file it was exported to, for `data-goto` links. */
  links?: Record<string, string>;
  /** Replace each component's wrapper div with its contents. */
  unwrap?: boolean;
}

export function cleanForExport(html: string, options: CleanOptions = {}): string {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;

  for (const el of Array.from(root.querySelectorAll('[data-goto]'))) {
    const target = options.links?.[el.getAttribute('data-goto')!];
    el.setAttribute('href', target ?? '#');
    el.removeAttribute('data-goto');
  }

  if (options.unwrap) {
    // Wrappers are bare `<div data-node>` elements: nothing else about them is meaningful.
    for (const el of Array.from(root.querySelectorAll('div[data-node]'))) {
      if (el.attributes.length === 1) el.replaceWith(...Array.from(el.childNodes));
    }
  }
  for (const el of root.querySelectorAll('*')) for (const a of EDITOR_ATTRS) el.removeAttribute(a);
  return tpl.innerHTML;
}

const INLINE = new Set([
  'a',
  'span',
  'strong',
  'em',
  'b',
  'i',
  'small',
  'abbr',
  'code',
  'br',
  'label',
  'sup',
  'sub',
  'button',
  'img',
  'svg',
  'path',
  'time',
]);
const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source']);

/** Indent block-level markup so it reads well when pasted into a codebase. */
export function formatHtml(html: string): string {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const lines: string[] = [];
  const walk = (node: Node, depth: number) => {
    const pad = '  '.repeat(depth);
    if (node.nodeType === 3) {
      const t = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (t) lines.push(pad + t.replace(/&/g, '&amp;').replace(/</g, '&lt;'));
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const hasBlockChild = Array.from(el.children).some((c) => !INLINE.has(c.tagName.toLowerCase()));
    const compact = el.outerHTML;
    if (
      VOID.has(tag) ||
      (!hasBlockChild && compact.length < 120) ||
      (INLINE.has(tag) && !hasBlockChild)
    ) {
      lines.push(pad + compact.replace(/\s+/g, ' '));
      return;
    }
    const open = compact.slice(0, compact.indexOf('>') + 1);
    lines.push(pad + open);
    el.childNodes.forEach((c) => walk(c, depth + 1));
    lines.push(`${pad}</${tag}>`);
  };
  tpl.content.childNodes.forEach((c) => walk(c, 0));
  return lines.join('\n');
}
