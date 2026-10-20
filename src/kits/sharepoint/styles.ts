/**
 * The SharePoint-style kit's CSS: a lookalike built on Fluent UI design tokens (SharePoint's own
 * page CSS isn't published). Every class is `sp-*`; colours come from theme variables set on the
 * `.sp-site` wrapper, so a theme change is one set of variables. No Microsoft fonts are bundled:
 * the font stack falls back to the system font.
 */
export const SP_FONT_STACK =
  '"Segoe UI","Segoe UI Web (West European)",-apple-system,BlinkMacSystemFont,Roboto,"Helvetica Neue",sans-serif';

const base = `
.sp-site{
  font-family:${SP_FONT_STACK};
  font-size:14px;line-height:1.43;color:var(--sp-text);background:var(--sp-bg);
  -webkit-font-smoothing:antialiased;min-height:100vh;
}
.sp-site *,.sp-site *::before,.sp-site *::after{box-sizing:border-box}
.sp-site h1,.sp-site h2,.sp-site h3,.sp-site h4,.sp-site p,.sp-site ul,.sp-site ol{margin:0}
.sp-site a{color:var(--sp-link)}
`;

const layout = `
.sp-page{display:block}
.sp-section{padding:16px 0}
.sp-section__inner{display:flex;gap:0;max-width:1204px;margin:0 auto;padding:0 24px}
.sp-column{flex:1 1 0;min-width:0;padding:0 8px}
.sp-column > *+*{margin-top:16px}
`;

const text = `
.sp-text{font-size:14px;line-height:20px}
.sp-text p+p{margin-top:12px}
`;

export const SP_CSS = [base, layout, text].join('\n');
