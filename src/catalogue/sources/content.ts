import type { ComponentSource, VariantSource } from '../types';
import { icon, placeholderImage } from './helpers';

const buttonStyles: [string, string, VariantSource['previewBg']?][] = [
  ['dark', 'Brand Dark'],
  ['dark-outline', 'Brand Dark Outline'],
  ['dark-outline-solid', 'Brand Dark Outline Solid'],
  ['light', 'Brand Light'],
  ['light-outline', 'Brand Light Outline', 'brand-dark'],
  ['white', 'White', 'brand-dark'],
  ['white-outline', 'White Outline', 'brand-dark'],
  ['danger', 'Danger'],
  ['info', 'Info'],
];

// The image comes first: NSW styles `.nsw-card__image + .nsw-card__content`.
const card = (mod: string, withImage: boolean) =>
  `<div class="nsw-card${mod ? ` nsw-card--${mod}` : ''}">` +
  (withImage
    ? `<div class="nsw-card__image" data-optional="image"><img src="${placeholderImage(640, 360)}" alt="" data-image="image"></div>`
    : '') +
  `<div class="nsw-card__content">` +
  `<div class="nsw-card__tag" data-optional="tag" data-edit="tag">Tag</div>` +
  `<h3 class="nsw-card__title"><a href="#"><span data-edit="title">Card title</span>${icon('east', 'nsw-material-icons--24 nsw-link--icon')}</a></h3>` +
  `<p class="nsw-card__copy" data-optional="copy" data-edit="copy" data-multiline>Supporting text that gives a short summary of the card content.</p>` +
  `<p class="nsw-card__date" data-optional="date" data-edit="date">20 October 2026</p></div>` +
  `</div>`;

const listItem = (mod: string) =>
  `<div class="nsw-list-item${mod ? ` nsw-list-item--${mod}` : ''}"><div class="nsw-list-item__content">` +
  `<div class="nsw-list-item__label" data-optional="label" data-edit="label">Category</div>` +
  `<h3 class="nsw-list-item__title"><a href="#"><span data-edit="title">List item title</span>${icon('east', 'nsw-material-icons--24 nsw-link--icon')}</a></h3>` +
  `<div class="nsw-list-item__copy" data-optional="copy" data-edit="copy" data-multiline>A short description of the list item.</div>` +
  `<div class="nsw-list-item__info" data-optional="date" data-edit="date">20 October 2026</div></div>` +
  `<div class="nsw-list-item__image" data-optional="image"><img src="${placeholderImage(480, 320)}" alt="" data-image="image"></div></div>`;

export const content: ComponentSource[] = [
  {
    id: 'button',
    slug: 'button',
    name: 'Buttons',
    category: 'Content',
    variants: [
      ...buttonStyles.map(([id, label, previewBg]) => ({
        id,
        label,
        previewBg,
        html: `<button class="nsw-button nsw-button--${id}" type="button"><span data-edit="label">Button</span></button>`,
      })),
      {
        id: 'disabled',
        label: 'Disabled',
        html: `<button class="nsw-button nsw-button--dark" type="button" disabled><span data-edit="label">Button</span></button>`,
      },
    ],
  },
  {
    id: 'link',
    slug: 'link',
    name: 'Link',
    category: 'Content',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html: `<p><a href="#" data-edit="label">Link text</a></p>`,
      },
      {
        id: 'icon',
        label: 'With arrow',
        html: `<p><a href="#"><span data-edit="label">Link text</span>${icon('east', 'nsw-material-icons--inline')}</a></p>`,
      },
      {
        id: 'small',
        label: 'Small',
        html: `<p class="nsw-small"><a href="#" data-edit="label">Small link text</a></p>`,
      },
    ],
  },
  {
    id: 'card',
    slug: 'card',
    name: 'Cards',
    category: 'Content',
    variants: [
      { id: 'default', label: 'Default', html: card('', true) },
      { id: 'headline', label: 'Headline', html: card('headline', true) },
      { id: 'highlight', label: 'Highlight', html: card('highlight', true) },
      { id: 'horizontal', label: 'Horizontal', html: card('horizontal', true) },
      { id: 'dark', label: 'Dark', html: card('dark', true) },
      { id: 'light', label: 'Light', html: card('light', true) },
      { id: 'no-image', label: 'No image', html: card('', false) },
    ],
  },
  {
    id: 'list-item',
    slug: 'list-item',
    name: 'List items',
    category: 'Content',
    variants: [
      { id: 'default', label: 'Default', html: listItem('') },
      { id: 'block', label: 'Block', html: listItem('block') },
      { id: 'reversed', label: 'Image left', html: listItem('reversed') },
    ],
  },
  {
    id: 'accordion',
    slug: 'accordion',
    name: 'Accordion',
    category: 'Content',
    needsJs: true,
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-accordion js-accordion-details">` +
          [1, 2, 3]
            .map(
              (n) =>
                `<details class="nsw-accordion__item"${n === 1 ? ' open' : ''}><summary class="nsw-accordion__title" data-edit="title${n}">Accordion title ${n}</summary>` +
                `<div class="nsw-accordion__content-wrap"><div class="nsw-accordion__content"><p data-edit="content${n}" data-multiline>Accordion content ${n}.</p></div></div></details>`,
            )
            .join('') +
          `</div>`,
      },
    ],
  },
  {
    id: 'callout',
    slug: 'callout',
    name: 'Callout',
    category: 'Content',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-callout"><div class="nsw-callout__content"><h2 class="nsw-h4" data-edit="title">Callout title</h2>` +
          `<p data-edit="copy" data-multiline>Use a callout to draw attention to important information.</p></div></div>`,
      },
    ],
  },
  {
    id: 'show-more',
    slug: 'show-more',
    name: 'Show more',
    category: 'Content',
    fidelity: 'partial',
    note: 'Built on the native details element, so it opens and closes in Preview mode.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<details class="nsw-show-more"><summary class="nsw-show-more__toggle"><span class="nsw-show-more__toggle-text--show" data-edit="show">Show more</span>` +
          `<span class="nsw-show-more__toggle-text--hide" data-edit="hide">Show less</span>${icon('keyboard_arrow_down', 'nsw-show-more__icon')}</summary>` +
          `<div class="nsw-show-more__content"><p data-edit="content" data-multiline>Additional content that is hidden until the user asks for it.</p></div></details>`,
      },
    ],
  },
  {
    id: 'table',
    slug: 'table',
    name: 'Tables',
    category: 'Content',
    variants: [
      ['default', 'Default', 'nsw-table'],
      ['striped', 'Striped', 'nsw-table nsw-table--striped'],
      ['bordered', 'Bordered', 'nsw-table nsw-table--bordered'],
    ].map(([id, label, cls]) => ({
      id: id as string,
      label: label as string,
      html:
        `<table class="${cls}"><caption data-edit="caption">Table caption</caption><thead><tr>` +
        [1, 2, 3].map((c) => `<th scope="col" data-edit="h${c}">Heading ${c}</th>`).join('') +
        `</tr></thead><tbody>` +
        [1, 2, 3]
          .map(
            (r) =>
              `<tr>${[1, 2, 3].map((c) => `<td data-edit="r${r}c${c}">Cell ${r}.${c}</td>`).join('')}</tr>`,
          )
          .join('') +
        `</tbody></table>`,
    })),
  },
  {
    id: 'tag',
    slug: 'tag',
    name: 'Tags',
    category: 'Content',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html: `<p><a class="nsw-tag" href="#" data-edit="label">Tag</a></p>`,
      },
      {
        id: 'checkbox',
        label: 'Selectable',
        html: `<p><label class="nsw-tag nsw-tag--checkbox"><input type="checkbox"><span data-edit="label">Tag</span></label></p>`,
      },
    ],
  },
  {
    id: 'status-labels',
    slug: 'status-labels',
    name: 'Status labels',
    category: 'Content',
    variants: ['info', 'success', 'warning', 'error'].map((s) => ({
      id: s,
      label: s[0]!.toUpperCase() + s.slice(1),
      html: `<p><span class="nsw-status-label nsw-status-label--${s}" data-edit="label">${s[0]!.toUpperCase() + s.slice(1)}</span></p>`,
    })),
  },
  {
    id: 'steps',
    slug: 'steps',
    name: 'Steps',
    category: 'Content',
    variants: [
      ['default', 'Default', ''],
      ['dark', 'Dark', ' nsw-steps--dark'],
      ['light', 'Light', ' nsw-steps--light'],
      ['supplementary', 'Supplementary', ' nsw-steps--supplementary'],
    ].map(([id, label, mod]) => ({
      id: id as string,
      label: label as string,
      html:
        `<ol class="nsw-steps${mod}">` +
        [1, 2, 3]
          .map(
            (n) =>
              `<li class="nsw-steps__item"><div class="nsw-steps__content"><h3 class="nsw-h4" data-edit="title${n}">Step ${n}</h3><p data-edit="copy${n}" data-multiline>Describe what happens in step ${n}.</p></div></li>`,
          )
          .join('') +
        `</ol>`,
    })),
  },
  {
    id: 'support-list',
    slug: 'support-list',
    name: 'Support list',
    category: 'Content',
    fidelity: 'partial',
    note: 'Logos are shown as labelled placeholders.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-support-list"><div class="nsw-support-list__container"><div class="nsw-support-list__header"><h2 class="nsw-h4" data-edit="title">Supported by</h2></div>` +
          `<div class="nsw-support-list__logo-grid">` +
          [1, 2, 3]
            .map(
              (n) =>
                `<div class="nsw-support-list__logo-grid__item"><img src="${placeholderImage(240, 100, `Logo ${n}`)}" alt="Logo ${n}"></div>`,
            )
            .join('') +
          `</div></div></div>`,
      },
    ],
  },
  {
    id: 'results-bar',
    slug: 'results-bar',
    name: 'Results bar',
    category: 'Content',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-results-bar"><div data-edit="summary">Showing 1–10 of 48 results</div>` +
          `<div class="nsw-results-bar__sorting"><label class="nsw-form__label" for="results-sort">Sort by</label>` +
          `<select class="nsw-form__select" id="results-sort"><option>Relevance</option><option>Newest</option></select></div></div>`,
      },
    ],
  },
  {
    id: 'close-button',
    slug: 'close-button',
    name: 'Close button',
    category: 'Content',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html: `<button class="nsw-icon-button" type="button" aria-label="Close">${icon('close')}<span class="sr-only">Close</span></button>`,
      },
    ],
  },
];
