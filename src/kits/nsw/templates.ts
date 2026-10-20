import {
  c,
  equal,
  page,
  row,
  sec,
  top,
  type CompSpec,
  type NswTemplateDef,
  type TopItem,
} from './templateDsl';
import { buildTree } from './templateDsl';
import type { TemplateDef } from '../../templates/types';

/**
 * The NSW Design System's page templates, rebuilt from catalogue components so that every part stays
 * editable. The docs site could not be reached while writing these, so each follows the template's
 * published structure (see docs/NSW-DESIGN-SYSTEM.md) with placeholder wording. Anything that can't be
 * reproduced, such as a live map, is a clearly labelled placeholder.
 */

const h = (level: 1 | 2 | 3 | 4, text: string) => c('heading', `h${level}`, { text: { text } });
const p = (text: string) => c('paragraph', 'default', { text: { text } });
const intro = (text: string) => c('paragraph', 'intro', { text: { text } });
const btn = (label: string, variant = 'dark') => c('button', variant, { text: { label } });

const chrome = (): TopItem[] => [
  top('masthead', 'dark'),
  top('header', 'default', {
    text: { title: 'Service name', description: 'Helping people with everyday services' },
  }),
  top('main-nav', 'default', {
    text: {
      item1: 'Home',
      item2: 'Services',
      item3: 'News',
      item4: 'Events',
      item5: 'About us',
      item6: 'Contact us',
    },
  }),
];

const footer = (): TopItem => top('footer', 'dark');

const crumbs = (...labels: string[]): CompSpec =>
  c('breadcrumbs', 'default', {
    text: {
      crumb1: labels[0] ?? 'Home',
      crumb2: labels[1] ?? 'Section',
      current: labels[2] ?? 'Current page',
    },
  });

const cards = (n: number, variant = 'default', hide: string[] = []): CompSpec[][] =>
  Array.from({ length: n }, (_, i) => [
    c('card', variant, {
      text: {
        tag: ['News', 'Guide', 'Event', 'Service'][i % 4]!,
        title: `Featured item ${i + 1}`,
        copy: 'A short summary of this item and why it matters to the reader.',
        date: '20 October 2026',
      },
      hide,
    }),
  ]);

const results = (n: number): CompSpec[] =>
  Array.from({ length: n }, (_, i) =>
    c('list-item', 'default', {
      text: {
        label: ['Guide', 'Form', 'Service', 'News'][i % 4]!,
        title: `Search result ${i + 1}`,
        copy: 'A short description of this result, taken from the start of the page.',
        date: '12 October 2026',
      },
    }),
  );

const sideNav = (): CompSpec =>
  c('side-nav', 'default', {
    text: {
      item1: 'Parent page',
      child1: 'Child page one',
      child2: 'Child page two',
      item2: 'Related page',
      item3: 'Another page',
    },
  });

const filtersBlock = (): CompSpec =>
  c('filters', 'default', {
    text: { title: 'Filter results', group1: 'Topic', group2: 'Location', group3: 'Date' },
  });

const mapPlaceholder = (
  label = 'Map placeholder: a live map isn’t reproduced in mockups',
): CompSpec => c('media', 'default', { text: { caption: label }, name: 'Map placeholder' });

const form = (): CompSpec[] => [
  c('form', 'text', { text: { label: 'Full name', helper: 'As it appears on your licence' } }),
  c('form', 'text', { text: { label: 'Email address', helper: 'We’ll send your receipt here' } }),
  c('date-input', 'default', { text: { legend: 'Date of birth' } }),
  c('select', 'default', {
    text: { label: 'Service centre', helper: 'Choose the one closest to you' },
  }),
  c('form', 'radio', { text: { legend: 'How would you like to be contacted?' } }),
  c('form', 'textarea', { text: { label: 'Anything else we should know?', helper: 'Optional' } }),
  btn('Submit'),
];

export const NSW_TEMPLATE_DEFS: NswTemplateDef[] = [
  // ---- Homepage
  {
    id: 'homepage-featured-list',
    name: 'Homepage: featured list',
    group: 'Homepage',
    description: 'Hero banner, a featured list of cards and links to popular services.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        top('hero-banner', 'dark', {
          text: {
            title: 'Everyday services, made simple',
            intro: 'Find, apply for and manage the services you use most.',
            button: 'Browse all services',
          },
        }),
        sec({ bg: 'white' }, h(2, 'Featured'), row([4, 4, 4], ...cards(3))),
        sec(
          { bg: 'brand-light' },
          h(2, 'Popular services'),
          row(
            [6, 6],
            [
              c('link-list', 'default', {
                text: {
                  title: 'Licences and permits',
                  link1: 'Renew a licence',
                  link2: 'Apply for a permit',
                  link3: 'Replace a licence',
                  link4: 'Check your status',
                },
              }),
            ],
            [
              c('link-list', 'default', {
                text: {
                  title: 'Support and payments',
                  link1: 'Pay a fee',
                  link2: 'Apply for support',
                  link3: 'Report a problem',
                  link4: 'Find a service centre',
                },
              }),
            ],
          ),
        ),
        sec({ bg: 'white' }, h(2, 'Latest news'), ...results(3)),
        footer(),
      ),
  },
  {
    id: 'homepage-hero-banner',
    name: 'Homepage: hero banner',
    group: 'Homepage',
    description: 'A wide hero banner leading into content blocks and a call to action.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        top('hero-banner', 'wide', {
          text: {
            title: 'Get things done online',
            intro: 'Services for people, families and businesses in New South Wales.',
            button: 'Get started',
          },
        }),
        sec(
          { bg: 'white' },
          h(2, 'How we can help'),
          row(
            [4, 4, 4],
            [
              c('content-block', 'default', {
                text: {
                  title: 'For individuals',
                  copy: 'Licences, benefits and everyday paperwork.',
                  link: 'See services',
                },
              }),
            ],
            [
              c('content-block', 'default', {
                text: {
                  title: 'For families',
                  copy: 'Support for every stage of family life.',
                  link: 'See services',
                },
              }),
            ],
            [
              c('content-block', 'default', {
                text: {
                  title: 'For business',
                  copy: 'Registrations, permits and compliance.',
                  link: 'See services',
                },
              }),
            ],
          ),
        ),
        sec(
          { bg: 'off-white' },
          c('callout', 'default', {
            text: {
              title: 'Need help now?',
              copy: 'Call us on 13 77 88 or visit your nearest service centre.',
            },
          }),
        ),
        footer(),
      ),
  },
  {
    id: 'homepage-hero-search',
    name: 'Homepage: hero search',
    group: 'Homepage',
    description: 'A search-led homepage: hero search, popular topics and recent updates.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        top('hero-search', 'default', {
          text: {
            title: 'What do you need help with?',
            intro: 'Search for services, forms and information.',
            label: 'Search',
          },
        }),
        sec(
          { bg: 'white' },
          h(2, 'Popular topics'),
          row(
            [3, 3, 3, 3],
            ...['Driving and transport', 'Housing', 'Education', 'Health'].map((t) => [
              c('card', 'headline', {
                text: { tag: 'Topic', title: t, copy: 'Guides, forms and services.' },
                hide: ['image', 'date'],
              }),
            ]),
          ),
        ),
        sec({ bg: 'off-white' }, h(2, 'Recent updates'), ...results(3)),
        footer(),
      ),
  },
  // ---- Content
  {
    id: 'content-article',
    name: 'Content: article',
    group: 'Content',
    description:
      'A standard article page with breadcrumbs, an in-page menu and a related links list.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec({ bg: 'white', padding: 'half' }, crumbs('Home', 'News', 'Article')),
        sec(
          { bg: 'white' },
          row(
            [8, 4],
            [
              h(1, 'Article headline goes here'),
              intro('A short introduction that tells the reader what this article covers.'),
              c('media', 'default', { text: { caption: 'Image caption' } }),
              h(2, 'First section'),
              p('Body text for this section. Use plain, direct language that is easy to scan.'),
              p('A second paragraph continues the section with supporting detail.'),
              h(2, 'Second section'),
              c('callout', 'default', {
                text: {
                  title: 'Good to know',
                  copy: 'Use a callout for information the reader should not miss.',
                },
              }),
              p('Closing paragraph with next steps.'),
            ],
            [
              c('in-page-nav', 'default', {
                text: {
                  title: 'On this page',
                  item1: 'First section',
                  item2: 'Second section',
                  item3: 'Next steps',
                  item4: 'Contact us',
                },
              }),
              c('link-list', 'default', {
                text: {
                  title: 'Related links',
                  link1: 'Related guide',
                  link2: 'Another service',
                  link3: 'Frequently asked questions',
                  link4: 'Contact us',
                },
              }),
            ],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'content-easy-read',
    name: 'Content: Easy Read',
    group: 'Content',
    description:
      'Short sentences, one idea per block and an image for each. Built from content blocks.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          crumbs('Home', 'Easy Read', 'Renewing your licence'),
          h(1, 'Renewing your licence'),
          intro('This page tells you how to renew your licence.'),
          equal(
            [
              c('content-block', 'image', {
                text: { title: 'Step 1', copy: 'Get your licence number ready.', link: 'More' },
                hide: ['link'],
              }),
            ],
            [
              c('content-block', 'image', {
                text: {
                  title: 'Step 2',
                  copy: 'Go to the website or a service centre.',
                  link: 'More',
                },
                hide: ['link'],
              }),
            ],
            [
              c('content-block', 'image', {
                text: { title: 'Step 3', copy: 'Pay the fee.', link: 'More' },
                hide: ['link'],
              }),
            ],
          ),
          c('callout', 'default', {
            text: { title: 'Need help?', copy: 'Call 13 77 88. We can help you.' },
          }),
        ),
        footer(),
      ),
  },
  {
    id: 'content-filters',
    name: 'Content: filters',
    group: 'Content',
    description: 'A content listing with a filter panel beside the results.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          crumbs('Home', 'Resources', 'All resources'),
          h(1, 'Resources'),
          row(
            [3, 9],
            [filtersBlock()],
            [
              c('results-bar', 'default', { text: { summary: 'Showing 1–10 of 48 results' } }),
              ...results(4),
              c('pagination', 'default'),
            ],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'content-form',
    name: 'Content: form',
    group: 'Content',
    description: 'A form page with progress, grouped fields and a submit button.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          crumbs('Home', 'Services', 'Apply'),
          row(
            [8, 4],
            [
              h(1, 'Apply for a permit'),
              c('progress-indicator', 'default', { text: { count: 'Step 1 of 3' } }),
              c('in-page-alert', 'info', {
                text: {
                  title: 'Before you start',
                  copy: 'You will need your licence number and a payment card.',
                },
              }),
              ...form(),
            ],
            [
              c('link-list', 'default', {
                text: {
                  title: 'Help with this form',
                  link1: 'What you’ll need',
                  link2: 'Fees and payments',
                  link3: 'Contact us',
                  link4: 'Accessibility help',
                },
              }),
            ],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'content-header-links',
    name: 'Content: header links',
    group: 'Content',
    description: 'A content page whose header carries utility links, with tabs for the body.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        top('masthead', 'dark'),
        top('header', 'default', {
          text: {
            title: 'Service name',
            description: 'Links in the header keep key actions close',
          },
        }),
        sec(
          { bg: 'off-white', padding: 'half' },
          c('utility-list', 'horizontal', {
            text: { item1: 'Print', item2: 'Share', item3: 'Email' },
          }),
        ),
        sec(
          { bg: 'white' },
          crumbs('Home', 'Guides', 'Guide'),
          h(1, 'Guide title'),
          c('tabs', 'default', {
            text: {
              tab1: 'Overview',
              tab2: 'Eligibility',
              tab3: 'How to apply',
              panel1: 'An overview of the service.',
              panel2: 'Who can use the service.',
              panel3: 'Steps to apply.',
            },
          }),
        ),
        footer(),
      ),
  },
  {
    id: 'content-side-navigation',
    name: 'Content: side navigation',
    group: 'Content',
    description: 'A section page with side navigation, content and a summary of related items.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          crumbs('Home', 'Section', 'Page'),
          row(
            [3, 9],
            [sideNav()],
            [
              h(1, 'Page title'),
              intro('An introduction to this part of the site.'),
              p('Body text sits here, beside the section’s navigation.'),
              c('accordion', 'default', {
                text: {
                  title1: 'Common question one',
                  content1: 'The answer to the first question.',
                  title2: 'Common question two',
                  content2: 'The answer to the second question.',
                  title3: 'Common question three',
                  content3: 'The answer to the third question.',
                },
              }),
            ],
          ),
        ),
        footer(),
      ),
  },
  // ---- Search
  {
    id: 'search-filters',
    name: 'Search: filters',
    group: 'Search',
    description: 'Search results with a filter panel, a results bar and pagination.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          h(1, 'Search results'),
          c('form', 'search', { text: { label: 'Search' } }),
          row(
            [3, 9],
            [filtersBlock(), c('tag', 'default', { text: { label: 'Housing' } })],
            [
              c('results-bar', 'default', { text: { summary: 'Showing 1–10 of 126 results' } }),
              ...results(5),
              c('pagination', 'default'),
            ],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'search-no-results',
    name: 'Search: no results',
    group: 'Search',
    description: 'What people see when a search finds nothing, with ways to try again.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          h(1, 'Search results'),
          c('form', 'search', { text: { label: 'Search' } }),
          c('in-page-alert', 'warning', {
            text: {
              title: 'No results found',
              copy: 'We couldn’t find anything for “licence renewl”.',
            },
          }),
          h(2, 'Try this'),
          c('list', 'bullet', {
            text: {
              item1: 'Check your spelling',
              item2: 'Use fewer or more general words',
              item3: 'Browse the topics below',
            },
          }),
          row([4, 4, 4], ...cards(3, 'headline', ['image'])),
        ),
        footer(),
      ),
  },
  {
    id: 'search-simple',
    name: 'Search: simple',
    group: 'Search',
    description: 'A simple results list with a search box and pagination.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          h(1, 'Search'),
          c('form', 'search', { text: { label: 'Search' } }),
          c('results-bar', 'default', { text: { summary: 'Showing 1–10 of 54 results' } }),
          ...results(5),
          c('pagination', 'default'),
        ),
        footer(),
      ),
  },
  // ---- Maps
  {
    id: 'maps-equal-value-filters',
    name: 'Maps: equal value filters',
    group: 'Maps',
    description: 'A map with a set of filters of equal weight, and a list of locations.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'white' },
          h(1, 'Find a service centre'),
          row(
            [3, 9],
            [
              filtersBlock(),
              c('select', 'default', {
                text: { label: 'Services offered', helper: '' },
                hide: ['helper'],
              }),
            ],
            [
              mapPlaceholder(),
              c('results-bar', 'default', { text: { summary: '12 locations' } }),
              ...results(3),
            ],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'maps-location-only',
    name: 'Maps: location based only',
    group: 'Maps',
    description: 'A search by location, a map and the nearest results.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'off-white' },
          h(1, 'Find a location near you'),
          c('form', 'search', { text: { label: 'Enter a suburb or postcode' } }),
        ),
        sec(
          { bg: 'white' },
          row(
            [5, 7],
            [
              c('results-bar', 'default', { text: { summary: 'Nearest locations' } }),
              ...results(4),
            ],
            [mapPlaceholder()],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'maps-location-primary',
    name: 'Maps: location primary with sub filters',
    group: 'Maps',
    description: 'Location is the main search, with secondary filters beneath it.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'brand-dark' },
          h(1, 'Find a location'),
          c('form', 'search', { text: { label: 'Enter a suburb or postcode' } }),
          row(
            [4, 4, 4],
            [c('select', 'default', { text: { label: 'Service type' }, hide: ['helper'] })],
            [c('select', 'default', { text: { label: 'Opening hours' }, hide: ['helper'] })],
            [c('select', 'default', { text: { label: 'Accessibility' }, hide: ['helper'] })],
          ),
        ),
        sec(
          { bg: 'white' },
          row(
            [4, 8],
            [
              c('results-bar', 'default', { text: { summary: '8 locations found' } }),
              ...results(3),
            ],
            [mapPlaceholder()],
          ),
        ),
        footer(),
      ),
  },
  // ---- Theming
  {
    id: 'theming-content-only',
    name: 'Theming: content only',
    group: 'Theming',
    description: 'Shows content sections in different NSW colour themes, without page chrome.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        sec(
          { bg: 'white' },
          h(2, 'Light theme'),
          p('Content on a white background.'),
          btn('Primary action'),
          btn('Secondary action', 'dark-outline'),
        ),
        sec(
          { bg: 'brand-light' },
          h(2, 'Brand light'),
          p('Content on the brand light background.'),
          btn('Primary action'),
        ),
        sec(
          { bg: 'brand-dark' },
          h(2, 'Brand dark'),
          p('Content on the brand dark background, with inverted text.'),
          btn('Primary action', 'white'),
          btn('Secondary action', 'white-outline'),
        ),
        sec(
          { bg: 'off-white' },
          row(
            [6, 6],
            [c('card', 'default', { text: { title: 'Card on off-white' } })],
            [c('card', 'light', { text: { title: 'Light card' } })],
          ),
        ),
      ),
  },
  {
    id: 'theming-full-page',
    name: 'Theming: full page',
    group: 'Theming',
    description: 'A full page in a dark theme: masthead, header, hero, content and footer.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        top('masthead', 'light'),
        top('header', 'default', {
          text: {
            title: 'Themed service',
            description: 'A page using the supplementary theme colours',
          },
        }),
        top('hero-banner', 'light', {
          text: {
            title: 'A themed page',
            intro: 'Every part of this page uses the NSW theme colours.',
            button: 'Call to action',
          },
        }),
        sec(
          { bg: 'brand-supplementary' },
          h(2, 'Supplementary colour'),
          p('Content on the supplementary brand colour.'),
          btn('Primary action', 'white'),
        ),
        sec({ bg: 'grey-04' }, row([4, 4, 4], ...cards(3))),
        top('footer', 'light'),
      ),
  },
  {
    id: 'theming-partial',
    name: 'Theming: partial',
    group: 'Theming',
    description: 'One themed band in an otherwise standard page.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec({ bg: 'white' }, h(1, 'Standard page'), p('Most of this page uses the default theme.')),
        sec(
          { bg: 'brand-dark' },
          h(2, 'A themed band'),
          p('Only this section uses a different theme.'),
          btn('Find out more', 'white'),
        ),
        sec({ bg: 'white' }, p('The page returns to the default theme here.')),
        footer(),
      ),
  },
  // ---- Landing pages
  {
    id: 'landing-events',
    name: 'Landing page: events',
    group: 'Landing pages',
    description: 'An events landing page: hero, upcoming events and a call to action.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        top('hero-banner', 'off-white', {
          text: {
            title: 'Events',
            intro: 'Find workshops, talks and community days near you.',
            button: 'View the calendar',
          },
        }),
        sec({ bg: 'white' }, h(2, 'Upcoming events'), row([4, 4, 4], ...cards(3, 'default'))),
        sec(
          { bg: 'brand-light' },
          row(
            [8, 4],
            [h(2, 'Host an event'), p('Run an event with support from our team.')],
            [btn('Apply to host an event')],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'landing-featured-list',
    name: 'Landing page: featured list',
    group: 'Landing pages',
    description: 'A landing page built around a featured list of services.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        sec(
          { bg: 'brand-dark' },
          h(1, 'Services for you'),
          intro('Start here to find what you need.'),
        ),
        sec({ bg: 'white' }, h(2, 'Featured services'), ...results(4)),
        sec(
          { bg: 'off-white' },
          h(2, 'More ways to get help'),
          row(
            [6, 6],
            [
              c('content-block', 'default', {
                text: { title: 'Online', copy: 'Do it in minutes, any time.', link: 'Go online' },
              }),
            ],
            [
              c('content-block', 'default', {
                text: {
                  title: 'In person',
                  copy: 'Visit a service centre.',
                  link: 'Find a centre',
                },
              }),
            ],
          ),
        ),
        footer(),
      ),
  },
  {
    id: 'landing-hero-banner',
    name: 'Landing page: hero banner',
    group: 'Landing pages',
    description: 'A campaign landing page with a dark hero, steps and a closing call to action.',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        ...chrome(),
        top('hero-banner', 'dark', {
          text: {
            title: 'Switch to digital',
            intro: 'It’s quicker, easier and free.',
            button: 'Switch now',
          },
        }),
        sec(
          { bg: 'white' },
          h(2, 'How it works'),
          c('steps', 'default', {
            text: {
              title1: 'Create your account',
              copy1: 'It takes two minutes.',
              title2: 'Verify who you are',
              copy2: 'Use your licence or passport.',
              title3: 'Start using services',
              copy3: 'Everything in one place.',
            },
          }),
        ),
        sec({ bg: 'brand-light' }, h(2, 'Ready to switch?'), btn('Create an account')),
        footer(),
      ),
  },
  // ---- Kitchen sink
  {
    id: 'kitchen-sink-sticky',
    name: 'Kitchen sink: sticky elements',
    group: 'Kitchen sink',
    description:
      'A busy page with alerts and the elements that stick to the screen (shown static here).',
    device: 'desktop',
    width: 1440,
    items: () =>
      page(
        top('global-alert', 'default', {
          text: {
            title: 'Planned maintenance',
            copy: 'Some services will be unavailable on Saturday night.',
            button: 'Find out more',
          },
        }),
        top('quick-exit', 'default'),
        ...chrome(),
        sec(
          { bg: 'white' },
          crumbs('Home', 'Help', 'Kitchen sink'),
          h(1, 'Sticky elements'),
          c('in-page-alert', 'info', {
            text: {
              title: 'About this page',
              copy: 'The quick exit bar, global alert and back to top button stick to the screen on a real site. Here they are shown in place.',
            },
          }),
          p('Scroll the page to see them on a real site.'),
          c('back-to-top', 'default'),
        ),
        top('cookie-consent', 'default'),
        footer(),
      ),
  },
];

/** The NSW templates in the kit's common shape. `NSW_TEMPLATE_DEFS` keeps the specs for the samples. */
export const NSW_TEMPLATES: TemplateDef[] = NSW_TEMPLATE_DEFS.map((def) => ({
  id: def.id,
  name: def.name,
  group: def.group,
  description: def.description,
  device: def.device,
  width: def.width,
  kitId: 'nsw',
  build: (makeId) => buildTree(def.items(), makeId),
}));
