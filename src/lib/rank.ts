/** One thing the command palette can run. */
export interface RankItem {
  id: string;
  label: string;
  /** Extra words that should find it (not shown). */
  keywords?: string;
  group: string;
}

/**
 * Score how well `query` matches an item, or 0 for no match. Every word of the query has to appear;
 * the label starting with it, a word in the label starting with it, and a shorter label all score higher.
 */
export function scoreItem(item: RankItem, query: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;
  const label = item.label.toLowerCase();
  const hay = `${label} ${item.group.toLowerCase()} ${(item.keywords ?? '').toLowerCase()}`;
  let score = 0;
  for (const t of terms) {
    if (!hay.includes(t)) return 0;
    if (label.startsWith(t)) score += 40;
    else if (label.split(/[^a-z0-9]+/).some((w) => w.startsWith(t))) score += 25;
    else if (label.includes(t)) score += 12;
    else score += 4;
  }
  return score + Math.max(0, 20 - label.length / 4);
}

/** The items that match, best first (ties keep their order), at most `limit`. */
export function rankItems<T extends RankItem>(items: T[], query: string, limit = 60): T[] {
  return items
    .map((item, i) => ({ item, i, score: scoreItem(item, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((r) => r.item);
}
