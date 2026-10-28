/**
 * The Simple kit's own CSS: a neutral, tidy look with no brand. Everything is driven by a few
 * variables on `.sk-page` (the accent colour is a kit setting). Only classes defined here may be
 * used in the catalogue snippets (`npm run catalogue` checks).
 */
export const SIMPLE_CSS = `
.sk-c{min-width:0}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#fff;color:#1f2430;font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.sk-page{--sk-accent:#2563eb;--sk-accent-ink:#fff;--sk-accent-text:var(--sk-accent);--sk-accent-soft:color-mix(in srgb,var(--sk-accent) 10%,#fff);--sk-text:#1f2430;--sk-muted:#667085;--sk-line:#e4e7ec;--sk-soft:#f6f7f9;--sk-radius:10px;--sk-gap:24px;color:var(--sk-text);min-height:100vh}
.sk-page img{max-width:100%;display:block}
.sk-page a{color:var(--sk-accent-text)}
.sk-page h1,.sk-page h2,.sk-page h3,.sk-page h4,.sk-page p{margin:0}

/* Sections and columns */
.sk-section{width:100%}
.sk-section__inner{display:grid;gap:var(--sk-gap);max-width:1120px;margin:0 auto;padding:48px 24px}
.sk-section--compact .sk-section__inner{padding-top:24px;padding-bottom:24px}
.sk-section--spacious .sk-section__inner{padding-top:88px;padding-bottom:88px}
.sk-section--wide .sk-section__inner{max-width:none}
.sk-section--one-column .sk-section__inner{grid-template-columns:minmax(0,1fr)}
.sk-section--two-columns .sk-section__inner{grid-template-columns:repeat(2,minmax(0,1fr))}
.sk-section--three-columns .sk-section__inner{grid-template-columns:repeat(3,minmax(0,1fr))}
.sk-section--sidebar-left .sk-section__inner{grid-template-columns:minmax(0,1fr) minmax(0,3fr)}
.sk-section--sidebar-right .sk-section__inner{grid-template-columns:minmax(0,3fr) minmax(0,1fr)}
.sk-section--bg-soft{background:var(--sk-soft)}
.sk-section--bg-dark{background:#161a23;color:#f4f5f7;--sk-text:#f4f5f7;--sk-muted:#aab0bd;--sk-line:#2d3341;--sk-soft:#1f2430}
.sk-section--bg-accent{background:var(--sk-accent);color:var(--sk-accent-ink);--sk-text:var(--sk-accent-ink);--sk-muted:color-mix(in srgb,var(--sk-accent-ink) 80%,transparent);--sk-line:color-mix(in srgb,var(--sk-accent-ink) 30%,transparent)}
.sk-section--bg-accent a{color:inherit}
.sk-section--bg-accent .sk-button{background:#fff;color:var(--sk-accent-text);border-color:#fff}
.sk-section--bg-accent .sk-button--outline,.sk-section--bg-accent .sk-button--text{background:transparent;color:var(--sk-accent-ink);border-color:var(--sk-accent-ink)}
.sk-section--bg-accent .sk-button--text{border-color:transparent}
.sk-column{display:flex;flex-direction:column;gap:16px;min-width:0;align-items:stretch}
.sk-column>*{min-width:0}
@media (max-width:720px){
.sk-section--two-columns .sk-section__inner,.sk-section--three-columns .sk-section__inner,.sk-section--sidebar-left .sk-section__inner,.sk-section--sidebar-right .sk-section__inner{grid-template-columns:minmax(0,1fr)}
.sk-section__inner{padding:32px 16px}
}

/* Text */
.sk-h{font-weight:700;letter-spacing:-.02em;line-height:1.15;color:var(--sk-text)}
.sk-h--1{font-size:clamp(32px,4.5vw,48px)}
.sk-h--2{font-size:clamp(26px,3.2vw,34px)}
.sk-h--3{font-size:22px;line-height:1.25}
.sk-h--4{font-size:18px;line-height:1.3}
.sk-p{color:var(--sk-text)}
.sk-p--lead{font-size:20px;line-height:1.5;color:var(--sk-muted)}
.sk-p--small{font-size:14px;color:var(--sk-muted)}
.sk-quote{margin:0;padding:4px 0 4px 20px;border-left:3px solid var(--sk-accent);font-size:20px;line-height:1.45}
.sk-quote cite{display:block;margin-top:8px;font-size:14px;font-style:normal;color:var(--sk-muted)}
.sk-list{margin:0;padding-left:22px;display:grid;gap:6px}
.sk-list--check{list-style:none;padding-left:0}
.sk-list--check li{position:relative;padding-left:28px}
.sk-list--check li::before{content:"✓";position:absolute;left:0;top:0;width:20px;height:20px;border-radius:50%;background:var(--sk-accent-soft);color:var(--sk-accent-text);font-size:12px;line-height:20px;text-align:center;font-weight:700;margin-top:2px}
.sk-divider{border:0;border-top:1px solid var(--sk-line);margin:8px 0;width:100%}
.sk-spacer{display:block;height:24px;width:100%}
.sk-spacer--small{height:12px}
.sk-spacer--large{height:56px}
.sk-badge{display:inline-flex;align-self:flex-start;align-items:center;padding:2px 10px;border-radius:999px;background:var(--sk-soft);color:var(--sk-text);border:1px solid var(--sk-line);font-size:13px;font-weight:600}
.sk-badge--accent{background:var(--sk-accent-soft);color:var(--sk-accent-text);border-color:transparent}
.sk-badge--success{background:#e7f6ec;color:#17693a;border-color:transparent}
.sk-badge--warning{background:#fff4de;color:#8a5a00;border-color:transparent}
.sk-badge--danger{background:#fdeaea;color:#a12626;border-color:transparent}
.sk-eyebrow{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--sk-accent-text)}

/* Actions */
.sk-button{display:inline-flex;align-items:center;justify-content:center;align-self:flex-start;gap:8px;min-height:44px;padding:0 20px;border-radius:var(--sk-radius);border:1px solid transparent;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;background:var(--sk-accent);color:var(--sk-accent-ink)}
.sk-button--secondary{background:var(--sk-soft);color:var(--sk-text);border-color:var(--sk-line)}
.sk-button--outline{background:transparent;color:var(--sk-accent-text);border-color:var(--sk-accent-text)}
.sk-button--text{background:transparent;color:var(--sk-accent-text);padding:0 8px}
.sk-button--small{min-height:34px;padding:0 14px;font-size:14px}
.sk-button--large{min-height:54px;padding:0 28px;font-size:18px}
.sk-button--full{align-self:stretch;width:100%}
.sk-buttons{display:flex;flex-wrap:wrap;gap:12px}
.sk-link{font-weight:600;text-decoration:none}
.sk-link:hover{text-decoration:underline}

/* Content */
.sk-card{display:flex;flex-direction:column;border:1px solid var(--sk-line);border-radius:calc(var(--sk-radius) + 4px);overflow:hidden;background:#fff;color:#1f2430}
.sk-card__image{width:100%;aspect-ratio:16/9;object-fit:cover}
.sk-card__body{display:flex;flex-direction:column;gap:8px;padding:20px}
.sk-card__title{font-size:20px;font-weight:700;letter-spacing:-.01em;line-height:1.25}
.sk-card__text{color:#667085}
.sk-card__link{margin-top:4px;font-weight:600;color:#2563eb;text-decoration:none}
.sk-card--horizontal{flex-direction:row}
.sk-card--horizontal .sk-card__image{width:38%;aspect-ratio:auto;min-height:160px}
.sk-card--flat{border-color:transparent;background:var(--sk-soft)}
.sk-hero{display:flex;flex-direction:column;align-items:flex-start;gap:16px;padding:32px 0}
.sk-hero--centre{align-items:center;text-align:center;max-width:720px;margin:0 auto}
.sk-hero--centre .sk-hero__actions{justify-content:center}
.sk-hero__title{font-size:clamp(34px,5vw,56px);font-weight:800;letter-spacing:-.03em;line-height:1.08}
.sk-hero__text{font-size:20px;line-height:1.5;color:var(--sk-muted);max-width:620px}
.sk-hero__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px}
.sk-hero--split{flex-direction:row;align-items:center;gap:40px}
.sk-hero__copy{display:flex;flex-direction:column;gap:16px;flex:1 1 0;min-width:0}
.sk-hero__image{flex:1 1 0;min-width:0;border-radius:calc(var(--sk-radius) + 6px);aspect-ratio:4/3;object-fit:cover}
.sk-callout{display:flex;flex-direction:column;gap:4px;padding:16px 20px;border-radius:var(--sk-radius);border:1px solid #bfd3fb;border-left-width:4px;background:#eef4ff;color:#1b2f5e}
.sk-callout--success{background:#eaf7ef;border-color:#a9dbbd;color:#14532d}
.sk-callout--warning{background:#fff7e6;border-color:#f3d28a;color:#6b4500}
.sk-callout--error{background:#fdeeee;border-color:#f0b3b3;color:#7a1d1d}
.sk-callout__title{font-weight:700}
.sk-callout__text{display:block}
.sk-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px}
.sk-stat{display:flex;flex-direction:column;gap:2px;padding:20px;border:1px solid var(--sk-line);border-radius:var(--sk-radius);background:#fff;color:#1f2430}
.sk-stat__value{font-size:36px;font-weight:800;letter-spacing:-.02em;line-height:1.1}
.sk-stat__label{color:#667085;font-size:14px}
.sk-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px}
.sk-feature{display:flex;flex-direction:column;gap:8px}
.sk-feature__icon{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:var(--sk-accent-soft);color:var(--sk-accent-text);font-size:20px}
.sk-feature__title{font-size:18px;font-weight:700}
.sk-feature__text{color:var(--sk-muted)}
.sk-accordion{border:1px solid var(--sk-line);border-radius:var(--sk-radius);overflow:hidden;background:#fff;color:#1f2430}
.sk-accordion details{border-top:1px solid var(--sk-line)}
.sk-accordion details:first-child{border-top:0}
.sk-accordion summary{cursor:pointer;padding:16px 20px;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:12px}
.sk-accordion summary::-webkit-details-marker{display:none}
.sk-accordion summary::after{content:"+";color:#667085;font-size:20px;line-height:1}
.sk-accordion details[open] summary::after{content:"–"}
.sk-accordion__body{padding:0 20px 18px;color:#667085}
.sk-table{width:100%;border-collapse:collapse;font-size:15px}
.sk-table th{text-align:left;font-weight:600;color:var(--sk-muted);font-size:13px;text-transform:uppercase;letter-spacing:.05em}
.sk-table th,.sk-table td{padding:12px 14px;border-bottom:1px solid var(--sk-line)}
.sk-table--striped tbody tr:nth-child(even){background:var(--sk-soft)}
.sk-rows{border:1px solid var(--sk-line);border-radius:var(--sk-radius);overflow:hidden;background:#fff;color:#1f2430}
.sk-row{display:flex;align-items:center;gap:14px;padding:14px 18px;border-top:1px solid var(--sk-line)}
.sk-row:first-child{border-top:0}
.sk-row__main{display:flex;flex-direction:column;flex:1;min-width:0}
.sk-row__title{font-weight:600}
.sk-row__sub{color:#667085;font-size:14px}
.sk-row__meta{color:#667085;font-size:14px;white-space:nowrap}
.sk-avatar{display:inline-flex;align-items:center;justify-content:center;flex:none;width:44px;height:44px;border-radius:50%;background:var(--sk-accent-soft);color:var(--sk-accent-text);font-weight:700}
.sk-profile{display:flex;align-items:center;gap:14px}
.sk-profile__name{font-weight:700}
.sk-profile__role{color:var(--sk-muted);font-size:14px}
.sk-profile__text{display:flex;flex-direction:column}
.sk-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;counter-reset:step}
.sk-step{display:flex;flex-direction:column;gap:12px}
.sk-step__num{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--sk-accent);color:var(--sk-accent-ink);font-weight:700}
.sk-step__title{font-weight:700}
.sk-step__text{color:var(--sk-muted);font-size:15px}
.sk-testimonial{display:flex;flex-direction:column;gap:16px;padding:28px;border:1px solid var(--sk-line);border-radius:calc(var(--sk-radius) + 4px);background:#fff;color:#1f2430}
.sk-testimonial__quote{font-size:20px;line-height:1.45}
.sk-pricing{display:flex;flex-direction:column;gap:14px;padding:28px;border:1px solid var(--sk-line);border-radius:calc(var(--sk-radius) + 4px);background:#fff;color:#1f2430}
.sk-pricing--featured{border:2px solid var(--sk-accent)}
.sk-pricing__name{font-weight:700;color:#667085}
.sk-pricing__price{font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1}
.sk-pricing__price small{font-size:16px;font-weight:500;color:#667085}
.sk-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:48px 24px;border:1px dashed var(--sk-line);border-radius:var(--sk-radius);text-align:center}
.sk-empty__icon{display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:var(--sk-soft);font-size:24px}
.sk-empty__title{font-weight:700;font-size:18px}
.sk-empty__text{color:var(--sk-muted);max-width:360px}
.sk-progress{display:flex;flex-direction:column;gap:8px}
.sk-progress__head{display:flex;justify-content:space-between;font-size:14px;font-weight:600}
.sk-progress__bar{height:10px;border-radius:999px;background:var(--sk-soft);border:1px solid var(--sk-line);overflow:hidden}
.sk-progress__fill{display:block;height:100%;width:65%;background:var(--sk-accent);border-radius:999px}
.sk-placeholder{display:flex;flex-direction:column;gap:6px;padding:16px;border:1px dashed #b42318;border-radius:var(--sk-radius);background:#fff6f5;color:#7a271a}
.sk-placeholder__tag{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}

/* Forms */
.sk-field{display:flex;flex-direction:column;gap:6px}
.sk-field__label{font-weight:600;font-size:15px}
.sk-field__hint{color:var(--sk-muted);font-size:14px}
.sk-input{width:100%;min-height:44px;padding:10px 14px;border:1px solid #c9ced8;border-radius:var(--sk-radius);background:#fff;color:#1f2430;font:inherit}
.sk-input::placeholder{color:#98a2b3}
.sk-input--area{min-height:110px;resize:none}
.sk-input--search{padding-left:40px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E") no-repeat 13px center}
.sk-check{display:flex;align-items:center;gap:10px;cursor:pointer}
.sk-check input{width:20px;height:20px;accent-color:var(--sk-accent);margin:0}
.sk-switch{position:relative;display:inline-flex;align-items:center;gap:12px;cursor:pointer}
.sk-switch input{position:absolute;opacity:0;width:44px;height:26px;margin:0}
.sk-switch__track{width:44px;height:26px;border-radius:999px;background:#c9ced8;position:relative;transition:background .15s}
.sk-switch__track::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
.sk-switch input:checked+.sk-switch__track{background:var(--sk-accent)}
.sk-switch input:checked+.sk-switch__track::after{transform:translateX(18px)}
.sk-form{display:flex;flex-direction:column;gap:16px;padding:28px;border:1px solid var(--sk-line);border-radius:calc(var(--sk-radius) + 4px);background:#fff;color:#1f2430}
.sk-form__title{font-size:22px;font-weight:700;letter-spacing:-.01em}

/* Navigation */
.sk-navbar{display:flex;align-items:center;gap:28px;padding:16px 32px;border-bottom:1px solid var(--sk-line);background:#fff;color:#1f2430}
.sk-navbar__brand{font-weight:800;font-size:20px;letter-spacing:-.02em;text-decoration:none;color:inherit}
.sk-navbar__links{display:flex;gap:22px;flex:1;flex-wrap:wrap}
.sk-navbar__links a{color:#475467;text-decoration:none;font-weight:500}
.sk-navbar--centre{justify-content:center}
.sk-navbar--centre .sk-navbar__links{flex:none}
.sk-navbar .sk-button{align-self:center}
.sk-breadcrumb{display:flex;flex-wrap:wrap;gap:8px;font-size:14px;color:var(--sk-muted);list-style:none;margin:0;padding:0}
.sk-breadcrumb li+li::before{content:"/";margin-right:8px;color:#b8bec9}
.sk-breadcrumb li:last-child{color:var(--sk-text);font-weight:600}
.sk-breadcrumb a{text-decoration:none;color:inherit}
.sk-tabs{display:flex;gap:4px;border-bottom:1px solid var(--sk-line);overflow:hidden}
.sk-tab{padding:10px 16px;border-bottom:2px solid transparent;margin-bottom:-1px;color:var(--sk-muted);font-weight:600;text-decoration:none}
.sk-tab--active{color:var(--sk-accent-text);border-bottom-color:var(--sk-accent-text)}
.sk-pagination{display:flex;gap:6px;align-items:center}
.sk-page-link{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:38px;padding:0 10px;border:1px solid var(--sk-line);border-radius:8px;text-decoration:none;color:var(--sk-text);font-weight:600}
.sk-page-link--active{background:var(--sk-accent);border-color:var(--sk-accent-text);color:var(--sk-accent-ink)}
.sk-sidenav{display:flex;flex-direction:column;gap:2px}
.sk-sidenav a{padding:9px 12px;border-radius:8px;color:var(--sk-text);text-decoration:none;font-weight:500}
.sk-sidenav a.sk-sidenav__active{background:var(--sk-accent-soft);color:var(--sk-accent-text);font-weight:700}
.sk-footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:28px 32px;background:#161a23;color:#aab0bd;font-size:14px}
.sk-footer__links{display:flex;gap:20px;flex-wrap:wrap}
.sk-footer a{color:#e4e7ec;text-decoration:none}

/* Media */
.sk-image{display:flex;flex-direction:column;gap:8px;margin:0}
.sk-image__img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:var(--sk-radius)}
.sk-image--square .sk-image__img{aspect-ratio:1/1}
.sk-image--banner .sk-image__img{aspect-ratio:3/1}
.sk-image figcaption{font-size:14px;color:var(--sk-muted)}
.sk-video{position:relative;aspect-ratio:16/9;border-radius:var(--sk-radius);background:#1f2430;display:flex;align-items:center;justify-content:center}
.sk-video__play{display:flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.95);color:#1f2430;font-size:24px;padding-left:4px}
.sk-logos{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px 32px;color:var(--sk-muted);font-weight:800;font-size:20px;letter-spacing:-.02em}
.sk-box{display:flex;align-items:center;justify-content:center;min-height:140px;border:1px dashed #b8bec9;border-radius:var(--sk-radius);background:var(--sk-soft);color:var(--sk-muted);font-weight:600;text-align:center;padding:16px}
.sk-box--cross{background:linear-gradient(to top right,transparent calc(50% - 1px),#c9ced8,transparent calc(50% + 1px)),linear-gradient(to bottom right,transparent calc(50% - 1px),#c9ced8,transparent calc(50% + 1px)),var(--sk-soft)}
/* Alignment option */
.sk-align-center{text-align:center;margin-left:auto;margin-right:auto;justify-content:center;align-self:center}
.sk-align-right{text-align:right;margin-left:auto;justify-content:flex-end;align-self:flex-end}
.sk-button.sk-align-center,.sk-button.sk-align-right{display:flex;width:fit-content}
.sk-button.sk-align-center{margin-left:auto;margin-right:auto}
#root>[data-node]+[data-node],.sk-section__inner>div>[data-node]+[data-node]{margin-top:16px}
`;
