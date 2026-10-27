import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { addFromLibrary } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf: Buffer) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
/** A solid red PNG of the given size. */
function redPng(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) row[1 + x * 3] = 255;
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const frameLabel = (page: Page) => page.getByTestId('frame-Home').locator('.frame__label');
const reference = (page: Page) => page.getByTestId('frame-reference');

/** Paste an image into the page, as the browser does for a copied screenshot. */
async function pasteImage(page: Page, png: Buffer) {
  await page.evaluate((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], 'shot.png', { type: 'image/png' }));
    window.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  }, png.toString('base64'));
}

test.describe('reference image', () => {
  test('pasting an image with only the frame selected adds it, over the content, at 40%', async ({
    page,
  }) => {
    await frameLabel(page).click();
    await pasteImage(page, redPng(393, 300));
    await expect(reference(page)).toHaveAttribute('data-placement', 'over');
    await expect(reference(page).locator('img')).toHaveCSS('opacity', '0.4');
    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
  });

  test('a component selected means paste is left alone', async ({ page }) => {
    await addFromLibrary(page, 'button', 'Brand Dark');
    await pasteImage(page, redPng(393, 300));
    await expect(reference(page)).toHaveCount(0);
  });

  test('a 2× screenshot offers to halve the width and match the frame', async ({ page }) => {
    await frameLabel(page).click();
    await pasteImage(page, redPng(2880, 200));
    const dialog = page.getByRole('dialog', { name: 'Match the page to the screenshot?' });
    await expect(dialog).toContainText('2× capture');
    await dialog.getByRole('button', { name: 'Set width to 1440px' }).click();
    await expect(page.getByTestId('frame-Home').locator('.frame__size')).toHaveText('1440px');
    await expect(page.getByLabel('Device')).toHaveValue('desktop');
  });

  test('the panel adds, changes, hides and removes it; each change undoes', async ({ page }) => {
    await frameLabel(page).click();
    await page.getByLabel('Reference image file').setInputFiles({
      name: 'shot.png',
      mimeType: 'image/png',
      buffer: redPng(393, 300),
    });
    await expect(reference(page)).toHaveCount(1);

    // The opacity slider: a drag is one undo entry.
    const slider = page.getByLabel('Reference opacity');
    await slider.focus();
    await slider.press('Home');
    await slider.press('ArrowRight');
    await slider.press('ArrowRight');
    await expect(reference(page).locator('img')).toHaveCSS('opacity', '0.02');

    await page.getByRole('button', { name: 'Behind' }).click();
    await expect(reference(page)).toHaveAttribute('data-placement', 'behind');
    await page.getByRole('button', { name: 'Beside' }).click();
    await expect(reference(page)).toHaveAttribute('data-placement', 'beside');
    await expect(reference(page).locator('img')).toHaveCSS('opacity', '1');
    await page.getByRole('button', { name: 'Over', exact: true }).click();

    await page.getByLabel(/^Show \(/).uncheck();
    await expect(reference(page)).toHaveCount(0);
    await page.getByLabel(/^Show \(/).check();
    await expect(reference(page)).toHaveCount(1);

    await page.getByLabel('Offset x').fill('12');
    await page.getByLabel('Offset x').press('Enter');
    await expect(reference(page).locator('img')).toHaveCSS('left', '12px');

    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(reference(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(reference(page)).toHaveCount(1);
  });

  test('dragging the opacity slider is one undo step', async ({ page }) => {
    await frameLabel(page).click();
    await pasteImage(page, redPng(393, 300));
    const slider = page.getByLabel('Reference opacity');
    await slider.scrollIntoViewIfNeeded();
    const box = (await slider.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 8 });
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(reference(page).locator('img')).not.toHaveCSS('opacity', '0.4');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(reference(page).locator('img')).toHaveCSS('opacity', '0.4');
    await expect(reference(page)).toHaveCount(1); // one step back, not all the way
  });

  test('dropping an image file on the frame adds it', async ({ page }) => {
    await page.evaluate((b64) => {
      const frame = document.querySelector<HTMLIFrameElement>('iframe[title="Home"]')!;
      const doc = frame.contentDocument!;
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], 'shot.png', { type: 'image/png' }));
      doc.body.dispatchEvent(
        new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }),
      );
    }, redPng(393, 300).toString('base64'));
    await expect(reference(page)).toHaveCount(1);
  });

  test('behind makes the page see-through; the content stays on top and clickable', async ({
    page,
  }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await frameLabel(page).click();
    await pasteImage(page, redPng(393, 300));
    await page.getByRole('button', { name: 'Behind' }).click();
    const bg = await page.evaluate(() => {
      const d = document.querySelector<HTMLIFrameElement>('iframe[title="Home"]')!.contentDocument!;
      return getComputedStyle(d.body).backgroundColor;
    });
    expect(bg).toBe('rgba(0, 0, 0, 0)');
    await page.getByRole('button', { name: 'Over', exact: true }).click();
    const back = await page.evaluate(() => {
      const d = document.querySelector<HTMLIFrameElement>('iframe[title="Home"]')!.contentDocument!;
      return d.getElementById('ref-behind') === null;
    });
    expect(back).toBe(true);
  });

  test('the shortcut shows and hides it', async ({ page }) => {
    await frameLabel(page).click();
    await pasteImage(page, redPng(393, 300));
    await expect(reference(page)).toHaveCount(1);
    await page.keyboard.press('Control+Shift+R');
    await expect(reference(page)).toHaveCount(0);
    await page.keyboard.press('Control+Shift+R');
    await expect(reference(page)).toHaveCount(1);
  });

  test('it never appears in Preview, and the PNG export is unchanged by it', async ({ page }) => {
    await addFromLibrary(page, 'card', 'Default');
    const exportPng = async () => {
      await page.getByRole('button', { name: 'File' }).click();
      await page.getByRole('menuitem', { name: /Export/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Export' });
      await dialog.getByLabel('1× (normal)').check();
      const [d] = await Promise.all([
        page.waitForEvent('download'),
        dialog.getByRole('button', { name: 'Export', exact: true }).click(),
      ]);
      return readFileSync(await d.path());
    };
    const without = await exportPng();

    await frameLabel(page).click();
    await pasteImage(page, redPng(393, 600));
    await expect(reference(page)).toHaveCount(1);
    const withRef = await exportPng();
    expect(withRef.equals(without)).toBe(true);

    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(reference(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(reference(page)).toHaveCount(1);
  });

  test('it is saved with the mockup and survives a reload', async ({ page }) => {
    await frameLabel(page).click();
    await pasteImage(page, redPng(393, 300));
    await expect(page.getByTestId('save-status')).toHaveText('Saved');
    await page.reload();
    await expect(reference(page)).toHaveCount(1);
  });
});
