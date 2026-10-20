import { describe, expect, it } from 'vitest';
import { readElementText, renderComponent, setElementText } from '../src/layout/component';
import { renderFrameHtml } from '../src/layout/render';
import { columnClasses, effectiveSpan, equalSpans, readSpans } from '../src/layout/spans';
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
