import { expect, test, type Page } from '@playwright/test';

/** Settings > Editor theme. */
async function chooseTheme(page: Page, theme: 'Dark' | 'Light') {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page
    .getByRole('group', { name: 'Editor theme' })
    .getByRole('button', { name: theme })
    .click();
  await page.keyboard.press('Escape');
}

test('the editor is dark by default, can switch to light, and remembers it', async ({ page }) => {
  await page.goto('./');
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  // The editor chrome is glass over an aurora backdrop; the mockup itself is unaffected.
  await expect(page.locator('.toolbar')).toHaveCSS('border-radius', '999px');
  await chooseTheme(page, 'Light');
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await chooseTheme(page, 'Dark');
  await expect(root).toHaveAttribute('data-theme', 'dark');
});

test('a frame stays white whatever the editor theme', async ({ page }) => {
  await page.goto('./');
  const body = page.locator('.frame__body').first();
  await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await chooseTheme(page, 'Light');
  await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('the glass look is the default; Flat is calm, remembered, and independent of dark and light', async ({
  page,
}) => {
  await page.goto('./');
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-look', 'glass');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page
    .getByRole('group', { name: 'Editor look' })
    .getByRole('button', { name: 'Flat' })
    .click();
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-look', 'flat');
  // Hairline-divided panels instead of floating pills; no blur anywhere on the chrome.
  await expect(page.locator('.toolbar')).toHaveCSS('border-radius', '0px');
  await expect(page.locator('.left')).toHaveCSS('border-radius', '0px');
  await expect(page.locator('.left')).toHaveCSS('backdrop-filter', 'none');
  await page.reload();
  await expect(root).toHaveAttribute('data-look', 'flat');
  await chooseTheme(page, 'Light');
  await expect(root).toHaveAttribute('data-look', 'flat');
  await expect(root).toHaveAttribute('data-theme', 'light');
  // The mockup itself is unaffected.
  await expect(page.locator('.frame__body').first()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
});

for (const look of ['glass', 'flat']) {
  test(`menus are opaque in the ${look} look`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('pagewright.look', l), look);
    await page.goto('./');
    await page.getByRole('button', { name: 'File' }).click();
    const alpha = await page
      .locator('.menu__list')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(alpha).toMatch(/^rgb\(/); // rgb(), not rgba(): fully opaque
  });
}
