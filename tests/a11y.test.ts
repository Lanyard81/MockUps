import { describe, expect, it } from 'vitest';
import {
  checkImages,
  checkStructure,
  contrastRatio,
  over,
  parseCssColor,
  requiredContrast,
} from '../src/lib/a11y';

const page = (html: string) => {
  const d = document.implementation.createHTMLDocument('t');
  d.body.innerHTML = html;
  return d.body;
};
const rules = (html: string) => checkStructure(page(html)).map((i) => i.rule);

describe('accessibility structure checks', () => {
  it('accepts a tidy page', () => {
    expect(rules('<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2><a href="#">Go</a>')).toEqual([]);
  });
  it('flags skipped heading levels, a missing h1 and several', () => {
    expect(rules('<h1>A</h1><h3>B</h3>')).toEqual(['heading-order']);
    expect(rules('<h2>A</h2>')).toEqual(['heading-order']);
    expect(rules('<h1>A</h1><h1>B</h1>')).toEqual(['heading-order']);
  });
  it('flags empty headings, unnamed links and buttons', () => {
    expect(rules('<h1></h1>')).toContain('heading-empty');
    expect(rules('<h1>A</h1><a href="#"></a>')).toEqual(['link-name']);
    expect(rules('<h1>A</h1><button></button>')).toEqual(['link-name']);
    expect(
      rules('<h1>A</h1><a href="#" aria-label="Home"></a><button title="Go"></button>'),
    ).toEqual([]);
    expect(rules('<h1>A</h1><a href="#"><img alt="Logo" src="x"></a>')).toEqual([]);
  });
  it('flags form fields with no label', () => {
    expect(rules('<h1>A</h1><input type="text">')).toEqual(['form-label']);
    expect(rules('<h1>A</h1><label>Name <input></label>')).toEqual([]);
    expect(rules('<h1>A</h1><label for="n">Name</label><input id="n">')).toEqual([]);
    expect(rules('<h1>A</h1><input type="hidden"><input type="submit">')).toEqual([]);
  });
  it('flags uploaded pictures with no alt text', () => {
    const nodes = {
      a: { props: { images: { photo: { imageId: 'img1', alt: '' } } } },
      b: { props: { images: { photo: { imageId: 'img2', alt: 'A dog' } } } },
      c: { props: { images: { photo: { alt: '' } } } },
    };
    expect(checkImages(nodes, ['a', 'b', 'c']).map((i) => i.nodeId)).toEqual(['a']);
  });
});

describe('contrast', () => {
  it('reads computed colours', () => {
    expect(parseCssColor('rgb(0, 128, 255)')).toEqual([0, 128, 255, 1]);
    expect(parseCssColor('rgba(0, 0, 0, 0.5)')).toEqual([0, 0, 0, 0.5]);
    expect(parseCssColor('transparent')).toEqual([0, 0, 0, 0]);
    expect(parseCssColor('nonsense')).toBeNull();
  });
  it('matches the WCAG ratios', () => {
    expect(contrastRatio([0, 0, 0, 1], [255, 255, 255, 1])).toBeCloseTo(21, 1);
    expect(contrastRatio([119, 119, 119, 1], [255, 255, 255, 1])).toBeCloseTo(4.48, 1);
    expect(contrastRatio([255, 255, 255, 1], [255, 255, 255, 1])).toBe(1);
  });
  it('composites a translucent colour over another', () => {
    expect(over([0, 0, 0, 0.5], [255, 255, 255, 1])).toEqual([127.5, 127.5, 127.5, 1]);
  });
  it('asks less of large text', () => {
    expect(requiredContrast(16, false)).toBe(4.5);
    expect(requiredContrast(24, false)).toBe(3);
    expect(requiredContrast(19, true)).toBe(3);
    expect(requiredContrast(19, false)).toBe(4.5);
  });
});
