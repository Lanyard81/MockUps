import type { DocNode } from '../../store/types';

const emptyHint = (node: DocNode, label: string) =>
  (node.children?.length ?? 0) === 0 ? ` data-empty="${label}"` : '';

/** Markup for a SharePoint section or column, around its children's markup. */
export function renderSpLayout(node: DocNode, kids: string): string {
  switch (node.type) {
    case 'section':
      return `<div class="sp-section" data-node="${node.id}"${emptyHint(node, 'Empty section')}><div class="sp-section__inner">${kids}</div></div>`;
    case 'column':
      return `<div class="sp-column" data-node="${node.id}"${emptyHint(node, 'Empty column')}>${kids}</div>`;
    default:
      return kids;
  }
}
