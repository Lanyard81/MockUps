import { getComponent, getVariant, kitOfComponent } from '../catalogue';
import { getKit } from '../kits';
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

function applyOption(
  root: ParentNode,
  opt: OptionDef,
  value: unknown,
  goto: unknown,
  iconRenderer?: (name: string) => string,
) {
  if (opt.type === 'href' && typeof goto === 'string' && goto) {
    // A "go to frame" link: a real link in the markup, followed by Preview and by HTML export.
    let el = root.querySelector(opt.selector);
    if (el?.tagName === 'BUTTON') {
      el = retag(el, 'a');
      el.removeAttribute('type');
      el.removeAttribute('disabled');
    }
    el?.setAttribute('href', '#');
    el?.setAttribute('data-goto', goto);
    return;
  }
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
    case 'choice': {
      const el = els[0];
      if (!el) break;
      const chosen = opt.choices.find((c) => c.id === value);
      for (const c of opt.choices) if (c.className) el.classList.remove(c.className);
      if (chosen?.className) el.classList.add(chosen.className);
      break;
    }
    case 'iconSlot': {
      const el = els[0];
      const render = iconRenderer;
      if (el && render && typeof value === 'string' && value) el.innerHTML = render(value);
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

/** Ids the NSW script looks up by name, so they can't be made unique. */
const FIXED_IDS = new Set(['main-nav']);

/** Attributes whose value is one or more element ids. */
const ID_LIST_ATTRS = [
  'for',
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-activedescendant',
  'list',
  'form',
  'data-popover-id',
];

/**
 * Make every id in a component unique to its node, and point everything that refers to those ids at the
 * new names (`for`, `aria-*`, `#fragment` links, popover ids). Without this, the same component used
 * twice in a frame repeats its ids, which breaks labels, tabs and popovers.
 */
export function uniquifyIds(root: ParentNode, suffix: string) {
  const renamed = new Map<string, string>();
  for (const el of root.querySelectorAll('[id]')) {
    if (FIXED_IDS.has(el.id)) continue;
    const next = `${el.id}--${suffix}`;
    renamed.set(el.id, next);
    el.id = next;
  }
  if (renamed.size === 0) return;
  for (const el of root.querySelectorAll('*')) {
    for (const attr of ID_LIST_ATTRS) {
      const value = el.getAttribute(attr);
      if (value)
        el.setAttribute(
          attr,
          value
            .split(/\s+/)
            .map((t) => renamed.get(t) ?? t)
            .join(' '),
        );
    }
    const href = el.getAttribute('href');
    if (href?.startsWith('#') && renamed.has(href.slice(1)))
      el.setAttribute('href', `#${renamed.get(href.slice(1))}`);
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
  const iconRenderer = getKit(kitOfComponent(comp.id)).icons?.render;
  for (const opt of comp.options) applyOption(root, opt, props[opt.key], props.goto, iconRenderer);

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

  uniquifyIds(root, safeKey(node.id));

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

const applies = new Map<string, boolean>();

/**
 * The options that do something in this variant: those whose selector matches its markup. (An option can
 * belong to only some variants of a component, such as a table's style.) Results are cached.
 */
export function optionsForVariant(variantHtml: string, options: OptionDef[]): OptionDef[] {
  return options.filter((opt) => {
    const key = `${opt.selector}\u0000${variantHtml}`;
    let hit = applies.get(key);
    if (hit === undefined) {
      const tpl = document.createElement('template');
      tpl.innerHTML = variantHtml;
      hit = tpl.content.querySelector(opt.selector) !== null;
      if (applies.size > 2000) applies.clear();
      applies.set(key, hit);
    }
    return hit;
  });
}
