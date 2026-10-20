import type { Catalogue } from '../../catalogue/types';
import data from './catalogue/generated/catalogue.json';
import { buildSpSection } from './blocks';
import { SP_CATEGORIES } from './categories';
import { renderSpLayout } from './render';
import { SP_VERSION } from './version';
import { spShell } from './shell';
import { BLUE_THEME, themeVars } from './theme';
import type { Kit } from '../types';

export const sharepointKit: Kit = {
  id: 'sharepoint',
  name: 'SharePoint (out of the box)',
  shortLabel: 'SharePoint',
  version: SP_VERSION,
  licence:
    'A SharePoint-style lookalike built on Fluent UI design tokens (MIT). No Microsoft logos or fonts are included; icons are Fluent System Icons (MIT).',
  fidelityNote:
    'SharePoint-style: a lookalike, not real SharePoint code. Only layouts and options SharePoint offers out of the box are shown.',
  shell: spShell,
  catalogue: data as Catalogue,
  categories: SP_CATEGORIES,
  layoutCategory: 'Sections',
  schema: {
    layers: ['section', 'column'],
    defaultProps: (type) => (type === 'section' ? { layout: 'one-column' } : undefined),
    maxChildren: { section: 3 },
  },
  labels: {
    names: { section: 'Section', column: 'Column' },
    empty: { section: 'Empty section', column: 'Empty column' },
  },
  renderLayout: renderSpLayout,
  renderFrame: (content) =>
    `<div class="sp-site" style="${themeVars(BLUE_THEME)}"><div class="sp-page">${content}</div></div>`,
  layoutBlocks: [
    {
      kind: 'section',
      columns: 1,
      label: 'One column',
      title: 'Add a one-column section',
      layer: 'section',
      icon: [{ x: 4, y: 6, width: 56, height: 28, fill: true }],
      build: (makeId) => buildSpSection(makeId, 1),
    },
  ],
  pageParts: [],
  export: { cdn: null, init: 'window.SPK&&SPK.init()' },
  settings: { node: {}, frame: [], kit: [] },
  templates: [],
  templateGroups: [],
  samples: [],
  devices: ['iphone', 'android', 'tablet', 'desktop', 'custom'],
};
