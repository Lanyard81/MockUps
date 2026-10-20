import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  getShade,
  hexToRgb,
  normaliseHex,
  rgbToHex,
} from '../src/kits/sharepoint/color';
import {
  THEME_PRESETS,
  generateTheme,
  readThemeSpec,
  resolveTheme,
  themeFromSpec,
  themeVars,
  variantColours,
} from '../src/kits/sharepoint/theme';

describe('colour maths', () => {
  it('reads and writes hex colours', () => {
    expect(hexToRgb('#0078D4')).toEqual({ r: 0, g: 120, b: 212 });
    expect(hexToRgb('abc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(hexToRgb('nope')).toBeNull();
    expect(rgbToHex({ r: 0, g: 120, b: 212 })).toBe('#0078d4');
    expect(normaliseHex('#ABC', '#000000')).toBe('#aabbcc');
    expect(normaliseHex('rubbish', '#123456')).toBe('#123456');
    expect(normaliseHex(42, '#123456')).toBe('#123456');
  });

  it('makes lighter and darker shades', () => {
    const base = hexToRgb('#0078d4')!;
    expect(getShade(base, 0)).toEqual(base);
    const lighter = getShade(base, 2);
    const darker = getShade(base, 8);
    expect(contrastRatio(lighter, { r: 255, g: 255, b: 255 })).toBeLessThan(
      contrastRatio(base, { r: 255, g: 255, b: 255 }),
    );
    expect(contrastRatio(darker, { r: 255, g: 255, b: 255 })).toBeGreaterThan(
      contrastRatio(base, { r: 255, g: 255, b: 255 }),
    );
  });
});

describe('theme generation', () => {
  it('the Blue preset is SharePoint’s default theme, as Microsoft tuned it', () => {
    const t = themeFromSpec({ preset: 'blue' });
    expect(t).toMatchObject({
      themePrimary: '#0078d4',
      themeLighterAlt: '#eff6fc',
      themeLighter: '#deecf9',
      themeLight: '#c7e0f4',
      themeTertiary: '#71afe5',
      themeSecondary: '#2b88d8',
      themeDarkAlt: '#106ebe',
      themeDark: '#005a9e',
      themeDarker: '#004578',
      neutralPrimary: '#323130',
      neutralLighter: '#f3f2f1',
      white: '#ffffff',
    });
  });

  it('generated tints follow Fluent’s shade tables (checked by hand for the softest and strongest)', () => {
    // #0078d4 is HSV 206/100/83; its first tint softens by 0.96: S 4, V 99.3, which is #f3f9fd.
    const t = generateTheme({ primary: '#0078d4' });
    expect(t.themeLighterAlt).toBe('#f3f9fd');
    // Tints get lighter and shades darker, in order.
    const order = [
      'themeLighterAlt',
      'themeLighter',
      'themeLight',
      'themeTertiary',
      'themeSecondary',
      'themePrimary',
      'themeDarkAlt',
      'themeDark',
      'themeDarker',
    ];
    const white = { r: 255, g: 255, b: 255 };
    const contrasts = order.map((k) => contrastRatio(hexToRgb(t[k]!)!, white));
    expect([...contrasts].sort((a, b) => a - b)).toEqual(contrasts);
  });

  it('every slot is a real colour, for every preset and for dark and custom themes', () => {
    const specs = [
      ...THEME_PRESETS.map((p) => themeFromSpec({ preset: p.id })),
      themeFromSpec({
        preset: 'custom',
        primary: '#b4009e',
        text: '#222222',
        background: '#fafafa',
      }),
      themeFromSpec({ preset: 'organisation' }),
      themeFromSpec({ preset: 'custom', primary: '#00cc6a', dark: true }),
    ];
    for (const theme of specs) {
      expect(Object.keys(theme).length).toBeGreaterThanOrEqual(23);
      for (const v of Object.values(theme)) expect(v).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('dark themes put light text on a dark background and invert the neutrals', () => {
    const dark = themeFromSpec({ preset: 'dark-blue' });
    expect(dark.white).toBe('#1b1a19');
    expect(dark.neutralPrimary).toBe('#ffffff');
    expect(contrastRatio(hexToRgb(dark.white!)!, hexToRgb(dark.neutralPrimary!)!)).toBeGreaterThan(
      7,
    );
    // Lighter neutrals are closer to the (dark) background than darker ones.
    expect(contrastRatio(hexToRgb(dark.neutralLighter!)!, hexToRgb(dark.white!)!)).toBeLessThan(
      contrastRatio(hexToRgb(dark.neutralTertiaryAlt!)!, hexToRgb(dark.white!)!),
    );
  });

  it('ignores bad input and falls back to Blue', () => {
    expect(readThemeSpec({ themePreset: 'nonsense' }).preset).toBe('blue');
    expect(readThemeSpec(null).preset).toBe('blue');
    expect(themeFromSpec({ preset: 'custom', primary: 'not-a-colour' }).themePrimary).toBe(
      '#0078d4',
    );
  });

  it('a frame’s own theme beats the document’s', () => {
    const doc = { themePreset: 'red' };
    expect(resolveTheme(undefined, doc).themePrimary).toBe('#a4262c');
    // Only when the frame switches on its own theme.
    expect(resolveTheme({ themePreset: 'green' }, doc).themePrimary).toBe('#a4262c');
    expect(resolveTheme({ themeOverride: true, themePreset: 'green' }, doc).themePrimary).toBe(
      '#498205',
    );
    expect(resolveTheme(undefined, undefined).themePrimary).toBe('#0078d4');
  });

  it('turns a theme into CSS variables and the four header, section and footer looks', () => {
    const theme = themeFromSpec({ preset: 'blue' });
    const css = themeVars(theme);
    expect(css).toContain('--sp-theme-primary:#0078d4');
    expect(css).toContain('--sp-neutral-lighter:#f3f2f1');
    expect(css).toContain('--sp-text:#323130');
    expect(variantColours(theme, 'none').bg).toBe('#ffffff');
    expect(variantColours(theme, 'neutral').bg).toBe('#f3f2f1');
    expect(variantColours(theme, 'soft').bg).toBe('#deecf9');
    expect(variantColours(theme, 'strong')).toEqual({ bg: '#0078d4', fg: '#ffffff' });
  });
});
