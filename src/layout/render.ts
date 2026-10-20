import DOMPurify from 'dompurify';
import { DEMO_HTML } from '../catalogue/demo';
import type { DocNode } from '../store/types';

type Nodes = Record<string, DocNode>;

const esc = (s: string) => s.replace(/[^a-z0-9-]/gi, '');

/** Render a node tree to NSW markup. Output is sanitised before it reaches a frame. */
function renderNode(nodes: Nodes, id: string): string {
  const node = nodes[id];
  if (!node || node.hidden) return '';
  const kids = (node.children ?? []).map((c) => renderNode(nodes, c)).join('');
  switch (node.type) {
    case 'section': {
      const bg = esc(String(node.props?.background ?? 'white'));
      return `<section class="nsw-section nsw-section--${bg}" data-node="${node.id}">${kids}</section>`;
    }
    case 'container':
      return `<div class="nsw-container" data-node="${node.id}">${kids}</div>`;
    case 'grid':
      return `<div class="nsw-grid" data-node="${node.id}">${kids}</div>`;
    case 'column': {
      const span = Number(node.props?.span ?? 12) || 12;
      return `<div class="nsw-col nsw-col-${span}" data-node="${node.id}">${kids}</div>`;
    }
    case 'component': {
      const key = (node.componentId ?? '').replace(/^demo:/, '');
      return `<div data-node="${node.id}">${DEMO_HTML[key] ?? ''}</div>`;
    }
  }
}

export function renderFrameHtml(nodes: Nodes, root: string[]): string {
  const html = root.map((id) => renderNode(nodes, id)).join('');
  return DOMPurify.sanitize(html, { ADD_ATTR: ['data-node'] });
}
