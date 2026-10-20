import type { ComponentSource } from '../../../../catalogue/types';
import {
  PEOPLE,
  STORIES,
  avatar,
  carouselControls,
  head,
  picture,
  spIcon,
  stripControls,
} from './helpers';

const SUMMARIES = [
  'Take a first look at the new floors, meeting spaces and quiet rooms.',
  'Eight teams were recognised for ideas that saved time and money.',
  'What is changing, who is affected and where to get help.',
  'Simple habits that keep you and our information safe.',
  'Pick a project and a date. Teams of any size are welcome.',
  'Priorities for the coming quarter and how you can get involved.',
];

/** One news story: a picture, a title, where and when, and a summary. */
const story = (i: number, extra = '', thumb = true, summary = true) => {
  const [title, tag, date] = STORIES[i % STORIES.length]!;
  return (
    `<a class="sp-story${extra}" href="#"${i > 0 ? ` data-optional="story${i + 1}"` : ''}>` +
    (thumb
      ? `<span class="sp-story__thumb">${picture(`image${i + 1}`, i, title, 640, 360, 'sp-media')}</span>`
      : '') +
    `<span class="sp-story__body"><span class="sp-tag" data-edit="tag${i + 1}">${tag}</span>` +
    `<span class="sp-story__title" data-edit="title${i + 1}">${title}</span>` +
    (summary
      ? `<span class="sp-story__summary" data-optional="summaries" data-edit="summary${i + 1}">${SUMMARIES[i % SUMMARIES.length]}</span>`
      : '') +
    `<span class="sp-meta"><span data-edit="author${i + 1}">${PEOPLE[i % PEOPLE.length]![0]}</span> · <span data-edit="date${i + 1}">${date}</span></span></span></a>`
  );
};

const stories = (n: number, extra = '', thumb = true, summary = true) =>
  Array.from({ length: n }, (_, i) => story(i, extra, thumb, summary)).join('');

const EVENTS = [
  ['Oct', '21', 'Town hall with the leadership team', 'Main hall · 10:00 am'],
  ['Oct', '24', 'Cyber security awareness session', 'Online · 12:30 pm'],
  ['Nov', '3', 'Volunteer day', 'Various locations · All day'],
  ['Nov', '12', 'Learning lunch: effective meetings', 'Room 4.02 · 12:00 pm'],
  ['Nov', '19', 'End of year celebration', 'Rooftop · 5:00 pm'],
] as const;

const event = (i: number, cls = '') => {
  const [month, day, title, where] = EVENTS[i]!;
  return (
    `<a class="sp-event${cls}" href="#"${i > 1 ? ` data-optional="event${i + 1}"` : ''}>` +
    `<span class="sp-event__date"><span class="sp-event__month" data-edit="month${i + 1}">${month}</span><span class="sp-event__day" data-edit="day${i + 1}">${day}</span></span>` +
    `<span class="sp-event__body"><span class="sp-event__title" data-edit="title${i + 1}">${title}</span>` +
    `<span class="sp-meta" data-edit="where${i + 1}">${where}</span></span></a>`
  );
};

const HIGHLIGHTS = [
  ['Annual report 2026', 'Document', 'document_text'],
  ['Brand guidelines', 'Document', 'document'],
  ['Onboarding checklist', 'Page', 'news'],
  ['Travel policy', 'Document', 'document_text'],
  ['Customer survey results', 'Page', 'data_bar_vertical'],
  ['Meeting room guide', 'Page', 'news'],
] as const;

const highlight = (i: number, thumb: boolean, cls = 'sp-hc__item') => {
  const [title, kind, icon] = HIGHLIGHTS[i]!;
  return (
    `<a class="${cls}" href="#"${i > 2 ? ` data-optional="item${i + 1}"` : ''}>` +
    (thumb
      ? `<span class="sp-hc__thumb">${picture(`image${i + 1}`, i + 1, title, 480, 270, 'sp-media')}</span>`
      : '') +
    `<span class="sp-hc__body"><span class="sp-hc__kind">${spIcon(icon, '', 16)}<span data-edit="kind${i + 1}">${kind}</span></span>` +
    `<span class="sp-hc__title" data-edit="title${i + 1}">${title}</span></span></a>`
  );
};

const person = (i: number, contact: boolean) => {
  const [name, role, initials] = PEOPLE[i]!;
  return (
    `<div class="sp-person"${i > 3 ? ` data-optional="person${i + 1}"` : ''}>${avatar(initials, i)}` +
    `<div><div class="sp-person__name" data-edit="name${i + 1}">${name}</div><div class="sp-person__title" data-edit="role${i + 1}">${role}</div>` +
    (contact
      ? `<div class="sp-person__contact" data-optional="contact">${spIcon('mail', '', 16)}${spIcon('chat', '', 16)}${spIcon('phone', '', 16)}</div>`
      : '') +
    `</div></div>`
  );
};

/** News, Events, Highlighted content, People, Countdown timer and Page properties. */
export const content: ComponentSource[] = [
  {
    id: 'sp-news',
    slug: 'news',
    name: 'News',
    category: 'Content',
    variants: [
      {
        id: 'top-story',
        label: 'Top story',
        html: `<div class="sp-wp">${head('News')}<div class="sp-news sp-news--top"><div class="sp-news__lead">${story(0)}</div><div class="sp-news__side">${[1, 2, 3, 4].map((i) => story(i, '', true, false)).join('')}</div></div></div>`,
      },
      {
        id: 'list',
        label: 'List',
        html: `<div class="sp-wp">${head('News')}<div class="sp-news sp-news--list">${stories(4)}</div></div>`,
      },
      {
        id: 'side-by-side',
        label: 'Side-by-side',
        html: `<div class="sp-wp">${head('News')}<div class="sp-news sp-news--side">${stories(4)}</div></div>`,
      },
      {
        id: 'hub-news',
        label: 'Hub news',
        html: `<div class="sp-wp">${head('News')}<div class="sp-news sp-news--hub">${stories(5, '', true, false)}</div></div>`,
      },
      {
        id: 'carousel',
        label: 'Carousel',
        html: `<div class="sp-wp">${head('News')}<div class="sp-news sp-news--carousel sp-carousel" data-sp-carousel>${Array.from({ length: 4 }, (_, i) => `<div class="sp-carousel__slide${i === 0 ? ' is-active' : ''}">${story(i, '', true, false)}</div>`).join('')}${carouselControls(4)}</div></div>`,
      },
      {
        id: 'tiles',
        label: 'Tiles',
        html: `<div class="sp-wp">${head('News')}<div class="sp-news sp-news--tiles">${stories(6, '', true, false)}</div></div>`,
      },
      {
        id: 'filmstrip',
        label: 'Filmstrip',
        html: `<div class="sp-wp">${head('News')}<div class="sp-strip sp-news--filmstrip" data-sp-strip>${stripControls()}<div class="sp-strip__track">${Array.from({ length: 6 }, (_, i) => story(i, ' sp-strip__item', true, false)).join('')}</div></div></div>`,
      },
    ],
  },
  {
    id: 'sp-events',
    slug: 'events',
    name: 'Events',
    category: 'Content',
    note: 'A static preview: SharePoint shows live events from a calendar.',
    fidelity: 'static',
    variants: [
      {
        id: 'compact',
        label: 'Compact',
        html: `<div class="sp-wp">${head('Upcoming events')}<div class="sp-events sp-events--compact">${EVENTS.map((_, i) => event(i)).join('')}</div></div>`,
      },
      {
        id: 'filmstrip',
        label: 'Filmstrip',
        html: `<div class="sp-wp">${head('Upcoming events')}<div class="sp-strip sp-events--filmstrip" data-sp-strip>${stripControls()}<div class="sp-strip__track">${EVENTS.map((_, i) => event(i, ' sp-strip__item')).join('')}</div></div></div>`,
      },
    ],
  },
  {
    id: 'sp-highlighted-content',
    slug: 'highlighted-content',
    name: 'Highlighted content',
    category: 'Content',
    note: 'A static preview: SharePoint shows live documents and pages.',
    fidelity: 'static',
    variants: [
      {
        id: 'cards',
        label: 'Cards',
        html: `<div class="sp-wp">${head('Highlighted content')}<div class="sp-hc sp-hc--cards">${HIGHLIGHTS.map((_, i) => highlight(i, true)).join('')}</div></div>`,
      },
      {
        id: 'list',
        label: 'List',
        html: `<div class="sp-wp">${head('Highlighted content')}<div class="sp-hc sp-hc--list">${HIGHLIGHTS.map((_, i) => highlight(i, true)).join('')}</div></div>`,
      },
      {
        id: 'carousel',
        label: 'Carousel',
        html: `<div class="sp-wp">${head('Highlighted content')}<div class="sp-hc sp-carousel" data-sp-carousel>${HIGHLIGHTS.slice(
          0,
          4,
        )
          .map(
            (_, i) =>
              `<div class="sp-carousel__slide${i === 0 ? ' is-active' : ''}">${highlight(i, true)}</div>`,
          )
          .join('')}${carouselControls(4)}</div></div>`,
      },
      {
        id: 'filmstrip',
        label: 'Filmstrip',
        html: `<div class="sp-wp">${head('Highlighted content')}<div class="sp-strip sp-hc--filmstrip" data-sp-strip>${stripControls()}<div class="sp-strip__track">${HIGHLIGHTS.map((_, i) => highlight(i, true, 'sp-hc__item sp-strip__item')).join('')}</div></div></div>`,
      },
    ],
  },
  {
    id: 'sp-people',
    slug: 'people',
    name: 'People',
    category: 'Content',
    variants: [
      {
        id: 'compact',
        label: 'Compact',
        html: `<div class="sp-wp">${head('Our team')}<div class="sp-people sp-people--compact">${PEOPLE.map((_, i) => person(i, false)).join('')}</div></div>`,
      },
      {
        id: 'descriptive',
        label: 'Descriptive',
        html: `<div class="sp-wp">${head('Our team')}<div class="sp-people sp-people--descriptive">${PEOPLE.map((_, i) => person(i, true)).join('')}</div></div>`,
      },
    ],
  },
  {
    id: 'sp-countdown',
    slug: 'countdown-timer',
    name: 'Countdown timer',
    category: 'Content',
    note: 'The numbers are fixed. SharePoint counts down to a date you choose.',
    fidelity: 'static',
    variants: [
      {
        id: 'countdown',
        label: 'Countdown timer',
        html:
          `<div class="sp-countdown">${picture('background', 1, 'Background picture', 1200, 400, 'sp-countdown__bg')}<span class="sp-countdown__shade"></span>` +
          `<h2 class="sp-countdown__title" data-edit="title">Open day in</h2><div class="sp-countdown__units">` +
          [
            ['12', 'Days'],
            ['4', 'Hours'],
            ['37', 'Minutes'],
            ['09', 'Seconds'],
          ]
            .map(
              ([n, l], i) =>
                `<div class="sp-countdown__unit"><span class="sp-countdown__number" data-edit="n${i + 1}">${n}</span><span class="sp-countdown__label" data-edit="l${i + 1}">${l}</span></div>`,
            )
            .join('') +
          `</div><a class="sp-button sp-button--primary" href="#" data-optional="button"><span data-edit="button">Register</span></a></div>`,
      },
    ],
  },
  {
    id: 'sp-page-properties',
    slug: 'page-properties',
    name: 'Page properties',
    category: 'Content',
    variants: [
      {
        id: 'properties',
        label: 'Page properties',
        html: `<div class="sp-wp"><dl class="sp-props">${[
          ['Title', 'Remote working guide'],
          ['Author', 'Alex Taylor'],
          ['Published', '12 October 2026'],
          ['Owner', 'People and culture'],
          ['Review date', '12 April 2027'],
        ]
          .map(
            ([k, v], i) =>
              `<dt data-edit="key${i + 1}">${k}</dt><dd data-edit="value${i + 1}">${v}</dd>`,
          )
          .join('')}</dl></div>`,
      },
    ],
  },
];
