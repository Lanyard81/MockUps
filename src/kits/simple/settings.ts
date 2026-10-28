import type { SettingDef } from '../types';
import { SECTION_LAYOUTS } from './sections';
import { DEFAULT_ACCENT } from './render';

const ACCENTS = [
  ['#2563eb', 'Blue'],
  ['#7c3aed', 'Violet'],
  ['#0d9488', 'Teal'],
  ['#16a34a', 'Green'],
  ['#ea580c', 'Orange'],
  ['#dc2626', 'Red'],
  ['#111827', 'Charcoal'],
] as const;

const accentSwatches = ACCENTS.map(([id, label]) => ({ id, label, swatch: id }));

/** The accent colour for every Simple frame in the mockup. */
export const KIT_SETTINGS: SettingDef[] = [
  {
    type: 'swatches',
    key: 'accent',
    label: 'Accent colour',
    group: 'Simple kit colours (all Simple pages)',
    default: DEFAULT_ACCENT,
    options: accentSwatches,
  },
];

export const FRAME_SETTINGS: SettingDef[] = [
  {
    type: 'toggle',
    key: 'accentOverride',
    label: 'Use a different accent on this page',
    group: 'Colour',
    default: false,
  },
  {
    type: 'swatches',
    key: 'accent',
    label: 'Accent colour on this page',
    group: 'Colour',
    default: DEFAULT_ACCENT,
    options: accentSwatches,
    unavailable: (ctx) =>
      ctx.values.accentOverride === true ? null : 'Turn on “Use a different accent” first.',
    hideWhenUnavailable: true,
  },
];

export const SECTION_SETTINGS: SettingDef[] = [
  {
    type: 'select',
    key: 'layout',
    label: 'Section layout',
    group: 'Layout',
    default: 'one-column',
    hint: 'Changing the layout moves content: when columns go, their content moves into the last one that stays.',
    options: SECTION_LAYOUTS.map((l) => ({ id: l.id, label: l.label, title: l.title })),
  },
  {
    type: 'swatches',
    key: 'background',
    label: 'Background',
    group: 'Look',
    default: 'none',
    options: [
      { id: 'none', label: 'None', swatch: '#ffffff' },
      { id: 'soft', label: 'Soft grey', swatch: '#f1f2f5' },
      { id: 'dark', label: 'Dark', swatch: '#161a23' },
      { id: 'accent', label: 'Accent colour', swatch: DEFAULT_ACCENT },
    ],
  },
  {
    type: 'segmented',
    key: 'spacing',
    label: 'Space above and below',
    group: 'Look',
    default: 'normal',
    options: [
      { id: 'compact', label: 'Compact' },
      { id: 'normal', label: 'Normal' },
      { id: 'spacious', label: 'Spacious' },
    ],
  },
  {
    type: 'toggle',
    key: 'wide',
    label: 'Edge to edge',
    group: 'Look',
    default: false,
    hint: 'Let the content use the whole width instead of staying in a centred column.',
  },
];
