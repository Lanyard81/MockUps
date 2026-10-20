import { describe, expect, it } from 'vitest';
import { fitFontSize, minFontSize } from '../src/lib/textFit';

/** A text that fits while the font size is at most `limit`. */
const fitsUpTo = (limit: number) => (size: number) => size <= limit;

describe('minimum size', () => {
  it('is 75% of the original, but never below 12px', () => {
    expect(minFontSize(24)).toBe(18);
    expect(minFontSize(16)).toBe(12);
    expect(minFontSize(14)).toBe(12);
    expect(minFontSize(48)).toBe(36);
  });
});

describe('fitFontSize', () => {
  it('keeps the original size when the text already fits', () => {
    expect(fitFontSize(24, fitsUpTo(30))).toEqual({ size: 24, truncated: false });
  });

  it('shrinks to the largest size that fits, in half-pixel steps', () => {
    expect(fitFontSize(24, fitsUpTo(20))).toEqual({ size: 20, truncated: false });
    expect(fitFontSize(24, fitsUpTo(20.3))).toEqual({ size: 20, truncated: false });
    expect(fitFontSize(24, fitsUpTo(20.5))).toEqual({ size: 20.5, truncated: false });
  });

  it('can shrink exactly to the minimum', () => {
    expect(fitFontSize(24, fitsUpTo(18))).toEqual({ size: 18, truncated: false });
  });

  it('truncates at the minimum size when nothing larger fits', () => {
    expect(fitFontSize(24, fitsUpTo(10))).toEqual({ size: 18, truncated: true });
    expect(fitFontSize(16, fitsUpTo(5))).toEqual({ size: 12, truncated: true });
  });

  it('never goes below 12px or below 75%', () => {
    for (const original of [12, 14, 16, 20, 32, 48]) {
      const { size } = fitFontSize(original, () => false);
      expect(size).toBeGreaterThanOrEqual(Math.min(original, 12));
      expect(size).toBeGreaterThanOrEqual(original * 0.75 - 0.5);
    }
  });

  it('does not shrink text that is already at or below the minimum', () => {
    expect(fitFontSize(12, () => false)).toEqual({ size: 12, truncated: true });
    expect(fitFontSize(10, fitsUpTo(10))).toEqual({ size: 10, truncated: false });
  });

  it('calls the fit test only a handful of times (binary search)', () => {
    let calls = 0;
    fitFontSize(48, (s) => {
      calls++;
      return s <= 40;
    });
    expect(calls).toBeLessThan(12);
  });
});
