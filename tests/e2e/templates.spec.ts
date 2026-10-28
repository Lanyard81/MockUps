import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary, centre, dragBetween } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const openTab = (page: Page) => page.getByRole('tab', { name: 'Templates' }).click();
const tile = (page: Page, name: string) =>
  page.getByTestId('template-tile').filter({ hasText: name }).first();
const frames = (page: Page) => page.locator('iframe.frame__iframe');

test('the Templates tab lists official templates by group and searches them', async ({ page }) => {
  await openTab(page);
  for (const g of ['Homepage', 'Content', 'Search', 'Landing pages'])
    await expect(page.getByRole('region', { name: g })).toBeVisible();
  await page.getByLabel('Search templates').fill('article');
  await expect(page.getByTestId('template-tile')).toHaveCount(1);
  await page.getByLabel('Search templates').fill('zzzz');
  await expect(page.getByTestId('template-tile')).toHaveCount(0);
});

test('clicking a template makes a new frame; dragging onto a frame asks before replacing', async ({
  page,
}) => {
  // An empty starter page is replaced by a template, so give the first page some content.
  await addFromLibrary(page, 'heading', 'Heading 1');
  await openTab(page);
  await tile(page, 'Article').click();
  await expect(frames(page)).toHaveCount(2);
  await openTab(page);
  await page.waitForTimeout(500); // the view re-fits after a frame is added
  const box = (await frames(page).nth(1).boundingBox())!;
  await tile(page, 'Simple').scrollIntoViewIfNeeded();
  await dragBetween(page, await centre(tile(page, 'Simple')), {
    x: box.x + box.width / 2,
    y: box.y + 100,
  });
  const confirm = page.getByRole('dialog', { name: 'Replace this page’s content?' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Replace content' }).click();
  await expect(page.frameLocator('iframe.frame__iframe').nth(1).locator('h1')).not.toHaveCount(0);
  await page.keyboard.press('Control+z');
  await expect(frames(page)).toHaveCount(2);
});

test('dragging onto empty canvas makes a new frame', async ({ page }) => {
  await openTab(page);
  const vp = (await page.getByTestId('viewport').boundingBox())!;
  await tile(page, 'Article').scrollIntoViewIfNeeded();
  await dragBetween(page, await centre(tile(page, 'Article')), {
    x: vp.x + vp.width - 40,
    y: vp.y + vp.height - 40,
  });
  await expect(frames(page)).toHaveCount(2);
});

test('Save as template: appears under My templates, renames, deletes, travels in a file', async ({
  page,
}) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.getByTestId('frame-Home').locator('.frame__label').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Save as template…' }).click();
  await page.getByLabel('Template name').fill('My start');
  await page.getByRole('button', { name: 'Save template' }).click();
  const mine = page.getByRole('region', { name: 'My templates' });
  await expect(mine).toContainText('My start');

  await mine.getByRole('button', { name: 'Rename' }).click();
  await page.getByLabel('Template name').fill('Renamed');
  await page.keyboard.press('Enter');
  await expect(mine).toContainText('Renamed');

  await mine.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete template' }).click();
  await expect(page.getByRole('region', { name: 'My templates' })).toHaveCount(0);
});

test('an empty frame offers templates and the File menu opens samples', async ({ page }) => {
  await page.getByRole('button', { name: 'Choose a template' }).click();
  await expect(page.getByRole('tab', { name: 'Templates' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Sample: Licence renewal/ }).click();
  await expect(frames(page)).toHaveCount(3);
});

test('Preview follows go-to-frame links in a sample, with Back and Close', async ({ page }) => {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Sample: Licence renewal/ }).click();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const first = page.frameLocator('iframe.frame__iframe').first();
  await first.locator('[data-goto]').first().click();
  const viewer = page.getByRole('dialog', { name: /^Preview:/ });
  await expect(viewer).toBeVisible();
  const firstTitle = await viewer.locator('.prototype__title').innerText();
  const inner = viewer.frameLocator('iframe');
  await inner.locator('[data-goto]').first().click();
  await expect(viewer.locator('.prototype__title')).not.toHaveText(firstTitle);
  await viewer.getByRole('button', { name: /Back/ }).click();
  await expect(viewer.locator('.prototype__title')).toHaveText(firstTitle);
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
});
