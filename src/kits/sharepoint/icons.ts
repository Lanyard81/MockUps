import { SP_ICON_PATHS } from './icons.generated';

/** Names of the bundled Fluent System Icons, sorted. */
export const SP_ICON_NAMES: string[] = Object.keys(SP_ICON_PATHS).sort();

/** An inline Fluent System Icon (MIT). Unknown names give an empty box so layouts don't jump. */
export function spIcon(name: string, extraClass = '', size = 20): string {
  const inner = SP_ICON_PATHS[name] ?? '';
  return `<svg class="sp-icon${extraClass ? ` ${extraClass}` : ''}" width="${size}" height="${size}" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false">${inner}</svg>`;
}

/** "Alex Taylor" becomes "AT". */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

/** A soft gradient placeholder picture, as a data URI so it works offline. */
export function gradientImage(a: string, b: string, width = 1200, height = 300): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<circle cx="${width * 0.82}" cy="${height * 0.2}" r="${height * 0.5}" fill="#fff" opacity=".08"/>` +
    `<circle cx="${width * 0.7}" cy="${height * 0.9}" r="${height * 0.7}" fill="#fff" opacity=".06"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
