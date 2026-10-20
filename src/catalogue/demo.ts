/**
 * Temporary Milestone 1 demo content, so frames have something real to render.
 * Replaced by the generated catalogue in Milestone 2. Markup uses NSW classes only.
 */
import type { DocNode } from '../store/types';

export const DEMO_HTML: Record<string, string> = {
  heading: '<h1>Service NSW demo page</h1>',
  paragraph: '<p>This is a real NSW Design System layout. Resize the frame to see it respond.</p>',
  longText:
    '<p>Mockups built here use the real NSW Design System, so spacing, type and responsive ' +
    'behaviour match a live site. Change the frame width to see how a layout adapts from a ' +
    'phone to a desktop screen, then add more content to see the frame grow past the fold line.</p>',
  buttons:
    '<p><button class="nsw-button nsw-button--dark">Brand dark</button> ' +
    '<button class="nsw-button nsw-button--dark-outline">Outline</button></p>',
  callout:
    '<div class="nsw-callout"><div class="nsw-callout__content"><h2 class="nsw-h4">Callout</h2>' +
    '<p>Use a callout to draw attention to important information.</p></div></div>',
  accordion:
    '<div class="nsw-accordion js-accordion-details">' +
    '<details class="nsw-accordion__item"><summary class="nsw-accordion__title">Click to open</summary>' +
    '<div class="nsw-accordion__content-wrap"><div class="nsw-accordion__content"><p>Accordion content.</p></div></div></details>' +
    '</div>',
};

/** A small tree: one off-white section with a container holding demo components. */
export function demoNodes(makeId: (prefix: string) => string): {
  nodes: Record<string, DocNode>;
  root: string[];
} {
  const keys = ['heading', 'paragraph', 'longText', 'buttons', 'callout', 'accordion'];
  const nodes: Record<string, DocNode> = {};
  const compIds = keys.map((key) => {
    const id = makeId('n');
    nodes[id] = { id, type: 'component', componentId: `demo:${key}` };
    return id;
  });
  const col = makeId('n');
  const grid = makeId('n');
  const container = makeId('n');
  const section = makeId('n');
  nodes[col] = { id: col, type: 'column', children: compIds };
  nodes[grid] = { id: grid, type: 'grid', props: { columns: [12] }, children: [col] };
  nodes[container] = { id: container, type: 'container', children: [grid] };
  nodes[section] = {
    id: section,
    type: 'section',
    props: { background: 'off-white' },
    children: [container],
  };
  return { nodes, root: [section] };
}
