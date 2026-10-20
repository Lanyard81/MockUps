import type { DocNode, Frame, MockupDoc } from '../../store/types';
import type { BuildNotesTools } from '../types';
import { SECTION_LAYOUTS, sectionLayoutOf } from './sections';
import { readSite, type NavItem } from './site';
import { THEME_PRESETS, readThemeSpec } from './theme';

/**
 * "Build notes": a plain-English Markdown spec for a SharePoint frame that someone can follow in
 * SharePoint, using SharePoint's own names for settings, sections and web parts: first the site
 * settings (theme, header, navigation, footer, page title), then each section and web part in order.
 */
const LOOK: Record<string, string> = {
  none: 'None',
  neutral: 'Neutral',
  soft: 'Soft',
  strong: 'Strong',
  gradient: 'Gradient',
  image: 'Image',
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const q = (s: string) => `“${s.replace(/\s+/g, ' ').trim()}”`;
const yes = (b: boolean) => (b ? 'on' : 'off');

function navLines(items: NavItem[], depth = 0): string[] {
  return items.flatMap((it) => [
    `${'  '.repeat(depth)}- ${it.label || '(no label)'}`,
    ...navLines(it.children ?? [], depth + 1),
  ]);
}

function themeLine(frame: Frame, kitSettings: Record<string, unknown> | undefined): string {
  const own = frame.settings?.themeOverride === true;
  const spec = readThemeSpec(own ? frame.settings : kitSettings);
  const preset = THEME_PRESETS.find((p) => p.id === spec.preset);
  const name = preset
    ? preset.name
    : spec.preset === 'organisation'
      ? `Organisation theme (main colour ${spec.primary ?? 'as set'})`
      : `Custom theme (main colour ${spec.primary ?? 'as set'}${spec.dark ? ', dark' : ''})`;
  return `${name}${own ? ' (this page only; in SharePoint themes apply to the whole site, so use a separate site for a different theme)' : ''}`;
}

function webPart(node: DocNode, doc: MockupDoc, n: number, tools: BuildNotesTools): string[] {
  const { getComponent, getVariant, describeVariant, optionsForVariant } = tools;
  const comp = node.componentId ? getComponent(node.componentId) : undefined;
  if (!comp) return [`${n}. (unknown web part)`];
  const variant = getVariant(comp.id, node.variant)!;
  const lines = [
    `${n}. **${comp.name}** web part${comp.variants.length > 1 ? `, layout: ${variant.label}` : ''}`,
  ];
  const props = node.props ?? {};
  const hidden = Array.isArray(props.hiddenParts) ? (props.hiddenParts as string[]) : [];
  const parts = describeVariant(variant.html);

  for (const opt of optionsForVariant(variant.html, comp.options)) {
    const v = props[opt.key];
    if (v === undefined || v === false) continue;
    if (opt.type === 'choice') {
      const c = opt.choices.find((x) => x.id === v);
      if (c && c.id !== opt.choices[0]!.id) lines.push(`   - ${opt.label}: ${c.label}`);
    } else if (opt.type === 'toggleClass' || opt.type === 'toggleAttr')
      lines.push(`   - ${opt.label}: on`);
    else if (opt.type === 'iconSlot' && typeof v === 'string')
      lines.push(`   - ${opt.label}: ${v.replace(/_/g, ' ')}`);
    else if (opt.type === 'href' && typeof v === 'string') lines.push(`   - ${opt.label}: ${v}`);
  }
  if (typeof props.goto === 'string') {
    const target = doc.frames.find((f) => f.id === props.goto);
    if (target) lines.push(`   - Link: to the page ${q(target.name)}`);
  }
  for (const key of parts.optional) {
    const label = comp.optional.find((o) => o.key === key)?.label ?? key;
    if (hidden.includes(key)) lines.push(`   - Hide: ${label.replace(/^Show /, '')}`);
  }
  const content = parts.editable
    .filter((f) => !hidden.some((h) => f.key.includes(h)))
    .map((f) => [f.key, (node.text?.[f.key] ?? f.default).trim()] as const)
    .filter(([, v]) => v);
  if (content.length) {
    lines.push('   - Content:');
    for (const [k, v] of content.slice(0, 40))
      lines.push(`     - ${k.replace(/(\d+)$/, ' $1')}: ${q(v)}`);
    if (content.length > 40) lines.push(`     - …and ${content.length - 40} more fields`);
  }
  const imgs = (props.images ?? {}) as Record<string, { imageId?: string }>;
  for (const [key, entry] of Object.entries(imgs))
    if (entry?.imageId && doc.images[entry.imageId])
      lines.push(
        `   - Picture (${key}): use your own picture${doc.images[entry.imageId]!.name ? ` (${doc.images[entry.imageId]!.name})` : ''}`,
      );
  if (comp.fidelity === 'static')
    lines.push(`   - Note: ${comp.note ?? 'This mockup shows a static preview.'}`);
  return lines;
}

/** The Markdown build notes for one SharePoint frame. */
export function buildSharePointNotes(doc: MockupDoc, frame: Frame, tools: BuildNotesTools): string {
  const site = readSite(frame.settings);
  const out: string[] = [];
  out.push(`# ${frame.name}: SharePoint build notes`, '');
  out.push(
    `Made from the mockup “${doc.name}”. Follow these steps in SharePoint Online using only out-of-the-box features. This is a SharePoint-style mockup, so check wording and options against your tenant.`,
    '',
  );

  out.push('## Site settings', '');
  out.push(`- Site type: ${site.type === 'team' ? 'Team site' : 'Communication site'}`);
  out.push(`- Change the look > Theme: ${themeLine(frame, doc.kitSettings.sharepoint)}`);
  const h = site.header;
  out.push(
    `- Change the look > Header: layout ${cap(h.layout)}; background ${h.background === 'image' ? `image (overlay ${h.overlay}%)` : LOOK[h.background]}; site title ${h.showTitle ? `shown, ${q(h.title)}` : 'hidden'}${h.layout === 'extended' ? `; logo alignment ${h.logoAlign}` : ''}${h.logoId ? '; site logo uploaded' : ''}${h.thumbnailId ? '; logo thumbnail uploaded' : ''}`,
  );
  out.push(`- Suite bar: ${yes(site.suiteBar)}`);
  if (site.nav.visible) {
    out.push(
      `- Change the look > Navigation: ${site.type === 'team' ? 'left-hand menu, cascading' : site.nav.style === 'mega' ? 'Mega menu' : 'Cascading'}. Links:`,
      ...navLines(site.nav.items).map((l) => `  ${l}`),
    );
  } else out.push('- Change the look > Navigation: hidden');
  if (site.type === 'communication') {
    const f = site.footer;
    out.push(
      f.visible
        ? `- Change the look > Footer: ${cap(f.layout)} layout; background ${LOOK[f.background]}; display name ${f.showName ? q(f.name) : 'hidden'}${f.logoId ? '; logo uploaded' : ''}; links: ${f.links.map(q).join(', ') || 'none'}`
        : '- Change the look > Footer: off',
    );
  }
  out.push('');

  const t = site.titleArea;
  out.push('## Page title area', '');
  if (!t.visible) out.push('- Hidden', '');
  else
    out.push(
      `- Layout: ${t.layout === 'image-and-title' ? 'Image and title' : cap(t.layout.replace('-', ' '))}; text aligned ${t.align}`,
      `- Title: ${q(t.title)}`,
      `- Topic header: ${t.showTopic ? q(t.topic) : 'off'}`,
      `- Author: ${t.showAuthor ? q(t.author) : 'off'}; published date: ${t.showDate ? q(t.date) : 'off'}`,
      '',
    );

  out.push('## Page content, top to bottom', '');
  let sectionNo = 0;
  for (const id of frame.root) {
    const node = doc.nodes[id];
    if (!node || node.hidden) continue;
    sectionNo++;
    const layout = SECTION_LAYOUTS.find((l) => l.id === sectionLayoutOf(node));
    const bg = String(node.props?.background ?? 'none');
    out.push(
      `### Section ${sectionNo}: ${layout?.label.replace(' (approximation)', '') ?? 'One column'}`,
      '',
    );
    out.push(
      `- Background: ${LOOK[bg] ?? cap(bg)}${bg === 'image' ? ' (add a picture; SharePoint adds an overlay)' : ''}`,
    );
    if (sectionLayoutOf(node) === 'flexible')
      out.push(
        '- This is a flexible section. SharePoint places web parts freely; this mockup shows them side by side.',
      );
    if (node.props?.collapsible === true) {
      out.push(
        `- Collapsible section: on; title ${q(node.text?.collapseTitle ?? 'Section title')}; heading ${String(
          node.props.collapseHeading ?? 'h2',
        )
          .toUpperCase()
          .replace(
            'H',
            'Heading ',
          )}; divider ${yes(node.props.collapseDivider !== false)}; icon ${node.props.collapseIcon === 'right' ? 'right' : 'left'}; ${node.props.collapsedByDefault === true ? 'collapsed' : 'expanded'} by default`,
      );
    }
    out.push('');
    (node.children ?? []).forEach((colId, ci, cols) => {
      const col = doc.nodes[colId];
      if (!col || col.hidden) return;
      if (cols.length > 1) out.push(`**Column ${ci + 1}**`, '');
      let n = 0;
      for (const wid of col.children ?? []) {
        const w = doc.nodes[wid];
        if (!w || w.hidden) continue;
        out.push(...webPart(w, doc, ++n, tools));
      }
      if (n === 0) out.push('(empty)');
      out.push('');
    });
  }
  if (sectionNo === 0) out.push('No sections yet.', '');
  return (
    out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n'
  );
}
