import { expect, test, type Page } from '@playwright/test';

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
const group = (page: Page, name: string) => page.getByRole('group', { name, exact: true });
const choose = (page: Page, groupName: string, option: string) =>
  group(page, groupName).getByRole('button', { name: option, exact: true }).click();
const library = (page: Page, label: string) =>
  page.getByTestId('layout-blocks').getByRole('button', { name: label, exact: true });
const primary = (page: Page) =>
  inner(page)
    .locator('.sp-site')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--sp-theme-primary').trim());

test('header, theme and site type changes show on the canvas, and undo', async ({ page }) => {
  await addSharePointFrame(page);
  await expect(inner(page).locator('.sp-header--compact')).toHaveCount(1);
  await expect(inner(page).locator('.sp-suite')).toHaveCount(1);

  await choose(page, 'Header layout', 'Extended');
  await expect(inner(page).locator('.sp-header--extended')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(inner(page).locator('.sp-header--compact')).toHaveCount(1);

  await choose(page, 'Header layout', 'Standard');
  await group(page, 'Header background').getByRole('button', { name: 'Strong' }).click();
  await expect(inner(page).locator('.sp-header[data-variant="strong"]')).toHaveCount(1);
  await page.getByLabel('Show the suite bar').uncheck();
  await expect(inner(page).locator('.sp-suite')).toHaveCount(0);

  // The document's theme changes the colours of every SharePoint frame.
  expect(await primary(page)).toBe('#0078d4');
  await group(page, 'Theme').getByRole('button', { name: 'Teal' }).click();
  await expect.poll(() => primary(page)).toBe('#007780');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => primary(page)).toBe('#0078d4');
});

test('a team site has a left menu and no footer, and the options that no longer apply say why', async ({
  page,
}) => {
  await addSharePointFrame(page);
  await expect(inner(page).locator('footer.sp-footer')).toHaveCount(1);
  await expect(inner(page).locator('.sp-nav--mega')).toHaveCount(1);

  await choose(page, 'Site type', 'Team site');
  await expect(inner(page).locator('.sp-site--team .sp-nav--vertical')).toHaveCount(1);
  await expect(inner(page).locator('footer.sp-footer')).toHaveCount(0);
  await expect(page.getByLabel('Show the footer')).toBeDisabled();
  await expect(page.getByText('Footers are only available on communication sites.')).toBeVisible();
  await expect(
    group(page, 'Navigation style').getByRole('button', { name: 'Mega menu' }),
  ).toBeDisabled();

  // Full-width sections aren't offered either.
  await expect(library(page, 'Full-width section')).toBeDisabled();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(inner(page).locator('footer.sp-footer')).toHaveCount(1);
  await expect(library(page, 'Full-width section')).toBeEnabled();
});

test('changing a section’s layout moves its content, and undo puts it back', async ({ page }) => {
  await addSharePointFrame(page);
  await library(page, 'Two columns').click();
  const columns = inner(page).locator('.sp-section__inner--two-columns > .sp-column');
  await expect(columns).toHaveCount(2);
  await columns.nth(1).click();
  await page.getByTestId('component-sp-text').getByRole('button', { name: 'Paragraph' }).click();
  await expect(columns.nth(1).locator('.sp-text')).toHaveCount(1);

  await page
    .getByRole('navigation', { name: 'Selection' })
    .getByRole('button', { name: 'Section' })
    .click();
  await page.getByLabel('Section layout').selectOption('one-column');
  await expect(inner(page).locator('.sp-section .sp-column')).toHaveCount(1);
  await expect(inner(page).locator('.sp-section .sp-column .sp-text')).toHaveCount(1);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(columns).toHaveCount(2);
  await expect(columns.nth(1).locator('.sp-text')).toHaveCount(1);
});

test('layouts a site can’t have are listed with the reason, never silently ignored', async ({
  page,
}) => {
  await addSharePointFrame(page);
  await library(page, 'One column').click();
  await library(page, 'Vertical section').click();
  await expect(inner(page).locator('aside.sp-section--vertical')).toHaveCount(1);
  // Only one vertical section: the second is refused.
  await expect(library(page, 'Vertical section')).toBeDisabled();
  // Select the one-column section: it can't become full-width while the page has a vertical one.
  await inner(page)
    .locator('section.sp-section--one-column')
    .click({ position: { x: 5, y: 5 } });
  const option = page
    .getByLabel('Section layout')
    .locator('option', { hasText: 'Full-width section' });
  await expect.poll(() => option.evaluate((el) => (el as HTMLOptionElement).disabled)).toBe(true);
  await expect(option).toContainText('vertical section');
});

test('double-click the site title or a menu label to edit it in place; one undo step', async ({
  page,
}) => {
  await addSharePointFrame(page);
  const title = inner(page).locator('[data-setting-edit="siteTitle"]');
  await title.dblclick();
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Policy hub');
  await page.keyboard.press('Enter');
  await expect(title).toHaveText('Policy hub');

  const home = inner(page).locator('[data-setting-edit="navItems.0.label"]');
  await home.dblclick();
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Start');
  await page.keyboard.press('Enter');
  await expect(home).toHaveText('Start');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home).toHaveText('Home');
  await expect(title).toHaveText('Policy hub');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(title).toHaveText('Our intranet');
});

test('menu links are edited in Properties, and the menu opens in Preview', async ({ page }) => {
  await addSharePointFrame(page);
  await page.getByRole('button', { name: 'Add a link', exact: true }).first().click();
  await expect(inner(page).locator('.sp-nav__list > .sp-nav__item').last()).toContainText(
    'New link',
  );
  await page.getByRole('button', { name: 'Remove New link' }).click();
  await expect(inner(page).locator('.sp-nav__list > .sp-nav__item')).toHaveCount(5);

  const panel = inner(page).locator('.sp-nav__panel--mega').first();
  await expect(panel).toBeHidden();
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await inner(page).locator('.sp-nav__item.has-children .sp-nav__toggle').first().click();
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Company news');
});

test('collapsible sections collapse in Preview and show their title', async ({ page }) => {
  await addSharePointFrame(page);
  await library(page, 'One column').click();
  await page.getByTestId('component-sp-text').getByRole('button', { name: 'Paragraph' }).click();
  await page
    .getByRole('navigation', { name: 'Selection' })
    .getByRole('button', { name: 'Section' })
    .click();
  await page.getByLabel('Collapsible section').check();
  await expect(inner(page).locator('.sp-section--collapsible .sp-collapse__title')).toHaveText(
    'Section title',
  );
  await page.getByLabel('Section title', { exact: true }).fill('Details');
  await page.keyboard.press('Enter');
  await expect(inner(page).locator('.sp-collapse__title')).toHaveText('Details');

  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const body = inner(page).locator('.sp-collapse__body');
  await expect(body).toBeVisible();
  await inner(page).locator('[data-sp-collapse-toggle]').click();
  await expect(body).toBeHidden();
  await inner(page).locator('[data-sp-collapse-toggle]').click();
  await expect(body).toBeVisible();
});

test('on a phone frame columns stack and the menu moves behind a button', async ({ page }) => {
  await addSharePointFrame(page, 'iPhone');
  await library(page, 'Two columns').click();
  await expect(inner(page).locator('.sp-header__menu')).toBeVisible();
  await expect(inner(page).locator('.sp-header .sp-nav')).toBeHidden();
  const cols = inner(page).locator('.sp-section__inner--two-columns > .sp-column');
  await expect(cols).toHaveCount(2);
  const [a, b] = [(await cols.nth(0).boundingBox())!, (await cols.nth(1).boundingBox())!];
  expect(b.y).toBeGreaterThan(a.y + a.height - 1); // stacked, not side by side
});
