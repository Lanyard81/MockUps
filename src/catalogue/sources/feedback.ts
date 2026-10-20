import type { ComponentSource } from '../types';
import { icon } from './helpers';

const alertIcons: Record<string, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'cancel',
};

export const feedback: ComponentSource[] = [
  {
    id: 'global-alert',
    slug: 'global-alert',
    name: 'Global alert',
    category: 'Feedback',
    fullWidth: true,
    needsJs: true,
    variants: [
      ['default', 'Default', ''],
      ['light', 'Light', ' nsw-global-alert--light'],
      ['critical', 'Critical', ' nsw-global-alert--critical'],
    ].map(([id, label, mod]) => ({
      id: id as string,
      label: label as string,
      html:
        `<div class="nsw-global-alert${mod}"><div class="nsw-global-alert__wrapper"><div class="nsw-global-alert__content">` +
        `<div class="nsw-global-alert__title" data-edit="title">Alert title</div><p data-edit="copy" data-multiline>A short message that applies to the whole site.</p>` +
        `<button class="nsw-button nsw-button--white" type="button" data-optional="button" data-edit="button">Find out more</button></div>` +
        `<button class="nsw-icon-button js-close-alert" type="button">${icon('close')}<span class="sr-only">Close</span></button></div></div>`,
    })),
  },
  {
    id: 'in-page-alert',
    slug: 'in-page-alert',
    name: 'In-page alert',
    category: 'Feedback',
    variants: Object.entries(alertIcons).flatMap(([kind, ic]) => [
      {
        id: kind,
        label: kind[0]!.toUpperCase() + kind.slice(1),
        html:
          `<div class="nsw-in-page-alert nsw-in-page-alert--${kind}">${icon(ic, 'nsw-in-page-alert__icon')}` +
          `<div class="nsw-in-page-alert__content"><h2 class="nsw-h4" data-edit="title">Alert title</h2><p data-edit="copy" data-multiline>A short message about this part of the page.</p></div></div>`,
      },
    ]),
  },
  {
    id: 'dialog',
    slug: 'dialog',
    name: 'Dialog',
    category: 'Feedback',
    fidelity: 'static',
    note: 'The dialog box is shown inline. The dark backdrop and open/close behaviour are not shown.',
    variants: [
      {
        id: 'default',
        label: 'Two actions',
        html:
          `<div class="nsw-dialog__wrapper" role="dialog" aria-modal="false" aria-labelledby="dlg-title"><div class="nsw-dialog__top"><h2 class="nsw-dialog__title" id="dlg-title" data-edit="title">Dialog title</h2>` +
          `<button class="nsw-icon-button nsw-dialog__close" type="button">${icon('close')}<span class="sr-only">Close</span></button></div>` +
          `<div class="nsw-dialog__content"><p data-edit="copy" data-multiline>Explain what the person is being asked to confirm.</p></div>` +
          `<div class="nsw-dialog__bottom"><button class="nsw-button nsw-button--dark" type="button" data-edit="confirm">Confirm</button><button class="nsw-button nsw-button--dark-outline-solid" type="button" data-edit="cancel">Cancel</button></div></div>`,
      },
    ],
  },
  {
    id: 'cookie-consent',
    slug: 'cookie-consent',
    name: 'Cookie consent',
    category: 'Feedback',
    fullWidth: true,
    fidelity: 'static',
    note: 'Shown as the banner only. The preferences dialog is not shown.',
    variants: [
      {
        id: 'default',
        label: 'Banner',
        html:
          `<div class="nsw-cookie-banner"><div class="nsw-cookie-banner__wrapper"><div class="nsw-cookie-banner__content"><div class="nsw-cookie-banner__title" data-edit="title">We use cookies</div>` +
          `<p data-edit="copy" data-multiline>We use cookies to improve your experience on this site.</p></div>` +
          `<div class="nsw-cookie-banner__buttons-container"><div class="nsw-cookie-banner__cta-group"><button class="nsw-button nsw-button--dark" type="button" data-edit="accept">Accept all</button>` +
          `<button class="nsw-button nsw-button--dark-outline-solid" type="button" data-edit="manage">Manage cookies</button></div></div></div></div>`,
      },
      {
        id: 'light',
        label: 'Banner (light)',
        html:
          `<div class="nsw-cookie-banner nsw-cookie-banner--light"><div class="nsw-cookie-banner__wrapper"><div class="nsw-cookie-banner__content"><div class="nsw-cookie-banner__title" data-edit="title">We use cookies</div>` +
          `<p data-edit="copy" data-multiline>We use cookies to improve your experience on this site.</p></div>` +
          `<div class="nsw-cookie-banner__buttons-container"><div class="nsw-cookie-banner__cta-group"><button class="nsw-button nsw-button--dark" type="button" data-edit="accept">Accept all</button>` +
          `<button class="nsw-button nsw-button--dark-outline-solid" type="button" data-edit="manage">Manage cookies</button></div></div></div></div>`,
      },
    ],
  },
  {
    id: 'loader',
    slug: 'loader',
    name: 'Loader',
    category: 'Feedback',
    variants: ['sm', 'md', 'lg'].map((size) => ({
      id: size,
      label: { sm: 'Small', md: 'Medium', lg: 'Large' }[size]!,
      html: `<div class="nsw-loader" role="status"><div class="nsw-loader__circle nsw-loader__circle--${size}"></div><span class="nsw-loader__label" data-edit="label">Loading</span></div>`,
    })),
  },
  {
    id: 'progress-indicator',
    slug: 'progress-indicator',
    name: 'Progress indicator',
    category: 'Feedback',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-progress-indicator"><div class="nsw-progress-indicator__count" data-edit="count">Step 2 of 4</div>` +
          `<div class="nsw-progress-indicator__bar"><div class="active"></div><div class="active"></div><div></div><div></div></div></div>`,
      },
    ],
  },
  {
    id: 'popover',
    slug: 'popover',
    name: 'Popover',
    category: 'Feedback',
    needsJs: true,
    fidelity: 'partial',
    note: 'The trigger button opens the popover in Preview mode.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="js-popover" data-popover-id="popover-demo" data-popover-position="bottom"><button class="nsw-button nsw-button--dark-outline-solid" type="button" data-anchor data-edit="trigger">Open popover</button></div>` +
          `<div class="nsw-popover" id="popover-demo" role="dialog"><p data-edit="copy" data-multiline>Popover content goes here.</p></div>`,
      },
    ],
  },
  {
    id: 'tooltip',
    slug: 'tooltip',
    name: 'Tooltip',
    category: 'Feedback',
    needsJs: true,
    variants: [
      {
        id: 'default',
        label: 'Tooltip',
        html: `<p><span class="js-tooltip" data-tooltip-content="Tooltip text" tabindex="0"><span data-edit="label">Hover or focus me</span></span></p>`,
      },
    ],
  },
  {
    id: 'quick-exit',
    slug: 'quick-exit',
    name: 'Quick exit',
    category: 'Feedback',
    fullWidth: true,
    fidelity: 'static',
    note: 'The real component sticks to the top of the screen and listens for the Esc key. Shown here as the static bar, without the Esc-key hint.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html: `<div class="nsw-quick-exit"><div class="nsw-quick-exit__content"><span class="nsw-quick-exit__exit-text" data-edit="label">Exit now</span></div></div>`,
      },
    ],
  },
];
