/**
 * A minimal PDF writer (Milestone G10): one page per picture, each page exactly the size of its picture
 * (1 CSS pixel = 0.75pt). No library: the pictures are JPEGs, which a PDF can carry as they are.
 */
export interface PdfPage {
  jpeg: Uint8Array;
  /** Picture size in pixels. */
  width: number;
  height: number;
  /** A fixed sheet size in pixels: the picture is scaled to its width and sits at the top. Default: the sheet is the picture. */
  sheet?: { width: number; height: number };
}

const enc = new TextEncoder();

export function buildPdf(pages: PdfPage[]): Blob {
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: Uint8Array | string) => {
    const bytes = typeof chunk === 'string' ? enc.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (n: number, body: string | (Uint8Array | string)[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    for (const piece of Array.isArray(body) ? body : [body]) push(piece);
    push('\nendobj\n');
  };

  // Objects: 1 catalogue, 2 page tree, then per page: page, content, image.
  push('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  object(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((p, i) => {
    const page = 3 + i * 3;
    const sheetW = +((p.sheet?.width ?? p.width) * 0.75).toFixed(2);
    const sheetH = +((p.sheet?.height ?? p.height) * 0.75).toFixed(2);
    // The picture fills the sheet, or (on a fixed sheet) the sheet's width, from the top.
    const w = sheetW;
    const h = p.sheet ? +((p.height * sheetW) / p.width).toFixed(2) : sheetH;
    const y = +(sheetH - h).toFixed(2);
    object(
      page,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${sheetW} ${sheetH}] /Contents ${page + 1} 0 R /Resources << /XObject << /Im0 ${page + 2} 0 R >> >> >>`,
    );
    const draw = `q ${w} 0 0 ${h} 0 ${y} cm /Im0 Do Q`;
    object(page + 1, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
    object(page + 2, [
      `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
      p.jpeg,
      '\nendstream',
    ]);
  });

  const count = 3 + pages.length * 3;
  const xref = length;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let n = 1; n < count; n++) push(`${String(offsets[n]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}

/** A4 at 96 pixels to the inch. */
export const A4 = { width: 794, height: 1123 };

/**
 * A PNG as JPEG pages: one page the size of the picture, or (with `a4`) as many A4 sheets as it takes,
 * the picture scaled to the sheet's width and cut into sheet-height slices. On white, so transparency
 * doesn't turn black.
 */
export async function pngToJpegPages(png: Blob, a4 = false, quality = 0.92): Promise<PdfPage[]> {
  const bitmap = await createImageBitmap(png);
  const slice = a4 ? Math.floor((A4.height * bitmap.width) / A4.width) : bitmap.height;
  const pages: PdfPage[] = [];
  for (let top = 0; top < bitmap.height; top += slice) {
    const h = Math.min(slice, bitmap.height - top);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, top, bitmap.width, h, 0, 0, bitmap.width, h);
    const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (!jpeg) throw new Error('Could not make the page image.');
    pages.push({
      jpeg: new Uint8Array(await jpeg.arrayBuffer()),
      width: bitmap.width,
      height: h,
      ...(a4 ? { sheet: A4 } : {}),
    });
  }
  return pages;
}

/** A PNG as JPEG bytes (on white, so transparency doesn't turn black) plus its pixel size. */
export async function pngToJpegPage(png: Blob, quality = 0.92): Promise<PdfPage> {
  const bitmap = await createImageBitmap(png);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!jpeg) throw new Error('Could not make the page image.');
  return {
    jpeg: new Uint8Array(await jpeg.arrayBuffer()),
    width: bitmap.width,
    height: bitmap.height,
  };
}
