import type { DocNode } from '../../store/types';
import type { RenderContext } from '../types';
import { sectionLayoutOf } from './sections';

const emptyHint = (node: DocNode, label: string) =>
  (node.children?.length ?? 0) === 0 ? ` data-empty="${label}"` : '';

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

export const BACKGROUNDS = ['none', 'soft', 'dark', 'accent'] as const;
export const SPACINGS = ['compact', 'normal', 'spacious'] as const;

/** Markup for a section or column, around its children's markup. */
export function renderLayout(node: DocNode, kids: string): string {
  if (node.type === 'column')
    return `<div class="sk-column" data-node="${node.id}"${emptyHint(node, 'Empty column')}>${kids}</div>`;
  if (node.type !== 'section') return kids;
  const layout = sectionLayoutOf(node);
  const bg = pick(node.props?.background, BACKGROUNDS, 'none');
  const spacing = pick(node.props?.spacing, SPACINGS, 'normal');
  const cls = [
    'sk-section',
    `sk-section--${layout}`,
    `sk-section--bg-${bg}`,
    spacing !== 'normal' ? `sk-section--${spacing}` : '',
    node.props?.wide === true ? 'sk-section--wide' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<section class="${cls}" data-node="${node.id}" data-layout="${layout}"${emptyHint(node, 'Empty section')}><div class="sk-section__inner">${kids}</div></section>`;
}

/** Only hex colours become CSS, so a saved file can't smuggle anything else into the style. */
const colour = (v: unknown, fallback: string) =>
  typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;

export const DEFAULT_ACCENT = '#2563eb';

/** Readable text on an accent colour: white on dark accents, near-black on light ones. */
export function inkFor(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.4 ? '#111827' : '#ffffff';
}

/** The page: the accent colour for the whole frame, around the content. */
export function renderFrame(
  children: { node: DocNode; html: string }[],
  ctx: RenderContext,
): string {
  const accent = colour(
    ctx.settings.accentOverride === true ? ctx.settings.accent : ctx.kitSettings.accent,
    DEFAULT_ACCENT,
  );
  return `<div class="sk-page" style="--sk-accent:${accent};--sk-accent-ink:${inkFor(accent)}">${children.map((c) => c.html).join('')}</div>`;
}
