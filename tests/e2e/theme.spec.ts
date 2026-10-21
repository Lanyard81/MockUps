import { expect, test } from '@playwright/test';

test('the editor is dark by default, can switch to light, and remembers it', async ({ page }) => {
  await page.goto('./');
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  // The editor chrome is glass over an aurora backdrop; the mockup itself is unaffected.
  await expect(page.locator('.toolbar')).toHaveCSS('border-radius', '999px');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
});

test('a frame stays white whatever the editor theme', async ({ page }) => {
  await page.goto('./');
  const body = page.locator('.frame__body').first();
  await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});
