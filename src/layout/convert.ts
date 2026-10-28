import { getComponent } from '../catalogue';
import { KITS, getKit } from '../kits';
import type { ConversionSource, KitId } from '../kits/types';
import { newId } from '../lib/ids';
import type { DocNode, Frame, MockupDoc } from '../store/types';

/** What a conversion did, for the summary the person sees. */
export interface ConversionReport {
  fromKit: KitId;
  toKit: KitId;
  sourceName: string;
  /** Components and settings brought across. */
  converted: number;
  /** What had no equivalent and became a placeholder, by original name. */
  placeholders: { name: string; count: number }[];
  /** What became what: the original's name and the ids of the components it became (none: page settings). */
  mappings: { from: string; to: string[]; count: number }[];
  notes: string[];
}

export interface ConversionResult {
  frame: Frame;
  nodes: Record<string, DocNode>;
  report: ConversionReport;
}

const FRAME_GAP = 80;

/** The target kits a frame can be converted to (those with a conversion from its own kit). */
export function conversionTargets(sourceKitId: KitId): KitId[] {
  const from = getKit(sourceKitId).id;
  return KITS.map((k) => k.id).filter((id) => id !== from && !!findConversion(id, from));
}

const findConversion = (to: KitId, from: KitId) =>
  getKit(to).conversions?.find((c) => c.from === from);

function sourceFor(doc: MockupDoc, frame: Frame): ConversionSource {
  const kit = getKit(frame.kitId);
  const comp = (n: DocNode) => (n.componentId ? getComponent(n.componentId) : undefined);
  return {
    frame,
    nodes: doc.nodes,
    images: doc.images,
    chrome: kit.readChrome?.(frame) ?? null,
    textOf: (n, key) => {
      const own = n.text?.[key];
      if (own !== undefined) return own;
      const c = comp(n);
      // Text regions are the same across a component's variants; use the default variant's text.
      return c?.editable.find((e) => e.key === key)?.default ?? '';
    },
    variantOf: (n) => {
      const c = comp(n);
      return n.variant ?? c?.defaultVariant ?? '';
    },
    nameOf: (n) => comp(n)?.name ?? n.componentId ?? 'Unknown component',
  };
}

/**
 * Convert a frame into another kit. The result is a new frame (the original is not touched) with
 * the converted page, plus a report of what was and wasn't brought across. Null if the kits have
 * no conversion between them.
 */
export function convertFrame(
  doc: MockupDoc,
  frameId: string,
  targetKitId: KitId,
  makeId: (prefix: string) => string = newId,
): ConversionResult | null {
  const frame = doc.frames.find((f) => f.id === frameId);
  if (!frame) return null;
  const target = getKit(targetKitId);
  const conversion = findConversion(target.id, getKit(frame.kitId).id);
  if (!conversion || target.id === getKit(frame.kitId).id) return null;

  let converted = 0;
  const mappings = new Map<string, { from: string; to: string[]; count: number }>();
  const unmapped = new Map<string, number>();
  const notes = new Set<string>();
  const page = conversion.convert(sourceFor(doc, frame), {
    makeId,
    mapped: (from, to) => {
      converted++;
      if (!from) return;
      const key = `${from}→${(to ?? []).join('+')}`;
      const m = mappings.get(key) ?? { from, to: to ?? [], count: 0 };
      m.count++;
      mappings.set(key, m);
    },
    unmapped: (name) => unmapped.set(name, (unmapped.get(name) ?? 0) + 1),
    note: (text) => void notes.add(text),
  });

  const out: Frame = {
    id: makeId('f'),
    // Converting a copy again doesn't stack suffixes: "Home (NSW)" becomes "Home (SharePoint)", not "Home (NSW) (SharePoint)".
    name: `${frame.name.replace(/ \((NSW|SharePoint|Simple)\)$/, '')} (${target.shortLabel})`,
    kitId: target.id,
    ...(page.settings && Object.keys(page.settings).length ? { settings: page.settings } : {}),
    device: frame.device,
    width: frame.width,
    // To the right of everything, so the copy never lands on another page or its label.
    x: Math.max(...doc.frames.map((f) => f.x + f.width)) + FRAME_GAP,
    y: frame.y,
    root: page.root,
  };
  return {
    frame: out,
    nodes: page.nodes,
    report: {
      fromKit: getKit(frame.kitId).id,
      toKit: target.id,
      sourceName: frame.name,
      converted,
      placeholders: [...unmapped].map(([name, count]) => ({ name, count })),
      mappings: [...mappings.values()],
      notes: [...notes],
    },
  };
}
