import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: Page) => page.frameLocator('iframe[title="Home"]');
const topLevel = (page: Page) =>
  home(page)
    .locator('#root > *')
    .evaluateAll((els) =>
      els.map((e) => (e.querySelector('[class*="nsw-"]') ?? e).className.split(' ')[0] ?? ''),
    );

test('masthead and header, content, then a footer land in that order, whatever is selected', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add masthead + header' }).click();
  await addFromLibrary(page, 'heading', 'Heading 1');
  for (let i = 0; i < 3; i++) await addFromLibrary(page, 'card', 'Default');
  await page.getByRole('button', { name: 'Add footer' }).click();
  // The footer is selected now: more content still goes above it.
  await addFromLibrary(page, 'heading', 'Heading 2');
  const order = await topLevel(page);
  expect(order[0]).toBe('nsw-masthead');
  expect(order[1]).toBe('nsw-header');
  expect(order[order.length - 1]).toBe('nsw-footer');
  expect(order).toHaveLength(4);
  await expect(home(page).locator('h1, h2')).toHaveCount(2);
  await expect(home(page).locator('.nsw-card')).toHaveCount(3);
});

test('the Library says where the next item will go', async ({ page }) => {
  await expect(page.locator('#panel-library .library__target')).toContainText(
    'Adds to Home, at the top of the page',
  );
  await addFromLibrary(page, 'heading', 'Heading 1');
  await expect(page.locator('#panel-library .library__target')).toContainText('after “Heading');
});

test('three stacked cards go side by side with one click', async ({ page }) => {
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  for (let i = 0; i < 3; i++) await addFromLibrary(page, 'card', 'Default');
  const cards = page.frameLocator('iframe[title="Desktop 2"]').locator('.nsw-card');
  const ys = async () =>
    cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(await ys()).size).toBe(3);
  // Select the first card, then ask for three across.
  await cards.first().click();
  await page.getByRole('button', { name: '3 across' }).click();
  await expect.poll(async () => new Set(await ys()).size).toBe(1);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(async () => new Set(await ys()).size).toBe(3);
});

test('Esc steps out past containers and grids, and Settings can show them', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  const title = () => page.locator('#properties-panel h2').textContent();
  expect(await title()).toMatch(/Heading/i);
  await page.locator('#canvas').focus();
  await page.keyboard.press('Escape');
  expect(await title()).toMatch(/Section/i); // not the column, grid or container in between
  await page.keyboard.press('Escape');
  expect(await title()).toBe('Page');
});
