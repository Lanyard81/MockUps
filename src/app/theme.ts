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
  document.documentElement.dataset.look = readLook();
}

/** The editor look: glass (the default) or flat. Independent of dark and light; also a per-browser preference. */
export type Look = 'glass' | 'flat';
const LOOK_KEY = 'pagewright.look';

export function readLook(): Look {
  try {
    return localStorage.getItem(LOOK_KEY) === 'flat' ? 'flat' : 'glass';
  } catch {
    return 'glass';
  }
}

export function applyLook(look: Look): void {
  document.documentElement.dataset.look = look;
  try {
    localStorage.setItem(LOOK_KEY, look);
  } catch {
    /* storage blocked: the choice just isn't remembered */
  }
}
