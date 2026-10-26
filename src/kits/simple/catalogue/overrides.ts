import type { OptionDef } from '../../../catalogue/types';

/** Hand-curated data the markup can't express (see the NSW kit's `overrides.ts`). */
export interface Override {
  category?: string;
  keywords?: string[];
  optionalLabels?: Record<string, string>;
  options?: OptionDef[];
  defaultVariant?: string;
}

const align = (selector = '.sk-c'): OptionDef => ({
  type: 'choice',
  key: 'align',
  label: 'Alignment',
  selector,
  choices: [
    { id: 'left', label: 'Left' },
    { id: 'center', label: 'Centre', className: 'sk-align-center' },
    { id: 'right', label: 'Right', className: 'sk-align-right' },
  ],
});

const href = (selector: string, label = 'Link address'): OptionDef => ({
  type: 'href',
  key: 'href',
  label,
  selector,
});

export const overrides: Record<string, Override> = {
  'sk-heading': {
    keywords: ['title', 'h1', 'h2', 'heading'],
    options: [
      align(),
      { type: 'headingLevel', key: 'level', label: 'Heading level', selector: '.sk-h', default: 1 },
    ],
  },
  'sk-paragraph': { keywords: ['text', 'body', 'copy'], options: [align()] },
  'sk-eyebrow': { keywords: ['label', 'kicker', 'overline'], options: [align()] },
  'sk-quote': { keywords: ['blockquote', 'pull quote'], optionalLabels: { source: 'Show source' } },
  'sk-list': { keywords: ['bullets', 'numbers', 'checklist', 'ticks'] },
  'sk-badge': { keywords: ['tag', 'status', 'pill', 'label'], options: [align()] },
  'sk-divider': { keywords: ['line', 'rule', 'spacer', 'gap', 'space'] },
  'sk-button': {
    keywords: ['cta', 'call to action', 'submit'],
    options: [
      href('.sk-button'),
      align('.sk-button'),
      {
        type: 'choice',
        key: 'size',
        label: 'Size',
        selector: '.sk-button',
        choices: [
          { id: 'medium', label: 'Medium' },
          { id: 'small', label: 'Small', className: 'sk-button--small' },
          { id: 'large', label: 'Large', className: 'sk-button--large' },
        ],
      },
      {
        type: 'toggleClass',
        key: 'full',
        label: 'Full width',
        selector: '.sk-button',
        className: 'sk-button--full',
      },
    ],
  },
  'sk-buttons': { keywords: ['cta', 'actions', 'group'], options: [align('.sk-buttons')] },
  'sk-link': { keywords: ['anchor', 'url'], options: [href('.sk-link')] },
  'sk-card': {
    keywords: ['tile', 'panel', 'teaser'],
    optionalLabels: { link: 'Show link' },
    options: [href('.sk-card__link')],
  },
  'sk-hero': {
    keywords: ['banner', 'header', 'intro', 'landing'],
    optionalLabels: { actions: 'Show buttons' },
  },
  'sk-callout': { keywords: ['alert', 'notice', 'message', 'warning', 'info'] },
  'sk-stats': { keywords: ['numbers', 'metrics', 'kpi', 'figures'] },
  'sk-features': { keywords: ['benefits', 'icons', 'highlights'] },
  'sk-accordion': { keywords: ['faq', 'expand', 'collapse', 'questions'] },
  'sk-table': { keywords: ['grid', 'data', 'rows', 'columns'] },
  'sk-rows': { keywords: ['list', 'files', 'people', 'items'] },
  'sk-profile': { keywords: ['person', 'avatar', 'author', 'user'] },
  'sk-steps': { keywords: ['process', 'how it works', 'stages'] },
  'sk-testimonial': { keywords: ['review', 'quote', 'customer'] },
  'sk-pricing': { keywords: ['plan', 'price', 'tier'] },
  'sk-empty': {
    keywords: ['blank', 'no results', 'zero state'],
    optionalLabels: { action: 'Show button' },
  },
  'sk-progress': { keywords: ['bar', 'percentage', 'loading'] },
  'sk-field': {
    keywords: ['input', 'text box', 'email', 'textarea', 'dropdown', 'select', 'search'],
    optionalLabels: { hint: 'Show hint', label: 'Show label' },
  },
  'sk-check': { keywords: ['checkbox', 'radio', 'toggle', 'switch', 'option'] },
  'sk-form': { keywords: ['login', 'sign in', 'contact', 'inputs'] },
  'sk-navbar': {
    keywords: ['menu', 'header', 'top bar', 'navigation'],
    optionalLabels: { action: 'Show button' },
  },
  'sk-footer': { keywords: ['bottom', 'links', 'copyright'] },
  'sk-breadcrumb': { keywords: ['trail', 'path'] },
  'sk-tabs': { keywords: ['tab', 'sections'] },
  'sk-sidenav': { keywords: ['sidebar', 'menu', 'vertical'] },
  'sk-pagination': { keywords: ['pages', 'next', 'previous'] },
  'sk-image': {
    keywords: ['picture', 'photo', 'figure'],
    optionalLabels: { caption: 'Show caption' },
  },
  'sk-video': { keywords: ['play', 'movie', 'media'] },
  'sk-logos': { keywords: ['brands', 'partners', 'customers', 'clients'] },
  'sk-box': { keywords: ['wireframe', 'placeholder', 'blank', 'rectangle'] },
  'sk-placeholder': { keywords: ['not converted'] },
};
