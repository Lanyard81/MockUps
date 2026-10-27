import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { contrast } from '../src/kits/simple/render';

/** The editor's own colour tokens must meet WCAG AA (1.4.3) where text sits on them. */
const css = readFileSync('src/styles/theme.css', 'utf8');
const block = (selector: string) => {
  const start = css.indexOf(selector);
  return css.slice(start, css.indexOf('\n}', start));
};
const dark = block(':root {');
const light = block(":root[data-theme='light']");
const token = (b: string, name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(b)![1]!.trim();
const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
/** `rgba(r,g,b,a)` over an opaque hex, as a hex. */
function over(c: string, below: string): string {
  const m = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/.exec(c);
  if (!m) return c;
  const a = Number(m[4]);
  const b = [1, 3, 5].map((i) => parseInt(below.slice(i, i + 2), 16));
  return '#' + [1, 2, 3].map((i, k) => hex(Number(m[i]) * a + b[k]! * (1 - a))).join('');
}

describe.each([
  ['dark', dark, '#1b1b25'],
  ['light', light, '#fbfbfe'],
])('%s theme tokens', (_name, block, surface) => {
  it('lets white text read on the primary fill (4.5:1)', () => {
    expect(contrast('#ffffff', token(block, '--dd-accent-fill'))).toBeGreaterThanOrEqual(4.5);
  });
  it('keeps muted and placeholder text at 4.5:1 on the surface', () => {
    expect(
      contrast(over(token(block, '--ed-text-muted'), surface), surface),
    ).toBeGreaterThanOrEqual(4.5);
    expect(contrast(over(token(block, '--dd-ink-3'), surface), surface)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});
