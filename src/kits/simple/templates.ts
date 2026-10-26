import type { TemplateDef } from '../../templates/types';
import { buildPage, c, page, section, type PageSpec } from './build';

/** Ready-made Simple pages: a landing page, a sign-in screen, a dashboard and so on. */
const T = (
  id: string,
  name: string,
  group: string,
  description: string,
  width: number,
  device: TemplateDef['device'],
  spec: () => PageSpec,
): TemplateDef => ({
  id,
  name,
  group,
  description,
  device,
  width,
  kitId: 'simple',
  build: (makeId) => buildPage(spec(), makeId),
});

const nav = () => c('sk-navbar', 'simple', { text: { brand: 'Acme' } });
const foot = () => c('sk-footer', 'simple');

export const SIMPLE_TEMPLATES: TemplateDef[] = [
  T(
    'simple-landing',
    'Landing page',
    'Pages',
    'A header, a bold introduction, three features, steps and a closing call to action.',
    1440,
    'desktop',
    () =>
      page(
        {},
        nav(),
        section('one-column', { spacing: 'spacious' }, [
          c('sk-hero', 'centre', { text: { title: 'Make something people love' } }),
        ]),
        section(
          'three-columns',
          { background: 'soft' },
          [c('sk-features', 'one')],
          [c('sk-features', 'one')],
          [c('sk-features', 'one')],
        ),
        section('one-column', {}, [
          c('sk-heading', 'h2', { text: { text: 'How it works' } }),
          c('sk-steps', 'three'),
        ]),
        section('one-column', { background: 'accent', spacing: 'spacious' }, [
          c('sk-heading', 'h2', {
            text: { text: 'Ready when you are' },
            props: { align: 'center' },
          }),
          c('sk-button', 'primary', {
            text: { label: 'Get started' },
            props: { align: 'center' },
          }),
        ]),
        foot(),
      ),
  ),
  T('simple-sign-in', 'Sign in', 'Pages', 'A centred sign-in form.', 1440, 'desktop', () =>
    page(
      {},
      section(
        'three-columns',
        { spacing: 'spacious' },
        [],
        [
          c('sk-form', 'login'),
          c('sk-paragraph', 'small', { text: { text: 'Forgot your password?' } }),
        ],
        [],
      ),
    ),
  ),
  T(
    'simple-dashboard',
    'Dashboard',
    'Pages',
    'A side menu, headline numbers, a table and a list.',
    1440,
    'desktop',
    () =>
      page(
        {},
        nav(),
        section(
          'sidebar-left',
          {},
          [c('sk-sidenav', 'sidenav')],
          [
            c('sk-heading', 'h2', { text: { text: 'Dashboard' } }),
            c('sk-stats', 'three'),
            c('sk-table', 'striped'),
          ],
        ),
      ),
  ),
  T(
    'simple-article',
    'Article',
    'Pages',
    'A breadcrumb, headline, picture and body text with a side panel.',
    1440,
    'desktop',
    () =>
      page(
        {},
        nav(),
        section(
          'sidebar-right',
          {},
          [
            c('sk-breadcrumb', 'breadcrumb'),
            c('sk-heading', 'h1', {
              text: { text: 'A headline that says what the article is about' },
            }),
            c('sk-profile', 'profile'),
            c('sk-image', 'wide'),
            c('sk-paragraph', 'body'),
            c('sk-quote', 'quote'),
            c('sk-paragraph', 'body'),
          ],
          [c('sk-card', 'flat', { text: { title: 'Related' } }), c('sk-rows', 'simple')],
        ),
        foot(),
      ),
  ),
  T(
    'simple-pricing',
    'Pricing',
    'Pages',
    'Three plans side by side, with questions underneath.',
    1440,
    'desktop',
    () =>
      page(
        {},
        nav(),
        section('one-column', {}, [
          c('sk-heading', 'h1', { text: { text: 'Simple pricing' }, props: { align: 'center' } }),
        ]),
        section(
          'three-columns',
          {},
          [c('sk-pricing', 'plan')],
          [c('sk-pricing', 'featured')],
          [c('sk-pricing', 'plan')],
        ),
        section('one-column', { background: 'soft' }, [c('sk-accordion', 'three')]),
        foot(),
      ),
  ),
  T(
    'simple-mobile-home',
    'Phone home screen',
    'Phone',
    'A search box, a few cards and a button, sized for a phone.',
    393,
    'iphone',
    () =>
      page(
        {},
        section('one-column', { spacing: 'compact' }, [
          c('sk-heading', 'h2', { text: { text: 'Good morning' } }),
          c('sk-field', 'search'),
          c('sk-card', 'image'),
          c('sk-card', 'basic'),
          c('sk-button', 'primary', { props: { full: true } }),
        ]),
      ),
  ),
  T(
    'simple-contact',
    'Contact page',
    'Pages',
    'A short message and a contact form.',
    1440,
    'desktop',
    () =>
      page(
        {},
        nav(),
        section(
          'two-columns',
          { spacing: 'spacious' },
          [
            c('sk-heading', 'h1', { text: { text: 'Get in touch' } }),
            c('sk-paragraph', 'lead', {
              text: { text: 'Tell us what you need and we will reply within a day.' },
            }),
            c('sk-profile', 'profile'),
          ],
          [c('sk-form', 'contact')],
        ),
        foot(),
      ),
  ),
];
