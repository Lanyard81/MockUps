import type { RenderContext } from '../types';
import { esc, gradientImage, initials, spIcon } from './icons';
import type { NavItem, Site } from './site';
import { variantColours, type SpTheme, type Variant } from './theme';

/**
 * The page chrome around a SharePoint frame's content: suite bar, header, navigation, page title
 * area and footer, drawn from the frame's site settings. Text that can be edited in place carries
 * `data-setting-edit="<path into the settings>"`, so a double-click edits it.
 */
const imageUrl = (ctx: RenderContext, id: string | undefined): string | undefined =>
  id ? ctx.images[id]?.dataUrl : undefined;

function suiteBar(): string {
  return (
    `<div class="sp-suite">` +
    `<button class="sp-suite__launcher" aria-label="App launcher">${spIcon('grid_dots')}</button>` +
    `<span class="sp-suite__name">Intranet</span>` +
    `<span class="sp-suite__search">${spIcon('search', 'sp-suite__search-icon', 16)}<span>Search this site</span></span>` +
    `<span class="sp-suite__spacer"></span>` +
    `<button class="sp-suite__icon" aria-label="Settings">${spIcon('settings')}</button>` +
    `<button class="sp-suite__icon" aria-label="Help">${spIcon('question_circle')}</button>` +
    `<span class="sp-avatar sp-avatar--small" role="img" aria-label="Your account">AT</span>` +
    `</div>`
  );
}

function navLabel(item: NavItem, path: string): string {
  return `<span class="sp-nav__label" data-setting-edit="${path}.label">${esc(item.label)}</span>`;
}

/** One menu item and, for a cascading menu, its sub-menus (up to three levels). */
function navItem(item: NavItem, path: string, depth: number, mega: boolean): string {
  const kids = item.children ?? [];
  const toggle = kids.length
    ? `<button class="sp-nav__toggle" data-sp-menu-toggle aria-label="Show ${esc(item.label)} links" aria-expanded="false">${spIcon('chevron_down', '', 12)}</button>`
    : '';
  const link = `<a class="sp-nav__link" href="#">${navLabel(item, path)}</a>`;
  let panel = '';
  if (kids.length) {
    const sub = kids.map((c, i) => navItem(c, `${path}.children.${i}`, depth + 1, mega)).join('');
    panel = mega
      ? `<div class="sp-nav__panel sp-nav__panel--mega"><ul class="sp-nav__sub">${sub}</ul></div>`
      : `<ul class="sp-nav__panel sp-nav__sub">${sub}</ul>`;
  }
  const cls = ['sp-nav__item', `sp-nav__item--l${depth}`, kids.length ? 'has-children' : '']
    .filter(Boolean)
    .join(' ');
  return `<li class="${cls}" data-sp-menu>${link}${toggle}${panel}</li>`;
}

function nav(site: Site): string {
  if (!site.nav.visible) return '';
  const mega = site.nav.style === 'mega';
  const items = site.nav.items.map((it, i) => navItem(it, `navItems.${i}`, 1, mega)).join('');
  const cls = `sp-nav sp-nav--${site.nav.orientation} sp-nav--${site.nav.style}`;
  return `<nav class="${cls}" aria-label="Site navigation"><ul class="sp-nav__list">${items}</ul></nav>`;
}

function logoThumb(site: Site, ctx: RenderContext): string {
  const src = imageUrl(ctx, site.header.thumbnailId);
  return src
    ? `<span class="sp-logo-thumb"><img src="${src}" alt=""></span>`
    : `<span class="sp-logo-thumb sp-logo-thumb--initials" aria-hidden="true">${esc(initials(site.header.title))}</span>`;
}

function header(site: Site, theme: SpTheme, ctx: RenderContext): string {
  const h = site.header;
  const image = h.background === 'image';
  const variant: Variant = image ? 'strong' : (h.background as Variant);
  const photo = image
    ? `<img class="sp-header__image" src="${
        imageUrl(ctx, h.imageId) ?? gradientImage(theme.themeDark!, theme.themeSecondary!)
      }" alt=""><span class="sp-header__overlay" style="opacity:${h.overlay / 100}"></span>`
    : '';
  const title = h.showTitle
    ? `<span class="sp-site-title" data-setting-edit="siteTitle">${esc(h.title)}</span>`
    : '';
  const logo = imageUrl(ctx, h.logoId);
  const logoImg = logo ? `<img class="sp-site-logo" src="${logo}" alt="${esc(h.title)}">` : '';
  const menuButton = site.nav.visible
    ? `<button class="sp-header__menu" data-sp-nav-toggle aria-label="Menu">${spIcon('navigation')}</button>`
    : '';
  const horizontalNav = site.nav.orientation === 'horizontal' ? nav(site) : '';
  const inlineNav = h.layout === 'minimal';
  const colours = variantColours(theme, variant);
  const style = image ? '' : ` style="background:${colours.bg};color:${colours.fg}"`;
  return (
    `<header class="sp-header sp-header--${h.layout} sp-header--align-${h.layout === 'extended' ? h.logoAlign : 'left'}${image ? ' sp-header--image' : ''}" data-variant="${variant}"${style}>` +
    photo +
    `<div class="sp-header__bar">${menuButton}${logoThumb(site, ctx)}${logoImg}${title}${inlineNav ? horizontalNav : ''}</div>` +
    (inlineNav ? '' : horizontalNav) +
    `</header>`
  );
}

function titleArea(site: Site, theme: SpTheme, ctx: RenderContext): string {
  const t = site.titleArea;
  if (!t.visible) return '';
  const src =
    imageUrl(ctx, t.imageId) ?? gradientImage(theme.themeSecondary!, theme.themeDarker!, 1200, 260);
  const topic = t.showTopic
    ? `<div class="sp-title__topic" data-setting-edit="topicText">${esc(t.topic)}</div>`
    : '';
  const byline =
    t.showAuthor || t.showDate
      ? `<div class="sp-title__byline">${
          t.showAuthor
            ? `<span class="sp-avatar sp-avatar--small" aria-hidden="true">${esc(initials(t.author))}</span><span data-setting-edit="authorName">${esc(t.author)}</span>`
            : ''
        }${t.showAuthor && t.showDate ? '<span class="sp-title__dot" aria-hidden="true">·</span>' : ''}${
          t.showDate ? `<span data-setting-edit="publishedDate">${esc(t.date)}</span>` : ''
        }</div>`
      : '';
  const heading = `<h1 class="sp-title__text" data-setting-edit="pageTitle">${esc(t.title)}</h1>`;
  const text = `${topic}${heading}${byline}`;
  const picture = `<div class="sp-title__picture"><img src="${src}" alt=""></div>`;
  const body =
    t.layout === 'plain'
      ? `<div class="sp-title__inner">${text}</div>`
      : t.layout === 'colour-block'
        ? `<div class="sp-title__block"><div class="sp-title__inner">${text}</div></div>`
        : `${picture}<div class="sp-title__inner sp-title__inner--on-image">${text}</div>`;
  return `<div class="sp-title sp-title--${t.layout} sp-title--align-${t.align}">${body}</div>`;
}

function footer(site: Site, theme: SpTheme, ctx: RenderContext): string {
  const f = site.footer;
  if (!f.visible) return '';
  const colours = variantColours(theme, f.background as Variant);
  const logo = imageUrl(ctx, f.logoId);
  const name = f.showName
    ? `<span class="sp-footer__name" data-setting-edit="footerName">${esc(f.name)}</span>`
    : '';
  const links = f.links
    .map((l, i) => `<li><a href="#" data-setting-edit="footerLinks.${i}">${esc(l)}</a></li>`)
    .join('');
  return (
    `<footer class="sp-footer sp-footer--${f.layout}" data-variant="${f.background}" style="background:${colours.bg};color:${colours.fg}">` +
    `<div class="sp-footer__inner"><div class="sp-footer__brand">${logo ? `<img class="sp-footer__logo" src="${logo}" alt="">` : ''}${name}</div>` +
    `<ul class="sp-footer__links">${links}</ul></div></footer>`
  );
}

/** Everything around the content: the whole `.sp-site` wrapper. `main` and `vertical` are already-rendered sections. */
export function renderSiteChrome(
  site: Site,
  theme: SpTheme,
  ctx: RenderContext,
  vars: string,
  main: string,
  vertical: string,
  dark: boolean,
): string {
  const team = site.type === 'team';
  const canvas = vertical
    ? `<div class="sp-canvas sp-canvas--has-vertical"><div class="sp-canvas__main">${main}</div>${vertical}</div>`
    : `<div class="sp-canvas">${main}</div>`;
  return (
    `<div class="sp-site sp-site--${site.type}${dark ? ' sp-site--dark' : ''}" style="${vars}">` +
    (site.suiteBar ? suiteBar() : '') +
    header(site, theme, ctx) +
    `<div class="sp-body${team && site.nav.visible ? ' sp-body--side-nav' : ''}">` +
    (team ? nav(site) : '') +
    `<main class="sp-main">${titleArea(site, theme, ctx)}${canvas}</main></div>` +
    footer(site, theme, ctx) +
    `</div>`
  );
}
