import type { DocNode } from '../../store/types';
import type { RenderContext } from '../types';
import { renderSiteChrome } from './chrome';
import { esc, spIcon } from './icons';
import { sectionLayoutOf } from './sections';
import { readSite } from './site';
import { resolveTheme, themeVars, variantColours, type SpTheme, type Variant } from './theme';

const emptyHint = (node: DocNode, label: string) =>
  (node.children?.length ?? 0) === 0 ? ` data-empty="${label}"` : '';

// Themes are cheap but section rendering asks for one per section: remember the last few.
const themeCache = new Map<string, SpTheme>();
function themeFor(ctx: RenderContext): SpTheme {
  const keys = (o: Record<string, unknown> | undefined) =>
    ['themeOverride', 'themePreset', 'themePrimary', 'themeText', 'themeBackground', 'themeDark']
      .map((k) => String(o?.[k] ?? ''))
      .join('|');
  const key = `${ctx.settings.themeOverride === true ? keys(ctx.settings) : keys(ctx.kitSettings)}`;
  let theme = themeCache.get(key);
  if (!theme) {
    theme = resolveTheme(ctx.settings, ctx.kitSettings);
    if (themeCache.size > 50) themeCache.clear();
    themeCache.set(key, theme);
  }
  return theme;
}

export const SECTION_BACKGROUNDS = [
  'none',
  'neutral',
  'soft',
  'strong',
  'gradient',
  'image',
] as const;
type SectionBackground = (typeof SECTION_BACKGROUNDS)[number];

const isBackground = (v: unknown): v is SectionBackground =>
  typeof v === 'string' && (SECTION_BACKGROUNDS as readonly string[]).includes(v);

/** Inline style, extra markup and a text colour for a section's background. */
function sectionBackground(node: DocNode, theme: SpTheme, ctx: RenderContext) {
  const bg = isBackground(node.props?.background) ? node.props.background : 'none';
  if (bg === 'gradient')
    return {
      bg,
      style: `background:linear-gradient(135deg,${theme.themePrimary},${theme.themeDark});color:#fff`,
      extra: '',
    };
  if (bg === 'image') {
    const entry = (node.props?.images as Record<string, { imageId?: string }> | undefined)
      ?.background;
    const src = entry?.imageId ? ctx.images[entry.imageId]?.dataUrl : undefined;
    return {
      bg,
      style: `background:${theme.themeDark};color:#fff`,
      // The overlay keeps text readable on any picture.
      extra: `${src ? `<img class="sp-section__bg" src="${src}" alt="">` : ''}<span class="sp-section__overlay"></span>`,
    };
  }
  const c = variantColours(theme, bg as Variant);
  return { bg, style: bg === 'none' ? '' : `background:${c.bg};color:${c.fg}`, extra: '' };
}

function collapseHead(node: DocNode): string {
  const level = ['h2', 'h3', 'h4'].includes(String(node.props?.collapseHeading))
    ? String(node.props?.collapseHeading)
    : 'h2';
  const title = node.text?.collapseTitle ?? 'Section title';
  const right = node.props?.collapseIcon === 'right';
  const divider = node.props?.collapseDivider !== false;
  const collapsed = node.props?.collapsedByDefault === true;
  return (
    `<div class="sp-collapse__head${right ? ' sp-collapse__head--icon-right' : ''}${divider ? ' sp-collapse__head--divider' : ''}">` +
    `<button class="sp-collapse__toggle" data-sp-collapse-toggle aria-expanded="${collapsed ? 'false' : 'true'}" aria-label="Expand or collapse section">${spIcon('chevron_down')}</button>` +
    `<${level} class="sp-collapse__title" data-edit="collapseTitle">${esc(title)}</${level}></div>`
  );
}

/** Markup for a SharePoint section or column, around its children's markup. */
export function renderSpLayout(node: DocNode, kids: string, ctx: RenderContext): string {
  if (node.type === 'column')
    return `<div class="sp-column" data-node="${node.id}"${emptyHint(node, 'Empty column')}>${kids}</div>`;
  if (node.type !== 'section') return kids;

  const theme = themeFor(ctx);
  const layout = sectionLayoutOf(node);
  const { bg, style, extra } = sectionBackground(node, theme, ctx);
  const collapsible = node.props?.collapsible === true && layout !== 'vertical';
  const collapsed = collapsible && node.props?.collapsedByDefault === true;
  const tag = layout === 'vertical' ? 'aside' : 'section';
  const cls = [
    'sp-section',
    `sp-section--${layout}`,
    `sp-section--bg-${bg}`,
    collapsible ? 'sp-section--collapsible' : '',
    collapsed ? 'is-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const inner = `<div class="sp-section__inner sp-section__inner--${layout}">${kids}</div>`;
  const body = collapsible
    ? `${collapseHead(node)}<div class="sp-collapse__body">${inner}</div>`
    : inner;
  const bgStyle = style ? ` style="${style}"` : '';
  return `<${tag} class="${cls}" data-node="${node.id}" data-layout="${layout}"${bgStyle}${emptyHint(node, 'Empty section')}>${extra}${body}</${tag}>`;
}

/** The whole page: the site chrome around the content, with a vertical section beside the rest. */
export function renderSpFrame(
  children: { node: DocNode; html: string }[],
  ctx: RenderContext,
): string {
  const site = readSite(ctx.settings);
  const theme = themeFor(ctx);
  const vertical = children.filter(
    (c) => c.node.type === 'section' && sectionLayoutOf(c.node) === 'vertical',
  );
  const main = children.filter((c) => !vertical.includes(c));
  const dark = (theme.white ?? '#ffffff') !== '#ffffff' && theme.neutralPrimary === '#ffffff';
  return renderSiteChrome(
    site,
    theme,
    ctx,
    themeVars(theme),
    main.map((c) => c.html).join(''),
    vertical.map((c) => c.html).join(''),
    dark,
  );
}
