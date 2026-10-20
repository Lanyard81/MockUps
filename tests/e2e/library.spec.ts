import { expect, test } from '@playwright/test';
import { addFromLibrary } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: import('@playwright/test').Page) => page.frameLocator('iframe[title="Home"]');

test('library lists every category and the layout blocks', async ({ page }) => {
  for (const c of ['Layout', 'Navigation', 'Content', 'Forms', 'Feedback', 'Media']) {
    await expect(page.getByRole('region', { name: c })).toBeVisible();
  }
  await expect(page.getByTestId('layout-blocks')).toBeVisible();
  // Buttons show their NSW variants.
  const buttons = page.getByTestId('component-button');
  for (const v of ['Brand Dark', 'Brand Dark Outline', 'Brand Light', 'White', 'Danger']) {
    await expect(buttons.getByRole('button', { name: v, exact: true })).toBeVisible();
  }
});

test('search filters instantly and category chips narrow the list', async ({ page }) => {
  await page.getByLabel('Search components').fill('accord');
  await expect(page.getByTestId('component-accordion')).toBeVisible();
  await expect(page.getByTestId('component-button')).toHaveCount(0);
  await page.getByLabel('Search components').fill('zzzz');
  await expect(page.getByText('Nothing matches')).toBeVisible();
  await page.getByLabel('Search components').fill('');
  await page.getByRole('button', { name: 'Forms', exact: true }).click();
  await expect(page.getByTestId('component-select')).toBeVisible();
  await expect(page.getByTestId('component-button')).toHaveCount(0);
});

test('thumbnails render once visible', async ({ page }) => {
  const tile = page
    .getByTestId('component-button')
    .getByRole('button', { name: 'Brand Dark', exact: true });
  await tile.scrollIntoViewIfNeeded();
  await expect(tile.locator('img')).toBeVisible({ timeout: 15_000 });
});

test('clicking a component adds it to the frame, stacked, and undo removes it', async ({
  page,
}) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await addFromLibrary(page, 'paragraph', 'Body text');
  await expect(home(page).locator('h1')).toHaveText('Heading 1');
  await expect(home(page).locator('section.nsw-section')).toHaveCount(1);
  await expect(home(page).locator('p').first()).toBeVisible();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home(page).locator('p')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home(page).locator('section.nsw-section')).toHaveCount(0);
});

test('full-width components sit at the top level, outside sections', async ({ page }) => {
  await addFromLibrary(page, 'masthead', 'Dark');
  await expect(home(page).locator('.nsw-masthead')).toBeVisible();
  await expect(home(page).locator('section.nsw-section')).toHaveCount(0);
});

test('grid blocks create the NSW responsive columns', async ({ page }) => {
  await page.getByTestId('layout-blocks').getByRole('button', { name: '3 columns' }).click();
  await expect(home(page).locator('.nsw-col-md-4')).toHaveCount(3);
  await expect(home(page).locator('[data-empty="Empty column"]')).toHaveCount(3);
  // Empty hints are Edit-mode only.
  await page.getByRole('button', { name: 'Preview' }).click();
  const outline = await home(page)
    .locator('.nsw-col-md-4')
    .first()
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).toBe('none');
});

test('variants of the same component can be added side by side', async ({ page }) => {
  await addFromLibrary(page, 'button', 'Brand Dark');
  await addFromLibrary(page, 'button', 'Danger');
  await expect(home(page).locator('.nsw-button--dark')).toHaveCount(1);
  await expect(home(page).locator('.nsw-button--danger')).toHaveCount(1);
});
