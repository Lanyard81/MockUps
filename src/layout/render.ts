import DOMPurify from 'dompurify';
import type { DocNode, MockupDoc } from '../store/types';
import { getKit } from '../kits';
import type { Kit } from '../kits/types';
import { renderComponent } from './component';

type Nodes = Record<string, DocNode>;
type Images = MockupDoc['images'];

/** Render a node tree to the kit's markup. Output is sanitised before it reaches a frame. */
function renderNode(nodes: Nodes, images: Images, id: string, kit: Kit): string {
  const node = nodes[id];
  if (!node || node.hidden) return '';
  if (node.type === 'component')
    return `<div data-node="${node.id}">${renderComponent(node, images)}</div>`;
  const kids = (node.children ?? []).map((c) => renderNode(nodes, images, c, kit)).join('');
  return kit.renderLayout(node, kids);
}

/** What survives sanitising: our own editor markers and the data attributes the NSW script reads. */
const SANITISE = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: [
    'data-node',
    'data-empty',
    'data-edit',
    'data-optional',
    'data-image',
    'data-multiline',
    'data-goto',
    'data-tooltip-content',
    'data-popover-id',
    'data-popover-position',
    'data-anchor',
    'focusable',
    'allowfullscreen',
  ],
};

export function renderFrameHtml(
  nodes: Nodes,
  root: string[],
  images: Images = {},
  kitId?: string,
  frameSettings: Record<string, unknown> = {},
): string {
  const kit = getKit(kitId);
  const content = root.map((id) => renderNode(nodes, images, id, kit)).join('');
  const html = kit.renderFrame ? kit.renderFrame(content, frameSettings) : content;
  return DOMPurify.sanitize(html, SANITISE);
}

/** Markup for one node and everything inside it (for "Copy HTML"). */
export function renderNodeHtml(
  nodes: Nodes,
  id: string,
  images: Images = {},
  kitId?: string,
): string {
  return DOMPurify.sanitize(renderNode(nodes, images, id, getKit(kitId)), SANITISE);
}
