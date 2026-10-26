/** The editor theme: dark (the default) or light. A per-browser preference, never part of a mockup. */
export type Theme = 'dark' | 'light';
const KEY = 'pagewright.theme';

export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage blocked: the choice just isn't remembered */
  }
}

/** Set the saved theme before the first paint. */
export function applyStoredTheme(): void {
  document.documentElement.dataset.theme = readTheme();
}
