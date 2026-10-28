import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary } from './helpers';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: Page) => page.frameLocator('iframe[title="Home"]');
const openHistory = async (page: Page) => {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Version history/ }).click();
  return page.getByRole('dialog', { name: 'Version history' });
};

test('save a version, change the page, compare, restore, and undo the restore', async ({
  page,
}) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  let dialog = await openHistory(page);
  await expect(dialog.getByTestId('history-empty')).toBeVisible();
  await dialog.getByLabel('Version name').fill('Just a heading');
  await dialog.getByRole('button', { name: 'Save version' }).click();
  await expect(dialog.getByTestId('history-list')).toContainText('Just a heading');
  await expect(dialog.getByTestId('history-summary')).toHaveText('Since then: No differences');
  await page.keyboard.press('Escape');

  await addFromLibrary(page, 'button', 'Brand Dark');
  await expect(home(page).locator('button.nsw-button')).toHaveCount(1);

  dialog = await openHistory(page);
  await expect(dialog.getByTestId('history-summary')).toHaveText('Since then: 1 frame changed');
  await dialog.getByRole('button', { name: 'What changed' }).click();
  await expect(dialog.getByTestId('history-diff')).toContainText('1 component added');
  await dialog.getByRole('button', { name: 'Restore', exact: true }).click();
  await page
    .getByRole('dialog', { name: /Restore “Just a heading”/ })
    .getByRole('button', { name: 'Restore' })
    .click();
  await expect(home(page).locator('button.nsw-button')).toHaveCount(0);
  await expect(home(page).locator('h1')).toHaveCount(1);

  // Restoring kept what was there first, and Undo brings it back.
  dialog = await openHistory(page);
  await expect(dialog.getByTestId('history-list')).toContainText(
    'Before restoring “Just a heading”',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home(page).locator('button.nsw-button')).toHaveCount(1);
});

test('versions survive a reload, open as a new mockup, and can be deleted', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  let dialog = await openHistory(page);
  await dialog.getByRole('button', { name: 'Save version' }).click(); // default name
  await expect(dialog.getByTestId('history-list')).toContainText('Version 1');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('save-status')).toHaveText('Saved');
  await page.reload();
  dialog = await openHistory(page);
  await expect(dialog.getByTestId('history-list')).toContainText('Version 1');

  await dialog.getByRole('button', { name: 'Open as new mockup' }).click();
  await expect(page.getByRole('button', { name: 'Untitled mockup (Version 1)' })).toBeVisible();
  await expect(home(page).locator('h1')).toHaveCount(1);

  dialog = await openHistory(page);
  await expect(dialog.getByTestId('history-empty')).toBeVisible(); // the new mockup has its own history
  await page.keyboard.press('Escape');
});

test('delete removes a version', async ({ page }) => {
  const dialog = await openHistory(page);
  await dialog.getByRole('button', { name: 'Save version' }).click();
  await expect(dialog.getByTestId('history-list')).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: /Delete “/ })
    .getByRole('button', { name: 'Delete version' })
    .click();
  await expect(dialog.getByTestId('history-empty')).toBeVisible();
});
