import { describe, expect, it } from 'vitest';
import { titleCase } from '../src/app/properties/controls';

describe('titleCase', () => {
  it('turns text keys into readable labels', () => {
    expect(titleCase('g1link1')).toBe('Group 1 link 1');
    expect(titleCase('link2')).toBe('Link 2');
    expect(titleCase('copy-text')).toBe('Copy text');
    expect(titleCase('title')).toBe('Title');
  });
});
