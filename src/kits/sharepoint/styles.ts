import { SP_MORE_CSS } from './stylesMore';
import { SP_WEBPART_CSS } from './stylesWebParts';

/**
 * The SharePoint-style kit's CSS: a lookalike built on Fluent UI design tokens (SharePoint's own
 * page CSS isn't published). Every class is `sp-*`; colours come from theme variables set on the
 * `.sp-site` wrapper (see `theme.ts`), so a theme change is one set of variables. No Microsoft
 * fonts are bundled: the font stack falls back to the system font.
 *
 * Breakpoints (assumptions, to check against a real site): below 1024px the vertical section moves
 * under the content; below 640px columns stack and the menu collapses behind a button.
 */
export const SP_FONT_STACK =
  '"Segoe UI","Segoe UI Web (West European)",-apple-system,BlinkMacSystemFont,Roboto,"Helvetica Neue",sans-serif';

const base = `
.sp-site{
  font-family:${SP_FONT_STACK};
  font-size:14px;line-height:20px;color:var(--sp-text);background:var(--sp-bg);
  -webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column;
}
.sp-site *,.sp-site *::before,.sp-site *::after{box-sizing:border-box}
.sp-site h1,.sp-site h2,.sp-site h3,.sp-site h4,.sp-site p,.sp-site ul,.sp-site ol{margin:0}
.sp-site ul,.sp-site ol{padding:0;list-style:none}
.sp-site a{color:var(--sp-link);text-decoration:none}
.sp-site button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.sp-icon{flex:none;vertical-align:middle}
.sp-avatar{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;
  background:var(--sp-theme-primary);color:var(--sp-on-strong);font-size:12px;font-weight:600}
.sp-avatar--small{width:24px;height:24px;font-size:10px}
`;

const suite = `
.sp-suite{display:flex;align-items:center;gap:4px;height:48px;padding:0 8px;background:var(--sp-theme-dark-alt);color:#fff;flex:none}
.sp-suite a,.sp-suite button{color:#fff}
.sp-suite__launcher,.sp-suite__icon{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px}
.sp-suite__name{font-size:16px;font-weight:600;padding:0 12px 0 4px;white-space:nowrap}
.sp-suite__search{display:flex;align-items:center;gap:8px;height:32px;min-width:0;width:100%;max-width:468px;padding:0 12px;border-radius:2px;
  background:rgba(255,255,255,.2);color:#fff;font-size:14px;overflow:hidden;white-space:nowrap}
.sp-suite__search-icon{flex:none}
.sp-suite__spacer{flex:1 1 0}
.sp-suite .sp-avatar{margin:0 8px;background:#fff;color:var(--sp-theme-dark-alt)}
`;

const header = `
.sp-header{position:relative;flex:none;border-bottom:1px solid var(--sp-neutral-light);overflow:visible}
.sp-header--image{border-bottom:0}
.sp-header__image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sp-header__overlay{position:absolute;inset:0;background:#000}
.sp-header__bar{position:relative;display:flex;align-items:center;gap:12px;padding:0 24px}
.sp-header--image .sp-header__bar,.sp-header--image .sp-nav{color:#fff}
.sp-header--minimal .sp-header__bar{height:48px}
.sp-header--compact .sp-header__bar{height:56px}
.sp-header--standard .sp-header__bar{height:80px}
.sp-header--extended .sp-header__bar{height:128px}
.sp-header--align-center .sp-header__bar{justify-content:center;flex-direction:column;gap:8px;text-align:center}
.sp-header--align-right .sp-header__bar{flex-direction:row-reverse;text-align:right}
.sp-logo-thumb{display:inline-flex;align-items:center;justify-content:center;flex:none;width:32px;height:32px;border-radius:2px;overflow:hidden;
  background:var(--sp-theme-primary);color:var(--sp-on-strong);font-size:14px;font-weight:600}
.sp-header--standard .sp-logo-thumb{width:48px;height:48px}
.sp-header--extended .sp-logo-thumb{width:64px;height:64px;font-size:20px}
.sp-logo-thumb img{display:block;width:100%;height:100%;object-fit:cover}
.sp-site-logo{display:block;max-height:48px;max-width:192px}
.sp-site-title{font-size:18px;line-height:24px;font-weight:600;white-space:nowrap}
.sp-header--standard .sp-site-title{font-size:20px}
.sp-header--extended .sp-site-title{font-size:28px;line-height:36px}
.sp-header__menu{display:none;align-items:center;justify-content:center;width:40px;height:40px}
`;

const nav = `
.sp-nav{position:relative;font-size:14px}
.sp-nav__list{display:flex;flex-wrap:nowrap}
.sp-nav__item{position:relative;display:flex;align-items:center}
.sp-nav__link{display:flex;align-items:center;min-height:40px;padding:0 12px;color:inherit !important;white-space:nowrap}
.sp-nav__toggle{display:inline-flex;align-items:center;justify-content:center;width:20px;height:40px;margin-left:-10px;opacity:.8}
.sp-nav__panel{display:none;position:absolute;z-index:20;top:100%;left:0;min-width:200px;padding:8px 0;color:var(--sp-text);
  background:var(--sp-white);border:1px solid var(--sp-neutral-quaternary-alt);box-shadow:0 6.4px 14.4px rgba(0,0,0,.13),0 1.2px 3.6px rgba(0,0,0,.11)}
.sp-nav__item.is-open > .sp-nav__panel{display:block}
.sp-nav__panel .sp-nav__item{display:block}
.sp-nav__panel .sp-nav__link{min-height:32px;color:var(--sp-text) !important;white-space:normal}
.sp-nav__panel .sp-nav__link:hover{background:var(--sp-neutral-lighter)}
.sp-nav__panel .sp-nav__toggle{display:none}
.sp-nav--cascading .sp-nav__panel .sp-nav__item{position:relative}
.sp-nav--cascading .sp-nav__panel .sp-nav__panel{top:0;left:100%}
.sp-nav--cascading .sp-nav__panel .sp-nav__item.has-children > .sp-nav__link::after{content:"›";margin-left:auto;padding-left:12px}
.sp-nav--mega .sp-nav__panel--mega{display:none;left:0;min-width:480px;padding:16px 24px}
.sp-nav--mega .sp-nav__item.is-open > .sp-nav__panel--mega{display:block}
.sp-nav--mega .sp-nav__panel--mega > .sp-nav__sub{display:flex;gap:32px;align-items:flex-start}
.sp-nav--mega .sp-nav__panel--mega > .sp-nav__sub > .sp-nav__item > .sp-nav__link{font-weight:600;padding:0;min-height:32px}
.sp-nav--mega .sp-nav__panel--mega .sp-nav__sub .sp-nav__sub .sp-nav__link{padding:0;min-height:28px;font-weight:400}
.sp-nav--mega .sp-nav__panel--mega .sp-nav__sub .sp-nav__sub{display:block}
.sp-nav--mega .sp-nav__panel--mega .sp-nav__sub .sp-nav__sub .sp-nav__panel{display:block;position:static;border:0;box-shadow:none;padding:0;min-width:0}
.sp-header .sp-nav{padding:0 12px}
.sp-header--minimal .sp-header__bar .sp-nav{margin-left:16px;padding:0}
.sp-nav--vertical{width:240px;flex:none;padding:12px 0;border-right:1px solid var(--sp-neutral-light);background:var(--sp-neutral-lighter-alt)}
.sp-nav--vertical .sp-nav__list{display:block}
.sp-nav--vertical .sp-nav__item{display:block}
.sp-nav--vertical .sp-nav__link{min-height:36px;padding:0 20px;color:var(--sp-text) !important}
.sp-nav--vertical .sp-nav__toggle{display:none}
.sp-nav--vertical .sp-nav__panel{display:block;position:static;border:0;box-shadow:none;padding:0 0 0 16px;background:none;min-width:0}
.sp-body{display:flex;flex:1 1 auto;min-height:0}
.sp-main{flex:1 1 0;min-width:0}
`;

const title = `
.sp-title{position:relative;max-width:1204px;margin:0 auto;padding:16px 24px 0}
.sp-title__picture{position:relative;height:208px;overflow:hidden;border-radius:2px}
.sp-title__picture img{display:block;width:100%;height:100%;object-fit:cover}
.sp-title__inner{padding:16px 0}
.sp-title__inner--on-image{position:absolute;left:24px;right:24px;bottom:0;padding:24px 24px;color:#fff;
  background:linear-gradient(to top,rgba(0,0,0,.6),rgba(0,0,0,0));border-radius:0 0 2px 2px}
.sp-title__text{font-size:28px;line-height:36px;font-weight:600}
.sp-title--align-center{text-align:center}
.sp-title--align-center .sp-title__byline{justify-content:center}
.sp-title__topic{font-size:12px;line-height:16px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;opacity:.85;margin-bottom:4px}
.sp-title__byline{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;line-height:16px}
.sp-title--plain .sp-title__inner{padding:24px 0 8px;border-bottom:1px solid var(--sp-neutral-light)}
.sp-title--colour-block .sp-title__block{background:var(--sp-theme-lighter);padding:8px 24px;border-left:8px solid var(--sp-theme-primary)}
.sp-title--overlap .sp-title__picture{height:176px}
.sp-title--overlap .sp-title__inner--on-image{position:relative;left:auto;right:auto;bottom:auto;width:calc(100% - 48px);margin:-48px auto 0;
  color:var(--sp-text);background:var(--sp-white);padding:16px 24px;border-radius:2px;
  box-shadow:0 3.2px 7.2px rgba(0,0,0,.13),0 .6px 1.8px rgba(0,0,0,.11)}
`;

const footer = `
.sp-footer{flex:none;margin-top:32px;border-top:1px solid var(--sp-neutral-light)}
.sp-footer__inner{display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:1204px;margin:0 auto;padding:24px}
.sp-footer__brand{display:flex;align-items:center;gap:12px}
.sp-footer__logo{display:block;max-height:32px;max-width:120px}
.sp-footer__name{font-size:16px;font-weight:600}
.sp-footer__links{display:flex;flex-wrap:wrap;gap:8px 24px}
.sp-footer__links a{color:inherit !important}
.sp-footer--extended .sp-footer__inner{flex-direction:column;align-items:flex-start}
.sp-footer--extended .sp-footer__links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 32px;width:100%}
`;

const sections = `
.sp-canvas{display:block}
.sp-canvas--has-vertical{display:flex;align-items:stretch}
.sp-canvas__main{flex:1 1 0;min-width:0}
.sp-section{position:relative;padding:16px 0;color:var(--sp-text)}
.sp-section__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sp-section__overlay{position:absolute;inset:0;background:rgba(0,0,0,.45)}
.sp-section > *:not(.sp-section__bg):not(.sp-section__overlay){position:relative}
.sp-section__inner{display:grid;gap:0;max-width:1204px;margin:0 auto;padding:0 24px;grid-template-columns:minmax(0,1fr)}
.sp-section__inner--two-columns{grid-template-columns:repeat(2,minmax(0,1fr))}
.sp-section__inner--three-columns{grid-template-columns:repeat(3,minmax(0,1fr))}
.sp-section__inner--one-third-left{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}
.sp-section__inner--one-third-right{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.sp-section--full-width .sp-section__inner{max-width:none;padding:0}
.sp-section--full-width{padding:0}
.sp-column{min-width:0;padding:0 8px}
.sp-column > *+*{margin-top:16px}
.sp-section--flexible .sp-column{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
.sp-section--flexible .sp-column > *+*{margin-top:0}
.sp-section--flexible .sp-column > *{flex:0 0 100%;max-width:100%}
.sp-section--vertical{flex:none;width:320px;padding:16px 0}
.sp-section--vertical .sp-section__inner{padding:0 16px;max-width:none}
.sp-collapse__head{display:flex;align-items:center;gap:8px;max-width:1204px;margin:0 auto;padding:8px 24px}
.sp-collapse__head--divider{border-bottom:1px solid var(--sp-neutral-quaternary-alt)}
.sp-collapse__head--icon-right{flex-direction:row-reverse;justify-content:space-between}
.sp-collapse__toggle{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;flex:none}
.sp-collapse__toggle .sp-icon{transition:transform .1s}
.sp-collapse__title{font-size:20px;line-height:28px;font-weight:600}
.sp-section--collapsible h3.sp-collapse__title{font-size:18px;line-height:24px}
.sp-section--collapsible h4.sp-collapse__title{font-size:16px;line-height:22px}
.sp-section--collapsible.is-collapsed .sp-collapse__body{display:none}
.sp-section--collapsible.is-collapsed .sp-collapse__toggle .sp-icon{transform:rotate(-90deg)}
body[data-mode="edit"] .sp-section--collapsible.is-collapsed .sp-collapse__body{display:block}
`;

const responsive = `
@media (max-width:1023px){
  .sp-canvas--has-vertical{display:block}
  .sp-section--vertical{width:auto}
}
@media (max-width:639px){
  .sp-section__inner,.sp-section__inner--two-columns,.sp-section__inner--three-columns,
  .sp-section__inner--one-third-left,.sp-section__inner--one-third-right{grid-template-columns:minmax(0,1fr)}
  .sp-section__inner{padding:0 16px}
  .sp-column{padding:0}
  .sp-column + .sp-column{margin-top:16px}
  .sp-header__menu{display:inline-flex}
  .sp-header .sp-nav,.sp-header__bar .sp-nav{display:none}
  .sp-header.is-menu-open .sp-nav{display:block;width:100%}
  .sp-header.is-menu-open .sp-nav__list{display:block}
  .sp-header.is-menu-open .sp-nav__panel{position:static;box-shadow:none;border:0;padding-left:16px}
  .sp-body--side-nav{display:block}
  .sp-nav--vertical{display:none}
  .sp-suite__search{display:none}
  .sp-suite__name{display:none}
  .sp-header__bar{padding:0 12px}
  .sp-title{padding:12px 16px 0}
  .sp-footer__inner{flex-direction:column;align-items:flex-start;padding:16px}
  .sp-footer--extended .sp-footer__links{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sp-collapse__head{padding:8px 16px}
}
`;

const text = `
.sp-text{font-size:14px;line-height:20px}
.sp-text p+p{margin-top:12px}
`;

export const SP_CSS = [
  base,
  suite,
  header,
  nav,
  title,
  footer,
  sections,
  responsive,
  text,
  SP_WEBPART_CSS,
  SP_MORE_CSS,
].join('\n');
