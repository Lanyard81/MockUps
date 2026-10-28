import { describe, expect, it } from 'vitest';
import {
  readElementText,
  renderComponent,
  setElementText,
  uniquifyIds,
} from '../src/layout/component';
import { renderFrameHtml } from '../src/layout/render';
import { columnClasses, effectiveSpan, equalSpans, readSpans } from '../src/kits/nsw/spans';
import type { DocNode } from '../src/store/types';

const node = (componentId: string, variant: string, extra: Partial<DocNode> = {}): DocNode => ({
  id: 'n1',
  type: 'component',
  componentId,
  variant,
  props: {},
  text: {},
  ...extra,
});

const dom = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d;
};

describe('rendering a component node', () => {
  it('renders the variant markup untouched when nothing is customised', () => {
    const el = dom(renderComponent(node('button', 'dark'), {}));
    expect(el.querySelector('button.nsw-button.nsw-button--dark')).not.toBeNull();
    expect(el.querySelector('[data-edit="label"]')!.textContent).toBe('Button');
  });

  it('applies edited text and keeps it when the variant changes', () => {
    const text = { label: 'Get started' };
    const dark = dom(renderComponent(node('button', 'dark', { text }), {}));
    const danger = dom(renderComponent(node('button', 'danger', { text }), {}));
    expect(dark.querySelector('[data-edit="label"]')!.textContent).toBe('Get started');
    expect(danger.querySelector('.nsw-button--danger [data-edit="label"]')!.textContent).toBe(
      'Get started',
    );
  });

  it('sets text as text, never as markup', () => {
    const el = dom(
      renderComponent(
        node('button', 'dark', { text: { label: '<img src=x onerror=alert(1)>' } }),
        {},
      ),
    );
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('[data-edit="label"]')!.textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });

  it('turns line breaks into <br> and back', () => {
    const el = document.createElement('p');
    setElementText(el, 'one\ntwo\nthree');
    expect(el.querySelectorAll('br')).toHaveLength(2);
    expect(readElementText(el)).toBe('one\ntwo\nthree');
    setElementText(el, 'single');
    expect(el.querySelectorAll('br')).toHaveLength(0);
  });

  it('hides optional parts', () => {
    const el = dom(
      renderComponent(node('card', 'default', { props: { hiddenParts: ['tag', 'image'] } }), {}),
    );
    expect(el.querySelector('.nsw-card__tag')).toBeNull();
    expect(el.querySelector('.nsw-card__image')).toBeNull();
    expect(el.querySelector('.nsw-card__title')).not.toBeNull();
  });

  it('applies class and attribute options', () => {
    const el = dom(
      renderComponent(node('button', 'dark', { props: { fullWidth: true, disabled: true } }), {}),
    );
    const b = el.querySelector('button')!;
    expect(b.classList.contains('nsw-button--full-width')).toBe(true);
    expect(b.hasAttribute('disabled')).toBe(true);
    const plain = dom(renderComponent(node('button', 'dark', { props: { fullWidth: false } }), {}));
    expect(plain.querySelector('button')!.classList.contains('nsw-button--full-width')).toBe(false);
  });

  it('turns a button into a link when it has an address', () => {
    const el = dom(
      renderComponent(node('button', 'dark', { props: { href: 'https://example.com' } }), {}),
    );
    const a = el.querySelector('a.nsw-button')!;
    expect(a.getAttribute('href')).toBe('https://example.com');
    expect(el.querySelector('button')).toBeNull();
    expect(a.querySelector('[data-edit="label"]')!.textContent).toBe('Button');
  });

  it('changes heading level and leaves the default alone', () => {
    const l2 = dom(renderComponent(node('card', 'default', { props: { level: 2 } }), {}));
    expect(l2.querySelector('h2.nsw-card__title')).not.toBeNull();
    expect(l2.querySelector('h3')).toBeNull();
    const dflt = dom(renderComponent(node('card', 'default', { props: { level: 3 } }), {}));
    expect(dflt.querySelector('h3.nsw-card__title')).not.toBeNull();
  });

  it('adds an icon before or after the label', () => {
    const before = dom(
      renderComponent(
        node('button', 'dark', { props: { icon: { name: 'search', position: 'before' } } }),
        {},
      ),
    );
    const children = [...before.querySelector('button')!.children];
    expect(children[0]!.className).toContain('material-icons');
    expect(children[0]!.textContent).toBe('search');
    const after = dom(
      renderComponent(
        node('button', 'dark', { props: { icon: { name: 'east', position: 'after' } } }),
        {},
      ),
    );
    const last = [...after.querySelector('button')!.children].pop()!;
    expect(last.textContent).toBe('east');
  });

  it('swaps in an uploaded image and sets alt text', () => {
    const images = { img_1: { dataUrl: 'data:image/png;base64,AAAA' } };
    const n = node('card', 'default', {
      props: { images: { image: { imageId: 'img_1', alt: 'A tree' } } },
    });
    const img = dom(renderComponent(n, images)).querySelector('img')!;
    expect(img.getAttribute('src')).toBe('data:image/png;base64,AAAA');
    expect(img.getAttribute('alt')).toBe('A tree');
  });

  it('keeps the placeholder but applies alt text when no image is chosen', () => {
    const n = node('card', 'default', { props: { images: { image: { alt: 'Only alt' } } } });
    const img = dom(renderComponent(n, {})).querySelector('img')!;
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
    expect(img.getAttribute('alt')).toBe('Only alt');
  });

  it('caches per node, and re-renders when the node or the images change', () => {
    const n = node('button', 'dark');
    expect(renderComponent(n, {})).toBe(renderComponent(n, {}));
    const changed = { ...n, text: { label: 'New' } };
    expect(renderComponent(changed, {})).toContain('New');
  });

  it('shows a placeholder for unknown components', () => {
    expect(renderComponent(node('nope', 'x'), {})).toContain('Unknown component');
  });
});

describe('rendering frames', () => {
  it('sanitises output: no scripts, handlers or javascript: links survive', () => {
    const nodes = {
      c: node('button', 'dark', {
        id: 'c',
        props: { href: 'javascript:alert(1)' },
        text: { label: 'x' },
      }),
    };
    const html = renderFrameHtml(nodes, ['c']);
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('<script');
  });

  it('applies section background, inverted text, padding and flush containers', () => {
    const nodes: Record<string, DocNode> = {
      s: {
        id: 's',
        type: 'section',
        props: { background: 'brand-dark', padding: 'half' },
        children: ['k'],
      },
      k: { id: 'k', type: 'container', props: { flush: true }, children: [] },
    };
    const html = renderFrameHtml(nodes, ['s']);
    expect(html).toContain('nsw-section--brand-dark');
    expect(html).toContain('nsw-section--invert');
    expect(html).toContain('nsw-section--half-padding');
    expect(html).toContain('nsw-container--flush');
  });
});

describe('space above stacked components', () => {
  const column = (kids: DocNode[], extra: Record<string, DocNode> = {}) => ({
    nodes: {
      col: { id: 'col', type: 'column', children: kids.map((k) => k.id) } as DocNode,
      ...Object.fromEntries(kids.map((k) => [k.id, k])),
      ...extra,
    },
  });
  const wrapper = (html: string, id: string) =>
    new RegExp(`<div data-node="${id}"( class="([^"]*)")?>`).exec(html);

  it('gives a section heading room above it, but not when it comes first', () => {
    const { nodes } = column([
      node('paragraph', 'default', { id: 'a' }),
      node('heading', 'h2', { id: 'b' }),
      node('heading', 'h1', { id: 'c' }),
    ]);
    const html = renderFrameHtml(nodes, ['col']);
    expect(wrapper(html, 'a')?.[2]).toBeUndefined();
    expect(wrapper(html, 'b')?.[2]).toBe('nsw-m-top-lg');
    expect(wrapper(html, 'c')?.[2]).toBeUndefined(); // a page title does not open a group
    const first = column([
      node('heading', 'h2', { id: 'x' }),
      node('paragraph', 'default', { id: 'y' }),
    ]);
    expect(wrapper(renderFrameHtml(first.nodes, ['col']), 'x')?.[2]).toBeUndefined();
  });

  it('follows the person’s choice, including none, with official NSW classes', () => {
    const { nodes } = column([
      node('paragraph', 'default', { id: 'a' }),
      node('heading', 'h2', { id: 'b', props: { spaceAbove: 'none' } }),
      node('paragraph', 'default', { id: 'c', props: { spaceAbove: 'xl' } }),
    ]);
    const html = renderFrameHtml(nodes, ['col']);
    expect(wrapper(html, 'b')?.[2]).toBe('nsw-m-top-0');
    expect(wrapper(html, 'c')?.[2]).toBe('nsw-m-top-xl');
  });

  it('leaves kits without spacing alone', () => {
    const { nodes } = column([
      node('sk-paragraph', 'default', { id: 'a' }),
      node('sk-heading', 'h2', { id: 'b', props: { spaceAbove: 'lg' } }),
    ]);
    const html = renderFrameHtml(nodes, ['col'], {}, { kitId: 'simple' });
    expect(wrapper(html, 'b')?.[2]).toBeUndefined();
  });
});

describe('column spans', () => {
  it('writes NSW column classes per breakpoint', () => {
    expect(columnClasses({ spans: { base: 12, md: 6, lg: 4 } })).toBe(
      'nsw-col nsw-col-12 nsw-col-md-6 nsw-col-lg-4',
    );
    expect(columnClasses(undefined)).toBe('nsw-col nsw-col-12');
  });

  it('reads and clamps spans, and inherits upward', () => {
    expect(readSpans({ spans: { md: 20, lg: -3 } })).toEqual({ base: 12, md: 12, lg: 1 });
    expect(effectiveSpan({ base: 12, md: 6 }, 'sm')).toBe(12);
    expect(effectiveSpan({ base: 12, md: 6 }, 'xl')).toBe(6);
  });

  it('makes equal widths', () => {
    expect(equalSpans(3)).toEqual({ base: 12, md: 4 });
    expect(equalSpans(5)).toEqual({ base: 12, md: 2 });
  });
});

describe('unique ids', () => {
  const ids = (html: string) => [...dom(html).querySelectorAll('[id]')].map((e) => e.id);

  it('gives the same component different ids in different nodes', () => {
    const a = renderComponent(node('form', 'text', { id: 'n_a' }), {});
    const b = renderComponent(node('form', 'text', { id: 'n_b' }), {});
    const all = [...ids(a), ...ids(b)];
    expect(all.length).toBeGreaterThan(1);
    expect(new Set(all).size).toBe(all.length);
  });

  it('keeps a label pointing at its own input', () => {
    const el = dom(renderComponent(node('form', 'text', { id: 'n_a' }), {}));
    const input = el.querySelector('input')!;
    expect(el.querySelector('label')!.getAttribute('for')).toBe(input.id);
    expect(input.id).toContain('n_a');
  });

  it('keeps tabs wired: each link points at a panel in the same component', () => {
    const el = dom(renderComponent(node('tabs', 'default', { id: 'n_t' }), {}));
    for (const a of el.querySelectorAll('a[href^="#"]')) {
      const target = el.querySelector(`[id="${a.getAttribute('href')!.slice(1)}"]`);
      expect(target).not.toBeNull();
      expect(target!.id).toContain('n_t');
    }
  });

  it('updates aria references and popover ids together', () => {
    const el = dom(renderComponent(node('popover', 'default', { id: 'n_p' }), {}));
    const trigger = el.querySelector('[data-popover-id]')!;
    expect(el.querySelector(`[id="${trigger.getAttribute('data-popover-id')}"]`)).not.toBeNull();
    const dlg = dom(renderComponent(node('dialog', 'default', { id: 'n_d' }), {}));
    const wrapper = dlg.querySelector('[aria-labelledby]')!;
    expect(dlg.querySelector(`[id="${wrapper.getAttribute('aria-labelledby')}"]`)).not.toBeNull();
  });

  it('leaves ids the NSW script looks up by name', () => {
    expect(ids(renderComponent(node('main-nav', 'default', { id: 'n_m' }), {}))).toContain(
      'main-nav',
    );
  });

  it('is stable: the same node always gets the same ids', () => {
    const n = node('form', 'text', { id: 'n_s' });
    expect(ids(renderComponent(n, {}))).toEqual(
      ids(renderComponent({ ...n, text: { label: 'x' } }, {})),
    );
  });

  it('rewrites a fragment in place and ignores fragments without ids', () => {
    const d = dom(
      '<label for="x">L</label><input id="x"><a href="#x">go</a><a href="#other">no</a>',
    );
    uniquifyIds(d, 's1');
    expect(d.querySelector('input')!.id).toBe('x--s1');
    expect(d.querySelector('label')!.getAttribute('for')).toBe('x--s1');
    expect(d.querySelectorAll('a')[0]!.getAttribute('href')).toBe('#x--s1');
    expect(d.querySelectorAll('a')[1]!.getAttribute('href')).toBe('#other');
    const none = dom('<p>hi</p>');
    uniquifyIds(none, 's2');
    expect(none.innerHTML).toBe('<p>hi</p>');
  });
});
