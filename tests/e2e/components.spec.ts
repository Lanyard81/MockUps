import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary, centre, dragBetween, frameBox } from './helpers';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: Page) => page.frameLocator('iframe[title="Home"]');

async function saveCard(page: Page, name: string) {
  await addFromLibrary(page, 'card', 'Default');
  await home(page).locator('.nsw-card__title').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Save as component…' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Save component' }).click();
}

test('save a component, then add it by click and by drag; it survives a reload', async ({
  page,
}) => {
  await saveCard(page, 'Promo card');
  const mine = page.getByTestId('my-components');
  await expect(mine.getByText('Promo card')).toBeVisible();
  await expect(home(page).locator('.nsw-card')).toHaveCount(1);

  await mine.locator('.mine__main', { hasText: 'Promo card' }).click();
  await expect(home(page).locator('.nsw-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home(page).locator('.nsw-card')).toHaveCount(1);

  // Drag onto a freeform frame: it lands where it is dropped.
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page
    .getByRole('group', { name: 'Layout for the new frame' })
    .getByRole('button', { name: 'Freeform' })
    .click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  await page.getByRole('button', { name: 'Zoom to fit' }).click();
  await page.waitForTimeout(300);
  const fb = await frameBox(page, 'Desktop 2');
  const row = mine.locator('.mine__main', { hasText: 'Promo card' });
  await dragBetween(page, await centre(row), { x: fb.x + fb.width * 0.5, y: fb.y + 150 });
  await expect(
    page.frameLocator('iframe[title="Desktop 2"]').locator('[data-free] .nsw-card'),
  ).toHaveCount(1);

  await expect(page.getByTestId('save-status')).toHaveText('Saved');
  await page.reload();
  await expect(page.getByTestId('my-components').getByText('Promo card')).toBeVisible();
});

test('deleting a saved component asks first and leaves pages alone', async ({ page }) => {
  await saveCard(page, 'Temp');
  await page.getByRole('button', { name: 'Delete “Temp”' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByTestId('my-components')).toHaveCount(0);
  await expect(home(page).locator('.nsw-card')).toHaveCount(1);
});

test('saved components go to the other kit’s library only for that kit', async ({ page }) => {
  await saveCard(page, 'NSW card');
  await page.getByRole('button', { name: 'SharePoint', exact: true }).click();
  await expect(page.getByTestId('my-components')).toHaveCount(0);
  await page.getByRole('button', { name: 'NSW', exact: true }).click();
  await expect(page.getByTestId('my-components')).toBeVisible();
});
