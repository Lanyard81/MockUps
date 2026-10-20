/** Fluent UI theme slots for a theme. The defaults are SharePoint's Blue theme. */
export interface SpTheme {
  [slot: string]: string;
}

export const BLUE_THEME: SpTheme = {
  themePrimary: '#0078d4',
  themeLighterAlt: '#eff6fc',
  themeLighter: '#deecf9',
  themeLight: '#c7e0f4',
  themeTertiary: '#71afe5',
  themeSecondary: '#2b88d8',
  themeDarkAlt: '#106ebe',
  themeDark: '#005a9e',
  themeDarker: '#004578',
  neutralLighterAlt: '#faf9f8',
  neutralLighter: '#f3f2f1',
  neutralLight: '#edebe9',
  neutralQuaternaryAlt: '#e1dfdd',
  neutralQuaternary: '#d0d0d0',
  neutralTertiaryAlt: '#c8c6c4',
  neutralTertiary: '#a19f9d',
  neutralSecondary: '#605e5c',
  neutralPrimaryAlt: '#3b3a39',
  neutralPrimary: '#323130',
  neutralDark: '#201f1e',
  white: '#ffffff',
  black: '#000000',
};

/** CSS custom properties for a theme, on the `.sp-site` wrapper. */
export function themeVars(theme: SpTheme): string {
  const slots = Object.entries(theme)
    .map(([k, v]) => `--sp-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`)
    .join(';');
  return `${slots};--sp-text:${theme.neutralPrimary};--sp-bg:${theme.white};--sp-link:${theme.themePrimary}`;
}
