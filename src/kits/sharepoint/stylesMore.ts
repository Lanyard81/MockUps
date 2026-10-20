/** Styles for the static-preview web parts (Milestone S5). See `styles.ts`. */
export const SP_MORE_CSS = `
.sp-preview{display:flex;align-items:flex-start;gap:16px;padding:20px}
.sp-preview__icon{display:inline-flex;align-items:center;justify-content:center;flex:none;width:48px;height:48px;border-radius:2px;
  background:var(--sp-theme-lighter);color:var(--sp-theme-primary)}
.sp-preview__body{display:flex;flex-direction:column;gap:6px;min-width:0}
.sp-preview__title{font-size:16px;line-height:22px;font-weight:600}
.sp-preview__text{color:var(--sp-neutral-secondary)}
.sp-preview .sp-button{align-self:flex-start;margin-top:8px}
.sp-placeholder{display:flex;flex-direction:column;gap:4px;padding:16px;border:2px dashed var(--sp-neutral-tertiary);border-radius:2px;background:var(--sp-neutral-lighter-alt);color:var(--sp-neutral-primary)}
.sp-placeholder__tag{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--sp-neutral-secondary)}
.sp-placeholder__name{font-size:16px}
.sp-placeholder__text{color:var(--sp-neutral-secondary)}
.sp-chart{display:block}
.sp-chart__svg{display:block;width:100%;max-width:560px;height:auto}
.sp-chart__axis{stroke:var(--sp-neutral-quaternary-alt);stroke-width:1}
.sp-chart__value{font-size:12px;font-weight:600;fill:var(--sp-neutral-primary)}
.sp-chart__label{font-size:12px;fill:var(--sp-neutral-secondary)}
.sp-chart__pie{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.sp-chart__svg--pie{width:220px}
.sp-chart__legend{display:flex;flex-direction:column;gap:6px}
.sp-chart__legend li{display:flex;align-items:center;gap:8px}
.sp-chart__swatch{width:12px;height:12px;border-radius:2px;flex:none}
.sp-weather{display:flex;flex-direction:column;gap:16px;padding:20px;max-width:360px}
.sp-weather__now{display:flex;align-items:center;gap:16px}
.sp-weather__icon{color:var(--sp-theme-primary)}
.sp-weather__temp{font-size:40px;line-height:44px;font-weight:300}
.sp-weather__place{font-weight:600}
.sp-weather__days{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center;font-size:12px}
.sp-weather__days li{display:flex;flex-direction:column;align-items:center;gap:4px}
.sp-clocks{display:flex;gap:24px;flex-wrap:wrap}
.sp-clock{display:flex;flex-direction:column;align-items:center;gap:4px}
.sp-clock__face{position:relative;width:64px;height:64px;border:2px solid var(--sp-neutral-primary);border-radius:50%}
.sp-clock__hand{position:absolute;left:50%;bottom:50%;width:2px;background:var(--sp-neutral-primary);transform-origin:bottom center}
.sp-clock__hand--hour{height:16px;transform:translateX(-50%) rotate(285deg)}
.sp-clock__hand--minute{height:24px;transform:translateX(-50%) rotate(246deg)}
.sp-clock__city{font-weight:600}
.sp-sites{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.sp-site-tile{display:flex;align-items:center;gap:12px;padding:12px;color:var(--sp-text) !important}
.sp-site-tile__logo{display:inline-flex;align-items:center;justify-content:center;flex:none;width:40px;height:40px;border-radius:2px;color:#fff;font-weight:600}
.sp-site-tile__name{font-weight:600}
.sp-rows{display:flex;flex-direction:column}
.sp-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--sp-neutral-light)}
.sp-row__main{display:flex;flex-direction:column;gap:2px;min-width:0}
.sp-row__title{font-weight:600}
.sp-row__icon{color:var(--sp-theme-primary)}
.sp-calendar{padding:12px;max-width:420px}
.sp-calendar__head{padding:4px 4px 12px;font-size:16px;font-weight:600}
.sp-calendar__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}
.sp-calendar__dow{padding:4px;font-size:12px;font-weight:600;color:var(--sp-neutral-secondary)}
.sp-calendar__day{position:relative;display:flex;align-items:flex-start;justify-content:center;min-height:44px;padding:4px;font-size:12px;border-radius:2px}
.sp-calendar__day.is-out{color:var(--sp-neutral-tertiary)}
.sp-calendar__day.is-today{background:var(--sp-theme-primary);color:var(--sp-on-strong)}
.sp-calendar__event{position:absolute;left:6px;right:6px;bottom:4px;height:4px;border-radius:2px;background:var(--sp-theme-secondary)}
.sp-org{display:flex;flex-direction:column;align-items:center;gap:24px}
.sp-org__top{display:flex;justify-content:center}
.sp-org__row{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
.sp-org__box{display:flex;align-items:center;gap:10px;padding:10px 14px}
.sp-markdown h2{font-size:20px;line-height:28px;font-weight:600;margin-bottom:8px}
.sp-markdown ul{list-style:disc;padding-left:24px;margin-top:8px}
.sp-code-wrap{border:1px solid var(--sp-neutral-quaternary-alt);border-radius:2px;overflow:hidden}
.sp-code__lang{padding:6px 12px;font-size:12px;color:var(--sp-neutral-secondary);background:var(--sp-neutral-lighter);border-bottom:1px solid var(--sp-neutral-light)}
.sp-code{margin:0;padding:12px;font:13px/20px Consolas,"Cascadia Mono","Courier New",monospace;white-space:pre-wrap;background:var(--sp-neutral-lighter-alt);overflow-x:auto}
.sp-video{position:relative;overflow:hidden;background:#000}
.sp-video__play{position:absolute;left:50%;top:50%;display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;margin:-32px 0 0 -32px;
  border-radius:50%;background:rgba(0,0,0,.65);color:#fff}
.sp-video__title{position:absolute;left:0;right:0;bottom:0;padding:12px 16px;color:#fff;font-weight:600;background:linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,0))}
.sp-filecard{display:flex;flex-direction:column;gap:12px;padding:16px;max-width:320px}
.sp-filecard__page{display:flex;flex-direction:column;gap:8px;padding:16px;aspect-ratio:3/4;background:var(--sp-neutral-lighter);border:1px solid var(--sp-neutral-quaternary-alt)}
.sp-filecard__page span{height:8px;background:var(--sp-neutral-quaternary-alt)}
.sp-filecard__page span:first-child{width:60%;height:12px}
.sp-filecard__name{display:flex;align-items:center;gap:8px;font-weight:600}
.sp-report{padding:16px}
.sp-report__title{margin-bottom:12px;font-size:16px;font-weight:600}
.sp-map{position:relative;overflow:hidden;background:
  linear-gradient(0deg,rgba(255,255,255,.5) 1px,transparent 1px) 0 0/48px 48px,
  linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px) 0 0/48px 48px,var(--sp-neutral-light)}
.sp-map__pin{position:absolute;left:50%;top:44%;margin:-28px 0 0 -14px;color:#a4262c}
.sp-map__label{position:absolute;left:12px;bottom:12px;padding:6px 10px;background:var(--sp-white);border-radius:2px;box-shadow:0 1.6px 3.6px rgba(0,0,0,.13)}
.sp-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.sp-board__col{display:flex;flex-direction:column;gap:8px;padding:8px;background:var(--sp-neutral-lighter);border-radius:2px}
.sp-board__head{font-weight:600;padding:4px}
.sp-board__card{padding:10px 12px}
.sp-posts{display:flex;flex-direction:column;gap:12px}
.sp-post{display:flex;gap:12px;padding:12px}
.sp-post__body{display:flex;flex-direction:column;gap:2px;min-width:0}
@media (max-width:639px){
  .sp-board{grid-template-columns:minmax(0,1fr)}
  .sp-weather__days{grid-template-columns:repeat(3,1fr)}
}
`;
