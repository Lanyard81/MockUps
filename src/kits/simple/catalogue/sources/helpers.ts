/** Shared snippets for the Simple kit's hand-written markup. Sample content is generic and made up. */

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A soft, neutral placeholder picture (no real photo is bundled), as a data URI that works offline. */
export function art(n: number, width = 640, height = 360): string {
  const tones = ['#dbe4f5', '#e3dcf3', '#d7efe6', '#f6e3d3', '#e6e9ee'];
  const deep = ['#9db5e3', '#b7a5e3', '#91d3b8', '#eab68f', '#b9c1ce'];
  const a = tones[n % tones.length]!;
  const b = deep[n % deep.length]!;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${a}"/>` +
    `<circle cx="${width * 0.72}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.14}" fill="#fff" opacity=".7"/>` +
    `<path d="M0 ${height} L${width * 0.32} ${height * 0.5} L${width * 0.52} ${height * 0.76} L${width * 0.7} ${height * 0.55} L${width} ${height * 0.9} L${width} ${height} Z" fill="${b}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A picture marked as replaceable (`data-image`). */
export const picture = (key: string, n: number, alt: string, cls: string, w = 640, h = 360) =>
  `<img class="${cls}" data-image="${key}" src="${art(n, w, h)}" alt="${esc(alt)}">`;
