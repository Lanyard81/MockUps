import type { ComponentSource } from '../../../../catalogue/types';
import { picture, spIcon, stripControls } from './helpers';

const LINKS = [
  ['Leave and time off', 'Apply for leave or check your balance', 'calendar_ltr'],
  ['Book a meeting room', 'Find and reserve a space', 'building_multiple'],
  ['Find a policy', 'Search the policy library', 'document'],
  ['IT help desk', 'Get help with your devices', 'headset'],
  ['Company calendar', 'Events across the organisation', 'calendar_clock'],
  ['Expense claims', 'Submit and track claims', 'receipt_money'],
] as const;

type Mode = 'icon' | 'thumb';

function item(i: number, mode: Mode, cls = 'sp-ql__item'): string {
  const [title, desc, icon] = LINKS[i]!;
  const media =
    mode === 'icon'
      ? `<span class="sp-ql__icon" data-slot="icon${i + 1}">${spIcon(icon, '', 20)}</span>`
      : `<span class="sp-ql__thumb">${picture(`image${i + 1}`, i, title, 360, mode === 'thumb' ? 270 : 640, 'sp-media')}</span>`;
  return (
    `<a class="${cls}" href="#"${i > 2 ? ` data-optional="item${i + 1}"` : ''}>${media}` +
    `<span class="sp-ql__text"><span class="sp-ql__title" data-edit="title${i + 1}">${title}</span>` +
    `<span class="sp-ql__desc" data-optional="descriptions" data-edit="desc${i + 1}">${desc}</span></span></a>`
  );
}

const items = (mode: Mode, wrap = '') =>
  LINKS.map((_, i) => item(i, mode, `sp-ql__item${wrap}`)).join('');

/** Button, Call to action, Link and Quick links. */
export const links: ComponentSource[] = [
  {
    id: 'sp-button',
    slug: 'button',
    name: 'Button',
    category: 'Navigation and links',
    variants: [
      {
        id: 'primary',
        label: 'Button',
        html: `<div class="sp-button-row"><a class="sp-button sp-button--primary" href="#"><span data-edit="label">Learn more</span></a></div>`,
      },
    ],
  },
  {
    id: 'sp-cta',
    slug: 'call-to-action',
    name: 'Call to action',
    category: 'Navigation and links',
    variants: [
      {
        id: 'cta',
        label: 'Call to action',
        html:
          `<div class="sp-cta">${picture('background', 3, 'Background picture', 1200, 400, 'sp-cta__bg')}<span class="sp-cta__shade"></span>` +
          `<div class="sp-cta__body"><h2 class="sp-cta__title" data-edit="title">Join this year’s volunteer day</h2>` +
          `<p data-optional="text" data-edit="text" data-multiline>Spend a day giving back with your team.</p>` +
          `<a class="sp-button" href="#"><span data-edit="label">Sign up</span></a></div></div>`,
      },
    ],
  },
  {
    id: 'sp-link',
    slug: 'link',
    name: 'Link',
    category: 'Navigation and links',
    variants: [
      {
        id: 'card',
        label: 'Preview card',
        html:
          `<a class="sp-linkcard sp-card" href="#"><span class="sp-linkcard__thumb">${picture('image', 5, 'Page preview', 400, 225, 'sp-media')}</span>` +
          `<span class="sp-linkcard__body"><span class="sp-linkcard__title" data-edit="title">Remote working guide</span>` +
          `<span class="sp-linkcard__url" data-optional="url" data-edit="url">intranet.example.com/guides/remote-working</span>` +
          `<span data-optional="description" data-edit="description" data-multiline>How to set up, stay secure and keep in touch when you work away from the office.</span></span></a>`,
      },
      {
        id: 'inline',
        label: 'Inline',
        html: `<a class="sp-linkcard sp-linkcard--inline sp-card" href="#">${spIcon('link', '', 20)}<span class="sp-linkcard__body"><span class="sp-linkcard__title" data-edit="title">Remote working guide</span><span class="sp-linkcard__url" data-edit="url">intranet.example.com/guides/remote-working</span></span></a>`,
      },
    ],
  },
  {
    id: 'sp-quick-links',
    slug: 'quick-links',
    name: 'Quick links',
    category: 'Navigation and links',
    variants: [
      {
        id: 'compact',
        label: 'Compact',
        html: `<div class="sp-wp">${titleRow('Quick links')}<div class="sp-ql sp-ql--compact">${items('icon')}</div></div>`,
      },
      {
        id: 'filmstrip',
        label: 'Filmstrip',
        html: `<div class="sp-wp">${titleRow('Quick links')}<div class="sp-strip sp-ql--filmstrip" data-sp-strip>${stripControls()}<div class="sp-strip__track">${LINKS.map((_, i) => item(i, 'thumb', 'sp-ql__item sp-strip__item')).join('')}</div></div></div>`,
      },
      {
        id: 'grid',
        label: 'Grid',
        html: `<div class="sp-wp">${titleRow('Quick links')}<div class="sp-ql sp-ql--grid">${items('thumb')}</div></div>`,
      },
      {
        id: 'button',
        label: 'Button',
        html: `<div class="sp-wp">${titleRow('Quick links')}<div class="sp-ql sp-ql--button">${items('icon')}</div></div>`,
      },
      {
        id: 'list',
        label: 'List',
        html: `<div class="sp-wp">${titleRow('Quick links')}<div class="sp-ql sp-ql--list">${items('icon')}</div></div>`,
      },
      {
        id: 'tiles',
        label: 'Tiles',
        html: `<div class="sp-wp">${titleRow('Quick links')}<div class="sp-ql sp-ql--tiles">${items('icon')}</div></div>`,
      },
    ],
  },
];

function titleRow(title: string): string {
  return `<div class="sp-wp__head" data-optional="titleRow"><h2 class="sp-wp__title" data-edit="title">${title}</h2></div>`;
}
