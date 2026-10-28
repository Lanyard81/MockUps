import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary } from './helpers';

const home = (page: Page) => page.frameLocator('iframe[title="Home"]');

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-persistence', 'ready');
});

test('a reload straight after an edit keeps it', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.reload();
  await expect(home(page).locator('h1')).toHaveCount(1);
});

test('deleting a page says so and Undo is one click away', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.locator('.frame__label').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Delete page' }).click();
  await expect(page.locator('.frame')).toHaveCount(0);
  const toast = page.locator('.toast');
  await expect(toast).toContainText('Deleted page “Home”');
  await toast.getByRole('button', { name: 'Bring it back' }).click();
  await expect(page.locator('.frame')).toHaveCount(1);
  await expect(home(page).locator('h1')).toHaveCount(1);
});

test('New mockup asks first, names what stays saved, and Cancel keeps the page', async ({
  page,
}) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: 'New mockup' }).click();
  const ask = page.getByRole('dialog', { name: 'Start a new mockup?' });
  await expect(ask).toContainText('stays saved in this browser');
  await ask.getByRole('button', { name: 'Cancel' }).click();
  await expect(home(page).locator('h1')).toHaveCount(1);
});

test('an empty mockup starts a new one without asking', async ({ page }) => {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: 'New mockup' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a second tab saving the same mockup pauses saving here until you choose', async ({
  page,
  context,
}) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await expect(page.getByTestId('save-status')).toHaveText('Saved');
  const other = await context.newPage();
  await other.addInitScript(() => localStorage.setItem('pagewright.tourDone', '1'));
  await other.goto('./');
  await expect(other.frameLocator('iframe[title="Home"]').locator('h1')).toHaveCount(1);
  await addFromLibrary(other, 'button', 'Brand Dark');
  await expect(other.getByTestId('save-status')).toHaveText('Saved');

  // The first tab is told, and does not overwrite the other tab's button.
  const banner = page.getByRole('alert').filter({ hasText: 'changed in another tab' });
  await expect(banner).toBeVisible();
  await expect(page.getByTestId('save-status')).toHaveText('Changed in another tab');
  await banner.getByRole('button', { name: /Load the other tab/ }).click();
  await expect(home(page).locator('.nsw-button')).toHaveCount(1);
  await expect(banner).toHaveCount(0);
});

test('deleting a saved version asks first', async ({ page }) => {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Version history/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Version history' });
  await dialog.getByRole('button', { name: 'Save version' }).click();
  await dialog.getByRole('button', { name: 'Delete' }).first().click();
  const ask = page.getByRole('dialog', { name: /Delete “/ });
  await expect(ask).toContainText('can’t be brought back');
  await ask.getByRole('button', { name: 'Delete version' }).click();
});
