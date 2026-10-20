import { getComponent, kitOfComponent } from '../catalogue';
import { KITS, getKit, hasKit } from '../kits';
import type { Kit, KitId, LayerType, PageSpecComponent, PageSpecContext } from '../kits/types';
import { describeVariant, optionsForVariant } from '../layout/component';
import { newId } from '../lib/ids';
import { safeJsonParse } from '../persistence/schema';
import { DEVICES, type DeviceId, type Frame, type MockupDoc } from '../store/types';
import {
  LIMITS,
  SPEC_FORMAT,
  SPEC_VERSION,
  SpecError,
  type ImportedPage,
  type PageImportReport,
} from './types';
import { checkSettings, cleanString, safeHref } from './values';

export * from './types';

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/** True when text looks like a page spec (so a paste can be told apart from ordinary text). */
export function looksLikePageSpec(text: string): boolean {
  return text.length < LIMITS.chars && /"format"\s*:\s*"mockup-page-spec"/.test(text);
}

/** The pages in a spec file: one page, or a list under `pages`. */
export function parsePageSpecText(text: string): {
  pages: unknown[];
  shared: Record<string, unknown>;
} {
  if (text.length > LIMITS.chars) throw new SpecError('That page spec is too large to import.');
  let raw: unknown;
  try {
    raw = safeJsonParse(text);
  } catch (err) {
    if (err instanceof Error && err.message.includes('will not open'))
      throw new SpecError(err.message);
    throw new SpecError('That isn’t valid JSON. Check for a missing comma or bracket.');
  }
  if (!isObject(raw) || raw.format !== SPEC_FORMAT)
    throw new SpecError(`That isn’t a page spec (it has no "format": "${SPEC_FORMAT}").`);
  if (typeof raw.version === 'number' && raw.version > SPEC_VERSION)
    throw new SpecError('That page spec is from a newer version of the app.');
  const pages = Array.isArray(raw.pages) ? raw.pages : [raw];
  if (pages.length === 0) throw new SpecError('That page spec has no pages.');
  if (pages.length > LIMITS.pages)
    throw new SpecError(`That page spec has more than ${LIMITS.pages} pages.`);
  const { pages: _p, ...shared } = raw; // eslint-disable-line @typescript-eslint/no-unused-vars
  return { pages, shared };
}

/** Collects what a page import did, and builds the checking functions the kit's converter uses. */
class Collector {
  components = 0;
  placeholders = new Map<string, number>();
  unknownVariants = 0;
  dropped = 0;
  movedCount = 0;
  notes = new Set<string>();
  note = (t: string) => {
    if (this.notes.size < 50) this.notes.add(t);
  };
}

const OPTION_ID = /^[a-z0-9_-]{1,60}$/i;

/** Check an option value against its definition. */
function checkOption(
  opt: ReturnType<typeof optionsForVariant>[number],
  value: unknown,
): unknown | undefined {
  switch (opt.type) {
    case 'toggleClass':
    case 'toggleAttr':
      return value === true ? true : undefined;
    case 'href':
      return safeHref(value);
    case 'headingLevel': {
      const n = typeof value === 'number' ? Math.round(value) : NaN;
      return n >= 1 && n <= 6 ? n : undefined;
    }
    case 'icon':
    case 'iconSlot':
      return typeof value === 'string' && OPTION_ID.test(value) ? value : undefined;
    case 'choice':
      return typeof value === 'string' && opt.choices.some((c) => c.id === value)
        ? value
        : undefined;
  }
}

function makeContext(kit: Kit, settings: Record<string, unknown>, col: Collector): PageSpecContext {
  const name = (v: unknown) => cleanString(v, LIMITS.nameChars)?.trim() || undefined;

  const placeholder = (label: string): PageSpecComponent => {
    col.placeholders.set(label, (col.placeholders.get(label) ?? 0) + 1);
    return kit.pageSpec.placeholder(label);
  };

  const component = (raw: unknown): PageSpecComponent | null => {
    if (!isObject(raw) || typeof raw.component !== 'string') return null;
    if (
      col.components + [...col.placeholders.values()].reduce((a, b) => a + b, 0) >=
      LIMITS.components
    ) {
      col.note(`Only the first ${LIMITS.components} components were imported.`);
      return null;
    }
    const id = raw.component.slice(0, 100);
    const comp = getComponent(id);
    if (!comp) return placeholder(name(raw.component) ?? 'Unknown component');
    if (kitOfComponent(comp.id) !== kit.id) return placeholder(comp.name);

    const out: PageSpecComponent = { componentId: comp.id };
    let variant = comp.variants.find((v) => v.id === raw.variant);
    const named = variant?.id;
    if (raw.variant !== undefined && !variant) {
      col.unknownVariants++;
      col.note(
        `“${comp.name}”: the variant “${cleanString(raw.variant, 60) ?? '?'}” doesn’t exist, so the default was used.`,
      );
    }
    variant ??= comp.variants.find((v) => v.id === comp.defaultVariant) ?? comp.variants[0]!;
    if (named) out.variant = named;

    const parts = describeVariant(variant.html);
    const keys = new Set(parts.editable.map((e) => e.key));
    const drop = (what: string) => {
      col.dropped++;
      col.note(`“${comp.name}”: ${what}`);
    };

    if (isObject(raw.text)) {
      const text: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw.text)) {
        const s = keys.has(k) ? cleanString(v) : undefined;
        if (s === undefined) drop(`“${k}” isn’t text this variant has, so it was left out.`);
        else text[k] = s;
      }
      if (Object.keys(text).length) out.text = text;
    }

    const props: Record<string, unknown> = {};
    if (isObject(raw.props)) {
      const options = optionsForVariant(variant.html, comp.options);
      const extras = kit.pageSpec.extraProps?.(comp.id, raw.props) ?? {};
      for (const [k, v] of Object.entries(raw.props)) {
        const opt = options.find((o) => o.key === k);
        if (k in extras) props[k] = extras[k];
        else if (opt) {
          const checked = checkOption(opt, v);
          if (checked === undefined) drop(`the option “${k}” has a value that isn’t allowed.`);
          else props[k] = checked;
        } else drop(`“${k}” isn’t an option this variant has, so it was left out.`);
      }
    }
    if (Object.keys(props).length) out.props = props;

    if (Array.isArray(raw.hide)) {
      const hide: string[] = [];
      for (const k of raw.hide.slice(0, 30)) {
        if (typeof k === 'string' && parts.optional.includes(k)) hide.push(k);
        else drop(`“${String(k).slice(0, 40)}” isn’t a part this variant can hide.`);
      }
      if (hide.length) out.hide = hide;
    }
    if (isObject(raw.fit)) {
      const fit: Record<string, 'natural' | 'shrink'> = {};
      for (const [k, v] of Object.entries(raw.fit))
        if (keys.has(k) && (v === 'natural' || v === 'shrink')) fit[k] = v;
      if (Object.keys(fit).length) out.textFit = fit;
    }
    if (raw.hidden === true) out.hidden = true;
    const label = name(raw.name);
    if (label) out.name = label;
    col.components++;
    return out;
  };

  return {
    makeId: newId,
    component,
    isFullWidth: (id) => !!getComponent(id)?.fullWidth,
    layerProps: (type: LayerType, raw, topLevel = []) => {
      const defs = kit.settings.node[type] ?? [];
      const { values, dropped } = checkSettings(
        defs,
        raw,
        { frame: settings, kit: {}, topLevel },
        col.note,
        `A ${type}`,
      );
      col.dropped += dropped;
      const props: Record<string, unknown> = {};
      const text: Record<string, string> = {};
      for (const def of defs) {
        if (!(def.key in values)) continue;
        if (def.store === 'text') text[def.key] = String(values[def.key]);
        else props[def.key] = values[def.key];
      }
      return { props, text };
    },
    frame: settings,
    note: col.note,
    moved: () => {
      col.movedCount++;
    },
  };
}

/** The frame settings a spec may set: those with definitions, plus the kit's editable lists (menus, links). */
function checkFrameSettings(kit: Kit, raw: unknown, col: Collector): Record<string, unknown> {
  if (!isObject(raw)) return {};
  const lists = Object.keys(kit.frameDefaults?.({}) ?? {});
  const listRaw: Record<string, unknown> = {};
  const defRaw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) (lists.includes(k) ? listRaw : defRaw)[k] = v;
  const { values, dropped } = checkSettings(
    kit.settings.frame,
    defRaw,
    { frame: {}, kit: {}, topLevel: [] },
    col.note,
    'Frame settings',
    true,
  );
  col.dropped += dropped;
  // Lists such as the navigation are plain nested data; keep them within sane size and depth.
  for (const [k, v] of Object.entries(listRaw)) {
    const cleaned = JSON.parse(JSON.stringify(v ?? null), (_k, val) =>
      typeof val === 'string' ? val.slice(0, 200) : val,
    ) as unknown;
    if (Array.isArray(cleaned) && cleaned.length <= 50) values[k] = cleaned;
  }
  return values;
}

/** Turn one raw page of a spec into a frame's worth of nodes, repairing and reporting as it goes. */
export function pageFromSpec(
  raw: unknown,
  shared: Record<string, unknown>,
  index: number,
  defaultKitId: KitId,
): ImportedPage {
  if (!isObject(raw)) throw new SpecError(`Page ${index + 1} isn’t an object.`);
  const col = new Collector();
  const kitName =
    typeof raw.kit === 'string' ? raw.kit : typeof shared.kit === 'string' ? shared.kit : undefined;
  if (kitName !== undefined && !hasKit(kitName))
    throw new SpecError(
      `Page ${index + 1} uses the kit “${cleanString(kitName, 40) ?? ''}”, which this app doesn’t have. Kits: ${KITS.map((k) => k.id).join(', ')}.`,
    );
  const kit = getKit(kitName ?? defaultKitId);
  if (kitName === undefined) col.note(`No kit was given, so “${kit.id}” was used.`);

  const device = (
    typeof raw.device === 'string' && raw.device in DEVICES ? raw.device : 'desktop'
  ) as DeviceId;
  const w = typeof raw.width === 'number' && Number.isFinite(raw.width) ? raw.width : undefined;
  const width = Math.round(Math.min(3000, Math.max(240, w ?? DEVICES[device].width)));
  const settings = checkFrameSettings(kit, raw.settings, col);
  const ctx = makeContext(kit, settings, col);
  const blocks = Array.isArray(raw.page) ? raw.page.slice(0, LIMITS.blocks) : [];
  if (!Array.isArray(raw.page)) col.note('The page has no "page" list, so the frame is empty.');
  const { root, nodes } = kit.pageSpec.build(blocks, ctx);

  const frameName = cleanString(raw.name, LIMITS.nameChars)?.trim() || `Imported page ${index + 1}`;
  const placeholders = [...col.placeholders].map(([name, count]) => ({ name, count }));
  return {
    name: frameName,
    kitId: kit.id,
    device,
    width: w === undefined ? DEVICES[device].width : width,
    ...(Object.keys(settings).length ? { settings } : {}),
    root,
    nodes,
    report: {
      frameName,
      kitId: kit.id,
      components: col.components,
      placeholders,
      unknownVariants: col.unknownVariants,
      dropped: col.dropped,
      moved: col.movedCount,
      notes: [...col.notes],
    },
  };
}

/** Parse and convert a page spec file (or pasted JSON) into pages ready to become frames. */
export function importPageSpec(text: string, defaultKitId: KitId): ImportedPage[] {
  const { pages, shared } = parsePageSpecText(text);
  return pages.map((p, i) => pageFromSpec(p, shared, i, defaultKitId));
}

/** One sentence for the top of the report: "Imported 24 components. 2 placeholders: 'Map'…". */
export function summariseReport(r: PageImportReport): string {
  const parts = [`Imported ${r.components} component${r.components === 1 ? '' : 's'}.`];
  const ph = r.placeholders.reduce((n, p) => n + p.count, 0);
  if (ph)
    parts.push(
      `${ph} placeholder${ph === 1 ? '' : 's'}: ${r.placeholders.map((p) => `“${p.name}”${p.count > 1 ? ` (${p.count})` : ''}`).join(', ')}.`,
    );
  if (r.unknownVariants)
    parts.push(
      `${r.unknownVariants} unknown variant${r.unknownVariants === 1 ? '' : 's'} replaced.`,
    );
  if (r.dropped)
    parts.push(
      `${r.dropped} unknown text key${r.dropped === 1 ? '' : 's'}, option${r.dropped === 1 ? '' : 's'} or setting${r.dropped === 1 ? '' : 's'} dropped.`,
    );
  if (r.moved) parts.push(`${r.moved} item${r.moved === 1 ? '' : 's'} moved to a valid place.`);
  return parts.join(' ');
}

// ---- Export ----

/** A frame as a page spec (one page). Pictures can't be carried, so they are left out and noted. */
export function frameToSpec(
  doc: MockupDoc,
  frameId: string,
): { spec: Record<string, unknown>; notes: string[] } | null {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) return null;
  const kit = getKit(frame.kitId);
  const notes: string[] = [];
  const settings: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(frame.settings ?? {})) {
    if (typeof v === 'string' && v.startsWith('img_'))
      notes.push('Pictures aren’t included in a page spec.');
    else settings[k] = v;
  }
  const hasImage = Object.values(doc.nodes).some(
    (n) =>
      n.type === 'component' &&
      Object.keys((n.props?.images as object | undefined) ?? {}).length > 0,
  );
  if (hasImage) notes.push('Pictures aren’t included in a page spec.');
  const spec: Record<string, unknown> = {
    format: SPEC_FORMAT,
    version: SPEC_VERSION,
    kit: kit.id,
    name: frame.name,
    device: frame.device === 'custom' ? 'desktop' : frame.device,
    ...(frame.device === 'custom' ? { width: frame.width } : {}),
    settings,
    page: kit.pageSpec.read(frame as Frame, doc.nodes),
  };
  return { spec, notes: [...new Set(notes)] };
}

/** Pretty JSON for one or several frames. Several frames become a `pages` list. */
export function framesToSpecText(
  doc: MockupDoc,
  frameIds: string[],
): { text: string; notes: string[] } | null {
  const made = frameIds.map((id) => frameToSpec(doc, id)).filter((m) => m !== null);
  if (made.length === 0) return null;
  const notes = [...new Set(made.flatMap((m) => m.notes))];
  if (made.length === 1) return { text: JSON.stringify(made[0]!.spec, null, 2), notes };
  const spec = {
    format: SPEC_FORMAT,
    version: SPEC_VERSION,
    pages: made.map((m) => {
      const { format: _f, version: _v, ...page } = m.spec; // eslint-disable-line @typescript-eslint/no-unused-vars
      return page;
    }),
  };
  return { text: JSON.stringify(spec, null, 2), notes };
}
