import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const addSharePointFrame = async (page: Page, device = 'Desktop') => {
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page
    .getByRole('group', { name: 'Style kit for the new frame' })
    .getByRole('button', { name: 'SharePoint' })
    .click();
  await page.getByRole('menuitem', { name: new RegExp(device) }).click();
};
const inner = (page: Page) => page.frameLocator('iframe.frame__iframe').nth(1);
const frameLabel = (page: Page, name: string) =>
  page.getByTestId(`frame-${name}`).locator('.frame__label');

test('SharePoint templates: two groups, search, and a click makes a page with its chrome', async ({
  page,
}) => {
  await addSharePointFrame(page);
  await page.getByRole('tab', { name: 'Templates' }).click();
  await expect(page.getByRole('region', { name: 'Home pages' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Pages', exact: true })).toBeVisible();
  await expect(page.getByTestId('template-tile')).toHaveCount(7);
  await page.getByLabel('Search templates').fill('intranet');
  await expect(page.getByTestId('template-tile')).toHaveCount(1);

  await page.getByTestId('template-tile').first().click();
  await expect(page.locator('iframe.frame__iframe')).toHaveCount(3);
  const made = page.frameLocator('iframe.frame__iframe').nth(2);
  await expect(made.locator('.sp-site')).toHaveCount(1);
  await expect(made.locator('aside.sp-section--vertical .sp-weather')).toHaveCount(1);
  await expect(made.locator('.sp-hero--layers')).toHaveCount(1);
  await expect(page.getByTestId('frame-kit').last()).toHaveText('SharePoint');
});

test('NSW templates are not offered while a SharePoint frame is selected, and the reverse', async ({
  page,
}) => {
  await page.getByRole('tab', { name: 'Templates' }).click();
  await expect(page.getByTestId('template-tile').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Homepage' })).toBeVisible();
  await addSharePointFrame(page);
  await expect(page.getByRole('region', { name: 'Homepage' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Home pages' })).toBeVisible();
});

test('quick chart: edit the data, switch type, and undo', async ({ page }) => {
  await addSharePointFrame(page);
  await page
    .getByTestId('layout-blocks')
    .getByRole('button', { name: 'One column', exact: true })
    .click();
  const tile = page
    .getByTestId('component-sp-quick-chart')
    .getByRole('button', { name: 'Column', exact: true });
  await tile.scrollIntoViewIfNeeded();
  await tile.click();
  const bars = inner(page).locator('.sp-chart rect');
  await expect(bars).toHaveCount(4);

  await page.getByLabel('Label 1', { exact: true }).fill('January');
  await page.keyboard.press('Enter');
  await expect(inner(page).locator('.sp-chart text', { hasText: 'January' })).toHaveCount(1);
  await page.getByLabel('Value 2', { exact: true }).fill('120');
  await page.keyboard.press('Enter');
  await expect(inner(page).locator('.sp-chart text', { hasText: '120' })).toHaveCount(1);

  await page.getByRole('button', { name: 'Add a point' }).click();
  await expect(bars).toHaveCount(5);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(bars).toHaveCount(4);

  await page
    .getByRole('group', { name: 'Variant' })
    .getByRole('button', { name: 'Pie', exact: true })
    .click();
  await expect(inner(page).locator('.sp-chart__pie path')).toHaveCount(4);
  await expect(inner(page).locator('.sp-chart text, .sp-chart__legend')).toContainText(['January']);
});

test('build notes: copy from the frame menu or the panel, or download a Markdown file', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await addSharePointFrame(page);
  await page
    .getByTestId('layout-blocks')
    .getByRole('button', { name: 'Two columns', exact: true })
    .click();
  await page.getByTestId('component-sp-news').scrollIntoViewIfNeeded();
  await page
    .getByTestId('component-sp-news')
    .getByRole('button', { name: 'Top story', exact: true })
    .click();

  // The SharePoint frame's menu has the build notes and not the NSW page parts.
  await frameLabel(page, 'Desktop 2').click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Add masthead + header' })).toHaveCount(0);
  await page.getByRole('menuitem', { name: 'Copy as SharePoint build notes' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'SharePoint build notes copied' }),
  ).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('# Desktop 2: SharePoint build notes');
  expect(text).toContain('Site type: Communication site');
  expect(text).toContain('### Section 1: Two columns');
  expect(text).toContain('**News** web part, layout: Top story');

  const [d] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download (.md)' }).click(),
  ]);
  expect(d.suggestedFilename()).toBe('desktop-2.build-notes.md');
  expect(readFileSync(await d.path(), 'utf8')).toContain('SharePoint build notes');

  // An NSW frame has neither.
  await frameLabel(page, 'Home').click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Add masthead + header' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /build notes/ })).toHaveCount(0);
});

test('PNG export works for a SharePoint frame', async ({ page }) => {
  await addSharePointFrame(page);
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: /Export/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Export' });
  await dialog.getByLabel('1× (normal)').check();
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  const bytes = readFileSync(await d.path());
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(1440);
});

test('HTML export of a SharePoint frame is a working page with the menu script', async ({
  page,
}) => {
  await addSharePointFrame(page);
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByRole('menuitem', { name: /Export/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Export' });
  await dialog.getByLabel(/HTML/).first().check();
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  const html = readFileSync(await d.path(), 'utf8');
  expect(html).toContain('class="sp-site');
  expect(html).toContain('window.SPK');
  expect(html).not.toContain('data-setting-edit');
});
