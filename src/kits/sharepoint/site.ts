/**
 * A SharePoint frame is one page of one site, so its site settings live on the frame (different
 * frames can show different sites). This module reads them: validated, with SharePoint's defaults,
 * and with the rules for each site type applied (a team site has no footer, no mega menu, and a
 * left-hand menu).
 */
export type SiteType = 'communication' | 'team';
export type HeaderLayout = 'minimal' | 'compact' | 'standard' | 'extended';
export type HeaderBackground = 'none' | 'neutral' | 'soft' | 'strong' | 'image';
export type FooterBackground = 'none' | 'neutral' | 'soft' | 'strong';
export type NavStyle = 'mega' | 'cascading';
export type TitleLayout = 'image-and-title' | 'plain' | 'colour-block' | 'overlap';
export type Align = 'left' | 'center' | 'right';

export interface NavItem {
  label: string;
  children?: NavItem[];
}

export const MAX_NAV_DEPTH = 3;
export const MAX_FOOTER_LINKS = 8;

export const DEFAULT_COMMUNICATION_NAV: NavItem[] = [
  { label: 'Home' },
  {
    label: 'News',
    children: [{ label: 'Company news' }, { label: 'Announcements' }],
  },
  {
    label: 'Departments',
    children: [
      {
        label: 'People and culture',
        children: [{ label: 'Benefits' }, { label: 'Policies' }, { label: 'Recruitment' }],
      },
      { label: 'Finance', children: [{ label: 'Expenses' }, { label: 'Procurement' }] },
      { label: 'Technology', children: [{ label: 'Get help' }, { label: 'Software' }] },
    ],
  },
  { label: 'Resources', children: [{ label: 'Templates' }, { label: 'Forms' }] },
  { label: 'Events' },
];

export const DEFAULT_TEAM_NAV: NavItem[] = [
  { label: 'Home' },
  { label: 'Conversations' },
  { label: 'Documents' },
  { label: 'Notebook' },
  { label: 'Pages' },
  { label: 'Site contents' },
];

export const DEFAULT_FOOTER_LINKS = ['About us', 'Contact', 'Privacy', 'Accessibility'];

export interface Site {
  type: SiteType;
  suiteBar: boolean;
  header: {
    layout: HeaderLayout;
    background: HeaderBackground;
    imageId?: string;
    overlay: number;
    showTitle: boolean;
    title: string;
    logoId?: string;
    thumbnailId?: string;
    logoAlign: Align;
  };
  nav: {
    visible: boolean;
    style: NavStyle;
    orientation: 'horizontal' | 'vertical';
    items: NavItem[];
  };
  footer: {
    visible: boolean;
    layout: 'simple' | 'extended';
    background: FooterBackground;
    logoId?: string;
    showName: boolean;
    name: string;
    links: string[];
  };
  titleArea: {
    visible: boolean;
    layout: TitleLayout;
    align: Align;
    title: string;
    imageId?: string;
    showTopic: boolean;
    topic: string;
    showAuthor: boolean;
    author: string;
    showDate: boolean;
    date: string;
  };
}

type Settings = Record<string, unknown> | undefined;

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
const text = (v: unknown, fallback: string, max = 200): string =>
  typeof v === 'string' ? v.slice(0, max) : fallback;
const flag = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const imageId = (v: unknown): string | undefined =>
  typeof v === 'string' && v.startsWith('img_') ? v : undefined;
const num = (v: unknown, fallback: number, min: number, max: number): number =>
  typeof v === 'number' && Number.isFinite(v)
    ? Math.min(max, Math.max(min, Math.round(v)))
    : fallback;

/** Menu items from settings, to at most three levels, ignoring anything malformed. */
export function readNavItems(raw: unknown, fallback: NavItem[], depth = 1): NavItem[] {
  if (!Array.isArray(raw)) return fallback;
  const items: NavItem[] = [];
  for (const entry of raw.slice(0, 30)) {
    if (!entry || typeof entry !== 'object') continue;
    const label = text((entry as { label?: unknown }).label, '', 80);
    const children =
      depth < MAX_NAV_DEPTH
        ? readNavItems((entry as { children?: unknown }).children, [], depth + 1)
        : [];
    items.push({ label, ...(children.length ? { children } : {}) });
  }
  return items;
}

export function readSite(settings: Settings): Site {
  const s = settings ?? {};
  const type = pick<SiteType>(s.siteType, ['communication', 'team'], 'communication');
  const team = type === 'team';
  const defaultNav = team ? DEFAULT_TEAM_NAV : DEFAULT_COMMUNICATION_NAV;
  const date = new Date(Date.UTC(2026, 9, 20));
  return {
    type,
    suiteBar: flag(s.suiteBar, true),
    header: {
      layout: pick<HeaderLayout>(
        s.headerLayout,
        ['minimal', 'compact', 'standard', 'extended'],
        'compact',
      ),
      background: pick<HeaderBackground>(
        s.headerBackground,
        ['none', 'neutral', 'soft', 'strong', 'image'],
        'none',
      ),
      imageId: imageId(s.headerImage),
      overlay: num(s.headerOverlay, 30, 0, 100),
      showTitle: flag(s.showSiteTitle, true),
      title: text(s.siteTitle, team ? 'Project team' : 'Our intranet', 80),
      logoId: imageId(s.siteLogo),
      thumbnailId: imageId(s.logoThumbnail),
      logoAlign: pick<Align>(s.logoAlign, ['left', 'center', 'right'], 'left'),
    },
    nav: {
      visible: flag(s.navVisible, true),
      // Team sites use a left-hand cascading menu; the mega menu is for communication and hub sites.
      style: team ? 'cascading' : pick<NavStyle>(s.navStyle, ['mega', 'cascading'], 'mega'),
      orientation: team ? 'vertical' : 'horizontal',
      items: readNavItems(s.navItems, defaultNav),
    },
    footer: {
      visible: !team && flag(s.footerVisible, true),
      layout: pick(s.footerLayout, ['simple', 'extended'] as const, 'simple'),
      background: pick<FooterBackground>(
        s.footerBackground,
        ['none', 'neutral', 'soft', 'strong'],
        'neutral',
      ),
      logoId: imageId(s.footerLogo),
      showName: flag(s.showFooterName, true),
      name: text(s.footerName, team ? 'Project team' : 'Our intranet', 80),
      links: Array.isArray(s.footerLinks)
        ? s.footerLinks
            .filter((l): l is string => typeof l === 'string')
            .slice(0, MAX_FOOTER_LINKS)
            .map((l) => l.slice(0, 80))
        : DEFAULT_FOOTER_LINKS,
    },
    titleArea: {
      visible: flag(s.showTitleArea, true),
      layout: pick<TitleLayout>(
        s.titleLayout,
        ['image-and-title', 'plain', 'colour-block', 'overlap'],
        'image-and-title',
      ),
      align: pick<Align>(s.titleAlign, ['left', 'center'], 'left') as Align,
      title: text(s.pageTitle, 'Page title', 120),
      imageId: imageId(s.titleImage),
      showTopic: flag(s.showTopic, false),
      topic: text(s.topicText, 'Topic header', 60),
      showAuthor: flag(s.showAuthor, true),
      author: text(s.authorName, 'Alex Taylor', 60),
      showDate: flag(s.showDate, true),
      date: text(
        s.publishedDate,
        date.toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }),
        40,
      ),
    },
  };
}

/** The menu a frame shows when it hasn't been edited, which depends on the site type. */
export function defaultNav(settings: Settings): NavItem[] {
  return readSite(settings).type === 'team' ? DEFAULT_TEAM_NAV : DEFAULT_COMMUNICATION_NAV;
}

export const siteTypeOf = (settings: Settings): SiteType => readSite(settings).type;
