import DOMPurify from 'dompurify';
import type { DocNode, Frame, MockupDoc } from '../store/types';
import { getKit } from '../kits';
import type { Kit, RenderContext } from '../kits/types';
import { renderComponent } from './component';

type Nodes = Record<string, DocNode>;
type Images = MockupDoc['images'];

/** Render a node tree to the kit's markup. Output is sanitised before it reaches a frame. */
function renderNode(
  nodes: Nodes,
  images: Images,
  id: string,
  kit: Kit,
  ctx: RenderContext,
): string {
  const node = nodes[id];
  if (!node || node.hidden) return '';
  if (node.type === 'component')
    return `<div data-node="${node.id}">${renderComponent(node, images)}</div>`;
  const kids = (node.children ?? []).map((c) => renderNode(nodes, images, c, kit, ctx)).join('');
  return kit.renderLayout(node, kids, ctx);
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

export interface RenderOptions {
  /** The frame's kit (NSW when missing). */
  kitId?: string;
  /** The frame's kit settings. */
  settings?: Record<string, unknown>;
  /** The document-wide settings of the frame's kit. */
  kitSettings?: Record<string, unknown>;
}

const NO_SETTINGS: Record<string, unknown> = {};

/** Render a frame's content (and the kit's page chrome around it) to sanitised markup. */
export function renderFrameHtml(
  nodes: Nodes,
  root: string[],
  images: Images = {},
  options: RenderOptions = {},
): string {
  const kit = getKit(options.kitId);
  const ctx: RenderContext = {
    images,
    settings: options.settings ?? NO_SETTINGS,
    kitSettings: options.kitSettings ?? NO_SETTINGS,
  };
  const children = root
    .map((id) => ({ node: nodes[id], html: renderNode(nodes, images, id, kit, ctx) }))
    .filter((c): c is { node: DocNode; html: string } => !!c.node);
  const html = kit.renderFrame
    ? kit.renderFrame(children, ctx)
    : children.map((c) => c.html).join('');
  return DOMPurify.sanitize(html, SANITISE);
}

/** Render one frame of a document. */
export function renderFrameOf(
  doc: Pick<MockupDoc, 'nodes' | 'images' | 'kitSettings'>,
  frame: Pick<Frame, 'root' | 'kitId' | 'settings'>,
): string {
  return renderFrameHtml(doc.nodes, frame.root, doc.images, {
    kitId: frame.kitId,
    settings: frame.settings,
    kitSettings: doc.kitSettings[getKit(frame.kitId).id],
  });
}

/** Markup for one node and everything inside it (for "Copy HTML"). */
export function renderNodeHtml(
  nodes: Nodes,
  id: string,
  images: Images = {},
  options: RenderOptions = {},
): string {
  const kit = getKit(options.kitId);
  const ctx: RenderContext = {
    images,
    settings: options.settings ?? NO_SETTINGS,
    kitSettings: options.kitSettings ?? NO_SETTINGS,
  };
  return DOMPurify.sanitize(renderNode(nodes, images, id, kit, ctx), SANITISE);
}
