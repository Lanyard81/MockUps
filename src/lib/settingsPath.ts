/**
 * Settings are plain JSON (strings, numbers, booleans, lists and objects). A path such as
 * `navItems.1.children.0.label` reaches one value inside them: names are object keys, numbers are
 * list positions. Used to edit one piece of a list in place and keep the change one undo step.
 */
const isIndex = (s: string) => /^\d+$/.test(s);
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

/** Read the value at a path, or undefined. */
export function getAtPath(root: unknown, path: string): unknown {
  let cur = root;
  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * A patch for `settings` that sets the value at `path`. The patch holds the whole top-level value
 * that changed (the first segment), copied, so it can be merged like any other settings change.
 * `defaults` supplies a top-level value the settings haven't stored yet (a default menu, say).
 * Returns null if the path doesn't lead anywhere.
 */
export function patchAtPath(
  settings: Record<string, unknown> | undefined,
  defaults: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> | null {
  const [head, ...rest] = path.split('.');
  if (!head || FORBIDDEN.has(head) || rest.some((p) => FORBIDDEN.has(p))) return null;
  if (rest.length === 0) return { [head]: value };
  const base = settings?.[head] ?? defaults[head];
  if (base === undefined || base === null || typeof base !== 'object') return null;
  const root = structuredClone(base) as unknown;
  let cur = root as Record<string, unknown> | unknown[];
  for (let i = 0; i < rest.length - 1; i++) {
    const key = rest[i]!;
    const next = (cur as Record<string, unknown>)[isIndex(key) ? Number(key) : key];
    if (next === null || typeof next !== 'object') return null;
    cur = next as Record<string, unknown> | unknown[];
  }
  const last = rest[rest.length - 1]!;
  if (!(isIndex(last) ? Number(last) in cur : last in cur)) return null;
  (cur as Record<string, unknown>)[isIndex(last) ? Number(last) : last] = value;
  return { [head]: root };
}
