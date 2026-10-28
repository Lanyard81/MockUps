import { describe, expect, it } from 'vitest';
import { buildPdf } from '../src/export/pdf';

const text = async (b: Blob) => new TextDecoder('latin1').decode(await b.arrayBuffer());

describe('buildPdf', () => {
  it('writes a page per picture, sized in points, with a correct cross-reference table', async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const out = await text(
      buildPdf([
        { jpeg, width: 400, height: 800 },
        { jpeg, width: 200, height: 100 },
      ]),
    );
    expect(out.startsWith('%PDF-1.4')).toBe(true);
    expect(out).toContain('/Count 2');
    expect(out).toContain('/MediaBox [0 0 300 600]');
    expect(out).toContain('/MediaBox [0 0 150 75]');
    expect(out).toContain('/Width 400 /Height 800');
    // Every xref entry points at its "n 0 obj".
    const start = Number(/startxref\n(\d+)/.exec(out)![1]);
    expect(out.slice(start, start + 4)).toBe('xref');
    const rows = out.slice(start).split('\n').slice(3, 9);
    rows.forEach((row, i) => {
      const at = Number(row.slice(0, 10));
      expect(out.slice(at, at + 8)).toBe(`${i + 1} 0 obj\n`);
    });
  });
});

describe('buildPdf on a fixed sheet', () => {
  it('sizes the page as the sheet and draws the picture at its width from the top', async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const out = await text(
      buildPdf([{ jpeg, width: 400, height: 500, sheet: { width: 794, height: 1123 } }]),
    );
    expect(out).toContain('/MediaBox [0 0 595.5 842.25]');
    // The picture is scaled to 595.5pt wide, 744.38pt tall, and sits at the top (842.25 - 744.38).
    expect(out).toContain('q 595.5 0 0 744.38 0 97.87 cm /Im0 Do Q');
  });
});
