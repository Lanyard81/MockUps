import type { ComponentSource } from '../types';
import { icon } from './helpers';

const items = (n: number, prefix: string) =>
  Array.from(
    { length: n },
    (_, i) => `<li><a href="#" data-edit="${prefix}${i + 1}"><span>Link ${i + 1}</span></a></li>`,
  ).join('');

export const navigation: ComponentSource[] = [
  {
    id: 'main-nav',
    slug: 'main-nav',
    name: 'Main navigation',
    category: 'Navigation',
    fullWidth: true,
    needsJs: true,
    fidelity: 'partial',
    note: 'Shown as the desktop bar (frames about 992px and wider). On narrow frames it is a slide-out menu, as on a real site. Sub-menus are not included.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<nav class="nsw-main-nav" id="main-nav" aria-label="Main navigation"><div class="nsw-main-nav__header"><div class="nsw-main-nav__title">Menu</div>` +
          `<button class="nsw-icon-button" type="button" aria-expanded="true">${icon('close')}<span class="sr-only">Close menu</span></button></div>` +
          `<ul class="nsw-main-nav__list">` +
          ['Home', 'Services', 'Events', 'News', 'About us', 'Contact']
            .map((t, i) => `<li><a href="#"><span data-edit="item${i + 1}">${t}</span></a></li>`)
            .join('') +
          `</ul></nav>`,
      },
    ],
  },
  {
    id: 'breadcrumbs',
    slug: 'breadcrumbs',
    name: 'Breadcrumbs',
    category: 'Navigation',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<nav class="nsw-breadcrumbs" aria-label="Breadcrumbs"><ol>` +
          `<li><a href="#" data-edit="crumb1">Home</a></li><li><a href="#" data-edit="crumb2">Services</a></li><li><span aria-current="page" data-edit="current">Current page</span></li></ol></nav>`,
      },
    ],
  },
  {
    id: 'side-nav',
    slug: 'side-nav',
    name: 'Side navigation',
    category: 'Navigation',
    fidelity: 'partial',
    note: 'Expand and collapse on narrow frames is not wired up.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<nav class="nsw-side-nav" aria-label="Side navigation"><div class="nsw-side-nav__content"><ul>` +
          `<li><a href="#" data-edit="item1">Parent page</a><ul class="nsw-side-nav__group"><li><a href="#" data-edit="child1">Child page 1</a></li><li><a href="#" data-edit="child2">Child page 2</a></li></ul></li>` +
          `<li><a href="#" data-edit="item2">Another page</a></li><li><a href="#" data-edit="item3">Third page</a></li></ul></div></nav>`,
      },
    ],
  },
  {
    id: 'in-page-nav',
    slug: 'in-page-nav',
    name: 'In-page navigation',
    category: 'Navigation',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<nav class="nsw-in-page-nav" aria-labelledby="in-page-nav-title"><h2 class="nsw-in-page-nav__title" id="in-page-nav-title" data-edit="title">On this page</h2><ul>` +
          items(4, 'item') +
          `</ul></nav>`,
      },
    ],
  },
  {
    id: 'pagination',
    slug: 'pagination',
    name: 'Pagination',
    category: 'Navigation',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<nav class="nsw-pagination" aria-label="Pagination"><ul>` +
          `<li><a href="#" aria-label="Previous page">${icon('keyboard_arrow_left')}<span>Previous</span></a></li>` +
          `<li><a href="#" aria-label="Page 1">1</a></li><li><a href="#" aria-current="page" aria-label="Page 2">2</a></li><li><a href="#" aria-label="Page 3">3</a></li><li><span>…</span></li><li><a href="#" aria-label="Page 10">10</a></li>` +
          `<li><a href="#" aria-label="Next page"><span>Next</span>${icon('keyboard_arrow_right')}</a></li></ul></nav>`,
      },
    ],
  },
  {
    id: 'tabs',
    slug: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    needsJs: true,
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-tabs js-tabs"><div class="nsw-tabs__list-wrapper"><ul class="nsw-tabs__list">` +
          [1, 2, 3]
            .map((n) => `<li><a href="#tab-panel-${n}" data-edit="tab${n}">Tab ${n}</a></li>`)
            .join('') +
          `</ul></div>` +
          [1, 2, 3]
            .map(
              (n) =>
                `<div class="nsw-tabs__content" id="tab-panel-${n}"><p data-edit="panel${n}" data-multiline>Content for tab ${n}.</p></div>`,
            )
            .join('') +
          `</div>`,
      },
    ],
  },
  {
    id: 'link-list',
    slug: 'link-list',
    name: 'Link list',
    category: 'Navigation',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-link-list"><h2 class="nsw-link-list__title nsw-h4" data-edit="title">Related links</h2><ul>` +
          [1, 2, 3, 4]
            .map(
              (n) =>
                `<li><a href="#"><span data-edit="link${n}">Related link ${n}</span>${icon('east', 'nsw-link--icon')}</a></li>`,
            )
            .join('') +
          `</ul></div>`,
      },
    ],
  },
  {
    id: 'utility-list',
    slug: 'utility-list',
    name: 'Utility list',
    category: 'Navigation',
    variants: [
      {
        id: 'default',
        label: 'Vertical',
        html:
          `<div class="nsw-utility-list"><div class="nsw-utility-list__title" data-edit="title">Utilities</div><ul>` +
          [
            ['print', 'Print'],
            ['share', 'Share'],
            ['mail', 'Email'],
          ]
            .map(
              ([ic, t], i) =>
                `<li class="nsw-utility-list__item"><a class="nsw-utility-list__link" href="#">${icon(ic as string)}<span data-edit="item${i + 1}">${t}</span></a></li>`,
            )
            .join('') +
          `</ul></div>`,
      },
      {
        id: 'horizontal',
        label: 'Horizontal',
        html:
          `<div class="nsw-utility-list nsw-utility-list--horizontal"><ul>` +
          [
            ['print', 'Print'],
            ['share', 'Share'],
            ['mail', 'Email'],
          ]
            .map(
              ([ic, t], i) =>
                `<li class="nsw-utility-list__item"><a class="nsw-utility-list__link" href="#">${icon(ic as string)}<span data-edit="item${i + 1}">${t}</span></a></li>`,
            )
            .join('') +
          `</ul></div>`,
      },
    ],
  },
  {
    id: 'back-to-top',
    slug: 'back-to-top',
    name: 'Back to top',
    category: 'Navigation',
    fidelity: 'static',
    note: 'The real component is fixed to the bottom of the screen. Shown here as the plain button it contains.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html: `<button class="nsw-button nsw-button--dark" type="button">${icon('arrow_upward')}<span data-edit="label">Back to top</span></button>`,
      },
    ],
  },
];
