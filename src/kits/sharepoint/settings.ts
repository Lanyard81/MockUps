import type { SettingContext, SettingDef, SettingOption } from '../types';
import { SECTION_LAYOUTS } from './sections';
import { readSite, siteTypeOf } from './site';
import {
  ORGANISATION_PRIMARY,
  THEME_PRESETS,
  readThemeSpec,
  themeFromSpec,
  variantColours,
  type Variant,
} from './theme';

const team = (ctx: SettingContext) => siteTypeOf(ctx.frame) === 'team';

/** A swatch for a theme-derived look (None, Neutral, Soft, Strong) that follows the frame's theme. */
const looks = (
  label: Record<Variant, string>,
): SettingOption<{ swatch: (ctx: SettingContext) => string }>[] =>
  (['none', 'neutral', 'soft', 'strong'] as Variant[]).map((v) => ({
    id: v,
    label: label[v],
    swatch: (ctx) => {
      const spec = ctx.frame.themeOverride === true ? ctx.frame : ctx.kit;
      return variantColours(themeFromSpec(readThemeSpec(spec)), v).bg;
    },
  }));

const LOOK_LABELS: Record<Variant, string> = {
  none: 'None',
  neutral: 'Neutral',
  soft: 'Soft',
  strong: 'Strong',
};

const when =
  (test: (ctx: SettingContext) => boolean, reason: string) =>
  (ctx: SettingContext): string | null =>
    test(ctx) ? null : reason;

const headerIs = (ctx: SettingContext) => readSite(ctx.frame).header.layout;
const headerBg = (ctx: SettingContext) => readSite(ctx.frame).header.background;

/** Theme controls, for the document (`override` false) or for one page that has its own (`override` true). */
function themeDefs(
  group: string,
  gate?: (ctx: SettingContext) => string | null,
  /** Added to each label, so the document's controls and a page's own can be told apart. */
  suffix = '',
): SettingDef[] {
  const custom = (ctx: SettingContext) => {
    const preset = readThemeSpec(ctx.values).preset;
    return preset === 'custom' || preset === 'organisation';
  };
  return [
    {
      type: 'swatches',
      key: 'themePreset',
      label: `Theme${suffix}`,
      group,
      default: 'blue',
      options: [
        ...THEME_PRESETS.map((p) => ({
          id: p.id,
          label: p.name,
          swatch: p.dark ? '#1b1a19' : p.primary,
        })),
        { id: 'organisation', label: 'Organisation theme', swatch: ORGANISATION_PRIMARY },
        {
          id: 'custom',
          label: 'Custom theme',
          swatch: 'conic-gradient(#a4262c,#ca5010,#ffc83d,#498205,#0078d4,#8764b8,#a4262c)',
        },
      ],
      unavailable: gate,
    },
    {
      type: 'color',
      key: 'themePrimary',
      label: `Main colour${suffix}`,
      group,
      default: ORGANISATION_PRIMARY,
      hint: 'The theme colours (lighter and darker shades) are made from this.',
      unavailable: (ctx) =>
        gate?.(ctx) ??
        when(custom, 'Choose “Custom theme” or “Organisation theme” to pick colours.')(ctx),
    },
    {
      type: 'color',
      key: 'themeText',
      label: `Text colour${suffix}`,
      group,
      default: '#323130',
      unavailable: (ctx) =>
        gate?.(ctx) ??
        when(custom, 'Choose “Custom theme” or “Organisation theme” to pick colours.')(ctx),
    },
    {
      type: 'color',
      key: 'themeBackground',
      label: `Background colour${suffix}`,
      group,
      default: '#ffffff',
      unavailable: (ctx) =>
        gate?.(ctx) ??
        when(custom, 'Choose “Custom theme” or “Organisation theme” to pick colours.')(ctx),
    },
    {
      type: 'toggle',
      key: 'themeDark',
      label: `Dark theme${suffix}`,
      group,
      default: false,
      hint: 'Light text on a dark background.',
      unavailable: (ctx) =>
        gate?.(ctx) ?? when(custom, 'Choose “Custom theme” or “Organisation theme” first.')(ctx),
    },
  ];
}

const override = (ctx: SettingContext): string | null =>
  ctx.frame.themeOverride === true ? null : 'Switch on “Use a different theme on this page” first.';

/** Document-wide theme (all SharePoint frames). */
export const KIT_SETTINGS: SettingDef[] = themeDefs('SharePoint theme (all SharePoint pages)');

/** Settings that belong to one SharePoint frame: the site it shows and the page title area. */
export const FRAME_SETTINGS: SettingDef[] = [
  {
    type: 'segmented',
    key: 'siteType',
    label: 'Site type',
    group: 'Site',
    default: 'communication',
    hint: 'Communication sites have a top menu, an optional footer and full-width sections. Team sites have a left-hand menu.',
    options: [
      {
        id: 'communication',
        label: 'Communication site',
        title: 'Top navigation, optional footer, full-width sections',
      },
      {
        id: 'team',
        label: 'Team site',
        title: 'Left-hand navigation, no footer, no full-width sections',
      },
    ],
  },
  { type: 'toggle', key: 'suiteBar', label: 'Show the suite bar', group: 'Site', default: true },

  {
    type: 'segmented',
    key: 'headerLayout',
    label: 'Header layout',
    group: 'Header',
    default: 'compact',
    options: [
      { id: 'minimal', label: 'Minimal', title: 'A single slim row with the title and menu' },
      { id: 'compact', label: 'Compact', title: 'Title row, with the menu below' },
      { id: 'standard', label: 'Standard', title: 'A taller title row' },
      { id: 'extended', label: 'Extended', title: 'A tall header with a large logo' },
    ],
  },
  {
    type: 'swatches',
    key: 'headerBackground',
    label: 'Header background',
    group: 'Header',
    default: 'none',
    options: [
      ...looks(LOOK_LABELS),
      { id: 'image', label: 'Image', swatch: 'linear-gradient(135deg,#106ebe,#71afe5)' },
    ],
  },
  {
    type: 'number',
    key: 'headerOverlay',
    label: 'Image overlay (%)',
    group: 'Header',
    min: 0,
    max: 100,
    step: 5,
    default: 30,
    unavailable: when((ctx) => headerBg(ctx) === 'image', 'Only for an image background.'),
  },
  {
    type: 'toggle',
    key: 'showSiteTitle',
    label: 'Show the site title',
    group: 'Header',
    default: true,
  },
  {
    type: 'text',
    key: 'siteTitle',
    label: 'Site title',
    group: 'Header',
    placeholder: 'Our intranet',
    unavailable: when((ctx) => readSite(ctx.frame).header.showTitle, 'The site title is hidden.'),
  },
  {
    type: 'segmented',
    key: 'logoAlign',
    label: 'Logo alignment',
    group: 'Header',
    default: 'left',
    options: [
      { id: 'left', label: 'Left' },
      { id: 'center', label: 'Centre' },
      { id: 'right', label: 'Right' },
    ],
    unavailable: when((ctx) => headerIs(ctx) === 'extended', 'Only on the Extended layout.'),
  },

  {
    type: 'toggle',
    key: 'navVisible',
    label: 'Show navigation',
    group: 'Navigation',
    default: true,
  },
  {
    type: 'segmented',
    key: 'navStyle',
    label: 'Navigation style',
    group: 'Navigation',
    default: 'mega',
    current: (ctx) => readSite(ctx.frame).nav.style,
    options: [
      {
        id: 'mega',
        label: 'Mega menu',
        title: 'Wide drop-downs showing three levels. Communication and hub sites only.',
        unavailable: (ctx) =>
          team(ctx) ? 'The mega menu is only available on communication sites.' : null,
      },
      { id: 'cascading', label: 'Cascading', title: 'Drop-downs that open to the side' },
    ],
  },

  {
    type: 'toggle',
    key: 'footerVisible',
    label: 'Show the footer',
    group: 'Footer',
    default: true,
    current: (ctx) => readSite(ctx.frame).footer.visible,
    unavailable: when((ctx) => !team(ctx), 'Footers are only available on communication sites.'),
  },
  {
    type: 'segmented',
    key: 'footerLayout',
    label: 'Footer layout',
    group: 'Footer',
    default: 'simple',
    options: [
      { id: 'simple', label: 'Simple' },
      { id: 'extended', label: 'Extended' },
    ],
    unavailable: when((ctx) => readSite(ctx.frame).footer.visible, 'The footer is hidden.'),
  },
  {
    type: 'swatches',
    key: 'footerBackground',
    label: 'Footer background',
    group: 'Footer',
    default: 'neutral',
    options: looks(LOOK_LABELS),
    unavailable: when((ctx) => readSite(ctx.frame).footer.visible, 'The footer is hidden.'),
  },
  {
    type: 'toggle',
    key: 'showFooterName',
    label: 'Show the display name',
    group: 'Footer',
    default: true,
    unavailable: when((ctx) => readSite(ctx.frame).footer.visible, 'The footer is hidden.'),
  },
  {
    type: 'text',
    key: 'footerName',
    label: 'Display name',
    group: 'Footer',
    unavailable: when((ctx) => readSite(ctx.frame).footer.visible, 'The footer is hidden.'),
  },

  {
    type: 'toggle',
    key: 'showTitleArea',
    label: 'Show the title area',
    group: 'Page title area',
    default: true,
  },
  {
    type: 'select',
    key: 'titleLayout',
    label: 'Title layout',
    group: 'Page title area',
    default: 'image-and-title',
    options: [
      { id: 'image-and-title', label: 'Image and title' },
      { id: 'plain', label: 'Plain' },
      { id: 'colour-block', label: 'Colour block' },
      { id: 'overlap', label: 'Overlap' },
    ],
  },
  {
    type: 'segmented',
    key: 'titleAlign',
    label: 'Title alignment',
    group: 'Page title area',
    default: 'left',
    options: [
      { id: 'left', label: 'Left' },
      { id: 'center', label: 'Centre' },
    ],
  },
  {
    type: 'text',
    key: 'pageTitle',
    label: 'Page title',
    group: 'Page title area',
    placeholder: 'Page title',
  },
  {
    type: 'toggle',
    key: 'showTopic',
    label: 'Show the topic header',
    group: 'Page title area',
    default: false,
  },
  {
    type: 'text',
    key: 'topicText',
    label: 'Topic header',
    group: 'Page title area',
    unavailable: when(
      (ctx) => readSite(ctx.frame).titleArea.showTopic,
      'The topic header is hidden.',
    ),
  },
  {
    type: 'toggle',
    key: 'showAuthor',
    label: 'Show the author',
    group: 'Page title area',
    default: true,
  },
  {
    type: 'text',
    key: 'authorName',
    label: 'Author',
    group: 'Page title area',
    unavailable: when((ctx) => readSite(ctx.frame).titleArea.showAuthor, 'The author is hidden.'),
  },
  {
    type: 'toggle',
    key: 'showDate',
    label: 'Show the published date',
    group: 'Page title area',
    default: true,
  },
  {
    type: 'text',
    key: 'publishedDate',
    label: 'Published date',
    group: 'Page title area',
    unavailable: when(
      (ctx) => readSite(ctx.frame).titleArea.showDate,
      'The published date is hidden.',
    ),
  },

  {
    type: 'toggle',
    key: 'themeOverride',
    label: 'Use a different theme on this page',
    group: 'Theme for this page',
    default: false,
  },
  ...themeDefs('Theme for this page', override, ' on this page'),
];

/** The layout choice for a section, built from the section layouts so the rules live in one place. */
const LAYOUT_SETTING: SettingDef = {
  type: 'select',
  key: 'layout',
  label: 'Section layout',
  group: 'Layout',
  default: 'one-column',
  hint: 'Changing the layout moves content: when columns go, their content moves into the last one that stays.',
  options: SECTION_LAYOUTS.map((l) => ({
    id: l.id,
    label: l.label,
    title: l.title,
    unavailable: l.unavailable,
  })),
};

const collapsible = (ctx: SettingContext) => ctx.values.collapsible === true;
const needsCollapsible = when(collapsible, 'Turn on “Collapsible section” first.');
const notVertical = when(
  (ctx) => ctx.values.layout !== 'vertical',
  'A vertical section can’t be collapsible.',
);

export const SECTION_SETTINGS: SettingDef[] = [
  LAYOUT_SETTING,
  {
    type: 'swatches',
    key: 'background',
    label: 'Section background',
    group: 'Background',
    default: 'none',
    hint: 'The first four come from the site theme. Lists, document libraries and quick charts keep the page background.',
    options: [
      ...looks(LOOK_LABELS),
      { id: 'gradient', label: 'Gradient', swatch: 'linear-gradient(135deg,#0078d4,#004578)' },
      { id: 'image', label: 'Image', swatch: 'linear-gradient(135deg,#106ebe,#71afe5)' },
    ],
  },
  {
    type: 'toggle',
    key: 'collapsible',
    label: 'Collapsible section',
    group: 'Collapsible',
    default: false,
    unavailable: notVertical,
  },
  {
    type: 'select',
    key: 'collapseHeading',
    label: 'Section title heading level',
    group: 'Collapsible',
    default: 'h2',
    options: [
      { id: 'h2', label: 'Heading 2' },
      { id: 'h3', label: 'Heading 3' },
      { id: 'h4', label: 'Heading 4' },
    ],
    unavailable: needsCollapsible,
  },
  {
    type: 'text',
    key: 'collapseTitle',
    label: 'Section title',
    group: 'Collapsible',
    store: 'text',
    placeholder: 'Section title',
    unavailable: needsCollapsible,
  },
  {
    type: 'toggle',
    key: 'collapseDivider',
    label: 'Show a divider line',
    group: 'Collapsible',
    default: true,
    unavailable: needsCollapsible,
  },
  {
    type: 'segmented',
    key: 'collapseIcon',
    label: 'Expand and collapse icon',
    group: 'Collapsible',
    default: 'left',
    options: [
      { id: 'left', label: 'Left' },
      { id: 'right', label: 'Right' },
    ],
    unavailable: needsCollapsible,
  },
  {
    type: 'toggle',
    key: 'collapsedByDefault',
    label: 'Collapsed when the page opens',
    group: 'Collapsible',
    default: false,
    unavailable: needsCollapsible,
  },
];
