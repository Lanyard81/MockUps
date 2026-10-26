import type { ComponentSource } from '../../../../catalogue/types';

/** Headings, paragraphs, quotes, lists, dividers and badges. */
export const text: ComponentSource[] = [
  {
    id: 'sk-heading',
    slug: 'heading',
    name: 'Heading',
    category: 'Text',
    variants: [1, 2, 3, 4].map((n) => ({
      id: `h${n}`,
      label: `Heading ${n}`,
      html: `<h${n} class="sk-c sk-h sk-h--${n}" data-edit="text">Heading ${n}</h${n}>`,
    })),
  },
  {
    id: 'sk-paragraph',
    slug: 'paragraph',
    name: 'Paragraph',
    category: 'Text',
    variants: [
      {
        id: 'body',
        label: 'Body',
        html: `<p class="sk-c sk-p" data-edit="text" data-multiline>A short paragraph of text. Keep it to a couple of sentences so people can read it at a glance.</p>`,
      },
      {
        id: 'lead',
        label: 'Lead',
        html: `<p class="sk-c sk-p sk-p--lead" data-edit="text" data-multiline>A larger introduction that sets up the page and says what it is for.</p>`,
      },
      {
        id: 'small',
        label: 'Small print',
        html: `<p class="sk-c sk-p sk-p--small" data-edit="text" data-multiline>Smaller, quieter text for notes, captions and legal lines.</p>`,
      },
    ],
  },
  {
    id: 'sk-eyebrow',
    slug: 'eyebrow',
    name: 'Eyebrow',
    category: 'Text',
    variants: [
      {
        id: 'eyebrow',
        label: 'Eyebrow',
        html: `<span class="sk-c sk-eyebrow" data-edit="text">Section label</span>`,
      },
    ],
  },
  {
    id: 'sk-quote',
    slug: 'quote',
    name: 'Quote',
    category: 'Text',
    variants: [
      {
        id: 'quote',
        label: 'Quote',
        html: `<blockquote class="sk-c sk-quote"><span data-edit="text" data-multiline>Simple tools make it easier to get the idea across.</span><cite data-optional="source" data-edit="source">Alex Taylor, Designer</cite></blockquote>`,
      },
    ],
  },
  {
    id: 'sk-list',
    slug: 'list',
    name: 'List',
    category: 'Text',
    variants: [
      {
        id: 'bullets',
        label: 'Bullets',
        html: `<ul class="sk-c sk-list">${[1, 2, 3].map((n) => `<li data-edit="item${n}">List item ${n}</li>`).join('')}</ul>`,
      },
      {
        id: 'numbers',
        label: 'Numbers',
        html: `<ol class="sk-c sk-list">${[1, 2, 3].map((n) => `<li data-edit="item${n}">Step ${n}</li>`).join('')}</ol>`,
      },
      {
        id: 'checks',
        label: 'Ticks',
        html: `<ul class="sk-c sk-list sk-list--check">${['Easy to start', 'Nothing to install', 'Works anywhere'].map((t, i) => `<li data-edit="item${i + 1}">${t}</li>`).join('')}</ul>`,
      },
    ],
  },
  {
    id: 'sk-badge',
    slug: 'badge',
    name: 'Badge',
    category: 'Text',
    variants: [
      ['neutral', 'Neutral', '', 'Draft'],
      ['accent', 'Accent', ' sk-badge--accent', 'New'],
      ['success', 'Success', ' sk-badge--success', 'Approved'],
      ['warning', 'Warning', ' sk-badge--warning', 'Pending'],
      ['danger', 'Danger', ' sk-badge--danger', 'Overdue'],
    ].map(([id, label, cls, t]) => ({
      id: id!,
      label: label!,
      html: `<span class="sk-c sk-badge${cls}" data-edit="text">${t}</span>`,
    })),
  },
  {
    id: 'sk-divider',
    slug: 'divider',
    name: 'Divider and space',
    category: 'Text',
    variants: [
      { id: 'line', label: 'Line', html: `<hr class="sk-c sk-divider">` },
      {
        id: 'space-small',
        label: 'Small space',
        html: `<span class="sk-c sk-spacer sk-spacer--small"></span>`,
      },
      { id: 'space', label: 'Space', html: `<span class="sk-c sk-spacer"></span>` },
      {
        id: 'space-large',
        label: 'Large space',
        html: `<span class="sk-c sk-spacer sk-spacer--large"></span>`,
      },
    ],
  },
];
