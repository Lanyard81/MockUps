import { expect, test } from '@playwright/test';

// This file is about the first run, so it starts with empty storage.
test.use({ storageState: { cookies: [], origins: [] } });

test('the first-run tour shows four tips, closes, and never comes back', async ({ page }) => {
  await page.goto('./');
  const tour = page.getByRole('dialog', { name: /Build a screen/ });
  await expect(tour).toBeVisible();
  await expect(tour).toContainText('Tip 1 of 4');
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog')).toContainText('Tip 2 of 4');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Tip 1 of 4');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('dialog')).toContainText('Tip 4 of 4');
  await page.getByRole('button', { name: 'Start building' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('viewport')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Skip tour also closes it for good', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('the tour does not get in the way of building', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByTestId('component-button')
    .getByRole('button', { name: 'Brand Dark', exact: true })
    .click();
  await expect(page.frameLocator('iframe[title="Home"]').locator('.nsw-button--dark')).toHaveCount(
    1,
  );
});
