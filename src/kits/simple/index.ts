import type { Catalogue } from '../../catalogue/types';
import data from './catalogue/generated/catalogue.json';
import { SIMPLE_LAYOUT_BLOCKS } from './blocks';
import { SIMPLE_CATEGORIES } from './categories';
import { simplePageSpec } from './pageSpec';
import { renderFrame, renderLayout } from './render';
import { SECTION_LAYOUTS } from './sections';
import { FRAME_SETTINGS, KIT_SETTINGS, SECTION_SETTINGS } from './settings';
import { simpleShell } from './shell';
import { SIMPLE_TEMPLATES } from './templates';
import { SIMPLE_VERSION } from './version';
import type { Kit } from '../types';

export const simpleKit: Kit = {
  id: 'simple',
  name: 'Simple (generic)',
  shortLabel: 'Simple',
  version: SIMPLE_VERSION,
  licence: 'Original to this app, free to use. System fonts only; no logos or brand assets.',
  fidelityNote:
    'Simple: a neutral, brand-free set of everyday parts for quick ideas, wireframes and layouts.',
  shell: simpleShell,
  catalogue: data as Catalogue,
  categories: SIMPLE_CATEGORIES,
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
  renderLayout,
  renderFrame,
  layoutBlocks: SIMPLE_LAYOUT_BLOCKS,
  pageParts: [
    {
      id: 'header',
      label: 'Add header bar',
      title: 'A header bar with a name and links, at the top',
      position: 'top',
      components: [['sk-navbar', 'simple']],
    },
    {
      id: 'footer',
      label: 'Add footer',
      title: 'A simple footer, at the bottom',
      position: 'bottom',
      components: [['sk-footer', 'simple']],
    },
  ],
  export: { cdn: null, init: '' },
  settings: {
    node: { section: SECTION_SETTINGS },
    frame: FRAME_SETTINGS,
    kit: KIT_SETTINGS,
  },
  pageSpec: simplePageSpec,
  templates: SIMPLE_TEMPLATES,
  templateGroups: ['Pages', 'Phone'],
  samples: [],
  devices: ['iphone', 'android', 'tablet', 'desktop', 'custom'],
};
