import type { ComponentSource } from '../../../../catalogue/types';
import { picture } from './helpers';

const initialsOf = (n: string) =>
  n
    .split(' ')
    .map((p) => p[0])
    .join('');

/** Cards, heroes, callouts, statistics, features, accordions, tables, rows, profiles and more. */
export const content: ComponentSource[] = [
  {
    id: 'sk-card',
    slug: 'card',
    name: 'Card',
    category: 'Content',
    variants: [
      {
        id: 'basic',
        label: 'Basic',
        html: `<div class="sk-c sk-card"><div class="sk-card__body"><h3 class="sk-card__title" data-edit="title">Card title</h3><p class="sk-card__text" data-edit="text" data-multiline>A short description that explains what this card is about.</p><a class="sk-card__link" href="#" data-optional="link" data-edit="link">Read more →</a></div></div>`,
      },
      {
        id: 'image',
        label: 'With picture',
        html: `<div class="sk-c sk-card">${picture('image', 0, 'Placeholder picture', 'sk-card__image')}<div class="sk-card__body"><h3 class="sk-card__title" data-edit="title">Card title</h3><p class="sk-card__text" data-edit="text" data-multiline>A short description that explains what this card is about.</p><a class="sk-card__link" href="#" data-optional="link" data-edit="link">Read more →</a></div></div>`,
      },
      {
        id: 'horizontal',
        label: 'Side by side',
        html: `<div class="sk-c sk-card sk-card--horizontal">${picture('image', 1, 'Placeholder picture', 'sk-card__image', 480, 360)}<div class="sk-card__body"><h3 class="sk-card__title" data-edit="title">Card title</h3><p class="sk-card__text" data-edit="text" data-multiline>A short description that explains what this card is about.</p><a class="sk-card__link" href="#" data-optional="link" data-edit="link">Read more →</a></div></div>`,
      },
      {
        id: 'flat',
        label: 'Soft',
        html: `<div class="sk-c sk-card sk-card--flat"><div class="sk-card__body"><h3 class="sk-card__title" data-edit="title">Card title</h3><p class="sk-card__text" data-edit="text" data-multiline>A softer card with no border, good for grouping a few facts.</p></div></div>`,
      },
    ],
  },
  {
    id: 'sk-hero',
    slug: 'hero',
    name: 'Hero',
    category: 'Content',
    variants: [
      {
        id: 'centre',
        label: 'Centred',
        html: `<div class="sk-c sk-hero sk-hero--centre"><h1 class="sk-hero__title" data-edit="title">A clear headline for the page</h1><p class="sk-hero__text" data-edit="text" data-multiline>One or two sentences that explain what this is and who it is for.</p><div class="sk-hero__actions" data-optional="actions"><button class="sk-button" data-edit="primary">Get started</button><button class="sk-button sk-button--secondary" data-edit="secondary">Learn more</button></div></div>`,
      },
      {
        id: 'left',
        label: 'Left aligned',
        html: `<div class="sk-c sk-hero"><h1 class="sk-hero__title" data-edit="title">A clear headline for the page</h1><p class="sk-hero__text" data-edit="text" data-multiline>One or two sentences that explain what this is and who it is for.</p><div class="sk-hero__actions" data-optional="actions"><button class="sk-button" data-edit="primary">Get started</button><button class="sk-button sk-button--secondary" data-edit="secondary">Learn more</button></div></div>`,
      },
      {
        id: 'split',
        label: 'With picture',
        html: `<div class="sk-c sk-hero sk-hero--split"><div class="sk-hero__copy"><h1 class="sk-hero__title" data-edit="title">A clear headline for the page</h1><p class="sk-hero__text" data-edit="text" data-multiline>One or two sentences that explain what this is and who it is for.</p><div class="sk-hero__actions" data-optional="actions"><button class="sk-button" data-edit="primary">Get started</button></div></div>${picture('image', 2, 'Placeholder picture', 'sk-hero__image', 640, 480)}</div>`,
      },
    ],
  },
  {
    id: 'sk-callout',
    slug: 'callout',
    name: 'Callout',
    category: 'Content',
    variants: [
      ['info', 'Information', '', 'Good to know'],
      ['success', 'Success', ' sk-callout--success', 'All done'],
      ['warning', 'Warning', ' sk-callout--warning', 'Check this first'],
      ['error', 'Error', ' sk-callout--error', 'Something went wrong'],
    ].map(([id, label, cls, title]) => ({
      id: id!,
      label: label!,
      html: `<div class="sk-c sk-callout${cls}" role="note"><span class="sk-callout__title" data-edit="title">${title}</span><span class="sk-callout__text" data-edit="text" data-multiline>A sentence or two that gives the detail.</span></div>`,
    })),
  },
  {
    id: 'sk-stats',
    slug: 'stats',
    name: 'Statistics',
    category: 'Content',
    variants: [
      {
        id: 'one',
        label: 'One number',
        html: `<div class="sk-c sk-stat"><span class="sk-stat__value" data-edit="value1">1,284</span><span class="sk-stat__label" data-edit="label1">Active users</span></div>`,
      },
      {
        id: 'three',
        label: 'Three numbers',
        html: `<div class="sk-c sk-stats">${[
          ['1,284', 'Active users'],
          ['96%', 'Satisfaction'],
          ['24', 'Countries'],
        ]
          .map(
            ([v, l], i) =>
              `<div class="sk-stat"><span class="sk-stat__value" data-edit="value${i + 1}">${v}</span><span class="sk-stat__label" data-edit="label${i + 1}">${l}</span></div>`,
          )
          .join('')}</div>`,
      },
    ],
  },
  {
    id: 'sk-features',
    slug: 'features',
    name: 'Features',
    category: 'Content',
    variants: [
      {
        id: 'one',
        label: 'One feature',
        html: `<div class="sk-c sk-feature"><span class="sk-feature__icon" aria-hidden="true">★</span><h3 class="sk-feature__title" data-edit="title1">A helpful feature</h3><p class="sk-feature__text" data-edit="text1" data-multiline>Explain the benefit in a sentence.</p></div>`,
      },
      {
        id: 'three',
        label: 'Three features',
        html: `<div class="sk-c sk-features">${[
          ['★', 'Quick to start', 'Get going in minutes with nothing to set up.'],
          ['✓', 'Easy to use', 'Everything is where you expect to find it.'],
          ['♥', 'Made to last', 'Reliable and simple, year after year.'],
        ]
          .map(
            ([i, t, x], n) =>
              `<div class="sk-feature"><span class="sk-feature__icon" aria-hidden="true">${i}</span><h3 class="sk-feature__title" data-edit="title${n + 1}">${t}</h3><p class="sk-feature__text" data-edit="text${n + 1}" data-multiline>${x}</p></div>`,
          )
          .join('')}</div>`,
      },
    ],
  },
  {
    id: 'sk-accordion',
    slug: 'accordion',
    name: 'Accordion',
    category: 'Content',
    variants: [
      {
        id: 'three',
        label: 'Three items',
        html: `<div class="sk-c sk-accordion">${[
          'How do I get started?',
          'Can I change my plan later?',
          'Who can I contact for help?',
        ]
          .map(
            (q, i) =>
              `<details${i === 0 ? ' open' : ''}><summary data-edit="title${i + 1}">${q}</summary><div class="sk-accordion__body" data-edit="text${i + 1}" data-multiline>A short, direct answer goes here.</div></details>`,
          )
          .join('')}</div>`,
      },
    ],
  },
  {
    id: 'sk-table',
    slug: 'table',
    name: 'Table',
    category: 'Content',
    variants: ['plain', 'striped'].map((id) => ({
      id,
      label: id === 'plain' ? 'Plain' : 'Striped',
      html:
        `<table class="sk-c sk-table${id === 'striped' ? ' sk-table--striped' : ''}"><thead><tr>${['Name', 'Role', 'Status'].map((h, i) => `<th data-edit="head${i + 1}">${h}</th>`).join('')}</tr></thead><tbody>` +
        [
          ['Priya Nair', 'Designer', 'Active'],
          ['Sam Okafor', 'Engineer', 'Active'],
          ['Mei Lin', 'Manager', 'Away'],
        ]
          .map(
            (r, i) =>
              `<tr>${r.map((c, j) => `<td data-edit="cell${i + 1}${j + 1}">${c}</td>`).join('')}</tr>`,
          )
          .join('') +
        `</tbody></table>`,
    })),
  },
  {
    id: 'sk-rows',
    slug: 'list-rows',
    name: 'Item list',
    category: 'Content',
    variants: [
      {
        id: 'simple',
        label: 'Simple',
        html: `<div class="sk-c sk-rows">${[
          ['Quarterly report', 'Updated yesterday', '2 MB'],
          ['Team handbook', 'Updated last week', '1 MB'],
          ['Budget plan', 'Updated 3 weeks ago', '480 KB'],
        ]
          .map(
            ([t, s, m], i) =>
              `<div class="sk-row"><div class="sk-row__main"><span class="sk-row__title" data-edit="title${i + 1}">${t}</span><span class="sk-row__sub" data-edit="sub${i + 1}">${s}</span></div><span class="sk-row__meta" data-edit="meta${i + 1}">${m}</span></div>`,
          )
          .join('')}</div>`,
      },
      {
        id: 'people',
        label: 'With avatars',
        html: `<div class="sk-c sk-rows">${[
          ['Priya Nair', 'Designer'],
          ['Sam Okafor', 'Engineer'],
          ['Mei Lin', 'Manager'],
        ]
          .map(
            ([t, s], i) =>
              `<div class="sk-row"><span class="sk-avatar" aria-hidden="true">${initialsOf(t!)}</span><div class="sk-row__main"><span class="sk-row__title" data-edit="title${i + 1}">${t}</span><span class="sk-row__sub" data-edit="sub${i + 1}">${s}</span></div></div>`,
          )
          .join('')}</div>`,
      },
    ],
  },
  {
    id: 'sk-profile',
    slug: 'profile',
    name: 'Profile',
    category: 'Content',
    variants: [
      {
        id: 'profile',
        label: 'Profile',
        html: `<div class="sk-c sk-profile"><span class="sk-avatar" aria-hidden="true">AT</span><div class="sk-profile__text"><span class="sk-profile__name" data-edit="name">Alex Taylor</span><span class="sk-profile__role" data-edit="role">Product designer</span></div></div>`,
      },
    ],
  },
  {
    id: 'sk-steps',
    slug: 'steps',
    name: 'Steps',
    category: 'Content',
    variants: [
      {
        id: 'three',
        label: 'Three steps',
        html: `<div class="sk-c sk-steps">${[
          ['Sign up', 'Create your account in a minute.'],
          ['Set up', 'Add your details and preferences.'],
          ['Go', 'Start using it straight away.'],
        ]
          .map(
            ([t, x], i) =>
              `<div class="sk-step"><span class="sk-step__num">${i + 1}</span><span class="sk-step__title" data-edit="title${i + 1}">${t}</span><span class="sk-step__text" data-edit="text${i + 1}">${x}</span></div>`,
          )
          .join('')}</div>`,
      },
    ],
  },
  {
    id: 'sk-testimonial',
    slug: 'testimonial',
    name: 'Testimonial',
    category: 'Content',
    variants: [
      {
        id: 'testimonial',
        label: 'Testimonial',
        html: `<div class="sk-c sk-testimonial"><p class="sk-testimonial__quote" data-edit="text" data-multiline>“It took us minutes to get started, and everyone understood it straight away.”</p><div class="sk-profile"><span class="sk-avatar" aria-hidden="true">SO</span><div class="sk-profile__text"><span class="sk-profile__name" data-edit="name">Sam Okafor</span><span class="sk-profile__role" data-edit="role">Operations lead</span></div></div></div>`,
      },
    ],
  },
  {
    id: 'sk-pricing',
    slug: 'pricing',
    name: 'Pricing',
    category: 'Content',
    variants: [
      {
        id: 'plan',
        label: 'Plan',
        html: `<div class="sk-c sk-pricing"><span class="sk-pricing__name" data-edit="name">Starter</span><span class="sk-pricing__price"><span data-edit="price">$12</span> <small data-edit="period">per month</small></span><ul class="sk-list sk-list--check">${['Up to 5 people', 'Basic reports', 'Email support'].map((t, i) => `<li data-edit="item${i + 1}">${t}</li>`).join('')}</ul><button class="sk-button sk-button--outline sk-button--full" data-edit="label">Choose plan</button></div>`,
      },
      {
        id: 'featured',
        label: 'Featured plan',
        html: `<div class="sk-c sk-pricing sk-pricing--featured"><span class="sk-pricing__name" data-edit="name">Team</span><span class="sk-pricing__price"><span data-edit="price">$39</span> <small data-edit="period">per month</small></span><ul class="sk-list sk-list--check">${['Unlimited people', 'Advanced reports', 'Priority support'].map((t, i) => `<li data-edit="item${i + 1}">${t}</li>`).join('')}</ul><button class="sk-button sk-button--full" data-edit="label">Choose plan</button></div>`,
      },
    ],
  },
  {
    id: 'sk-empty',
    slug: 'empty-state',
    name: 'Empty state',
    category: 'Content',
    variants: [
      {
        id: 'empty',
        label: 'Empty state',
        html: `<div class="sk-c sk-empty"><span class="sk-empty__icon" aria-hidden="true">＋</span><span class="sk-empty__title" data-edit="title">Nothing here yet</span><span class="sk-empty__text" data-edit="text" data-multiline>When you add something it will show up here.</span><button class="sk-button" data-optional="action" data-edit="label">Add the first one</button></div>`,
      },
    ],
  },
  {
    id: 'sk-progress',
    slug: 'progress',
    name: 'Progress bar',
    category: 'Content',
    variants: [
      {
        id: 'bar',
        label: 'Bar',
        html: `<div class="sk-c sk-progress"><div class="sk-progress__head"><span data-edit="label">Profile complete</span><span data-edit="value">65%</span></div><div class="sk-progress__bar"><span class="sk-progress__fill"></span></div></div>`,
      },
    ],
  },
  {
    id: 'sk-placeholder',
    slug: 'placeholder',
    name: 'Placeholder',
    category: 'Content',
    fidelity: 'static',
    note: 'Stands in for something this kit has no component for (for example one brought across from another kit).',
    variants: [
      {
        id: 'placeholder',
        label: 'Placeholder',
        html: `<div class="sk-c sk-placeholder"><span class="sk-placeholder__tag">Not converted</span><strong data-edit="name">Component name</strong><span data-edit="text" data-multiline>This had no equivalent in the Simple kit. Replace it, or rebuild it.</span></div>`,
      },
    ],
  },
];
