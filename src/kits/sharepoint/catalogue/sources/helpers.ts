import { esc, spIcon } from '../../icons';

/** Shared snippets for hand-written SharePoint-style markup. Sample content is generic and made up. */

/** Soft gradient pairs for generated placeholder pictures. */
const PALETTES: [string, string][] = [
  ['#0f6cbd', '#8ecdf0'],
  ['#0e7a6a', '#8fd6c4'],
  ['#8764b8', '#d4c4ef'],
  ['#c4562b', '#f2b999'],
  ['#2e6e4f', '#a8d5b5'],
  ['#4a5568', '#b6c1d1'],
  ['#a4262c', '#f0a3a6'],
  ['#986f0b', '#f1d589'],
];

/** A generated placeholder picture (no real photo is bundled), as a data URI that works offline. */
export function art(n: number, width = 640, height = 360): string {
  const [a, b] = PALETTES[n % PALETTES.length]!;
  const s = Math.min(width, height);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
    `<rect width="100%" height="100%" fill="url(#g)"/>` +
    `<circle cx="${width * (0.2 + ((n * 0.17) % 0.6))}" cy="${height * 0.3}" r="${s * 0.45}" fill="#fff" opacity=".10"/>` +
    `<circle cx="${width * 0.85}" cy="${height * 0.95}" r="${s * 0.6}" fill="#fff" opacity=".08"/>` +
    `<path d="M0 ${height} L${width * 0.3} ${height * 0.55} L${width * 0.5} ${height * 0.8} L${width * 0.72} ${height * 0.5} L${width} ${height * 0.85} L${width} ${height} Z" fill="#000" opacity=".12"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A picture marked as replaceable (`data-image`). */
export const picture = (key: string, n: number, alt: string, width = 640, height = 360, cls = '') =>
  `<img${cls ? ` class="${cls}"` : ''} data-image="${key}" src="${art(n, width, height)}" alt="${esc(alt)}">`;

/** The web part's title row: a title, and "See all" where SharePoint offers it. Both can be hidden. */
export const head = (title: string) =>
  `<div class="sp-wp__head" data-optional="titleRow"><h2 class="sp-wp__title" data-edit="title">${esc(title)}</h2>` +
  `<a class="sp-wp__seeall" href="#" data-optional="seeAll"><span data-edit="seeAll">See all</span></a></div>`;

const COLOURS = [
  '#0f6cbd',
  '#8764b8',
  '#0e7a6a',
  '#c4562b',
  '#a4262c',
  '#2e6e4f',
  '#4a5568',
  '#986f0b',
];

/** An initials avatar. */
export const avatar = (initials: string, n = 0, cls = '') =>
  `<span class="sp-avatar${cls ? ` ${cls}` : ''}" style="background:${COLOURS[n % COLOURS.length]};color:#fff" role="img" aria-label="${esc(initials)}">${esc(initials)}</span>`;

export { esc, spIcon };

/** Made-up people, so samples look real without being anyone. */
export const PEOPLE = [
  ['Alex Taylor', 'Communications lead', 'AT'],
  ['Priya Nair', 'Head of finance', 'PN'],
  ['Sam Okafor', 'Service desk manager', 'SO'],
  ['Mei Lin', 'People partner', 'ML'],
  ['Jordan Blake', 'Project manager', 'JB'],
  ['Chris Moreau', 'Facilities coordinator', 'CM'],
] as const;

/** Made-up news stories. */
export const STORIES = [
  ['Our new office opens next month', 'Facilities', '12 Oct'],
  ['Meet the 2026 innovation winners', 'Culture', '9 Oct'],
  ['Changes to the expenses process', 'Finance', '7 Oct'],
  ['Security tips for working away', 'Technology', '3 Oct'],
  ['Volunteer day: sign up now', 'Community', '30 Sep'],
  ['Quarterly update from the leadership team', 'Leadership', '28 Sep'],
] as const;

const chevron = (d: string) =>
  `<svg class="sp-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const LEFT =
  'M12.73 3.2a.75.75 0 0 1 .07 1.06L7.52 10l5.28 5.74a.75.75 0 1 1-1.1 1.02L5.9 10.5a.75.75 0 0 1 0-1.02l5.8-6.28a.75.75 0 0 1 1.03 0z';
const RIGHT =
  'M7.27 3.2a.75.75 0 0 0-.07 1.06L12.48 10 7.2 15.74a.75.75 0 1 0 1.1 1.02l5.8-6.26a.75.75 0 0 0 0-1.02L8.3 3.2a.75.75 0 0 0-1.03 0z';

/** Previous and next buttons and dots for a carousel (they work in Preview). */
export function carouselControls(count: number): string {
  return (
    `<button class="sp-carousel__prev" data-sp-prev aria-label="Previous">${chevron(LEFT)}</button>` +
    `<button class="sp-carousel__next" data-sp-next aria-label="Next">${chevron(RIGHT)}</button>` +
    `<div class="sp-carousel__dots">${Array.from({ length: count }, (_, i) => `<span class="sp-carousel__dot${i === 0 ? ' is-active' : ''}"></span>`).join('')}</div>`
  );
}

/** Previous and next buttons for a filmstrip (they scroll it in Preview). */
export const stripControls = () =>
  `<button class="sp-strip__prev" data-sp-prev aria-label="Previous">${chevron(LEFT)}</button>` +
  `<button class="sp-strip__next" data-sp-next aria-label="Next">${chevron(RIGHT)}</button>`;
