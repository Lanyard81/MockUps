import type { ComponentSource } from '../../../../catalogue/types';

/** Buttons and links. */
export const actions: ComponentSource[] = [
  {
    id: 'sk-button',
    slug: 'button',
    name: 'Button',
    category: 'Actions',
    variants: [
      ['primary', 'Primary', ''],
      ['secondary', 'Secondary', ' sk-button--secondary'],
      ['outline', 'Outline', ' sk-button--outline'],
      ['text', 'Text', ' sk-button--text'],
    ].map(([id, label, cls]) => ({
      id: id!,
      label: label!,
      html: `<button class="sk-c sk-button${cls}" data-edit="label">Button</button>`,
    })),
  },
  {
    id: 'sk-buttons',
    slug: 'button-group',
    name: 'Button pair',
    category: 'Actions',
    variants: [
      {
        id: 'pair',
        label: 'Primary and secondary',
        html: `<div class="sk-c sk-buttons"><button class="sk-button" data-edit="primary">Get started</button><button class="sk-button sk-button--secondary" data-edit="secondary">Learn more</button></div>`,
      },
      {
        id: 'outline',
        label: 'Primary and outline',
        html: `<div class="sk-c sk-buttons"><button class="sk-button" data-edit="primary">Get started</button><button class="sk-button sk-button--outline" data-edit="secondary">Contact us</button></div>`,
      },
    ],
  },
  {
    id: 'sk-link',
    slug: 'link',
    name: 'Link',
    category: 'Actions',
    variants: [
      {
        id: 'link',
        label: 'Link',
        html: `<a class="sk-c sk-link" href="#" data-edit="label">A link to somewhere →</a>`,
      },
    ],
  },
];
