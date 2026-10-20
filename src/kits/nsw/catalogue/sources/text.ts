import type { ComponentSource } from '../../../../catalogue/types';

/**
 * Basic typography. These are plain HTML elements styled by the NSW base styles, not named
 * components in the design system, but a mockup can't be built without them.
 */
export const text: ComponentSource[] = [
  {
    id: 'heading',
    slug: 'typography',
    name: 'Heading',
    category: 'Content',
    variants: [1, 2, 3, 4].map((n) => ({
      id: `h${n}`,
      label: `Heading ${n}`,
      html: `<h${n} data-edit="text">Heading ${n}</h${n}>`,
    })),
  },
  {
    id: 'paragraph',
    slug: 'typography',
    name: 'Paragraph',
    category: 'Content',
    variants: [
      {
        id: 'default',
        label: 'Body text',
        html: `<p data-edit="text" data-multiline>Body text for your page. Use plain, direct language that is easy to scan.</p>`,
      },
      {
        id: 'intro',
        label: 'Intro text',
        html: `<p class="nsw-intro" data-edit="text" data-multiline>An introduction that sets the scene for the content below.</p>`,
      },
    ],
  },
  {
    id: 'list',
    slug: 'typography',
    name: 'List',
    category: 'Content',
    variants: [
      {
        id: 'bullet',
        label: 'Bulleted',
        html: `<ul>${[1, 2, 3].map((n) => `<li data-edit="item${n}">List item ${n}</li>`).join('')}</ul>`,
      },
      {
        id: 'number',
        label: 'Numbered',
        html: `<ol>${[1, 2, 3].map((n) => `<li data-edit="item${n}">List item ${n}</li>`).join('')}</ol>`,
      },
    ],
  },
];
