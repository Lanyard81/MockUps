import DOMPurify from 'dompurify';
import { getVariant } from '../catalogue';
import type { DocNode } from '../store/types';

type Nodes = Record<string, DocNode>;

const token = (s: string) => s.replace(/[^a-z0-9-]/gi, '');

/** Column classes: full width on small screens, `span` of 12 from the md breakpoint up. */
function columnClass(node: DocNode): string {
  const span = Math.min(12, Math.max(1, Number(node.props?.span ?? 12) || 12));
  return span === 12 ? 'nsw-col nsw-col-12' : `nsw-col nsw-col-12 nsw-col-md-${span}`;
}

/** Layout nodes with nothing inside show a dashed hint in Edit mode only (see FRAME_CSS). */
const emptyHint = (node: DocNode, label: string) =>
  (node.children?.length ?? 0) === 0 ? ` data-empty="${label}"` : '';

/** Render a node tree to NSW markup. Output is sanitised before it reaches a frame. */
function renderNode(nodes: Nodes, id: string): string {
  const node = nodes[id];
  if (!node || node.hidden) return '';
  const kids = (node.children ?? []).map((c) => renderNode(nodes, c)).join('');
  switch (node.type) {
    case 'section': {
      const bg = token(String(node.props?.background ?? 'white'));
      const invert = ['brand-dark', 'black', 'brand-supplementary'].includes(bg)
        ? ' nsw-section--invert'
        : '';
      return `<section class="nsw-section nsw-section--${bg}${invert}" data-node="${node.id}"${emptyHint(node, 'Empty section')}>${kids}</section>`;
    }
    case 'container':
      return `<div class="nsw-container" data-node="${node.id}"${emptyHint(node, 'Empty container')}>${kids}</div>`;
    case 'grid':
      return `<div class="nsw-grid" data-node="${node.id}"${emptyHint(node, 'Empty grid')}>${kids}</div>`;
    case 'column':
      return `<div class="${columnClass(node)}" data-node="${node.id}"${emptyHint(node, 'Empty column')}>${kids}</div>`;
    case 'component': {
      const variant = node.componentId ? getVariant(node.componentId, node.variant) : undefined;
      const html = variant?.html ?? `<p>Unknown component “${token(node.componentId ?? '')}”</p>`;
      return `<div data-node="${node.id}">${html}</div>`;
    }
  }
}

export function renderFrameHtml(nodes: Nodes, root: string[]): string {
  const html = root.map((id) => renderNode(nodes, id)).join('');
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: [
      'data-node',
      'data-empty',
      'data-edit',
      'data-optional',
      'data-image',
      'data-multiline',
      'data-tooltip-content',
      'data-popover-id',
      'data-popover-position',
      'data-anchor',
      'focusable',
      'allowfullscreen',
    ],
  });
}
