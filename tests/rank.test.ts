import { describe, expect, it } from 'vitest';
import { rankItems, scoreItem, type RankItem } from '../src/lib/rank';

const item = (label: string, group = 'Action', keywords?: string): RankItem => ({
  id: label,
  label,
  group,
  keywords,
});

describe('palette ranking', () => {
  it('needs every word to match, in the label, group or hidden keywords', () => {
    expect(scoreItem(item('Zoom to fit'), 'zoom fit')).toBeGreaterThan(0);
    expect(scoreItem(item('Zoom to fit'), 'zoom card')).toBe(0);
    expect(scoreItem(item('Save to file', 'Action', 'download'), 'download')).toBeGreaterThan(0);
    expect(scoreItem(item('Card', 'Add component'), 'add')).toBeGreaterThan(0);
  });

  it('ranks a label that starts with the query above one that merely contains it', () => {
    const ranked = rankItems([item('Add card'), item('Card'), item('Scorecard')], 'card');
    expect(ranked.map((r) => r.label)).toEqual(['Card', 'Add card', 'Scorecard']);
  });

  it('is case-insensitive, lists everything for an empty query, and keeps order on ties', () => {
    const items = [item('Banana'), item('Apple'), item('Cherry')];
    expect(rankItems(items, '').map((r) => r.label)).toEqual(['Banana', 'Apple', 'Cherry']);
    expect(rankItems(items, 'APPLE')).toHaveLength(1);
  });

  it('limits the number of results', () => {
    const many = Array.from({ length: 200 }, (_, i) => item(`Item ${i}`));
    expect(rankItems(many, 'item', 25)).toHaveLength(25);
  });
});
