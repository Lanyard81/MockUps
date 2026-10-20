import type { SettingContext, SettingDef } from '../kits/types';

export const MAX_TEXT = 5000;

/** A string with control characters (other than a line break) removed, at most `max` long. */
export function cleanString(v: unknown, max = MAX_TEXT): string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) v = String(v);
  if (typeof v !== 'string') return undefined;
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').slice(0, max);
}

/** A link address that is safe to keep: web, mail and phone links, in-page links and relative paths. */
export function safeHref(v: unknown): string | undefined {
  const s = cleanString(v, 2000)?.trim();
  if (!s) return undefined;
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(s)) return s;
  return /^[a-z][a-z0-9+.-]*:/i.test(s) ? undefined : s;
}

/**
 * Check one value against a setting's definition. Returns the value to keep, or `undefined` when it
 * isn't valid for that setting (the caller drops it and says so).
 */
export function checkSetting(
  def: SettingDef,
  value: unknown,
): string | number | boolean | undefined {
  switch (def.type) {
    case 'swatches':
    case 'segmented':
    case 'select':
      return typeof value === 'string' && def.options.some((o) => o.id === value)
        ? value
        : undefined;
    case 'toggle':
      return typeof value === 'boolean' ? value : undefined;
    case 'text':
      return cleanString(value, 2000);
    case 'color':
      return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
    case 'number': {
      const n = typeof value === 'number' ? value : NaN;
      return Number.isFinite(n) ? Math.min(def.max, Math.max(def.min, n)) : undefined;
    }
  }
}

/**
 * Check a set of values (a frame's settings, a section's properties) against definitions. Unknown keys,
 * invalid values and settings that can't apply in this context are dropped, each reported once.
 */
export function checkSettings(
  defs: SettingDef[],
  raw: unknown,
  ctx: Omit<SettingContext, 'values'>,
  note: (text: string) => void,
  what: string,
  /** The values are the frame's own settings, so rules about "the frame" read them. */
  frameIsValues = false,
): { values: Record<string, unknown>; dropped: number } {
  const values: Record<string, unknown> = {};
  let dropped = 0;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { values, dropped };
  const input = raw as Record<string, unknown>;
  for (const def of defs) {
    if (!(def.key in input)) continue;
    const v = checkSetting(def, input[def.key]);
    if (v === undefined) {
      dropped++;
      note(`${what}: “${def.key}” has a value that isn’t allowed, so it was left out.`);
      continue;
    }
    values[def.key] = v;
  }
  // Settings that can't apply given the others (e.g. a footer on a team site) are dropped with the reason.
  for (const def of defs) {
    if (!(def.key in values)) continue;
    const why = def.unavailable?.({ ...ctx, ...(frameIsValues ? { frame: values } : {}), values });
    if (why) {
      delete values[def.key];
      dropped++;
      note(`${what}: “${def.key}” was left out. ${why}`);
    }
  }
  const known = new Set(defs.map((d) => d.key));
  for (const k of Object.keys(input))
    if (!known.has(k)) {
      dropped++;
      note(`${what}: “${k}” isn’t a setting, so it was left out.`);
    }
  return { values, dropped };
}
