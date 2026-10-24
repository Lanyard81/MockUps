import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { addFromLibrary, frameBox } from './helpers';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const pins = (page: Page) => page.getByTestId('comment-pin');

/** Pin a note at an offset inside the Home frame and type its text. */
async function pin(page: Page, dx: number, dy: number, text: string) {
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  const fb = await frameBox(page, 'Home');
  await page.mouse.click(fb.x + dx, fb.y + dy);
  await page.getByLabel('Comment text').fill(text);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
}

test('pin a note, find it in the list, mark it done, delete it, and undo', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await pin(page, 60, 80, 'Make this larger');
  await expect(pins(page)).toHaveCount(1);
  await expect(pins(page).first()).toHaveText('1');

  await page.getByRole('tab', { name: 'Comments' }).click();
  await expect(page.getByTestId('comments-list')).toContainText('Make this larger');
  await expect(page.getByTestId('comments-list')).toContainText('Home');

  // Open it from the list, mark it done: it leaves the open list but stays until deleted.
  await page.getByTestId('comments-list').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByTestId('comments-empty')).toHaveText('No open comments.');
  await page.getByLabel('Show done').check();
  await expect(page.getByTestId('comments-list')).toContainText('done');

  await pins(page).first().click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(pins(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(pins(page)).toHaveCount(1);
});

test('an empty note is not kept, and Esc puts the tool away', async ({ page }) => {
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  const fb = await frameBox(page, 'Home');
  await page.mouse.click(fb.x + 50, fb.y + 50);
  await expect(page.getByLabel('Comment text')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(pins(page)).toHaveCount(0);

  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Comment', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Comment', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('notes are saved with the mockup, hidden in Preview, and listed as Markdown', async ({
  page,
}) => {
  await pin(page, 70, 90, 'Check the wording');
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(pins(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(pins(page)).toHaveCount(1);
  await expect(page.getByTestId('save-status')).toHaveText('Saved');
  await page.reload();
  await expect(pins(page)).toHaveCount(1);

  await page.getByRole('tab', { name: 'Comments' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download (.md)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('untitled-mockup.comments.md');
  expect(readFileSync(await download.path(), 'utf8')).toContain('1. Check the wording');
});

test('the PNG can mark open comments, and is the plain image when that is off', async ({
  page,
}) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await pin(page, 70, 90, 'Look here');
  const exportPng = async (marks: boolean) => {
    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /Export/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Export' });
    await dialog.getByLabel('1× (normal)').check();
    const box = dialog.getByLabel('Mark open comments on the image');
    if (marks) await box.check();
    else await box.uncheck();
    const [d] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'Export', exact: true }).click(),
    ]);
    return readFileSync(await d.path());
  };
  const plain = await exportPng(false);
  const marked = await exportPng(true);
  expect(marked.equals(plain)).toBe(false);
  expect(plain.subarray(1, 4).toString()).toBe('PNG');
  expect(marked.subarray(1, 4).toString()).toBe('PNG');
});
