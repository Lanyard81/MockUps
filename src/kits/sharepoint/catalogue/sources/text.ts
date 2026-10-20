import type { ComponentSource } from '../../../../catalogue/types';

/** The Text web part: formatted text. */
export const text: ComponentSource[] = [
  {
    id: 'sp-text',
    slug: 'text',
    name: 'Text',
    category: 'Text and media',
    variants: [
      {
        id: 'paragraph',
        label: 'Paragraph',
        html: `<div class="sp-text"><p data-edit="text" data-multiline>Add your text here. Type a few words, then use the toolbar to format them.</p></div>`,
      },
    ],
  },
];
