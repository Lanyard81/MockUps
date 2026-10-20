import type { TemplateDef } from '../../templates/types';
import { buildPage, page, section, wp, type PageSpec } from './templateDsl';

/**
 * SharePoint page templates in the style of the ones SharePoint starts sites and pages from
 * (Communication site: Topic, Showcase, Blank; a team site home page; an intranet home page; a
 * news article; a department landing page). Written from knowledge and general descriptions, not
 * copied from SharePoint: check them against a real tenant (see `docs/SHAREPOINT-OOB.md`).
 */
const common = { device: 'desktop', width: 1440, kitId: 'sharepoint' } as const;

const T = (
  id: string,
  name: string,
  group: string,
  description: string,
  spec: () => PageSpec,
): TemplateDef => ({
  id,
  name,
  group,
  description,
  ...common,
  build: (makeId) => buildPage(spec(), makeId),
});

export const SP_TEMPLATES: TemplateDef[] = [
  T(
    'sp-topic',
    'Communication site: Topic',
    'Home pages',
    'A topic home page: hero tiles, news, events, quick links and key documents.',
    () =>
      page(
        {
          siteType: 'communication',
          headerLayout: 'standard',
          showTitleArea: false,
          siteTitle: 'Wellbeing hub',
        },
        section('full-width', {}, [wp('sp-hero', 'tiles')]),
        section(
          'two-columns',
          {},
          [wp('sp-news', 'list', { text: { title: 'Latest news' }, hide: ['story4'] })],
          [wp('sp-events', 'compact', { text: { title: 'Events' } })],
        ),
        section('one-column', { background: 'soft' }, [
          wp('sp-quick-links', 'compact', { text: { title: 'Get started' } }),
        ]),
        section(
          'one-third-right',
          {},
          [wp('sp-highlighted-content', 'cards', { text: { title: 'Guides and policies' } })],
          [wp('sp-people', 'descriptive', { text: { title: 'Your contacts' } })],
        ),
      ),
  ),
  T(
    'sp-showcase',
    'Communication site: Showcase',
    'Home pages',
    'A picture-led page: a large image, short text, a gallery and a call to action.',
    () =>
      page(
        {
          siteType: 'communication',
          headerLayout: 'compact',
          showTitleArea: true,
          titleLayout: 'image-and-title',
          pageTitle: 'Showcase',
        },
        section('full-width', {}, [wp('sp-image', 'image', { props: { ratio: '3x2' } })]),
        section('one-column', {}, [
          wp('sp-text', 'heading-2', { text: { text: 'What we are proud of' } }),
          wp('sp-text', 'paragraph', {
            text: {
              text: 'Use this page to tell the story of a project, a team or a place. Add pictures, short paragraphs and a clear next step.',
            },
          }),
        ]),
        section('one-column', {}, [wp('sp-image-gallery', 'brick')]),
        section('full-width', {}, [
          wp('sp-cta', undefined, {
            text: { title: 'See it for yourself', label: 'Book a visit' },
          }),
        ]),
      ),
  ),
  T(
    'sp-blank',
    'Communication site: Blank',
    'Home pages',
    'A clean start: the site header and one empty section.',
    () =>
      page(
        { siteType: 'communication', headerLayout: 'compact', showTitleArea: false },
        section('one-column', {}, [wp('sp-text', 'paragraph')]),
      ),
  ),
  T(
    'sp-team-home',
    'Team site: Home page',
    'Home pages',
    'A team site: news, quick links, recent documents, site activity and a calendar.',
    () =>
      page(
        {
          siteType: 'team',
          headerLayout: 'compact',
          showTitleArea: false,
          siteTitle: 'Project team',
        },
        section('one-column', {}, [
          wp('sp-news', 'side-by-side', { text: { title: 'News' }, hide: ['story3', 'story4'] }),
        ]),
        section(
          'two-columns',
          {},
          [
            wp('sp-quick-links', 'list', {
              text: { title: 'Quick links' },
              hide: ['item5', 'item6'],
            }),
            wp('sp-recent-documents', undefined),
          ],
          [wp('sp-group-calendar', 'month'), wp('sp-site-activity', undefined)],
        ),
      ),
  ),
  T(
    'sp-intranet-home',
    'Intranet home page',
    'Home pages',
    'A hub-style intranet home: a hero, news with a vertical section for quick links, weather and events.',
    () =>
      page(
        {
          siteType: 'communication',
          headerLayout: 'extended',
          headerBackground: 'strong',
          siteTitle: 'Our intranet',
          showTitleArea: false,
        },
        // A page can't have a full-width and a vertical section, so the hero sits in a normal section.
        section('one-column', {}, [wp('sp-hero', 'layers')]),
        section('one-column', {}, [wp('sp-news', 'top-story')]),
        section('one-column', { background: 'neutral' }, [
          wp('sp-quick-links', 'tiles', { text: { title: 'Everyday tools' } }),
        ]),
        section(
          'two-columns',
          {},
          [wp('sp-highlighted-content', 'list')],
          [wp('sp-people', 'compact')],
        ),
        section('vertical', {}, [
          wp('sp-weather', 'forecast'),
          wp('sp-events', 'compact'),
          wp('sp-world-clock', 'clocks'),
          wp('sp-countdown', 'countdown'),
        ]),
      ),
  ),
  T(
    'sp-news-article',
    'News article',
    'Pages',
    'A news article page: topic, title and byline, text, a picture, a quote and related news.',
    () =>
      page(
        {
          siteType: 'communication',
          headerLayout: 'compact',
          titleLayout: 'image-and-title',
          showTopic: true,
          topicText: 'Facilities',
          pageTitle: 'Our new office opens next month',
          showAuthor: true,
        },
        section('one-column', {}, [
          wp('sp-text', 'paragraph', {
            text: {
              text: 'After two years of planning, our new office opens on 3 November. It brings four teams together on two floors, with quiet rooms, a shared kitchen and plenty of space to meet.',
            },
          }),
          wp('sp-image', 'image', { text: { caption: 'The new third-floor workspace' } }),
          wp('sp-text', 'quote', {
            text: {
              text: 'It feels like a place where people will want to be.',
              source: 'Alex Taylor, Communications lead',
            },
          }),
          wp('sp-text', 'paragraph', {
            text: {
              text: 'Moving day is staged over the first two weeks. Your team lead will confirm your date and share a short checklist.',
            },
          }),
        ]),
        section('one-column', { background: 'neutral' }, [
          wp('sp-news', 'side-by-side', {
            text: { title: 'Related news' },
            hide: ['story3', 'story4'],
          }),
        ]),
      ),
  ),
  T(
    'sp-department-landing',
    'Department landing page',
    'Pages',
    'A department page: who we are, contacts, forms and documents, and quick links down the side.',
    () =>
      page(
        {
          siteType: 'communication',
          headerLayout: 'standard',
          titleLayout: 'overlap',
          pageTitle: 'People and culture',
          showAuthor: false,
          showDate: false,
        },
        section(
          'two-columns',
          {},
          [
            wp('sp-text', 'paragraph', {
              text: {
                text: 'We help everyone do their best work: from joining and growing here to looking after wellbeing and getting paid.',
              },
            }),
            wp('sp-quick-links', 'button', {
              text: { title: 'I want to…' },
              hide: ['item5', 'item6'],
            }),
          ],
          [
            wp('sp-people', 'descriptive', {
              text: { title: 'Contact us' },
              hide: ['person4', 'person5', 'person6'],
            }),
          ],
        ),
        section('one-column', { background: 'soft' }, [wp('sp-document-library', 'library')]),
        section('vertical', {}, [
          wp('sp-quick-links', 'list', {
            text: { title: 'Useful links' },
            hide: ['item5', 'item6'],
          }),
        ]),
      ),
  ),
];
