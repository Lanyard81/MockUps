import {
  getBackgroundShade,
  getShade,
  hexToRgb,
  isDarkColour,
  normaliseHex,
  readableOn,
  rgbToHex,
  type Rgb,
  type ShadeStep,
} from './color';

/** Fluent UI theme slots (Office UI Fabric palette names), as hex colours. */
export type SpTheme = Record<string, string>;

/** What a theme is made from. `preset` names a ready-made theme, or is `custom` / `organisation`. */
export interface ThemeSpec {
  preset: string;
  /** For custom themes: the main colour, and optionally text and background colours. */
  primary?: string;
  text?: string;
  background?: string;
  dark?: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  dark: boolean;
}

/**
 * SharePoint's ready-made themes. Names and colours follow `docs/SHAREPOINT-OOB.md` (Microsoft's
 * palette); the exact set in a tenant should be checked against a real site.
 */
export const THEME_PRESETS: readonly ThemePreset[] = [
  { id: 'blue', name: 'Blue', primary: '#0078d4', dark: false },
  { id: 'teal', name: 'Teal', primary: '#007780', dark: false },
  { id: 'orange', name: 'Orange', primary: '#ca5010', dark: false },
  { id: 'red', name: 'Red', primary: '#a4262c', dark: false },
  { id: 'purple', name: 'Purple', primary: '#8764b8', dark: false },
  { id: 'green', name: 'Green', primary: '#498205', dark: false },
  { id: 'grey', name: 'Grey', primary: '#69797e', dark: false },
  { id: 'dark-yellow', name: 'Dark yellow', primary: '#ffc83d', dark: true },
  { id: 'dark-blue', name: 'Dark blue', primary: '#3a96dd', dark: true },
];

export const DEFAULT_THEME_ID = 'blue';
/** The "Organisation theme" starting point: editable, like any custom theme. */
export const ORGANISATION_PRIMARY = '#4f6bed';

const LIGHT_BG = '#ffffff';
const LIGHT_TEXT = '#323130';
const DARK_BG = '#1b1a19';
const DARK_TEXT = '#ffffff';

// Fluent's default light neutrals, used as they are when the text and background colours are the defaults.
const DEFAULT_NEUTRALS: SpTheme = {
  neutralLighterAlt: '#faf9f8',
  neutralLighter: '#f3f2f1',
  neutralLight: '#edebe9',
  neutralQuaternaryAlt: '#e1dfdd',
  neutralQuaternary: '#d0d0d0',
  neutralTertiaryAlt: '#c8c6c4',
  neutralTertiary: '#a19f9d',
  neutralSecondaryAlt: '#8a8886',
  neutralSecondary: '#605e5c',
  neutralPrimaryAlt: '#3b3a39',
  neutralPrimary: '#323130',
  neutralDark: '#201f1e',
  black: '#000000',
  white: '#ffffff',
};

/**
 * SharePoint's default Blue theme is hand-tuned by Microsoft, so its slots are used as they are
 * (generating from the same main colour gives slightly different tints). Other presets are generated.
 */
const BLUE_SLOTS: SpTheme = {
  themePrimary: '#0078d4',
  themeLighterAlt: '#eff6fc',
  themeLighter: '#deecf9',
  themeLight: '#c7e0f4',
  themeTertiary: '#71afe5',
  themeSecondary: '#2b88d8',
  themeDarkAlt: '#106ebe',
  themeDark: '#005a9e',
  themeDarker: '#004578',
};

const rgb = (hex: string, fallback: string): Rgb => hexToRgb(hex) ?? hexToRgb(fallback)!;
const SHADES: ShadeStep[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * The full set of theme slots from a main colour (and optional text and background colours), the
 * way SharePoint's theme designer does it: the theme colours are tints and shades of the main
 * colour; the neutrals come from the background and text colours.
 */
export function generateTheme(spec: {
  primary: string;
  text?: string;
  background?: string;
  dark?: boolean;
}): SpTheme {
  const dark = spec.dark === true;
  const primary = normaliseHex(spec.primary, '#0078d4');
  const background = normaliseHex(spec.background, dark ? DARK_BG : LIGHT_BG);
  const text = normaliseHex(spec.text, dark ? DARK_TEXT : LIGHT_TEXT);
  const inverted = isDarkColour(rgb(background, LIGHT_BG));

  const p = rgb(primary, '#0078d4');
  const [lighterAlt, lighter, light, tertiary, secondary, darkAlt, darkC, darker] = SHADES.map(
    (n) => rgbToHex(getShade(p, n, inverted)),
  ) as [string, string, string, string, string, string, string, string];

  const theme: SpTheme = {
    themePrimary: primary,
    themeLighterAlt: lighterAlt,
    themeLighter: lighter,
    themeLight: light,
    themeTertiary: tertiary,
    themeSecondary: secondary,
    themeDarkAlt: darkAlt,
    themeDark: darkC,
    themeDarker: darker,
  };

  if (!dark && background === LIGHT_BG && text === LIGHT_TEXT) {
    return { ...theme, ...DEFAULT_NEUTRALS };
  }

  const bg = rgb(background, LIGHT_BG);
  const fg = rgb(text, LIGHT_TEXT);
  const bgShade = (n: ShadeStep) => rgbToHex(getBackgroundShade(bg, n, inverted));
  const fgShade = (n: ShadeStep) => rgbToHex(getShade(fg, n, inverted));
  return {
    ...theme,
    white: background,
    neutralLighterAlt: bgShade(1),
    neutralLighter: bgShade(2),
    neutralLight: bgShade(3),
    neutralQuaternaryAlt: bgShade(4),
    neutralQuaternary: bgShade(5),
    neutralTertiaryAlt: bgShade(6),
    neutralTertiary: fgShade(3),
    neutralSecondaryAlt: fgShade(4),
    neutralSecondary: fgShade(4),
    neutralPrimaryAlt: fgShade(5),
    neutralPrimary: text,
    neutralDark: fgShade(7),
    black: fgShade(8),
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Read a theme choice from settings (the document's, or a frame's own), filling in defaults and
 * ignoring anything that isn't valid. Keys: `themePreset`, `themePrimary`, `themeText`,
 * `themeBackground`, `themeDark`.
 */
export function readThemeSpec(raw: unknown): ThemeSpec {
  const o = isRecord(raw) ? raw : {};
  const preset = typeof o.themePreset === 'string' ? o.themePreset : DEFAULT_THEME_ID;
  const known =
    THEME_PRESETS.some((t) => t.id === preset) || preset === 'custom' || preset === 'organisation';
  return {
    preset: known ? preset : DEFAULT_THEME_ID,
    primary: typeof o.themePrimary === 'string' ? o.themePrimary : undefined,
    text: typeof o.themeText === 'string' ? o.themeText : undefined,
    background: typeof o.themeBackground === 'string' ? o.themeBackground : undefined,
    dark: o.themeDark === true,
  };
}

/** The slots for a theme choice. */
export function themeFromSpec(spec: ThemeSpec): SpTheme {
  const preset = THEME_PRESETS.find((t) => t.id === spec.preset);
  if (preset?.id === DEFAULT_THEME_ID) return { ...BLUE_SLOTS, ...DEFAULT_NEUTRALS };
  if (preset) return generateTheme({ primary: preset.primary, dark: preset.dark });
  const org = spec.preset === 'organisation';
  return generateTheme({
    primary: normaliseHex(spec.primary, org ? ORGANISATION_PRIMARY : '#0078d4'),
    text: spec.text,
    background: spec.background,
    dark: spec.dark,
  });
}

/**
 * The theme a frame uses: its own choice if it has switched on "a different theme on this frame"
 * (`themeOverride`), otherwise the document's SharePoint theme, otherwise Blue.
 */
export function resolveTheme(
  frameSettings: Record<string, unknown> | undefined,
  kitSettings: Record<string, unknown> | undefined,
): SpTheme {
  return themeFromSpec(
    readThemeSpec(frameSettings?.themeOverride === true ? frameSettings : kitSettings),
  );
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** CSS custom properties for a theme, set on the `.sp-site` wrapper (so a theme change is one style attribute). */
export function themeVars(theme: SpTheme): string {
  const slots = Object.entries(theme).map(([k, v]) => `--sp-${kebab(k)}:${v}`);
  const strong = hexToRgb(theme.themePrimary ?? '#0078d4')!;
  return [
    ...slots,
    `--sp-text:${theme.neutralPrimary}`,
    `--sp-bg:${theme.white}`,
    `--sp-link:${theme.themePrimary}`,
    `--sp-on-strong:${readableOn(strong)}`,
  ].join(';');
}

/** The four theme-derived looks for a header, section or footer: None, Neutral, Soft, Strong. */
export const VARIANTS = ['none', 'neutral', 'soft', 'strong'] as const;
export type Variant = (typeof VARIANTS)[number];

export function variantColours(theme: SpTheme, variant: Variant): { bg: string; fg: string } {
  switch (variant) {
    case 'neutral':
      return { bg: theme.neutralLighter!, fg: theme.neutralPrimary! };
    case 'soft':
      return { bg: theme.themeLighter!, fg: theme.neutralPrimary! };
    case 'strong':
      return { bg: theme.themePrimary!, fg: readableOn(hexToRgb(theme.themePrimary!)!) };
    default:
      return { bg: theme.white!, fg: theme.neutralPrimary! };
  }
}
