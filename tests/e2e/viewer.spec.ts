import { expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addFromLibrary, frameBox } from './helpers';

test.use({ viewport: { width: 1700, height: 1000 } });

test('export a viewer file, open it from disk: tabs, click-through, comments', async ({
  page,
  browser,
}) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
  await addFromLibrary(page, 'heading', 'Heading 1');
  await addFromLibrary(page, 'button', 'Brand Dark');
  // A second frame, and a button that goes to it.
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page.getByRole('menuitem', { name: /iPhone/ }).click();
  await page.getByRole('button', { name: 'Zoom to fit' }).click();
  await page.waitForTimeout(300);
  await page.frameLocator('iframe[title="Home"]').locator('button.nsw-button').click();
  await page.getByLabel('Go to frame').selectOption({ label: 'iPhone 2' });
  // A note on the first frame.
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  const fb = await frameBox(page, 'Home');
  await page.mouse.click(fb.x + 40, fb.y + 120);
  await page.getByLabel('Comment text').fill('Needs a clearer title');
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Export/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Export' });
  await dialog.getByLabel('Viewer file (to share)').check();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('untitled-mockup-viewer.html');
  const dir = mkdtempSync(join(tmpdir(), 'viewer-'));
  const file = join(dir, 'viewer.html');
  writeFileSync(file, readFileSync(await download.path()));

  // Open it in a fresh browser context, from disk, with no network at all.
  const context = await browser.newContext({ offline: true });
  const v = await context.newPage();
  await v.goto(`file://${file}`);
  await expect(v.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'true');
  const frame = v.frameLocator('iframe[title="Home"]');
  await expect(frame.locator('h1')).toBeVisible();
  // Click through to the other frame, then Back.
  await frame.locator('a.nsw-button, button.nsw-button').first().click();
  await expect(v.getByRole('button', { name: 'iPhone 2' })).toHaveAttribute('aria-current', 'true');
  await v.getByRole('button', { name: 'Back' }).click();
  await expect(v.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'true');
  // Comments are hidden until asked for, then show as a pin and in the list.
  await expect(v.locator('.v-pin')).toHaveCount(0);
  await v.getByRole('button', { name: 'Comments' }).click();
  await expect(v.locator('.v-pin')).toHaveCount(1);
  await expect(v.getByRole('complementary', { name: 'Comments' })).toContainText(
    'Needs a clearer title',
  );
  // Nothing in the viewer can edit the mockup.
  await expect(v.getByRole('button', { name: 'Undo' })).toHaveCount(0);
  await context.close();
});
