import type { ComponentSource } from '../../../../catalogue/types';

const links = (items: string[], start = 1) =>
  items.map((t, i) => `<a href="#" data-edit="link${start + i}">${t}</a>`).join('');

/** Menus, breadcrumbs, tabs, pagination and the page footer. */
export const nav: ComponentSource[] = [
  {
    id: 'sk-navbar',
    slug: 'navbar',
    name: 'Header bar',
    category: 'Navigation',
    fullWidth: true,
    variants: [
      {
        id: 'simple',
        label: 'Name and links',
        html: `<header class="sk-navbar"><a class="sk-navbar__brand" href="#" data-edit="brand">Brand</a><nav class="sk-navbar__links" aria-label="Main">${links(['Home', 'Features', 'Pricing', 'About'])}</nav><button class="sk-button sk-button--small" data-optional="action" data-edit="action">Sign in</button></header>`,
      },
      {
        id: 'centre',
        label: 'Centred',
        html: `<header class="sk-navbar sk-navbar--centre"><a class="sk-navbar__brand" href="#" data-edit="brand">Brand</a><nav class="sk-navbar__links" aria-label="Main">${links(['Home', 'Features', 'Pricing', 'About'])}</nav></header>`,
      },
    ],
  },
  {
    id: 'sk-footer',
    slug: 'footer',
    name: 'Footer',
    category: 'Navigation',
    fullWidth: true,
    variants: [
      {
        id: 'simple',
        label: 'Simple',
        html: `<footer class="sk-footer"><span data-edit="copy">© 2026 Your organisation</span><nav class="sk-footer__links" aria-label="Footer">${links(['Privacy', 'Terms', 'Contact'])}</nav></footer>`,
      },
    ],
  },
  {
    id: 'sk-breadcrumb',
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'Navigation',
    variants: [
      {
        id: 'breadcrumb',
        label: 'Breadcrumb',
        html: `<ol class="sk-c sk-breadcrumb"><li><a href="#" data-edit="link1">Home</a></li><li><a href="#" data-edit="link2">Section</a></li><li data-edit="current">Current page</li></ol>`,
      },
    ],
  },
  {
    id: 'sk-tabs',
    slug: 'tabs',
    name: 'Tab bar',
    category: 'Navigation',
    variants: [
      {
        id: 'tabs',
        label: 'Tab bar',
        html: `<nav class="sk-c sk-tabs" aria-label="Sections"><a class="sk-tab sk-tab--active" href="#" data-edit="tab1">Overview</a><a class="sk-tab" href="#" data-edit="tab2">Details</a><a class="sk-tab" href="#" data-edit="tab3">Activity</a></nav>`,
      },
    ],
  },
  {
    id: 'sk-sidenav',
    slug: 'side-menu',
    name: 'Side menu',
    category: 'Navigation',
    variants: [
      {
        id: 'sidenav',
        label: 'Side menu',
        html: `<nav class="sk-c sk-sidenav" aria-label="Side"><a class="sk-sidenav__active" href="#" data-edit="link1">Dashboard</a>${links(['Projects', 'Reports', 'Settings'], 2)}</nav>`,
      },
    ],
  },
  {
    id: 'sk-pagination',
    slug: 'pagination',
    name: 'Pagination',
    category: 'Navigation',
    variants: [
      {
        id: 'pagination',
        label: 'Pagination',
        html: `<nav class="sk-c sk-pagination" aria-label="Pages"><a class="sk-page-link" href="#">‹</a><a class="sk-page-link sk-page-link--active" href="#">1</a><a class="sk-page-link" href="#">2</a><a class="sk-page-link" href="#">3</a><a class="sk-page-link" href="#">›</a></nav>`,
      },
    ],
  },
];
