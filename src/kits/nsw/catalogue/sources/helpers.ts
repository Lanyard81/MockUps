/** Shared snippets for hand-written NSW markup. */

export const icon = (name: string, extra = '') =>
  `<span class="material-icons nsw-material-icons${extra ? ` ${extra}` : ''}" focusable="false" aria-hidden="true">${name}</span>`;

/** Neutral placeholder image, as a data URI so it works offline. */
export function placeholderImage(width: number, height: number, label = 'Image'): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#cdd3d6"/>` +
    `<path d="M0 ${height} L${width * 0.35} ${height * 0.45} L${width * 0.55} ${height * 0.7} L${width * 0.7} ${height * 0.5} L${width} ${height} Z" fill="#aab3b8"/>` +
    `<circle cx="${width * 0.8}" cy="${height * 0.25}" r="${Math.min(width, height) * 0.08}" fill="#e6eaec"/>` +
    `<text x="50%" y="${height * 0.9}" text-anchor="middle" font-family="sans-serif" font-size="${Math.max(12, height * 0.06)}" fill="#495054">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Stand-in for the NSW Government waratah logo, which is not part of the npm package. Quiet on
 * purpose: a plain outline and a soft grey label, so a screenshot reads as a page with a logo space
 * rather than a page marked unfinished.
 */
export const LOGO_PLACEHOLDER =
  `<svg class="nsw-header__rectangular-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 60" width="220" height="60" role="img" aria-label="Logo">` +
  `<rect x="1" y="1" width="218" height="58" rx="4" fill="#f5f6f7" stroke="#cdd3d6" stroke-width="2"/>` +
  `<text x="110" y="36" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#6b7280">Your logo</text></svg>`;
