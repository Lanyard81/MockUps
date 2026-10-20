import type { ComponentSource } from '../../../../catalogue/types';
import { spIcon } from './helpers';

const FILES = [
  ['Annual report 2026.docx', 'word', 'W', 'Today at 9:41 am', 'Priya Nair'],
  ['Budget forecast.xlsx', 'excel', 'X', 'Yesterday', 'Sam Okafor'],
  ['All-hands slides.pptx', 'powerpoint', 'P', '14 Oct', 'Alex Taylor'],
  ['Travel policy.pdf', 'pdf', 'PDF', '9 Oct', 'Mei Lin'],
  ['Templates', 'folder', '', '2 Oct', 'Jordan Blake'],
  ['Meeting notes.docx', 'word', 'W', '28 Sep', 'Chris Moreau'],
] as const;

const command = (icon: string, label: string, primary = false) =>
  `<span class="sp-command${primary ? ' sp-command--primary' : ''}">${spIcon(icon, '', 16)}<span data-edit="cmd-${label.toLowerCase().replace(/\W+/g, '-')}">${label}</span></span>`;

const fileRow = (i: number) => {
  const [name, kind, glyph, when, who] = FILES[i]!;
  return (
    `<tr${i > 3 ? ` data-optional="row${i + 1}"` : ''}><td><span class="sp-grid__name"><span class="sp-filetype sp-filetype--${kind}" aria-hidden="true">${glyph || spIcon('folder', '', 12)}</span>` +
    `<span data-edit="name${i + 1}">${name}</span></span></td><td data-edit="modified${i + 1}">${when}</td><td data-edit="by${i + 1}">${who}</td></tr>`
  );
};

const ITEMS = [
  ['Update the staff directory', 'In progress', 'Mei Lin', '24 Oct'],
  ['Review the leave policy', 'Not started', 'Priya Nair', '31 Oct'],
  ['Plan the open day', 'In progress', 'Jordan Blake', '7 Nov'],
  ['Refresh the brand guidelines', 'Completed', 'Alex Taylor', '14 Oct'],
  ['Migrate the shared drive', 'Not started', 'Sam Okafor', '21 Nov'],
] as const;

const itemRow = (i: number) => {
  const [title, status, owner, due] = ITEMS[i]!;
  return (
    `<tr${i > 3 ? ` data-optional="row${i + 1}"` : ''}><td data-edit="title${i + 1}">${title}</td><td data-edit="status${i + 1}">${status}</td>` +
    `<td data-edit="owner${i + 1}">${owner}</td><td data-edit="due${i + 1}">${due}</td></tr>`
  );
};

/** Document library and List: static views of the data, with editable rows. */
export const data: ComponentSource[] = [
  {
    id: 'sp-document-library',
    slug: 'document-library',
    name: 'Document library',
    category: 'Data',
    note: 'A static view: SharePoint shows a live library.',
    fidelity: 'static',
    variants: [
      {
        id: 'library',
        label: 'Document library',
        html:
          `<div class="sp-wp sp-doclib"><div class="sp-wp__head" data-optional="titleRow"><h2 class="sp-wp__title" data-edit="title">Documents</h2></div>` +
          `<div class="sp-command-bar" data-optional="commandBar">${command('add', 'New', true)}${command('arrow_upload', 'Upload')}${command('share', 'Share')}${command('link', 'Copy link')}${command('arrow_download', 'Download')}<span class="sp-command-bar__spacer"></span>${command('filter', 'Filter')}</div>` +
          `<table class="sp-grid"><thead><tr><th>Name</th><th>Modified</th><th>Modified by</th></tr></thead><tbody>${FILES.map((_, i) => fileRow(i)).join('')}</tbody></table></div>`,
      },
    ],
  },
  {
    id: 'sp-list',
    slug: 'list',
    name: 'List',
    category: 'Data',
    note: 'A static view: SharePoint shows a live list.',
    fidelity: 'static',
    variants: [
      {
        id: 'list',
        label: 'List',
        html:
          `<div class="sp-wp sp-listview"><div class="sp-wp__head" data-optional="titleRow"><h2 class="sp-wp__title" data-edit="title">Project tasks</h2></div>` +
          `<div class="sp-command-bar" data-optional="commandBar">${command('add', 'New item', true)}${command('edit', 'Edit in grid view')}${command('share', 'Share')}<span class="sp-command-bar__spacer"></span>${command('filter', 'Filter')}</div>` +
          `<table class="sp-grid"><thead><tr><th>Title</th><th>Status</th><th>Owner</th><th>Due</th></tr></thead><tbody>${ITEMS.map((_, i) => itemRow(i)).join('')}</tbody></table></div>`,
      },
    ],
  },
];
