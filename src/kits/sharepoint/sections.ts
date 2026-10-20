import type { DocNode } from '../../store/types';
import type { SectionLayout, SettingContext } from '../types';
import { siteTypeOf } from './site';

/**
 * Section layouts SharePoint offers out of the box (see docs/SHAREPOINT-OOB.md). Each says how many
 * columns it has, and when it can't be used:
 * - a full-width section needs a communication site;
 * - a page can't have both a full-width and a vertical section, or more than one vertical section;
 * - a flexible section can't be changed to another type (and nothing is changed to one).
 */
export const sectionLayoutOf = (n: DocNode | undefined): string =>
  typeof n?.props?.layout === 'string' ? n.props.layout : 'one-column';

const otherSections = (ctx: Pick<SettingContext, 'topLevel' | 'nodeId'>) =>
  ctx.topLevel.filter((n) => n.type === 'section' && n.id !== ctx.nodeId);

/** The reason a section whose current layout is `current` can't take layout `to`, or null. */
function flexibleRule(current: string, to: string): string | null {
  if (current === 'flexible' && to !== 'flexible')
    return 'A flexible section can’t be changed to another type.';
  if (current !== 'flexible' && to === 'flexible')
    return 'A flexible section can only be added as a new section from the library.';
  return null;
}

const rule =
  (to: string, extra?: (ctx: SettingContext) => string | null) =>
  (ctx: SettingContext): string | null =>
    flexibleRule(sectionLayoutOf({ props: ctx.values } as DocNode), to) ?? extra?.(ctx) ?? null;

export const SECTION_LAYOUTS: readonly SectionLayout[] = [
  { id: 'one-column', label: 'One column', columns: 1, unavailable: rule('one-column') },
  { id: 'two-columns', label: 'Two columns', columns: 2, unavailable: rule('two-columns') },
  { id: 'three-columns', label: 'Three columns', columns: 3, unavailable: rule('three-columns') },
  {
    id: 'one-third-left',
    label: 'One-third left column',
    columns: 2,
    title: 'A narrow column on the left and a wide one on the right',
    unavailable: rule('one-third-left'),
  },
  {
    id: 'one-third-right',
    label: 'One-third right column',
    columns: 2,
    title: 'A wide column on the left and a narrow one on the right',
    unavailable: rule('one-third-right'),
  },
  {
    id: 'full-width',
    label: 'Full-width section',
    columns: 1,
    title: 'Spans the whole page, edge to edge. Communication sites only.',
    unavailable: rule('full-width', (ctx) => fullWidthBlocked(ctx)),
  },
  {
    id: 'vertical',
    label: 'Vertical section',
    columns: 1,
    title: 'A column down the right-hand side of the page. One per page.',
    unavailable: rule('vertical', (ctx) => verticalBlocked(ctx)),
  },
  {
    id: 'flexible',
    label: 'Flexible section (approximation)',
    columns: 1,
    title:
      'Web parts sit side by side and can be resized. A simplified version of SharePoint’s flexible section.',
    unavailable: rule('flexible'),
  },
];

/** Why a full-width section can't go on this page, or null. */
export function fullWidthBlocked(
  ctx: Pick<SettingContext, 'frame' | 'topLevel' | 'nodeId'>,
): string | null {
  if (siteTypeOf(ctx.frame) === 'team')
    return 'Full-width sections are only available on communication sites.';
  if (otherSections(ctx).some((n) => sectionLayoutOf(n) === 'vertical'))
    return 'A page can’t have a full-width section and a vertical section.';
  return null;
}

/** Why a vertical section can't go on this page, or null. */
export function verticalBlocked(ctx: Pick<SettingContext, 'topLevel' | 'nodeId'>): string | null {
  if (otherSections(ctx).some((n) => sectionLayoutOf(n) === 'vertical'))
    return 'A page can have only one vertical section.';
  if (otherSections(ctx).some((n) => sectionLayoutOf(n) === 'full-width'))
    return 'A page can’t have a vertical section and a full-width section.';
  return null;
}
