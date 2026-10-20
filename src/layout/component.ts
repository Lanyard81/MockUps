import { getComponent, getVariant } from '../catalogue';
import type { OptionDef } from '../catalogue/types';
import type { DocNode, MockupDoc } from '../store/types';

/**
 * Turns a component node into NSW markup: the variant's HTML with the node's text, hidden parts,
 * images and options applied. Text is always set with `textContent`, never as HTML.
 *
 * Nodes are immutable, so results are cached per node object: an unchanged component costs nothing
 * when something else in the frame changes.
 */
type Images = MockupDoc['images'];

const cache = new WeakMap<DocNode, { images: Images; html: string }>();

const safeKey = (s: string) => s.replace(/[^\w-]/g, '');
const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** Set an element's text, turning line breaks into <br>. */
export function setElementText(el: Element, text: string) {
  el.textContent = '';
  text.split('\n').forEach((line, i) => {
    if (i > 0) el.appendChild(el.ownerDocument.createElement('br'));
    if (line) el.appendChild(el.ownerDocument.createTextNode(line));
  });
}

/** The text of an element, with <br> as line breaks (the inverse of `setElementText`). */
export function readElementText(el: Element): string {
  let out = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.textContent ?? '';
    else if ((n as Element).tagName === 'BR') out += '\n';
    else out += (n as Element).textContent ?? '';
  });
  return out;
}

function retag(el: Element, tag: string): Element {
  const next = el.ownerDocument.createElement(tag);
  for (const a of Array.from(el.attributes)) next.setAttribute(a.name, a.value);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
  return next;
}

function applyOption(root: ParentNode, opt: OptionDef, value: unknown) {
  if (value === undefined || value === null || value === false || value === '') return;
  const els = Array.from(root.querySelectorAll(opt.selector));
  switch (opt.type) {
    case 'toggleClass':
      for (const el of els) el.classList.add(opt.className);
      break;
    case 'toggleAttr':
      for (const el of els) {
        el.setAttribute(opt.attr, '');
        if (opt.attr === 'disabled') el.setAttribute('aria-disabled', 'true');
      }
      break;
    case 'href': {
      let el = els[0];
      if (!el) break;
      if (el.tagName === 'BUTTON') {
        el = retag(el, 'a');
        el.removeAttribute('type');
        el.removeAttribute('disabled');
      }
      el.setAttribute('href', String(value));
      break;
    }
    case 'headingLevel': {
      const level = Number(value);
      if (els[0] && level >= 1 && level <= 6 && level !== opt.default) retag(els[0], `h${level}`);
      break;
    }
    case 'icon': {
      const { name, position } = asRecord(value);
      const el = els[0];
      if (!el || typeof name !== 'string' || !name) break;
      const icon = el.ownerDocument.createElement('span');
      icon.className = 'material-icons nsw-material-icons';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = name;
      if (position === 'after') el.appendChild(icon);
      else el.insertBefore(icon, el.firstChild);
      break;
    }
  }
}

export function renderComponent(node: DocNode, images: Images): string {
  const hit = cache.get(node);
  if (hit && hit.images === images) return hit.html;

  const comp = node.componentId ? getComponent(node.componentId) : undefined;
  const variant = comp ? getVariant(comp.id, node.variant) : undefined;
  if (!comp || !variant) {
    return `<p>Unknown component “${safeKey(node.componentId ?? '')}”</p>`;
  }

  const tpl = document.createElement('template');
  tpl.innerHTML = variant.html;
  const root = tpl.content;
  const props = asRecord(node.props);

  // Options first: some retag elements, and the rest of the steps look elements up afterwards.
  for (const opt of comp.options) applyOption(root, opt, props[opt.key]);

  const hidden = Array.isArray(props.hiddenParts) ? props.hiddenParts.map(String) : [];
  for (const key of hidden)
    root.querySelectorAll(`[data-optional="${safeKey(key)}"]`).forEach((el) => el.remove());

  for (const [key, text] of Object.entries(node.text ?? {})) {
    root
      .querySelectorAll(`[data-edit="${safeKey(key)}"]`)
      .forEach((el) => setElementText(el, text));
  }

  for (const [key, entry] of Object.entries(asRecord(props.images))) {
    const img = root.querySelector(`img[data-image="${safeKey(key)}"]`);
    if (!img) continue;
    const { imageId, alt } = asRecord(entry);
    const stored = typeof imageId === 'string' ? images[imageId] : undefined;
    if (stored) img.setAttribute('src', stored.dataUrl);
    if (typeof alt === 'string') img.setAttribute('alt', alt);
  }

  const html = tpl.innerHTML;
  cache.set(node, { images, html });
  return html;
}

export interface EditableField {
  key: string;
  default: string;
  multiline: boolean;
}

export interface VariantParts {
  editable: EditableField[];
  /** Keys of parts that can be shown or hidden. */
  optional: string[];
  /** Keys of replaceable images, with their placeholder alt text. */
  images: string[];
}

const describeCache = new Map<string, VariantParts>();

/** What can be edited in a particular variant's markup (read from its `data-*` markers). Cached by markup. */
export function describeVariant(html: string): VariantParts {
  const hit = describeCache.get(html);
  if (hit) return hit;
  const parts = describeUncached(html);
  describeCache.set(html, parts);
  return parts;
}

function describeUncached(html: string): VariantParts {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const root = tpl.content;
  const optional: string[] = [];
  for (const el of root.querySelectorAll('[data-optional]')) {
    const key = el.getAttribute('data-optional')!;
    if (!optional.includes(key)) optional.push(key);
  }
  return {
    editable: Array.from(root.querySelectorAll('[data-edit]')).map((el) => ({
      key: el.getAttribute('data-edit')!,
      default: readElementText(el).trim(),
      multiline: el.hasAttribute('data-multiline'),
    })),
    optional,
    images: Array.from(root.querySelectorAll('img[data-image]')).map((el) =>
      el.getAttribute('data-image')!,
    ),
  };
}
