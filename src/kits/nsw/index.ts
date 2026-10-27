import type { Catalogue } from '../../catalogue/types';
import nswPkg from 'nsw-design-system/package.json';
import data from './catalogue/generated/catalogue.json';
import { buildContainer, buildGrid, buildSection } from './blocks';
import { NSW_CATEGORIES } from './categories';
import { sharePointToNsw } from './convertFromSharePoint';
import { renderNswLayout } from './render';
import { SECTION_BACKGROUNDS, SECTION_PADDINGS } from './sections';
import { nswShell } from './shell';
import { SAMPLES, buildSample } from './samples';
import { nswPageSpec } from './pageSpec';
import { NSW_TEMPLATES } from './templates';
import type { Kit, LayoutBlock } from '../types';

const GRID_ICONS: Record<number, number[]> = { 1: [12], 2: [6, 6], 3: [4, 4, 4], 4: [3, 3, 3, 3] };

const gridIcon = (n: number): LayoutBlock['icon'] => {
  const spans = GRID_ICONS[n]!;
  const total = 56 - (spans.length - 1) * 4;
  return spans.map((span, i) => ({
    x: 4 + spans.slice(0, i).reduce((acc, sp) => acc + (total * sp) / 12 + 4, 0),
    y: 6,
    width: (total * span) / 12,
    height: 28,
    fill: true,
  }));
};

const layoutBlocks: LayoutBlock[] = [
  {
    kind: 'section',
    label: 'Section',
    title: 'Add a full-width section',
    layer: 'section',
    icon: [
      { x: 2, y: 6, width: 60, height: 28 },
      { x: 12, y: 14, width: 40, height: 12, fill: true },
    ],
    build: (makeId) => buildSection(makeId),
  },
  {
    kind: 'container',
    label: 'Container',
    title: 'Add a container (nsw-container)',
    layer: 'container',
    icon: [
      { x: 14, y: 4, width: 36, height: 32 },
      { x: 20, y: 12, width: 24, height: 6, fill: true },
    ],
    build: (makeId) => buildContainer(makeId),
  },
  ...[1, 2, 3, 4].map((n): LayoutBlock => ({
    kind: 'grid',
    columns: n,
    label: `${n} column${n > 1 ? 's' : ''}`,
    title: `Add a grid with ${n} column${n > 1 ? 's' : ''}`,
    layer: 'grid',
    icon: gridIcon(n),
    build: (makeId) => buildGrid(makeId, n),
  })),
];

export const nswKit: Kit = {
  id: 'nsw',
  name: 'NSW Design System',
  shortLabel: 'NSW',
  version: nswPkg.version,
  licence: 'NSW Design System: MIT. Components are the official markup and styles.',
  shell: nswShell,
  catalogue: data as Catalogue,
  categories: NSW_CATEGORIES,
  layoutCategory: 'Layout',
  schema: {
    layers: ['section', 'container', 'grid', 'column'],
    defaultProps: (type) => {
      if (type === 'section') return { background: 'white' };
      if (type === 'column') return { spans: { base: 12, md: 12 } };
      return undefined;
    },
    maxChildren: { grid: 6 },
  },
  labels: {
    names: { section: 'Section', container: 'Container', grid: 'Grid', column: 'Column' },
    empty: {
      section: 'Empty section',
      container: 'Empty container',
      grid: 'Empty grid',
      column: 'Empty column',
    },
  },
  renderLayout: renderNswLayout,
  previewOnDark: (html) =>
    `<div class="nsw-section nsw-section--brand-dark nsw-section--invert" style="padding:16px 12px">${html}</div>`,
  layoutBlocks,
  pageParts: [
    {
      id: 'top',
      label: 'Add masthead + header',
      title: 'Adds the NSW masthead and header at the top of the page',
      position: 'top',
      components: [
        ['masthead', 'dark'],
        ['header', 'default'],
      ],
    },
    {
      id: 'footer',
      label: 'Add footer',
      title: 'Adds the NSW footer at the bottom of the page',
      position: 'bottom',
      components: [['footer', 'dark']],
    },
  ],
  export: {
    cdn: {
      head: [
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">',
        `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nsw-design-system@${nswPkg.version}/dist/css/main.css">`,
      ].join('\n'),
      foot: `<script src="https://cdn.jsdelivr.net/npm/nsw-design-system@${nswPkg.version}/dist/js/main.js"></script>`,
    },
    init: 'window.NSW.initSite()',
  },
  conversions: [sharePointToNsw],
  settings: {
    node: {
      section: [
        {
          type: 'swatches',
          key: 'background',
          label: 'Section background',
          group: 'Background',
          hint: 'NSW section backgrounds. Text colours adjust on dark backgrounds.',
          default: 'white',
          keepDefault: true,
          options: SECTION_BACKGROUNDS,
        },
        {
          type: 'segmented',
          key: 'padding',
          label: 'Section padding',
          group: 'Padding',
          default: 'default',
          options: SECTION_PADDINGS,
        },
      ],
      container: [
        {
          type: 'toggle',
          key: 'flush',
          label: 'Edge to edge (no side padding)',
          group: 'Container',
          default: false,
        },
      ],
    },
    frame: [],
    kit: [],
  },
  pageSpec: nswPageSpec,
  templates: NSW_TEMPLATES,
  templateGroups: [
    'Homepage',
    'Content',
    'Search',
    'Maps',
    'Theming',
    'Landing pages',
    'Application',
    'Test pages',
  ],
  samples: SAMPLES.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    build: () => buildSample(def),
  })),
  devices: ['iphone', 'android', 'tablet', 'desktop', 'custom'],
};
