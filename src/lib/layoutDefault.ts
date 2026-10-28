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

const STRUCTURE_KEY = 'pagewright.structure';

/** Whether to show containers and grids in the selection path (an "advanced" switch, off by default). */
export function readShowStructure(): boolean {
  try {
    return localStorage.getItem(STRUCTURE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveShowStructure(on: boolean): void {
  try {
    localStorage.setItem(STRUCTURE_KEY, on ? '1' : '0');
  } catch {
    /* storage blocked: the choice just isn't remembered */
  }
}
