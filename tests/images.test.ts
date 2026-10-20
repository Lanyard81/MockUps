import { describe, expect, it } from 'vitest';
import { fitWithin, imageId } from '../src/persistence/images';

describe('images', () => {
  it('scales large images down to 1600px on the long side, keeping the ratio', () => {
    expect(fitWithin(3200, 1600)).toEqual({ width: 1600, height: 800 });
    expect(fitWithin(1000, 4000)).toEqual({ width: 400, height: 1600 });
  });

  it('never scales up', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1600, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('gives the same id to the same content and different ids to different content', async () => {
    const a = await imageId('data:image/png;base64,AAAA');
    expect(a).toMatch(/^img_[0-9a-f]+$/);
    expect(await imageId('data:image/png;base64,AAAA')).toBe(a);
    expect(await imageId('data:image/png;base64,BBBB')).not.toBe(a);
  });
});
