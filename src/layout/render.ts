import DOMPurify from 'dompurify';
import type { DocNode, MockupDoc } from '../store/types';
import { renderComponent } from './component';
import { SECTION_BACKGROUNDS, SECTION_PADDINGS } from './sections';
import { columnClasses } from './spans';

type Nodes = Record<string, DocNode>;
type Images = MockupDoc['images'];

/** Layout nodes with nothing inside show a dashed hint in Edit mode only (see FRAME_CSS). */
const emptyHint = (node: DocNode, label: string) =>
  (node.children?.length ?? 0) === 0 ? ` data-empty="${label}"` : '';

/** Render a node tree to NSW markup. Output is sanitised before it reaches a frame. */
function renderNode(nodes: Nodes, images: Images, id: string): string {
  const node = nodes[id];
  if (!node || node.hidden) return '';
  const kids = (node.children ?? []).map((c) => renderNode(nodes, images, c)).join('');
  switch (node.type) {
    case 'section': {
      const bg =
        SECTION_BACKGROUNDS.find((b) => b.id === node.props?.background) ?? SECTION_BACKGROUNDS[0];
      const pad = SECTION_PADDINGS.find((p) => p.id === node.props?.padding)?.cls ?? '';
      const cls = [
        'nsw-section',
        `nsw-section--${bg.id}`,
        bg.invert ? 'nsw-section--invert' : '',
        pad,
      ]
        .filter(Boolean)
        .join(' ');
      return `<section class="${cls}" data-node="${node.id}"${emptyHint(node, 'Empty section')}>${kids}</section>`;
    }
    case 'container': {
      const flush = node.props?.flush === true ? ' nsw-container--flush' : '';
      return `<div class="nsw-container${flush}" data-node="${node.id}"${emptyHint(node, 'Empty container')}>${kids}</div>`;
    }
    case 'grid':
      return `<div class="nsw-grid" data-node="${node.id}"${emptyHint(node, 'Empty grid')}>${kids}</div>`;
    case 'column':
      return `<div class="${columnClasses(node.props)}" data-node="${node.id}"${emptyHint(node, 'Empty column')}>${kids}</div>`;
    case 'component':
      return `<div data-node="${node.id}">${renderComponent(node, images)}</div>`;
  }
}

export function renderFrameHtml(nodes: Nodes, root: string[], images: Images = {}): string {
  const html = root.map((id) => renderNode(nodes, images, id)).join('');
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
