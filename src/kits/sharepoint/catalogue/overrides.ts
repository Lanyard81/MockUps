import type { OptionDef } from '../../../catalogue/types';

/** Hand-curated data the markup can't express (see the NSW kit's `overrides.ts`). */
export interface Override {
  category?: string;
  keywords?: string[];
  optionalLabels?: Record<string, string>;
  options?: OptionDef[];
  defaultVariant?: string;
}

const align = (selector: string, className: string): OptionDef => ({
  type: 'choice',
  key: 'align',
  label: 'Alignment',
  selector,
  choices: [
    { id: 'left', label: 'Left' },
    { id: 'center', label: 'Centre', className },
  ],
});

const href = (selector: string, label = 'Link address'): OptionDef => ({
  type: 'href',
  key: 'href',
  label,
  selector,
});

const TITLE_LABELS = {
  titleRow: 'Show title and commands',
  seeAll: 'Show “See all”',
  summaries: 'Show summaries',
  descriptions: 'Show descriptions',
  captions: 'Show captions',
  caption: 'Show caption',
};

const items = (from: number, to: number, noun = 'Item') =>
  Object.fromEntries(
    Array.from({ length: to - from + 1 }, (_, i) => [
      `${noun.toLowerCase()}${from + i}`,
      `${noun} ${from + i}`,
    ]),
  );

export const overrides: Record<string, Override> = {
  'sp-text': {
    keywords: ['paragraph', 'heading', 'body', 'rich text', 'quote', 'list', 'table'],
    optionalLabels: { source: 'Show source' },
    options: [
      {
        type: 'choice',
        key: 'align',
        label: 'Alignment',
        selector: '.sp-text',
        choices: [
          { id: 'left', label: 'Left' },
          { id: 'center', label: 'Centre', className: 'sp-align-center' },
          { id: 'right', label: 'Right', className: 'sp-align-right' },
        ],
      },
      {
        type: 'toggleClass',
        key: 'accent',
        label: 'Theme colour text',
        selector: '.sp-text',
        className: 'sp-text--accent',
      },
      {
        type: 'toggleClass',
        key: 'highlight',
        label: 'Highlight',
        selector: '.sp-text',
        className: 'sp-text--highlight',
      },
      {
        type: 'choice',
        key: 'tableStyle',
        label: 'Table style',
        selector: '.sp-table',
        choices: [
          { id: 'plain', label: 'Plain' },
          { id: 'striped', label: 'Striped rows', className: 'sp-table--striped' },
          { id: 'header', label: 'Coloured header', className: 'sp-table--header-colour' },
          { id: 'light', label: 'Light', className: 'sp-table--light' },
        ],
      },
    ],
  },
  'sp-divider': {
    keywords: ['line', 'rule', 'separator'],
    options: [
      {
        type: 'choice',
        key: 'weight',
        label: 'Line',
        selector: '.sp-divider',
        choices: [
          { id: 'thin', label: 'Thin' },
          { id: 'thick', label: 'Thick', className: 'sp-divider--thick' },
          { id: 'accent', label: 'Theme colour', className: 'sp-divider--accent' },
        ],
      },
    ],
  },
  'sp-spacer': {
    keywords: ['space', 'gap', 'padding'],
    options: [
      {
        type: 'choice',
        key: 'height',
        label: 'Height',
        selector: '.sp-spacer',
        choices: [
          { id: 'medium', label: 'Medium (24px)' },
          { id: 'small', label: 'Small (12px)', className: 'sp-spacer--small' },
          { id: 'large', label: 'Large (48px)', className: 'sp-spacer--large' },
        ],
      },
    ],
  },
  'sp-image': {
    keywords: ['picture', 'photo'],
    optionalLabels: { caption: 'Show caption' },
    options: [
      {
        type: 'choice',
        key: 'ratio',
        label: 'Aspect ratio',
        selector: '.sp-image__frame',
        choices: [
          { id: '16x9', label: '16:9', className: 'sp-ratio-16x9' },
          { id: '4x3', label: '4:3', className: 'sp-ratio-4x3' },
          { id: '3x2', label: '3:2', className: 'sp-ratio-3x2' },
          { id: '1x1', label: 'Square', className: 'sp-ratio-1x1' },
        ],
      },
    ],
  },
  'sp-image-gallery': {
    keywords: ['photos', 'pictures', 'album', 'brick', 'grid', 'carousel'],
    optionalLabels: { captions: 'Show captions' },
  },
  'sp-hero': {
    keywords: ['banner', 'tiles', 'layers', 'featured'],
    optionalLabels: {
      ...items(2, 5, 'Item'),
      ...Object.fromEntries([1, 2, 3, 4, 5].map((n) => [`cta${n}`, `Call to action ${n}`])),
    },
    options: [href('.sp-hero__tile', 'First item link address')],
  },
  'sp-button': {
    keywords: ['link', 'action'],
    options: [
      align('.sp-button-row', 'sp-align-center'),
      {
        type: 'choice',
        key: 'style',
        label: 'Style',
        selector: '.sp-button',
        choices: [
          { id: 'primary', label: 'Primary', className: 'sp-button--primary' },
          { id: 'secondary', label: 'Secondary', className: 'sp-button--secondary' },
        ],
      },
      href('.sp-button'),
    ],
  },
  'sp-cta': {
    keywords: ['call to action', 'banner', 'promo'],
    optionalLabels: { text: 'Show text' },
    options: [align('.sp-cta__body', 'sp-align-center'), href('.sp-button')],
  },
  'sp-link': {
    keywords: ['preview', 'card', 'url', 'website'],
    optionalLabels: { url: 'Show address', description: 'Show description' },
    options: [href('.sp-linkcard')],
  },
  'sp-quick-links': {
    keywords: ['links', 'shortcuts', 'tiles', 'buttons', 'filmstrip', 'icons'],
    optionalLabels: {
      ...TITLE_LABELS,
      ...Object.fromEntries([4, 5, 6].map((n) => [`item${n}`, `Link ${n}`])),
    },
    options: [
      {
        type: 'choice',
        key: 'align',
        label: 'Alignment',
        selector: '.sp-ql',
        choices: [
          { id: 'left', label: 'Left' },
          { id: 'center', label: 'Centre', className: 'sp-ql--align-center' },
        ],
      },
      ...[1, 2, 3, 4, 5, 6].map((n): OptionDef => ({
        type: 'iconSlot',
        key: `icon${n}`,
        label: `Link ${n} icon`,
        selector: `[data-slot="icon${n}"]`,
      })),
    ],
  },
  'sp-news': {
    keywords: ['stories', 'articles', 'announcements', 'carousel', 'tiles', 'filmstrip'],
    optionalLabels: { ...TITLE_LABELS, ...items(2, 6, 'Story') },
    options: [
      {
        type: 'toggleClass',
        key: 'compact',
        label: 'Compact view',
        selector: '.sp-news',
        className: 'sp-news--compact',
      },
    ],
  },
  'sp-events': {
    keywords: ['calendar', 'dates', 'filmstrip'],
    optionalLabels: { ...TITLE_LABELS, ...items(3, 5, 'Event') },
  },
  'sp-highlighted-content': {
    keywords: ['documents', 'pages', 'cards', 'carousel', 'filmstrip'],
    optionalLabels: { ...TITLE_LABELS, ...items(4, 6, 'Item') },
  },
  'sp-people': {
    keywords: ['team', 'staff', 'directory', 'contacts'],
    optionalLabels: { ...TITLE_LABELS, contact: 'Show contact buttons', ...items(5, 6, 'Person') },
  },
  'sp-countdown': {
    keywords: ['timer', 'date', 'clock'],
    optionalLabels: { button: 'Show button' },
  },
  'sp-page-properties': { keywords: ['metadata', 'author', 'details'] },
  'sp-document-library': {
    keywords: ['files', 'documents', 'folder', 'library'],
    optionalLabels: {
      titleRow: 'Show title',
      commandBar: 'Show command bar',
      ...items(5, 6, 'Row'),
    },
  },
  'sp-list': {
    keywords: ['table', 'items', 'tasks', 'data'],
    optionalLabels: { titleRow: 'Show title', commandBar: 'Show command bar', row5: 'Row 5' },
  },
};
