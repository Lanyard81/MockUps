/**
 * Colour maths for theme generation: hex, RGB and HSV conversion and the "shade" tables that turn
 * one colour into the lighter and darker slots of a Fluent UI (Office UI Fabric) theme.
 *
 * The shade logic is ported from `@fluentui/react` (`utilities/color/shades`), MIT licence,
 * © Microsoft Corporation, so generated palettes match what SharePoint's theme designer produces.
 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const MAX = 255;
const clamp = (value: number, max: number, min = 0) =>
  value < min ? min : value > max ? max : value;

/** `#rgb` or `#rrggbb` (with or without the #) to RGB, or null if it isn't a colour. */
export function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1]!;
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export const rgbToHex = ({ r, g, b }: Rgb): string =>
  '#' + [r, g, b].map((c) => clamp(Math.round(c), MAX).toString(16).padStart(2, '0')).join('');

/** A hex colour in canonical `#rrggbb` form, or the fallback if it isn't valid. */
export function normaliseHex(value: unknown, fallback: string): string {
  const rgb = typeof value === 'string' ? hexToRgb(value) : null;
  return rgb ? rgbToHex(rgb) : fallback;
}

export function rgb2hsv({ r, g, b }: Rgb): Hsv {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h: number;
  if (delta === 0) h = 0;
  else if (r === max) h = ((g - b) / delta) % 6;
  else if (g === max) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return {
    h,
    s: Math.round((max === 0 ? 0 : delta / max) * 100),
    v: Math.round((max / MAX) * 100),
  };
}

export function hsv2rgb(h: number, s: number, v: number): Rgb {
  s /= 100;
  v /= 100;
  const c = v * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = v - c;
  const table: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const rgb = table[Math.floor(hh) % 6] ?? [0, 0, 0];
  return {
    r: Math.round(MAX * (rgb[0] + m)),
    g: Math.round(MAX * (rgb[1] + m)),
    b: Math.round(MAX * (rgb[2] + m)),
  };
}

/** Lightness (0–100) of an HSV colour. */
export function lightness({ s, v }: Hsv): number {
  const sat = s / 100;
  const val = v / 100;
  return ((2 - sat) * val * 100) / 2;
}

export const isDarkColour = (rgb: Rgb): boolean => lightness(rgb2hsv(rgb)) < 50;

// Luminance multipliers for generating the shades of a colour (from Fluent UI).
const WhiteShadeTableBG = [0.027, 0.043, 0.082, 0.145, 0.184, 0.216, 0.349, 0.537];
const BlackTintTableBG = [0.537, 0.45, 0.349, 0.216, 0.184, 0.145, 0.082, 0.043];
const WhiteShadeTable = [0.537, 0.349, 0.216, 0.184, 0.145, 0.082, 0.043, 0.027];
const BlackTintTable = [0.537, 0.45, 0.349, 0.216, 0.184, 0.145, 0.082, 0.043];
const LumTintTable = [0.88, 0.77, 0.66, 0.55, 0.44, 0.33, 0.22, 0.11];
const LumShadeTable = [0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88];
const ColorTintTable = [0.96, 0.84, 0.7, 0.4, 0.12];
const ColorShadeTable = [0.1, 0.24, 0.44];
const LOW_LUMINANCE = 0.2;
const HIGH_LUMINANCE = 0.8;

/** 1 (softest) to 8 (strongest); 0 is the colour itself. */
export type ShadeStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const darken = (hsv: Hsv, factor: number): Hsv => ({
  h: hsv.h,
  s: hsv.s,
  v: clamp(hsv.v - hsv.v * factor, 100),
});
const lighten = (hsv: Hsv, factor: number): Hsv => ({
  h: hsv.h,
  s: clamp(hsv.s - hsv.s * factor, 100),
  v: clamp(hsv.v + (100 - hsv.v) * factor, 100),
});

/** A shade (or tint) of a colour, the way Fluent UI's theme generator makes it. */
export function getShade(color: Rgb, shade: ShadeStep, isInverted = false): Rgb {
  if (shade === 0) return color;
  const base = rgb2hsv(color);
  const l = lightness(base) / 100;
  const i = shade - 1;
  const soften = isInverted ? darken : lighten;
  const strongen = isInverted ? lighten : darken;
  let hsv: Hsv;
  if (color.r === MAX && color.g === MAX && color.b === MAX)
    hsv = darken(base, WhiteShadeTable[i]!);
  else if (color.r === 0 && color.g === 0 && color.b === 0) hsv = lighten(base, BlackTintTable[i]!);
  else if (l > HIGH_LUMINANCE) hsv = strongen(base, LumShadeTable[i]!);
  else if (l < LOW_LUMINANCE) hsv = soften(base, LumTintTable[i]!);
  else if (i < ColorTintTable.length) hsv = soften(base, ColorTintTable[i]!);
  else hsv = strongen(base, ColorShadeTable[i - ColorTintTable.length]!);
  return hsv2rgb(hsv.h, hsv.s, hsv.v);
}

/** Background shades: the given colour is always the lightest (or, inverted, the darkest). */
export function getBackgroundShade(color: Rgb, shade: ShadeStep, isInverted = false): Rgb {
  if (shade === 0) return color;
  const base = rgb2hsv(color);
  const i = shade - 1;
  const hsv = isInverted
    ? lighten(base, BlackTintTableBG[BlackTintTable.length - 1 - i]!)
    : darken(base, WhiteShadeTableBG[i]!);
  return hsv2rgb(hsv.h, hsv.s, hsv.v);
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const channel = (x: number) => {
    const v = x / MAX;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (c: Rgb) =>
    0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b) + 0.05;
  const [x, y] = [lum(a), lum(b)];
  return x / y > 1 ? x / y : y / x;
}

/** Black or white text, whichever reads better on this background. */
export const readableOn = (bg: Rgb): '#000000' | '#ffffff' =>
  contrastRatio(bg, { r: 0, g: 0, b: 0 }) >= contrastRatio(bg, { r: 255, g: 255, b: 255 })
    ? '#000000'
    : '#ffffff';
