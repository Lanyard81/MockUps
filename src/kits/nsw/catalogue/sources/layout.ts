import type { ComponentSource } from '../../../../catalogue/types';
import { LOGO_PLACEHOLDER, icon, placeholderImage } from './helpers';

const heroImg = placeholderImage(960, 540, 'Hero image');

export const layout: ComponentSource[] = [
  {
    id: 'masthead',
    slug: 'masthead',
    name: 'Masthead',
    category: 'Layout',
    fullWidth: true,
    variants: [
      {
        id: 'dark',
        label: 'Dark',
        html: `<div class="nsw-masthead"><div class="nsw-container"><span data-edit="text">An official website of the NSW Government</span></div></div>`,
      },
      {
        id: 'light',
        label: 'Light',
        html: `<div class="nsw-masthead nsw-masthead--light"><div class="nsw-container"><span data-edit="text">An official website of the NSW Government</span></div></div>`,
      },
    ],
  },
  {
    id: 'header',
    slug: 'header',
    name: 'Header',
    category: 'Layout',
    fullWidth: true,
    note: 'The NSW Government waratah logo is not part of the npm package, so a labelled placeholder is shown.',
    variants: [
      {
        id: 'default',
        label: 'With menu and search',
        html:
          `<header class="nsw-header"><div class="nsw-header__container"><div class="nsw-container"><div class="nsw-header__inner">` +
          `<div class="nsw-header__menu" data-optional="menu"><button type="button" aria-expanded="false">${icon('menu')}<span>Menu</span></button></div>` +
          `<div class="nsw-header__main"><div class="nsw-header__waratah"><a href="#">${LOGO_PLACEHOLDER}</a></div>` +
          `<div class="nsw-header__name"><div class="nsw-header__title" data-edit="title">Site name</div>` +
          `<div class="nsw-header__description" data-edit="description" data-optional="description">A short description of this service</div></div></div>` +
          `<div class="nsw-header__search" data-optional="search"><button type="button" aria-expanded="false">${icon('search')}<span>Search</span></button></div>` +
          `</div></div></div></header>`,
      },
      {
        id: 'simple',
        label: 'Simple',
        html:
          `<header class="nsw-header nsw-header--simple"><div class="nsw-header__container"><div class="nsw-container"><div class="nsw-header__inner">` +
          `<div class="nsw-header__main"><div class="nsw-header__waratah"><a href="#">${LOGO_PLACEHOLDER}</a></div>` +
          `<div class="nsw-header__name"><div class="nsw-header__title" data-edit="title">Site name</div></div></div>` +
          `</div></div></div></header>`,
      },
    ],
  },
  {
    id: 'footer',
    slug: 'footer',
    name: 'Footer',
    category: 'Layout',
    fullWidth: true,
    variants: ['dark', 'light'].map((tone) => ({
      id: tone,
      label: tone === 'dark' ? 'Dark' : 'Light',
      html:
        `<footer class="nsw-footer nsw-footer--${tone}"><div class="nsw-footer__upper"><div class="nsw-container">` +
        [1, 2, 3, 4]
          .map(
            (n) =>
              `<div class="nsw-footer__group"><h3 class="nsw-footer__heading" data-edit="group${n}">Group ${n}</h3><ul>` +
              [1, 2, 3]
                .map((l) => `<li><a href="#" data-edit="g${n}link${l}">Footer link ${l}</a></li>`)
                .join('') +
              `</ul></div>`,
          )
          .join('') +
        `</div></div><div class="nsw-footer__lower"><div class="nsw-container">` +
        `<p class="nsw-footer__acknowledgement" data-edit="acknowledgement" data-optional="acknowledgement">We pay respect to the Traditional Custodians and First Peoples of NSW, and acknowledge their continued connection to their country and culture.</p>` +
        `<hr><ul><li><a href="#" data-edit="legal1">Privacy</a></li><li><a href="#" data-edit="legal2">Copyright</a></li><li><a href="#" data-edit="legal3">Disclaimer</a></li><li><a href="#" data-edit="legal4">Accessibility</a></li></ul>` +
        `<p class="nsw-footer__copyright" data-edit="copyright">Copyright © 2026</p></div></div></footer>`,
    })),
  },
  {
    id: 'hero-banner',
    slug: 'hero-banner',
    name: 'Hero banner',
    category: 'Layout',
    fullWidth: true,
    variants: [
      {
        id: 'dark',
        label: 'Dark',
        html:
          `<div class="nsw-hero-banner nsw-hero-banner--dark"><div class="nsw-container"><div class="nsw-hero-banner__container"><div class="nsw-hero-banner__wrapper"><div class="nsw-hero-banner__content">` +
          `<h1 data-edit="title">Hero banner title</h1>` +
          `<p class="nsw-intro" data-edit="intro" data-multiline>Use a hero banner to introduce the main purpose of a page or service.</p>` +
          `<a class="nsw-button nsw-button--white" href="#" data-optional="button"><span data-edit="button">Get started</span></a>` +
          `</div></div><div class="nsw-hero-banner__box"><img class="nsw-hero-banner__image" src="${heroImg}" alt="" data-image="hero"></div></div></div></div>`,
      },
      {
        id: 'light',
        label: 'Light',
        html:
          `<div class="nsw-hero-banner nsw-hero-banner--light"><div class="nsw-container"><div class="nsw-hero-banner__container"><div class="nsw-hero-banner__wrapper"><div class="nsw-hero-banner__content">` +
          `<h1 data-edit="title">Hero banner title</h1>` +
          `<p class="nsw-intro" data-edit="intro" data-multiline>Use a hero banner to introduce the main purpose of a page or service.</p>` +
          `<a class="nsw-button nsw-button--dark" href="#" data-optional="button"><span data-edit="button">Get started</span></a>` +
          `</div></div><div class="nsw-hero-banner__box"><img class="nsw-hero-banner__image" src="${heroImg}" alt="" data-image="hero"></div></div></div></div>`,
      },
      {
        id: 'off-white',
        label: 'Off-white',
        html:
          `<div class="nsw-hero-banner nsw-hero-banner--off-white"><div class="nsw-container"><div class="nsw-hero-banner__container"><div class="nsw-hero-banner__wrapper"><div class="nsw-hero-banner__content">` +
          `<h1 data-edit="title">Hero banner title</h1>` +
          `<p class="nsw-intro" data-edit="intro" data-multiline>Use a hero banner to introduce the main purpose of a page or service.</p>` +
          `<a class="nsw-button nsw-button--dark" href="#" data-optional="button"><span data-edit="button">Get started</span></a>` +
          `</div></div><div class="nsw-hero-banner__box"><img class="nsw-hero-banner__image" src="${heroImg}" alt="" data-image="hero"></div></div></div></div>`,
      },
      {
        id: 'wide',
        label: 'Wide',
        html:
          `<div class="nsw-hero-banner nsw-hero-banner--dark nsw-hero-banner--wide"><div class="nsw-container"><div class="nsw-hero-banner__container"><div class="nsw-hero-banner__wrapper"><div class="nsw-hero-banner__content">` +
          `<h1 data-edit="title">Hero banner title</h1>` +
          `<p class="nsw-intro" data-edit="intro" data-multiline>Use a hero banner to introduce the main purpose of a page or service.</p>` +
          `<a class="nsw-button nsw-button--white" href="#" data-optional="button"><span data-edit="button">Get started</span></a>` +
          `</div></div><div class="nsw-hero-banner__box"><img class="nsw-hero-banner__image" src="${heroImg}" alt="" data-image="hero"></div></div></div></div>`,
      },
    ],
  },
  {
    id: 'hero-search',
    slug: 'hero-search',
    name: 'Hero search',
    category: 'Layout',
    fullWidth: true,
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-section nsw-section--brand-dark nsw-section--invert"><div class="nsw-container">` +
          `<h2 class="nsw-h2" data-edit="title">Find what you need</h2>` +
          `<p class="nsw-intro" data-edit="intro" data-multiline>Search for services, forms and information.</p>` +
          `<div class="nsw-form__group"><label class="nsw-form__label" for="hero-search-input" data-edit="label">Search</label>` +
          `<div class="nsw-form__input-group"><input class="nsw-form__input" type="text" id="hero-search-input" placeholder="Search"><button class="nsw-button nsw-button--white" type="button">${icon('search')}<span>Search</span></button></div></div>` +
          `</div></div>`,
      },
    ],
  },
  {
    id: 'content-block',
    slug: 'content-block',
    name: 'Content blocks',
    category: 'Layout',
    variants: [
      {
        id: 'default',
        label: 'Icon',
        html:
          `<div><div class="nsw-content-block__icon" data-optional="icon">${icon('verified', 'nsw-material-icons--36 nsw-material-icons--brand')}</div>` +
          `<h3 class="nsw-content-block__title" data-edit="title">Content block title</h3>` +
          `<p class="nsw-content-block__copy" data-edit="copy" data-multiline>A short description that explains the content block.</p>` +
          `<a class="nsw-content-block__link" href="#" data-optional="link"><span data-edit="link">Read more</span>${icon('east', 'nsw-material-icons--24')}</a></div>`,
      },
      {
        id: 'image',
        label: 'Image',
        html:
          `<div><div class="nsw-content-block__image"><img src="${placeholderImage(640, 360)}" alt="" data-image="image"></div>` +
          `<h3 class="nsw-content-block__title" data-edit="title">Content block title</h3>` +
          `<p class="nsw-content-block__copy" data-edit="copy" data-multiline>A short description that explains the content block.</p>` +
          `<a class="nsw-content-block__link" href="#" data-optional="link"><span data-edit="link">Read more</span>${icon('east', 'nsw-material-icons--24')}</a></div>`,
      },
    ],
  },
];
