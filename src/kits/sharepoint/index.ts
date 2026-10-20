import type { Catalogue } from '../../catalogue/types';
import data from './catalogue/generated/catalogue.json';
import { SP_LAYOUT_BLOCKS } from './blocks';
import { buildSharePointNotes } from './buildNotes';
import { SP_ICON_NAMES, spIcon } from './icons';
import { SP_CATEGORIES } from './categories';
import { chartMarkup, readChart } from './charts';
import { renderSpFrame, renderSpLayout } from './render';
import { SECTION_LAYOUTS } from './sections';
import { FRAME_SETTINGS, KIT_SETTINGS, SECTION_SETTINGS } from './settings';
import { spShell } from './shell';
import { defaultNav } from './site';
import { SP_TEMPLATES } from './templates';
import { SP_VERSION } from './version';
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
    sectionLayouts: SECTION_LAYOUTS,
  },
  labels: {
    names: { section: 'Section', column: 'Column' },
    empty: { section: 'Empty section', column: 'Empty column' },
  },
  renderLayout: renderSpLayout,
  renderFrame: renderSpFrame,
  layoutBlocks: SP_LAYOUT_BLOCKS,
  pageParts: [],
  enhanceComponent: (root, node) => {
    // A quick chart is drawn from the numbers in `props.chart`.
    if (node.componentId !== 'sp-quick-chart') return;
    const el = root.querySelector<HTMLElement>('[data-chart]');
    if (!el) return;
    const kind = el.getAttribute('data-chart') === 'pie' ? 'pie' : 'column';
    el.innerHTML = chartMarkup(kind, readChart(node.props?.chart));
  },
  buildNotes: { label: 'SharePoint build notes', build: buildSharePointNotes },
  icons: { render: (name) => spIcon(name), names: SP_ICON_NAMES },
  export: { cdn: null, init: 'window.SPK&&SPK.init()' },
  settings: {
    node: { section: SECTION_SETTINGS },
    frame: FRAME_SETTINGS,
    kit: KIT_SETTINGS,
  },
  frameDefaults: (settings) => ({ navItems: defaultNav(settings) }),
  templates: SP_TEMPLATES,
  templateGroups: ['Home pages', 'Pages'],
  samples: [],
  devices: ['iphone', 'android', 'tablet', 'desktop', 'custom'],
};
