let counter = 0;

/** Short unique id with a readable prefix, e.g. `f_k3j9x2a`. */
export function newId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${Date.now().toString(36)}${rand}${counter.toString(36)}`;
}
