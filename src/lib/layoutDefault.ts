/** The layout new frames start with: Flow (sections and grids) or Freeform. A per-browser preference. */
export type DefaultLayout = 'flow' | 'free';
const KEY = 'pagewright.layout';

export function readDefaultLayout(): DefaultLayout {
  try {
    return localStorage.getItem(KEY) === 'free' ? 'free' : 'flow';
  } catch {
    return 'flow';
  }
}

export function saveDefaultLayout(layout: DefaultLayout): void {
  try {
    localStorage.setItem(KEY, layout);
  } catch {
    /* storage blocked: the choice just isn't remembered */
  }
}
