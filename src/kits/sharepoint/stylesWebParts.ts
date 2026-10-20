/**
 * Web part styles for the SharePoint-style kit (Fluent UI look). Like everything in this kit they
 * are written against the theme variables, so a theme change recolours them. See `styles.ts`.
 */
const common = `
.sp-wp{display:block}
.sp-image{margin:0}
.sp-gallery{display:block}
.sp-ql__text{display:flex;flex-direction:column;gap:2px;min-width:0}
.sp-hc__body{display:flex;flex-direction:column;gap:4px;min-width:0}
.sp-event__body{display:flex;flex-direction:column;gap:2px;min-width:0}
.sp-story__body{display:flex;flex-direction:column;gap:4px;min-width:0}
.sp-wp__head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}
.sp-wp__title{font-size:20px;line-height:28px;font-weight:600}
.sp-wp__seeall{font-size:14px;font-weight:600;white-space:nowrap}
.sp-align-center{text-align:center}
.sp-align-right{text-align:right}
.sp-media{display:block;width:100%;height:100%;object-fit:cover}
.sp-meta{font-size:12px;line-height:16px;color:var(--sp-neutral-secondary)}
.sp-tag{display:inline-block;font-size:12px;line-height:16px;font-weight:600;color:var(--sp-theme-primary);text-transform:none}
.sp-card{background:var(--sp-white);border:1px solid var(--sp-neutral-quaternary-alt);border-radius:2px;overflow:hidden;
  box-shadow:0 1.6px 3.6px rgba(0,0,0,.13),0 .3px .9px rgba(0,0,0,.11)}
.sp-ratio-16x9{aspect-ratio:16/9}
.sp-ratio-4x3{aspect-ratio:4/3}
.sp-ratio-3x2{aspect-ratio:3/2}
.sp-ratio-1x1{aspect-ratio:1/1}
.sp-ratio-9x16{aspect-ratio:9/16}
.sp-carousel{position:relative}
.sp-carousel__slide{display:none}
.sp-carousel__slide.is-active{display:block}
.sp-carousel__prev,.sp-carousel__next,.sp-strip__prev,.sp-strip__next{position:absolute;top:50%;z-index:2;display:inline-flex;align-items:center;
  justify-content:center;width:32px;height:48px;margin-top:-24px;background:rgba(255,255,255,.92);color:var(--sp-neutral-primary);
  box-shadow:0 1.6px 3.6px rgba(0,0,0,.2)}
.sp-carousel__prev,.sp-strip__prev{left:0}
.sp-carousel__next,.sp-strip__next{right:0}
.sp-carousel__dots{display:flex;justify-content:center;gap:8px;padding:8px 0}
.sp-carousel__dot{width:8px;height:8px;border-radius:50%;background:var(--sp-neutral-tertiary-alt)}
.sp-carousel__dot.is-active{background:var(--sp-theme-primary)}
.sp-strip{position:relative}
.sp-strip__track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding-bottom:4px}
.sp-strip__track::-webkit-scrollbar{display:none}
.sp-strip__item{flex:none;scroll-snap-align:start}
`;

const text = `
.sp-text h1{font-size:32px;line-height:40px;font-weight:600}
.sp-text h2{font-size:28px;line-height:36px;font-weight:600}
.sp-text h3{font-size:20px;line-height:28px;font-weight:600}
.sp-text h4{font-size:16px;line-height:22px;font-weight:600}
.sp-text ul{list-style:disc;padding-left:24px}
.sp-text ol{list-style:decimal;padding-left:24px}
.sp-text li+li{margin-top:4px}
.sp-text--accent,.sp-text--accent h1,.sp-text--accent h2,.sp-text--accent h3,.sp-text--accent h4{color:var(--sp-theme-primary)}
.sp-text--highlight{background:var(--sp-theme-lighter);padding:8px 12px}
.sp-quote{margin:0;padding:8px 20px;border-left:4px solid var(--sp-theme-primary);font-size:20px;line-height:28px;font-style:italic}
.sp-quote cite{display:block;margin-top:8px;font-size:14px;font-style:normal;color:var(--sp-neutral-secondary)}
.sp-table{width:100%;border-collapse:collapse;font-size:14px}
.sp-table th,.sp-table td{padding:8px 12px;border:1px solid var(--sp-neutral-quaternary-alt);text-align:left}
.sp-table th{font-weight:600}
.sp-table--striped tbody tr:nth-child(even){background:var(--sp-neutral-lighter-alt)}
.sp-table--header-colour thead{background:var(--sp-theme-primary);color:var(--sp-on-strong)}
.sp-table--light{background:var(--sp-neutral-lighter-alt)}
.sp-divider{height:0;margin:0;border:0;border-top:1px solid var(--sp-neutral-quaternary-alt)}
.sp-divider--thick{border-top-width:3px}
.sp-divider--accent{border-top:3px solid var(--sp-theme-primary)}
.sp-spacer{height:24px}
.sp-spacer--small{height:12px}
.sp-spacer--large{height:48px}
`;

const buttons = `
.sp-button-row{display:flex}
.sp-button-row.sp-align-center{justify-content:center}
.sp-button-row.sp-align-right{justify-content:flex-end}
.sp-button{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 20px;border:1px solid transparent;border-radius:2px;
  font-size:14px;font-weight:600;white-space:nowrap}
.sp-button--primary{background:var(--sp-theme-primary);color:var(--sp-on-strong) !important}
.sp-button--secondary{background:var(--sp-white);color:var(--sp-neutral-primary) !important;border-color:var(--sp-neutral-secondary)}
.sp-cta{position:relative;display:flex;align-items:center;min-height:200px;overflow:hidden;background:var(--sp-theme-dark);color:#fff}
.sp-cta__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sp-cta__shade{position:absolute;inset:0;background:rgba(0,0,0,.35)}
.sp-cta__body{position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:16px;width:100%;padding:32px 40px}
.sp-cta__body.sp-align-center{align-items:center;text-align:center}
.sp-cta__title{font-size:28px;line-height:36px;font-weight:600}
.sp-cta .sp-button{background:#fff;color:#201f1e !important}
.sp-linkcard{display:flex;gap:16px;color:var(--sp-text) !important}
.sp-linkcard__thumb{flex:none;width:200px}
.sp-linkcard__body{display:flex;flex-direction:column;gap:4px;padding:12px 12px 12px 0;min-width:0}
.sp-linkcard__title{font-size:16px;line-height:22px;font-weight:600}
.sp-linkcard__url{font-size:12px;color:var(--sp-neutral-secondary)}
.sp-linkcard--inline{align-items:center;padding:8px 12px;gap:12px}
.sp-linkcard--inline .sp-linkcard__body{padding:0}
`;

const media = `
.sp-image__frame{position:relative;overflow:hidden;background:var(--sp-neutral-lighter)}
.sp-image__caption{margin-top:8px;font-size:12px;line-height:16px;color:var(--sp-neutral-secondary)}
.sp-gallery--brick{column-count:3;column-gap:8px}
.sp-gallery--brick .sp-gallery__item{break-inside:avoid;margin-bottom:8px}
.sp-gallery--grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sp-gallery__item{position:relative;overflow:hidden;background:var(--sp-neutral-lighter)}
.sp-gallery__item img{display:block;width:100%;height:100%;object-fit:cover}
.sp-gallery__caption{position:absolute;left:0;right:0;bottom:0;padding:8px 12px;font-size:12px;color:#fff;background:linear-gradient(to top,rgba(0,0,0,.6),rgba(0,0,0,0))}
.sp-gallery--carousel .sp-gallery__item{aspect-ratio:16/9}
.sp-hero{display:grid;gap:4px}
.sp-hero__tile{position:relative;display:flex;align-items:flex-end;min-height:200px;overflow:hidden;color:#fff !important;background:var(--sp-theme-dark)}
.sp-hero__tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sp-hero__content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:8px;width:100%;padding:16px 20px;
  background:linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,0))}
.sp-hero__title{font-size:20px;line-height:28px;font-weight:600}
.sp-hero__cta{display:inline-flex;align-items:center;min-height:32px;padding:0 16px;background:#fff;color:#201f1e;font-weight:600;border-radius:2px}
.sp-hero--tiles{grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(180px,auto)}
.sp-hero--tiles .sp-hero__tile:first-child{grid-column:span 2;grid-row:span 2;min-height:364px}
.sp-hero--tiles .sp-hero__tile:first-child:last-child{grid-column:span 4}
.sp-hero--layers{grid-template-columns:minmax(0,1fr)}
.sp-hero--layers .sp-hero__tile{min-height:160px}
.sp-hero--layers .sp-hero__tile:first-child{min-height:320px}
`;

const quickLinks = `
.sp-ql{display:grid;gap:8px}
.sp-ql__item{display:flex;color:var(--sp-text) !important}
.sp-ql__icon{display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--sp-theme-primary)}
.sp-ql__title{font-size:14px;line-height:20px;font-weight:600}
.sp-ql__desc{font-size:12px;line-height:16px;color:var(--sp-neutral-secondary)}
.sp-ql--compact{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:4px 16px}
.sp-ql--compact .sp-ql__item{align-items:center;gap:12px;padding:8px}
.sp-ql--compact .sp-ql__icon{width:48px;height:48px;background:var(--sp-theme-lighter);border-radius:2px}
.sp-ql--compact .sp-ql__icon svg{width:24px;height:24px}
.sp-ql--list{grid-template-columns:minmax(0,1fr);gap:0}
.sp-ql--list .sp-ql__item{align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--sp-neutral-light)}
.sp-ql--list .sp-ql__icon{width:32px;height:32px}
.sp-ql--grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px}
.sp-ql--grid .sp-ql__item{flex-direction:column;gap:8px}
.sp-ql--grid .sp-ql__thumb{aspect-ratio:4/3;overflow:hidden;background:var(--sp-neutral-lighter)}
.sp-ql--button{display:flex;flex-wrap:wrap;gap:8px}
.sp-ql--button .sp-ql__item{align-items:center;gap:8px;min-height:32px;padding:0 16px;background:var(--sp-neutral-lighter);border:1px solid var(--sp-neutral-quaternary-alt);border-radius:2px}
.sp-ql--button .sp-ql__desc{display:none}
.sp-ql--tiles{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.sp-ql--tiles .sp-ql__item{flex-direction:column;justify-content:space-between;gap:24px;min-height:120px;padding:16px;background:var(--sp-theme-primary);color:var(--sp-on-strong) !important}
.sp-ql--tiles .sp-ql__icon{color:inherit;justify-content:flex-start}
.sp-ql--tiles .sp-ql__icon svg{width:28px;height:28px}
.sp-ql--filmstrip .sp-strip__item{width:140px}
.sp-ql--filmstrip .sp-ql__item{flex-direction:column;gap:8px}
.sp-ql--filmstrip .sp-ql__thumb{aspect-ratio:9/16;overflow:hidden;background:var(--sp-neutral-lighter)}
.sp-ql--align-center .sp-ql__item{justify-content:center;text-align:center}
`;

const content = `
.sp-news{display:grid;gap:16px}
.sp-story{display:flex;flex-direction:column;gap:8px;color:var(--sp-text) !important;min-width:0}
.sp-story__thumb{overflow:hidden;background:var(--sp-neutral-lighter);aspect-ratio:16/9}
.sp-story__title{font-size:16px;line-height:22px;font-weight:600}
.sp-story__summary{font-size:14px;line-height:20px;color:var(--sp-neutral-secondary)}
.sp-news--top{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}
.sp-news--top .sp-news__side{display:grid;gap:12px;align-content:start}
.sp-news--top .sp-news__side .sp-story{flex-direction:row;gap:12px}
.sp-news--top .sp-news__side .sp-story__thumb{flex:none;width:120px;aspect-ratio:4/3}
.sp-news--top .sp-news__lead .sp-story__title{font-size:20px;line-height:28px}
.sp-news--list{grid-template-columns:minmax(0,1fr);gap:0}
.sp-news--list .sp-story{flex-direction:row;gap:16px;padding:12px 0;border-bottom:1px solid var(--sp-neutral-light)}
.sp-news--list .sp-story__thumb{flex:none;width:160px;aspect-ratio:16/9}
.sp-news--side{grid-template-columns:repeat(2,minmax(0,1fr))}
.sp-news--side .sp-story{flex-direction:row;gap:12px}
.sp-news--side .sp-story__thumb{flex:none;width:44%}
.sp-news--hub{grid-template-columns:minmax(0,1fr)}
.sp-news--hub .sp-story{flex-direction:row;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--sp-neutral-light)}
.sp-news--hub .sp-story__thumb{flex:none;width:72px;aspect-ratio:1/1}
.sp-news--tiles{grid-template-columns:repeat(3,minmax(0,1fr))}
.sp-news--tiles .sp-story{position:relative;min-height:200px;justify-content:flex-end;color:#fff !important;overflow:hidden}
.sp-news--tiles .sp-story__thumb{position:absolute;inset:0;aspect-ratio:auto}
.sp-news--tiles .sp-story__body{position:relative;padding:12px 16px;background:linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,0))}
.sp-news--tiles .sp-meta{color:rgba(255,255,255,.85)}
.sp-news--carousel .sp-story{position:relative;min-height:280px;justify-content:flex-end;color:#fff !important;overflow:hidden}
.sp-news--carousel .sp-story__thumb{position:absolute;inset:0;aspect-ratio:auto}
.sp-news--carousel .sp-story__body{position:relative;padding:20px 24px;background:linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,0))}
.sp-news--carousel .sp-story__title{font-size:24px;line-height:32px}
.sp-news--carousel .sp-meta{color:rgba(255,255,255,.85)}
.sp-news--filmstrip .sp-strip__item{width:220px}
.sp-news--tiles .sp-tag,.sp-news--carousel .sp-tag{color:#fff}
.sp-news--compact .sp-story__thumb{display:none}
.sp-news--compact .sp-story__summary{display:none}
.sp-events{display:grid;gap:12px}
.sp-event{display:flex;gap:12px;color:var(--sp-text) !important;min-width:0}
.sp-event__date{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:56px;height:56px;background:var(--sp-theme-lighter);
  color:var(--sp-theme-dark);border-radius:2px}
.sp-event__month{font-size:12px;line-height:14px;font-weight:600;text-transform:uppercase}
.sp-event__day{font-size:24px;line-height:28px;font-weight:600}
.sp-event__title{font-size:14px;line-height:20px;font-weight:600}
.sp-events--compact{grid-template-columns:minmax(0,1fr)}
.sp-events--filmstrip .sp-strip__item{width:280px;padding:12px;background:var(--sp-white);border:1px solid var(--sp-neutral-quaternary-alt);border-radius:2px}
.sp-hc{display:grid;gap:16px}
.sp-hc__item{display:flex;flex-direction:column;gap:8px;color:var(--sp-text) !important;min-width:0}
.sp-hc__thumb{overflow:hidden;aspect-ratio:16/9;background:var(--sp-neutral-lighter)}
.sp-hc__kind{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--sp-neutral-secondary)}
.sp-hc__title{font-size:14px;line-height:20px;font-weight:600}
.sp-hc--cards{grid-template-columns:repeat(3,minmax(0,1fr))}
.sp-hc--list{grid-template-columns:minmax(0,1fr);gap:0}
.sp-hc--list .sp-hc__item{flex-direction:row;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--sp-neutral-light)}
.sp-hc--list .sp-hc__thumb{flex:none;width:96px;aspect-ratio:16/9}
.sp-hc--filmstrip .sp-strip__item{width:220px}
.sp-people{display:grid;gap:16px}
.sp-person{display:flex;align-items:center;gap:12px;min-width:0}
.sp-person .sp-avatar{flex:none}
.sp-person__name{font-size:14px;line-height:20px;font-weight:600}
.sp-person__title{font-size:12px;line-height:16px;color:var(--sp-neutral-secondary)}
.sp-people--compact{grid-template-columns:repeat(auto-fill,minmax(56px,1fr))}
.sp-people--compact .sp-person{flex-direction:column;text-align:center;gap:4px}
.sp-people--compact .sp-person__name,.sp-people--compact .sp-person__title{font-size:12px;line-height:16px}
.sp-people--descriptive{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.sp-people--descriptive .sp-person{padding:12px;background:var(--sp-white);border:1px solid var(--sp-neutral-quaternary-alt);border-radius:2px}
.sp-people--descriptive .sp-avatar{width:48px;height:48px;font-size:16px}
.sp-person__contact{display:flex;gap:8px;margin-top:4px;color:var(--sp-theme-primary)}
`;

const data = `
.sp-doclib,.sp-listview{border:1px solid transparent}
.sp-command-bar{display:flex;align-items:center;gap:4px;min-height:44px;padding:0 4px;border-bottom:1px solid var(--sp-neutral-light);overflow:hidden}
.sp-command{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 10px;border-radius:2px;font-size:14px;white-space:nowrap}
.sp-command--primary{color:var(--sp-theme-primary);font-weight:600}
.sp-command-bar__spacer{flex:1 1 0}
.sp-grid{width:100%;border-collapse:collapse;font-size:14px}
.sp-grid th{padding:8px 12px;text-align:left;font-weight:600;color:var(--sp-neutral-primary);border-bottom:1px solid var(--sp-neutral-light);white-space:nowrap}
.sp-grid td{padding:8px 12px;border-bottom:1px solid var(--sp-neutral-lighter);vertical-align:middle}
.sp-grid tbody tr:hover{background:var(--sp-neutral-lighter-alt)}
.sp-grid__name{display:flex;align-items:center;gap:10px;font-weight:400}
.sp-filetype{display:inline-flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border-radius:2px;color:#fff;font-size:9px;font-weight:700}
.sp-filetype--word{background:#185abd}
.sp-filetype--excel{background:#107c41}
.sp-filetype--powerpoint{background:#c43e1c}
.sp-filetype--pdf{background:#d13438}
.sp-filetype--folder{background:#e8b000}
.sp-filetype--generic{background:#69797e}
.sp-countdown{position:relative;display:flex;flex-direction:column;align-items:center;gap:16px;padding:32px 24px;overflow:hidden;color:#fff;
  background:var(--sp-theme-dark);text-align:center}
.sp-countdown__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sp-countdown__shade{position:absolute;inset:0;background:rgba(0,0,0,.35)}
.sp-countdown > *:not(.sp-countdown__bg):not(.sp-countdown__shade){position:relative;z-index:1}
.sp-countdown__title{font-size:24px;line-height:32px;font-weight:600}
.sp-countdown__units{display:flex;gap:16px}
.sp-countdown__unit{display:flex;flex-direction:column;align-items:center;min-width:72px;padding:12px 8px;background:rgba(255,255,255,.18);border-radius:2px}
.sp-countdown__number{font-size:36px;line-height:40px;font-weight:600}
.sp-countdown__label{font-size:12px;line-height:16px;text-transform:uppercase;letter-spacing:.04em}
.sp-props{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px 24px;font-size:14px}
.sp-props dt{font-weight:600;color:var(--sp-neutral-secondary)}
.sp-props dd{margin:0}
`;

const responsive = `
@media (max-width:639px){
  .sp-gallery--brick{column-count:2}
  .sp-hero--tiles{grid-template-columns:minmax(0,1fr)}
  .sp-hero--tiles .sp-hero__tile:first-child{grid-column:auto;grid-row:auto;min-height:220px}
  .sp-news--top,.sp-news--side{grid-template-columns:minmax(0,1fr)}
  .sp-news--tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sp-news--list .sp-story__thumb{width:104px}
  .sp-hc--cards{grid-template-columns:repeat(2,minmax(0,1fr))}
  .sp-linkcard{flex-direction:column;gap:0}
  .sp-linkcard__thumb{width:100%}
  .sp-linkcard__body{padding:12px}
  .sp-cta__body{padding:24px 20px}
  .sp-countdown__unit{min-width:56px}
  .sp-grid th:nth-child(n+3),.sp-grid td:nth-child(n+3){display:none}
}
`;

export const SP_WEBPART_CSS = [
  common,
  text,
  buttons,
  media,
  quickLinks,
  content,
  data,
  responsive,
].join('\n');
