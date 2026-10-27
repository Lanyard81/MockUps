import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const palette = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: 'Command palette' });

test('Ctrl+K finds a component and adds it to the selected frame', async ({ page }) => {
  await page.keyboard.press('Control+k');
  await expect(palette(page)).toBeVisible();
  await page.getByLabel('Search commands').fill('accordion');
  await expect(palette(page).getByRole('option').first()).toContainText('Accordion');
  await page.keyboard.press('Enter');
  await expect(palette(page)).toHaveCount(0);
  await expect(page.frameLocator('iframe[title="Home"]').locator('.nsw-accordion')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.frameLocator('iframe[title="Home"]').locator('.nsw-accordion')).toHaveCount(0);
});

test('arrows move, Esc closes, and the toolbar button opens it too', async ({ page }) => {
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByLabel('Search commands').fill('page');
  const options = palette(page).getByRole('option');
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(palette(page)).toHaveCount(0);
  // It opens even while typing in a field, and the shortcut toggles it.
  await page.getByLabel('Search components').focus();
  await page.keyboard.press('Control+k');
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(palette(page)).toHaveCount(0);
});

test('runs actions: add a frame, open the export dialog, switch theme', async ({ page }) => {
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search commands').fill('add a tablet');
  await page.keyboard.press('Enter');
  await expect(page.locator('iframe.frame__iframe')).toHaveCount(2);

  await page.keyboard.press('Control+k');
  await page.getByLabel('Search commands').fill('export');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Export' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.keyboard.press('Control+k');
  await page.getByLabel('Search commands').fill('light theme');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('jumps to a frame, finds templates and comments, and says when nothing matches', async ({
  page,
}) => {
  await page.keyboard.press('Control+k');
  await page.getByLabel('Search commands').fill('work dashboard');
  await expect(palette(page).getByRole('option').first()).toContainText('work dashboard');
  await page.getByLabel('Search commands').fill('go to home');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('frame-Home').locator('.frame__name')).toBeVisible();

  await page.keyboard.press('Control+k');
  await page.getByLabel('Search commands').fill('qqqqzzzz');
  await expect(page.getByText('Nothing matches')).toBeVisible();
});
