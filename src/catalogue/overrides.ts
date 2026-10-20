import type { Category } from './types';

/**
 * Hand-curated data the markup can't express. Applied on top of `sources/` by
 * `scripts/generate-catalogue.ts`. Regenerate with `npm run catalogue`.
 */
export interface Override {
  /** Move to a different library category. */
  category?: Category;
  /** Extra search terms. */
  keywords?: string[];
  /** Labels for `data-optional` parts, keyed by part key. Falls back to a capitalised key. */
  optionalLabels?: Record<string, string>;
  /** Variant shown first and used when a component is added. Defaults to the first variant. */
  defaultVariant?: string;
}

export const overrides: Record<string, Override> = {
  button: { keywords: ['cta', 'call to action', 'submit', 'primary', 'secondary'] },
  link: { keywords: ['anchor', 'hyperlink'] },
  card: {
    keywords: ['tile', 'teaser', 'promo'],
    optionalLabels: { tag: 'Tag', copy: 'Summary text', date: 'Date', image: 'Image' },
  },
  'list-item': {
    keywords: ['result', 'article', 'news'],
    optionalLabels: { label: 'Category label', copy: 'Summary text', date: 'Date', image: 'Image' },
  },
  accordion: { keywords: ['expand', 'collapse', 'faq', 'details'] },
  callout: { keywords: ['highlight', 'notice', 'important'] },
  table: { keywords: ['data', 'grid', 'rows', 'columns'] },
  tag: { keywords: ['chip', 'label', 'topic'] },
  'status-labels': { keywords: ['badge', 'status', 'pill'] },
  steps: { keywords: ['process', 'numbered', 'stages'] },
  'support-list': { keywords: ['logos', 'partners', 'funding'] },
  'close-button': { keywords: ['dismiss', 'x'] },
  masthead: { keywords: ['official', 'government', 'top bar'] },
  header: {
    keywords: ['logo', 'banner', 'site name', 'search'],
    optionalLabels: { menu: 'Menu button', description: 'Description', search: 'Search button' },
  },
  footer: {
    keywords: ['links', 'copyright', 'legal'],
    optionalLabels: { acknowledgement: 'Acknowledgement of Country' },
  },
  'hero-banner': {
    keywords: ['banner', 'headline', 'intro', 'splash'],
    optionalLabels: { button: 'Button' },
  },
  'hero-search': { keywords: ['search', 'banner'] },
  'content-block': {
    keywords: ['feature', 'icon', 'teaser'],
    optionalLabels: { icon: 'Icon', link: 'Link' },
  },
  'main-nav': { keywords: ['menu', 'navigation', 'primary'] },
  breadcrumbs: { keywords: ['trail', 'path', 'location'] },
  'side-nav': { keywords: ['sidebar', 'menu', 'local navigation'] },
  'in-page-nav': { keywords: ['on this page', 'anchor links', 'contents', 'toc'] },
  pagination: { keywords: ['pages', 'next', 'previous', 'paging'] },
  tabs: { keywords: ['tabbed', 'panels'] },
  'link-list': { keywords: ['related links', 'list of links'] },
  'utility-list': { keywords: ['print', 'share', 'actions'] },
  'back-to-top': { keywords: ['scroll', 'top'] },
  form: {
    keywords: ['input', 'text field', 'checkbox', 'radio', 'textarea', 'field'],
    optionalLabels: { helper: 'Helper text' },
  },
  select: {
    keywords: ['dropdown', 'drop-down', 'combo'],
    optionalLabels: { helper: 'Helper text' },
  },
  'date-input': { keywords: ['dob', 'birth', 'calendar'] },
  'date-picker': { keywords: ['calendar', 'date'], optionalLabels: { helper: 'Helper text' } },
  'file-upload': { keywords: ['attach', 'upload', 'document'] },
  filters: { keywords: ['refine', 'facets', 'search results'] },
  'global-alert': {
    keywords: ['banner', 'announcement', 'emergency', 'critical'],
    optionalLabels: { button: 'Button' },
  },
  'in-page-alert': { keywords: ['message', 'notification', 'error', 'success', 'warning', 'info'] },
  dialog: { keywords: ['modal', 'confirm', 'popup'] },
  'cookie-consent': { keywords: ['privacy', 'consent', 'cookies'] },
  loader: { keywords: ['spinner', 'loading', 'wait'] },
  'progress-indicator': { keywords: ['progress', 'bar', 'steps'] },
  popover: { keywords: ['popup', 'overlay'] },
  tooltip: { keywords: ['hint', 'hover', 'toggletip'] },
  'quick-exit': { keywords: ['safety', 'escape', 'leave'] },
  media: {
    keywords: ['image', 'picture', 'photo', 'video'],
    optionalLabels: { caption: 'Caption' },
  },
  'card-carousel': { keywords: ['slider', 'cards', 'scroll'] },
};
