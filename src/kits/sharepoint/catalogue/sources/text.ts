import type { ComponentSource } from '../../../../catalogue/types';

/** The Text web part, Divider and Spacer. */
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
        html: `<div class="sp-text"><p data-edit="text" data-multiline>Add your text here. Type a few words, then use the toolbar to format them. You can add headings, lists, quotes and tables.</p></div>`,
      },
      ...[1, 2, 3, 4].map((n) => ({
        id: `heading-${n}`,
        label: `Heading ${n}`,
        html: `<div class="sp-text"><h${n} data-edit="text">Heading ${n}</h${n}></div>`,
      })),
      {
        id: 'quote',
        label: 'Pull quote',
        html: `<div class="sp-text"><blockquote class="sp-quote"><span data-edit="text" data-multiline>Good ideas come from the people closest to the work.</span><cite data-optional="source" data-edit="source">Alex Taylor, Communications lead</cite></blockquote></div>`,
      },
      {
        id: 'bullets',
        label: 'Bulleted list',
        html: `<div class="sp-text"><ul>${[1, 2, 3].map((n) => `<li data-edit="item${n}">List item ${n}</li>`).join('')}</ul></div>`,
      },
      {
        id: 'numbers',
        label: 'Numbered list',
        html: `<div class="sp-text"><ol>${[1, 2, 3].map((n) => `<li data-edit="item${n}">Step ${n}</li>`).join('')}</ol></div>`,
      },
      {
        id: 'table',
        label: 'Table',
        html:
          `<div class="sp-text"><table class="sp-table"><thead><tr>${['Name', 'Team', 'Start date'].map((h, i) => `<th data-edit="head${i + 1}">${h}</th>`).join('')}</tr></thead><tbody>` +
          [
            ['Priya Nair', 'Finance', '3 Nov'],
            ['Sam Okafor', 'Technology', '10 Nov'],
            ['Mei Lin', 'People', '17 Nov'],
          ]
            .map(
              (r, i) =>
                `<tr>${r.map((c, j) => `<td data-edit="cell${i + 1}${j + 1}">${c}</td>`).join('')}</tr>`,
            )
            .join('') +
          `</tbody></table></div>`,
      },
    ],
  },
  {
    id: 'sp-divider',
    slug: 'divider',
    name: 'Divider',
    category: 'Text and media',
    variants: [{ id: 'line', label: 'Divider', html: `<hr class="sp-divider">` }],
  },
  {
    id: 'sp-spacer',
    slug: 'spacer',
    name: 'Spacer',
    category: 'Text and media',
    variants: [
      { id: 'space', label: 'Spacer', html: `<div class="sp-spacer" aria-hidden="true"></div>` },
    ],
  },
];
