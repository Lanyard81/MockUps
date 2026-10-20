import { describe, expect, it } from 'vitest';
import { createZip } from '../src/export/zip';

const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());
const u16 = (a: Uint8Array, o: number) => a[o]! | (a[o + 1]! << 8);
const u32 = (a: Uint8Array, o: number) =>
  (a[o]! | (a[o + 1]! << 8) | (a[o + 2]! << 16) | (a[o + 3]! << 24)) >>> 0;

describe('zip', () => {
  it('writes a readable archive: signatures, names, sizes and checksums', async () => {
    const zip = await bytes(
      createZip(
        [
          { name: 'a.txt', data: 'hello' },
          { name: 'dir/b.bin', data: new Uint8Array([1, 2, 3]) },
        ],
        new Date(2026, 9, 20, 12, 30, 40),
      ),
    );

    // End of central directory is the last 22 bytes.
    const end = zip.length - 22;
    expect(u32(zip, end)).toBe(0x06054b50);
    expect(u16(zip, end + 10)).toBe(2);
    const centralOffset = u32(zip, end + 16);

    // First local header: stored, 5 bytes, CRC-32 of "hello".
    expect(u32(zip, 0)).toBe(0x04034b50);
    expect(u32(zip, 14)).toBe(0x3610a686);
    expect(u32(zip, 18)).toBe(5);
    expect(new TextDecoder().decode(zip.slice(30, 35))).toBe('a.txt');
    expect(new TextDecoder().decode(zip.slice(35, 40))).toBe('hello');

    // Central directory points back at the local headers.
    expect(u32(zip, centralOffset)).toBe(0x02014b50);
    expect(u32(zip, centralOffset + 42)).toBe(0);
    const second = centralOffset + 46 + 'a.txt'.length;
    expect(u32(zip, second)).toBe(0x02014b50);
    expect(u32(zip, zip.length - 22 + 12)).toBe(second + 46 + 'dir/b.bin'.length - centralOffset);
  });

  it('handles an empty archive', async () => {
    const zip = await bytes(createZip([]));
    expect(zip.length).toBe(22);
    expect(u32(zip, 0)).toBe(0x06054b50);
  });
});
