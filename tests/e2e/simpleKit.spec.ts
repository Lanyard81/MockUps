import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

test('a Simple frame takes Simple components and a template', async ({ page }) => {
  await page.getByRole('button', { name: 'Add page' }).click();
  await page
    .getByRole('group', { name: 'Style kit for the new page' })
    .getByRole('button', { name: 'Simple' })
    .click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  const frame = page.getByTestId('frame-Desktop 2');
  await expect(frame.locator('.frame__kit, .frame__badge').first()).toContainText('Simple');

  await frame.locator('.frame__label').click();
  await page.getByTestId('component-sk-card').getByRole('button', { name: 'With picture' }).click();
  const inner = page.frameLocator('iframe[title="Desktop 2"]');
  await expect(inner.locator('.sk-card')).toHaveCount(1);
  await expect(inner.locator('.sk-column')).toHaveCount(1);
});
